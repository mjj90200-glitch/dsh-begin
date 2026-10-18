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

/* ── 左上角渐晕：只压暗文字区，够不到她的头发和脸 ── */
#dsh-begin-root .dbg-scrim{
  position:absolute; inset:0; pointer-events:none;
  background:
    radial-gradient(78% 72% at 11% 40%, rgba(4,10,16,.90) 0%, rgba(4,10,16,.74) 28%, rgba(4,10,16,.34) 52%, rgba(4,10,16,0) 72%),
    linear-gradient(180deg, rgba(4,9,14,.42) 0%, rgba(4,9,14,0) 16%, rgba(4,9,14,0) 76%, rgba(3,7,11,.66) 100%);
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
  display:flex; justify-content:space-between; align-items:center; gap:16px;
  padding:0 clamp(28px,5vw,110px) 0 clamp(40px,7vw,150px);
  font-size:clamp(10px,0.8vw,13px); letter-spacing:.08em; color:rgba(158,192,214,.42);
}
#dsh-begin-root .dbg-foot .dbg-kbd{
  border:1px solid rgba(158,192,214,.26); border-radius:5px; padding:1px 6px;
}
/* 自动播放被浏览器拦截时的提示：淡入，点击后消失 */
#dsh-begin-root .dbg-audiohint{
  opacity:0; transform:translateY(4px);
  transition:opacity .5s ease, transform .5s ease;
  color:rgba(186,222,244,.72); letter-spacing:.06em;
}
#dsh-begin-root .dbg-audiohint.dbg-visible{opacity:1; transform:translateY(0)}

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
    <span class="dbg-audiohint" id="dsh-begin-audiohint">点击任意处开启语音</span>
    <span><span class="dbg-kbd">Esc</span> 跳过</span>
  </div>
</div>
`

/** 提前把立绘拉下来，避免首帧空白。 */
export const artPreloadMarkup = `<link rel="preload" as="image" href="${ASSET_PREFIX}/${ART_FILE}" fetchpriority="high">`

/**
 * 交互脚本：语音 + 打字机同步、按钮解锁、跳过、收场。
 *
 * 同步策略：一句话「打完字」且「播完音」才算完，两者任一缺失都不会卡住——
 * 没配音就走纯打字机节奏，音频报错 / 被浏览器拦截就静默降级。
 */
export const splashScript = `
(function () {
  var data = globalThis.__DSH_BEGIN__ || {};
  var root = document.getElementById('dsh-begin-root');
  if (!root) return;
  root.setAttribute('data-dbg-init', '1');

  var lineEl = document.getElementById('dsh-begin-line');
  var btn = document.getElementById('dsh-begin-enter');
  var hintEl = document.getElementById('dsh-begin-audiohint');
  var caret = lineEl ? lineEl.querySelector('.dbg-caret') : null;

  var raw = (data.lines && data.lines.length) ? data.lines.slice(0, 3) : ['欢迎回来。'];
  var lines = [];
  for (var i = 0; i < raw.length; i += 1) {
    var item = raw[i];
    if (typeof item === 'string') lines.push({ text: item, audio: null });
    else lines.push({ text: item.text, audio: item.audio || null });
  }

  var reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var dismissed = false;
  var blocked = false;
  var gestureHooked = false;
  var index = 0;
  var timer = null;
  var currentAudio = null;
  var currentEntry = null;

  function showHint() { if (hintEl) hintEl.classList.add('dbg-visible'); }
  function hideHint() { if (hintEl) hintEl.classList.remove('dbg-visible'); }

  function stopAudio() {
    if (!currentAudio) return;
    try { currentAudio.pause(); currentAudio.src = ''; } catch (e) {}
    currentAudio = null;
  }

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

  function playOne(entry, done) {
    var typedDone = false;
    var audioDone = !entry.audio;
    var settled = false;
    // 单句硬上限：音频再长也不会把启动页卡住
    var guard = setTimeout(settle, 15000);

    function settle() {
      if (settled) return;
      settled = true;
      clearTimeout(guard);
      if (timer) clearTimeout(timer);
      stopAudio();
      done();
    }
    function check() {
      if (typedDone && audioDone) settle();
    }

    typeLine(entry.text, function () { typedDone = true; check(); });

    if (!entry.audio) return;
    try {
      var audio = new Audio(entry.audio);
      audio.preload = 'auto';
      currentAudio = audio;
      audio.addEventListener('ended', function () { audioDone = true; check(); });
      audio.addEventListener('error', function () { audioDone = true; check(); });
      var playing = audio.play();
      if (playing && typeof playing.catch === 'function') {
        playing.catch(function () {
          // 浏览器拦了自动播放：静音继续，提示用户点一下
          blocked = true;
          audioDone = true;
          stopAudio();
          showHint();
          hookGesture();
          check();
        });
      }
    } catch (e) {
      audioDone = true;
      check();
    }
  }

  function hookGesture() {
    if (gestureHooked) return;
    gestureHooked = true;
    var retry = function () {
      if (dismissed) return;
      blocked = false;
      hideHint();
      // 把当前这句的声音补上（正在打字的这一句）
      if (currentEntry && currentEntry.audio) {
        try {
          var again = new Audio(currentEntry.audio);
          currentAudio = again;
          again.play();
        } catch (e) {}
      }
      document.removeEventListener('pointerdown', retry);
      document.removeEventListener('keydown', retry);
    };
    document.addEventListener('pointerdown', retry);
    document.addEventListener('keydown', retry);
  }

  function nextLine() {
    if (dismissed) return;
    if (index >= lines.length) { unlock(); return; }
    var entry = lines[index];
    index += 1;
    currentEntry = entry;
    playOne(entry, function () {
      if (dismissed) return;
      timer = setTimeout(nextLine, 620);
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
    stopAudio();
    hideHint();
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

  // 第一句的音频提前拉，减少开口前的空档
  if (lines.length && lines[0].audio) {
    try { var warm = new Audio(lines[0].audio); warm.preload = 'auto'; } catch (e) {}
  }

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
