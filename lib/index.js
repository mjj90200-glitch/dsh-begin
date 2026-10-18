/**
 * dsh-begin — Host 半区。
 *
 * 唯一职责：在每次 index.html 渲染时，把「首帧样式 + 标记 + 交互脚本」推进
 * 宿主的注入表（`webserver/index-inject`）。
 *
 * 为什么必须走这条通道：自带加载卡片由前端 JS 在 React 挂载后创建，
 * 任何 client 侧插件（slot / overlay）都在它之后才有机会。注入表里的行
 * 由服务端直接渲染进 HTML 正文，因此必然先于加载卡片绘制。
 *
 * 刻意不做的事：
 *   - 不声明 `dsh.client`：不依赖 slots / uiSession，避免 static inject pending
 *     把整个 GUI 拖死（社区里真实发生过）。
 *   - 不注册任何路由：启动页不需要网络请求，素材全部内联。
 *   - 不隐藏 `#root`：只做覆盖。隐藏一旦脚本失效就是黑屏。
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { pickLines } from './lines.js'
import { splashMarkup, splashScript, splashStyle, watchdogScript } from './splash.js'

/** 插件名，与 cordis.patch.yml 的 `name` 一致。 */
export const name = 'dsh-begin'

/** 两次状态写入之间的最小间隔，避免频繁刷新时刷盘。 */
const WRITE_THROTTLE_MS = 60_000

/** 来访状态文件：$DSH_HOME/dsh-begin/state.json */
function stateFile() {
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, 'dsh-begin', 'state.json')
}

function readState(file) {
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'))
    return typeof parsed === 'object' && parsed !== null ? parsed : undefined
  } catch {
    return undefined
  }
}

function writeState(file, value) {
  try {
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, JSON.stringify(value, null, 2))
  } catch {
    /* 状态写不进去不该影响启动页本身，静默降级 */
  }
}

/**
 * 记一次来访并算出这次该说什么。
 * 先读旧状态再写新状态，所以同一次渲染里 deltaMs 反映的是「上次离开到现在」。
 * @returns {string[]} 本次要播放的台词。
 */
function takeLines() {
  const file = stateFile()
  const now = Date.now()
  const prev = readState(file)
  const visits = typeof prev?.visits === 'number' ? prev.visits : 0
  const lastSeen = typeof prev?.lastSeen === 'number' ? prev.lastSeen : undefined
  const deltaMs = lastSeen === undefined ? Number.POSITIVE_INFINITY : now - lastSeen
  const lines = pickLines({ visits, deltaMs, hour: new Date(now).getHours() })

  if (lastSeen === undefined || now - lastSeen > WRITE_THROTTLE_MS) {
    writeState(file, {
      firstSeen: typeof prev?.firstSeen === 'number' ? prev.firstSeen : now,
      lastSeen: now,
      visits: visits + 1,
    })
  }
  return lines
}

/** 构造本次渲染要推入注入表的行。 */
function rows() {
  return [
    // 行数据供 body 脚本读取；global 行渲染在 <head> 最前。
    { kind: 'global', name: '__DSH_BEGIN__', value: { version: 1, name: 'deepseek', lines: takeLines() } },
    { kind: 'style', text: splashStyle },
    { kind: 'html', placement: 'body', html: splashMarkup },
    { kind: 'script', placement: 'body', text: watchdogScript },
    { kind: 'script', placement: 'body', text: splashScript },
  ]
}

/**
 * 挂载插件。
 * @param ctx - Host 插件上下文。
 */
export function apply(ctx) {
  ctx.on('webserver/index-inject', (table) => {
    table.push(...rows())
  }, { prepend: true })
}
