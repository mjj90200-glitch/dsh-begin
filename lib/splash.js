/**
 * dsh-begin 的首帧素材：样式、标记与两段注入脚本。
 *
 * 三样东西都以纯字符串导出，由 Host 半区通过 `webserver/index-inject`
 * 推入注入表：
 *   {kind:'style'}                     → <head> 内，最先绘制
 *   {kind:'html', placement:'body'}    → 首帧标记，先于任何 JS
 *   {kind:'script', placement:'body'}  → 交互脚本，紧随标记之后
 *
 * 刻意不依赖 `@deepseek-ai/dsh-client-*`：启动页要在 React 挂载之前就存在。
 */

import { ASSET_PREFIX } from './assets.js'

/** 立绘文件名（assets/ 下）。 */
export const ART_FILE = 'deepseek-bust.webp'

/** 全屏启动页样式。自带深海底色，不复用主题 token（它是一块独立的世界）。 */
export const splashStyle = `
#dsh-begin-root{
  position:fixed; inset:0; z-index:2147483000;
  overflow:hidden; background:#050a10;
  color:#e8f1f8;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
  opacity:1; transform:scale(1);
  transition:opacity .52s ease, transform .52s ease;
  -webkit-font-smoothing:antialiased;
  animation:dbg-fade-in .9s ease both;
}
#dsh-begin-root.dbg-out{opacity:0; transform:scale(1.03); pointer-events:none}
@keyframes dbg-fade-in{from{opacity:0}to{opacity:1}}

/* ── 立绘：铺满，居中裁切，做慢呼吸 ── */
#dsh-begin-root .dbg-art{
  position:absolute; inset:0; pointer-events:none;
}
#dsh-begin-root .dbg-art img{
  width:100%; height:100%; object-fit:cover; object-position:center;
  display:block;
  transform-origin:52% 42%;
  animation:dbg-breathe 7.5s ease-in-out infinite, dbg-art-in 1.4s ease-out both;
}
@keyframes dbg-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.014)}}
@keyframes dbg-art-in{from{opacity:0; transform:scale(1.03)}to{opacity:1; transform:scale(1)}}

/* ── 左侧压暗：保证文字在任何立绘上都读得清 ── */
#dsh-begin-root .dbg-scrim{
  position:absolute; inset:0; pointer-events:none;
  background:
    linear-gradient(90deg, rgba(4,9,14,.94) 0%, rgba(4,9,14,.80) 26%, rgba(4,9,14,.28) 52%, rgba(4,9,14,0) 70%),
    linear-gradient(180deg, rgba(4,9,14,.55) 0%, rgba(4,9,14,0) 22%, rgba(4,9,14,0) 72%, rgba(3,7,11,.72) 100%);
}

/* ── 文字区：左侧一列 ── */
#dsh-begin-root .dbg-stage{
  position:absolute; left:0; top:50%; transform:translateY(-50%);
  z-index:2; width:min(48%,740px);
  padding-left:clamp(40px,7vw,150px);
  display:flex; flex-direction:column; align-items:flex-start; gap:22px;
  text-align:left;
}
#dsh-begin-root .dbg-name{
  font-size:clamp(11px,0.95vw,16px); letter-spacing:.44em; text-indent:.44em;
  color:rgba(158,196,222,.66); text-transform:uppercase; font-weight:600;
}
#dsh-begin-root .dbg-line{
  min-height:2.6em;
  font-size:clamp(20px,2.15vw,40px); line-height:1.55; font-weight:400;
  color:#eef6fc; letter-spacing:.02em;
  text-shadow:0 2px 18px rgba(0,0,0,.45);
}
#dsh-begin-root .dbg-line .dbg-caret{
  display:inline-block; width:2px; height:1.05em; margin-left:4px; vertical-align:-0.12em;
  background:rgba(150,214,248,.92); animation:dbg-blink 1s steps(1) infinite;
  visibility:hidden;
}
#dsh-begin-root .dbg-line.dbg-typing .dbg-caret{visibility:visible}
@keyframes dbg-blink{0%,49%{opacity:1}50%,100%{opacity:0}}

/* ── 进入按钮 ── */
#dsh-begin-root .dbg-enter{
  appearance:none; cursor:default;
  font:inherit; font-size:clamp(13px,1.05vw,20px); letter-spacing:.06em;
  padding:.62em 1.6em; border-radius:999px;
  color:rgba(234,246,253,.94);
  background:rgba(20,44,62,.66);
  border:1px solid rgba(126,206,246,.38);
  backdrop-filter:blur(6px);
  opacity:.30; transition:opacity .6s ease, background .22s ease, border-color .22s ease, box-shadow .22s ease;
}
#dsh-begin-root .dbg-enter.dbg-ready{
  cursor:pointer; opacity:1;
  border-color:rgba(146,216,252,.66);
  animation:dbg-ready 2.6s ease-out infinite;
}
#dsh-begin-root .dbg-enter.dbg-ready:hover{
  background:rgba(40,84,116,.82); border-color:rgba(186,236,255,.9);
}
@keyframes dbg-ready{0%{box-shadow:0 0 0 0 rgba(126,206,246,.34)}70%{box-shadow:0 0 0 14px rgba(126,206,246,0)}100%{box-shadow:0 0 0 0 rgba(126,206,246,0)}}

/* ── 角标 ── */
#dsh-begin-root .dbg-foot{
  position:absolute; left:0; right:0; bottom:clamp(16px,2.2vh,30px); z-index:2;
  display:flex; justify-content:space-between; align-items:center;
  padding:0 clamp(28px,5vw,110px) 0 clamp(40px,7vw,150px);
  font-size:clamp(10px,0.8vw,13px); letter-spacing:.08em; color:rgba(158,192,214,.42);
}
#dsh-begin-root .dbg-foot .dbg-kbd{
  border:1px solid rgba(158,192,214,.26); border-radius:5px; padding:1px 6px;
}

@media (max-width: 900px){
  #dsh-begin-root .dbg-stage{width:70%; padding-left:28px; gap:16px}
  #dsh-begin-root .dbg-scrim{background:linear-gradient(90deg, rgba(4,9,14,.94) 0%, rgba(4,9,14,.72) 46%, rgba(4,9,14,.30) 74%, rgba(4,9,14,0) 100%)}
  #dsh-begin-root .dbg-foot{padding:0 24px}
  #dsh-begin-root .dbg-foot .dbg-note{display:none}
}

@media (prefers-reduced-motion: reduce){
  #dsh-begin-root, #dsh-begin-root .dbg-art img, #dsh-begin-root .dbg-enter.dbg-ready{animation:none!important}
  #dsh-begin-root .dbg-line .dbg-caret{animation:none!important}
}
`

