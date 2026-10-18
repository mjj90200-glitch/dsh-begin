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

/** 全屏启动页样式。自带深海底色，不复用主题 token（它是一块独立的世界）。 */
export const splashStyle = `
#dsh-begin-root{
  position:fixed; inset:0; z-index:2147483000;
  display:grid; place-items:center; overflow:hidden;
  background:radial-gradient(120% 92% at 50% 6%,#0e2434 0%,#08131d 44%,#04070b 100%);
  color:#e8f1f8;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
  opacity:1; transform:scale(1);
  transition:opacity .52s ease, transform .52s ease;
  -webkit-font-smoothing:antialiased;
}
#dsh-begin-root.dbg-out{opacity:0; transform:scale(1.03); pointer-events:none}

#dsh-begin-root .dbg-glow{
  position:absolute; left:50%; top:38%; width:min(78vw,680px); height:min(78vw,680px);
  transform:translate(-50%,-50%); border-radius:50%; pointer-events:none;
  background:radial-gradient(circle,rgba(84,168,224,.20) 0%,rgba(84,168,224,.07) 42%,transparent 70%);
  filter:blur(6px);
}
#dsh-begin-root .dbg-beam{
  position:absolute; inset:0; pointer-events:none; opacity:.5;
  background:linear-gradient(180deg,rgba(120,196,240,.10) 0%,transparent 34%,transparent 74%,rgba(4,8,12,.85) 100%);
}
#dsh-begin-root .dbg-stage{
  position:relative; z-index:1; width:min(90vw,760px);
  display:flex; flex-direction:column; align-items:center; gap:30px;
  padding:24px; text-align:center;
}

/* ── 立绘位：v1 用抽象声呐环占位，分层立绘接入后替换为 <img> ── */
#dsh-begin-root .dbg-figure{
  position:relative; width:220px; height:220px; display:grid; place-items:center;
}
#dsh-begin-root .dbg-figure svg{width:100%; height:100%; overflow:visible}
#dsh-begin-root .dbg-ring{fill:none; stroke:rgba(126,206,246,.42); stroke-width:1}
#dsh-begin-root .dbg-ring-a{animation:dbg-pulse 3.6s ease-out infinite}
#dsh-begin-root .dbg-ring-b{animation:dbg-pulse 3.6s ease-out .9s infinite}
#dsh-begin-root .dbg-ring-c{animation:dbg-pulse 3.6s ease-out 1.8s infinite}
#dsh-begin-root .dbg-tail{fill:rgba(150,214,248,.9); animation:dbg-breathe 4.6s ease-in-out infinite; transform-origin:50% 62%}
@keyframes dbg-pulse{0%{transform:scale(.62);opacity:0}22%{opacity:.85}100%{transform:scale(1.18);opacity:0}}
@keyframes dbg-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}

/* ── 名字 ── */
#dsh-begin-root .dbg-name{
  font-size:11px; letter-spacing:.44em; text-indent:.44em;
  color:rgba(186,220,242,.62); text-transform:uppercase; font-weight:600;
}

/* ── 台词 ── */
#dsh-begin-root .dbg-line{
  min-height:3.1em; max-width:34em;
  font-size:clamp(16px,2.1vw,21px); line-height:1.62; font-weight:400;
  color:#eaf4fb; letter-spacing:.02em;
  display:flex; align-items:center; justify-content:center;
}
#dsh-begin-root .dbg-line .dbg-caret{
  display:inline-block; width:1px; height:1.05em; margin-left:3px;
  background:rgba(150,214,248,.92); animation:dbg-blink 1s steps(1) infinite;
  visibility:hidden;
}
#dsh-begin-root .dbg-line.dbg-typing .dbg-caret{visibility:visible}
@keyframes dbg-blink{0%,49%{opacity:1}50%,100%{opacity:0}}

/* ── 进入按钮 ── */
#dsh-begin-root .dbg-enter{
  appearance:none; cursor:default;
  font:inherit; font-size:14px; letter-spacing:.06em;
  padding:11px 30px; border-radius:999px;
  color:rgba(232,244,252,.92);
  background:rgba(96,178,224,.10);
  border:1px solid rgba(126,206,246,.34);
  opacity:.28; transition:opacity .6s ease, background .22s ease, border-color .22s ease, box-shadow .22s ease;
}
#dsh-begin-root .dbg-enter.dbg-ready{
  cursor:pointer; opacity:1;
  background:rgba(96,178,224,.18);
  border-color:rgba(146,216,252,.62);
  box-shadow:0 0 0 0 rgba(126,206,246,.30);
  animation:dbg-ready 2.6s ease-out infinite;
}
#dsh-begin-root .dbg-enter.dbg-ready:hover{background:rgba(96,178,224,.30); border-color:rgba(176,232,255,.86)}
@keyframes dbg-ready{0%{box-shadow:0 0 0 0 rgba(126,206,246,.30)}70%{box-shadow:0 0 0 12px rgba(126,206,246,0)}100%{box-shadow:0 0 0 0 rgba(126,206,246,0)}}

/* ── 角标 ── */
#dsh-begin-root .dbg-foot{
  position:absolute; left:0; right:0; bottom:18px; z-index:1;
  display:flex; justify-content:center; gap:18px;
  font-size:11px; letter-spacing:.08em; color:rgba(158,192,214,.38);
}
#dsh-begin-root .dbg-foot .dbg-kbd{
  border:1px solid rgba(158,192,214,.24); border-radius:5px; padding:1px 6px;
}

@media (prefers-reduced-motion: reduce){
  #dsh-begin-root .dbg-ring, #dsh-begin-root .dbg-tail, #dsh-begin-root .dbg-enter.dbg-ready{animation:none!important}
  #dsh-begin-root .dbg-line .dbg-caret{animation:none!important}
}
`

/** 首帧标记：纯 HTML，在任何脚本执行之前就已进入文档。 */
export const splashMarkup = `
<div id="dsh-begin-root" role="dialog" aria-modal="true" aria-label="deepseek 启动页">
  <div class="dbg-glow"></div>
  <div class="dbg-beam"></div>
  <div class="dbg-stage">
    <div class="dbg-figure" aria-hidden="true">
      <svg viewBox="0 0 220 220" role="presentation">
        <circle class="dbg-ring dbg-ring-a" cx="110" cy="110" r="74"/>
        <circle class="dbg-ring dbg-ring-b" cx="110" cy="110" r="74"/>
        <circle class="dbg-ring dbg-ring-c" cx="110" cy="110" r="74"/>
        <path class="dbg-tail" d="M110 152 C110 126 86 110 62 106 C74 84 100 77 110 92 C120 77 146 84 158 106 C134 110 110 126 110 152 Z"/>
      </svg>
    </div>
    <div class="dbg-name">DeepSeek</div>
    <div class="dbg-line" aria-live="polite" id="dsh-begin-line"><span class="dbg-caret"></span></div>
    <button class="dbg-enter" id="dsh-begin-enter" type="button" aria-disabled="true">开始今天的对话</button>
  </div>
  <div class="dbg-foot">
    <span>preview build · 立绘待接入</span>
    <span><span class="dbg-kbd">Esc</span> 跳过</span>
  </div>
</div>
`

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
    if (!lineEl) return done();
    if (reduced) { setText(text); return done(); }
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
    if (index >= lines.length) return unlock();
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

  timer = setTimeout(nextLine, 280);
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
