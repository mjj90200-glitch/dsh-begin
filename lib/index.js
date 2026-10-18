/**
 * dsh-begin — Host 半区。
 *
 * 两件事：
 *   1. 每次 index.html 渲染时，把「首帧样式 + 标记 + 交互脚本」推进宿主的
 *      注入表（`webserver/index-inject`）。
 *   2. 注册一条只读素材路由，把 assets/ 下的立绘伺服给启动页。
 *
 * 为什么必须走注入通道：自带加载卡片由前端 JS 在 React 挂载后创建，
 * 任何 client 侧插件（slot / overlay）都在它之后才有机会。注入表里的行
 * 由服务端直接渲染进 HTML 正文，因此必然先于加载卡片绘制。
 *
 * 刻意不做的事：
 *   - 不声明 `dsh.client`：不依赖 slots / uiSession，避免 static inject pending
 *     把整个 GUI 拖死（社区里真实发生过）。
 *   - 不隐藏 `#root`：只做覆盖。隐藏一旦脚本失效就是黑屏。
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pickLines } from './lines.js'
import { ASSET_PREFIX, createAssetHandler } from './assets.js'
import { artPreloadMarkup, splashMarkup, splashScript, splashStyle, watchdogScript } from './splash.js'

/** 插件名，与 cordis.patch.yml 的 `name` 一致。 */
export const name = 'dsh-begin'

/** 没有 webServer 的 profile（无头运行）里不该激活。 */
export const inject = ['webServer']

/** 两次状态写入之间的最小间隔，避免频繁刷新时刷盘。 */
const WRITE_THROTTLE_MS = 60_000

/** 素材根目录：包内 assets/。 */
const ASSETS_DIR = fileURLToPath(new URL('../assets', import.meta.url))

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
    // 立绘预加载：与样式一起进 head，赶在 body 绘制之前开始下载。
    { kind: 'html', placement: 'head', html: artPreloadMarkup },
    { kind: 'html', placement: 'body', html: splashMarkup },
    { kind: 'script', placement: 'body', text: watchdogScript },
    { kind: 'script', placement: 'body', text: splashScript },
  ]
}

/**
 * 挂载插件。
 * @param ctx - Host 插件上下文（已注入 webServer）。
 */
export function apply(ctx) {
  ctx.on('webserver/index-inject', (table) => {
    table.push(...rows())
  }, { prepend: true })

  ctx.effect(
    () => ctx.webServer.register({ kind: 'prefix', path: ASSET_PREFIX, handler: createAssetHandler(ASSETS_DIR) }),
    'dsh-begin: assets',
  )
}