/** 首帧标记：纯 HTML，在任何脚本执行之前就已进入文档。 */
export const splashMarkup = `
<div id="dsh-begin-root" role="dialog" aria-modal="true" aria-label="deepseek 启动页">
  <div class="dbg-art"><img src="${ASSET_PREFIX}/${ART_FILE}" alt="" decoding="async" fetchpriority="high"></div>
  <div class="dbg-scrim"></div>
  <div class="dbg-stage">
    <div class="dbg-name">DeepSeek</div>
    <div class="dbg-line" aria-live="polite" id="dsh-begin-line"><span class="dbg-caret"></span></div>
    <button class="dbg-enter" id="dsh-begin-enter" type="button" aria-disabled="true">开始今天的对话</button>
  </div>
  <div class="dbg-foot">
    <span class="dbg-note">preview build</span>
    <span><span class="dbg-kbd">Esc</span> 跳过</span>
  </div>
</div>
`

/** 提前把立绘拉下来，避免首帧空白。 */
export const artPreloadMarkup = `<link rel="preload" as="image" href="${ASSET_PREFIX}/${ART_FILE}" fetchpriority="high">`

/**
 * 交互脚本：打字机、按钮解锁、跳过、收场。
 * 用 ES5 语法书写，避免任何构建步骤；不引用任何宿主导出。
 */
export const splashScript = `
(function () {
  var data = globalThis.__DSH_BEGIN__ || {};
  var root = document.getElementById('dsh-begin-root');
  if (!root) return;
  root.setAttribute('data-dbg-init', '1');

  var lineEl = document.getElementById('dsh-begin-line');
  var btn = document.getElementById('dsh-begin-enter');
  var caret = lineEl ? lineEl.querySelector('.dbg-caret') : null;
  var lines = (data.lines && data.lines.length) ? data.lines.slice(0, 3) : ['欢迎回来。'];

  var reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var dismissed = false;
  var index = 0;
  var timer = null;

  function setText(text) {
    if (!lineEl) return;
    lineEl.textContent = text;
    if (caret) lineEl.appendChild(caret);
  }

  function typeLine(text, done) {
    if (!lineEl) { done(); return; }
    if (reduced) { setText(text); done(); return; }
    lineEl.classList.add('dbg-typing');
    var at = 0;
    (function step() {
      if (dismissed) return;
      at += 1;
      setText(text.slice(0, at));
      if (at < text.length) {
        timer = setTimeout(step, 42);
      } else {
        lineEl.classList.remove('dbg-typing');
        done();
      }
    })();
  }

  function nextLine() {
    if (dismissed) return;
    if (index >= lines.length) { unlock(); return; }
    var text = lines[index];
    index += 1;
    typeLine(text, function () {
      if (dismissed) return;
      timer = setTimeout(nextLine, 680);
    });
  }

  function unlock() {
    if (!btn) return;
    btn.classList.add('dbg-ready');
    btn.setAttribute('aria-disabled', 'false');
  }

  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    if (timer) clearTimeout(timer);
    root.classList.add('dbg-out');
    setTimeout(function () {
      if (root && root.parentNode) root.parentNode.removeChild(root);
    }, 540);
  }

  if (btn) {
    btn.addEventListener('click', function () {
      if (btn.classList.contains('dbg-ready')) dismiss();
    });
  }
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') dismiss();
  });

  timer = setTimeout(nextLine, 320);
})();
`

/**
 * 兜底脚本：独立的一段，只做一件事 —— 主脚本若从未初始化，强制撤掉启动页。
 * 单独成段的意义：主脚本抛错时它仍然会执行。
 */
export const watchdogScript = `
(function () {
  setTimeout(function () {
    var root = document.getElementById('dsh-begin-root');
    if (root && root.getAttribute('data-dbg-init') !== '1') {
      if (root.parentNode) root.parentNode.removeChild(root);
    }
  }, 20000);
})();
`
