/**
 * 渲染自检：用宿主真实的 renderIndexInjections 把注入表渲染进 index.html，
 * 断言启动页确实出现在「自带脚本之前」、素材路由已注册，并导出一份
 * 可单独打开的预览（立绘内联成 data URI，脱离宿主也能看）。
 *
 * 用法：
 *   DSH_APP_DIR="/Applications/DSH Desktop.app/Contents/Resources/app" \
 *     ELECTRON_RUN_AS_NODE=1 "<Electron 可执行文件>" scripts/render-test.mjs
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

const appDir = process.env.DSH_APP_DIR
if (appDir === undefined || appDir === '') {
  console.error('缺少 DSH_APP_DIR（指向 dsh 安装根目录，即含 node_modules 的那一层）')
  process.exit(1)
}

const load = (relative) => import(pathToFileURL(join(appDir, relative)).href)

const { renderIndexInjections } = await load(
  'node_modules/@deepseek-ai/dsh-host-webserver/lib/index.js',
)
const plugin = await import(pathToFileURL(join(root, 'lib/index.js')).href)

// 捕获插件注册的监听器与路由，模拟宿主的一次 emit。
let listener
const routes = []
plugin.apply({
  on(channel, fn) {
    if (channel === 'webserver/index-inject') listener = fn
    return () => {}
  },
  effect(fn) {
    return fn()
  },
  webServer: {
    register(route) {
      routes.push(route)
      return () => {}
    },
  },
})
if (listener === undefined) throw new Error('apply 没有订阅 webserver/index-inject')

const table = []
listener(table)

const kinds = table.map((row) => (row.placement === undefined ? row.kind : row.kind + ':' + row.placement))
console.log('注入行:', kinds.join(' → '))
console.log('注册路由:', routes.map((route) => `${route.kind} ${route.path}`).join(', ') || '(无)')

const rawHtml = readFileSync(
  join(appDir, 'node_modules/@deepseek-ai/dsh-web-frontend/dist/index.html'),
  'utf8',
)
const rendered = renderIndexInjections(rawHtml, table)

// ── 断言 ──────────────────────────────────────────────────────────────
const hasVideo = existsSync(join(root, 'assets', 'idle.mp4'))
const voiceDir = join(root, 'assets', 'voice')
const hasVoice = existsSync(join(voiceDir, 'manifest.json'))

/** 注入的脚本是字符串，import 时不会被解析，这里单独过一遍语法。 */
const parses = (source) => {
  try {
    new Function(source)
    return true
  } catch {
    return false
  }
}
const scripts = table.filter((row) => row.kind === 'script').map((row) => row.text)

const checks = [
  ['启动页标记进入文档', rendered.includes('<div id="dsh-begin-root"')],
  ['立绘 img 进入文档', rendered.includes('id="dsh-begin-root"') && rendered.includes('deepseek-bust.webp')],
  ['立绘预加载进入 head', rendered.includes('rel="preload" as="image"')],
  ['样式进入 head', rendered.includes('dbg-stage')],
  ['台词数据进入 head', rendered.includes('__DSH_BEGIN__')],
  ['交互脚本进入文档', rendered.includes("getElementById('dsh-begin-root')")],
  ['兜底脚本进入文档', rendered.includes('data-dbg-init')],
  ['素材路由已注册', routes.some((route) => route.path === '/dsh-begin')],
  ['台词带上语音 URL', hasVoice ? rendered.includes('/dsh-begin/voice/') : true],
  // 两种模式二选一：有待机视频时用视频，没有时退回「静态图 + 补丁」
  hasVideo
    ? ['待机视频已注入', rendered.includes('<video class="dbg-video"')]
    : ['眨眼补丁已注入', rendered.includes('dbg-patch-eyes')],
  hasVideo
    ? ['视频用 autoplay/muted/loop', /<video[^>]*autoplay[^>]*muted[^>]*loop/.test(rendered)]
    : ['补丁使用百分比定位', /dbg-patch-eyes"[^>]*style="left:[\d.]+%/.test(rendered)],
  ['注入脚本语法可解析', scripts.length >= 2 && scripts.every(parses)],
  [
    '启动页早于应用入口脚本',
    rendered.indexOf('dsh-begin-root') < rendered.indexOf('assets/index-'),
  ],
  [
    '启动页早于 </body>',
    rendered.indexOf('dsh-begin-root') < rendered.lastIndexOf('</body>'),
  ],
]

let failed = 0
for (const [label, ok] of checks) {
  console.log((ok ? '  ✓ ' : '  ✗ ') + label)
  if (!ok) failed += 1
}

// ── 导出可单独打开的预览（剥掉应用入口，立绘内联） ────────────────────
const artPath = join(root, 'assets', 'deepseek-bust.webp')
const artDataUri = 'data:image/webp;base64,' + readFileSync(artPath).toString('base64')

const standalone = rendered
  .replace(/<script[^>]*\bsrc=[^>]*><\/script>/gu, '')
  .replace(/<link[^>]*\brel="(?:modulepreload|stylesheet)"[^>]*>/gu, '')
  .replaceAll('/dsh-begin/deepseek-bust.webp', artDataUri)
  // 本轮台词用到的语音也内联，预览里能真的听见
  .replace(/\/dsh-begin\/voice\/([A-Za-z0-9._-]+\.mp3)/gu, (whole, file) => {
    const filePath = join(voiceDir, file)
    return existsSync(filePath)
      ? 'data:audio/mpeg;base64,' + readFileSync(filePath).toString('base64')
      : whole
  })
  // 眨眼 / 口型补丁同样内联，预览里能看到动起来
  .replace(/\/dsh-begin\/layers\/([A-Za-z0-9._-]+\.webp)/gu, (whole, file) => {
    const filePath = join(root, 'assets', 'layers', file)
    return existsSync(filePath)
      ? 'data:image/webp;base64,' + readFileSync(filePath).toString('base64')
      : whole
  })

const outDir = join(root, 'preview')
mkdirSync(outDir, { recursive: true })

// 预览是 file:// 打开的，/dsh-begin/* 请求不到：视频拷到旁边并改成相对路径
let previewHtml = standalone
if (hasVideo) {
  copyFileSync(join(root, 'assets', 'idle.mp4'), join(outDir, 'idle.mp4'))
  previewHtml = previewHtml.replaceAll('/dsh-begin/idle.mp4', './idle.mp4')
}
const previewPath = join(outDir, 'splash-preview.html')
writeFileSync(previewPath, previewHtml, 'utf8')
console.log('预览已导出:', previewPath)

if (failed > 0) {
  console.error(`${failed} 项断言失败`)
  process.exitCode = 1
} else {
  console.log('全部断言通过')
}
