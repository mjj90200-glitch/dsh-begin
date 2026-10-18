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

/* ── 立绘舞台：16:9 覆盖盒子，内含底图 + 眨眼 / 口型补丁 ── */
#dsh-begin-root .dbg-art{
  position:absolute; inset:0; pointer-events:none; overflow:hidden;
}
#dsh-begin-root .dbg-scaler{
  position:absolute; inset:0;
  animation:dbg-breathe 7.5s ease-in-out infinite, dbg-art-in 1.4s ease-out both;
  will-change:transform;
}
/* 用 max() 让 16:9 盒子始终覆盖视口：补丁的百分比定位因此永远与底图对齐 */
#dsh-begin-root .dbg-artbox{
  position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
  width:max(100vw, 177.78vh); height:max(100vh, 56.25vw);
}
#dsh-begin-root .dbg-base{
  display:block; width:100%; height:100%;
}
#dsh-begin-root.dbg-video-mode .dbg-scaler{animation:dbg-art-in 1.4s ease-out both}
#dsh-begin-root .dbg-greet{
  position:absolute; inset:0; width:100%; height:100%;
  object-fit:cover; display:block; background:transparent;
  transition:opacity .8s ease;
}
/* 问候播完后：问候淡出、待机淡入 */
#dsh-begin-root.dbg-idle-on .dbg-greet{opacity:0}
#dsh-begin-root .dbg-video{transition:opacity .8s ease}
#dsh-begin-root.dbg-idle-on .dbg-video{opacity:1}
#dsh-begin-root .dbg-video{
  position:absolute; inset:0; width:100%; height:100%;
  object-fit:cover; display:block; background:transparent;
}
#dsh-begin-root .dbg-patch{
  position:absolute; display:block;
  transition:opacity 55ms linear;
  will-change:opacity;
}
/* 眨眼：默认隐藏，加 .dbg-blink 时显示闭眼补丁 */
#dsh-begin-root .dbg-patch-eyes{opacity:0}
#dsh-begin-root.dbg-blink .dbg-patch-eyes{opacity:1}
/* 口型：默认盖上闭口（静息），说话（.dbg-talking）时揭开，露出底图的张口 */
#dsh-begin-root .dbg-patch-mouth{opacity:1}
#dsh-begin-root.dbg-talking .dbg-patch-mouth{opacity:0}
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

/**
 * 首帧标记：纯 HTML，在任何脚本执行之前就已进入文档。
 * 补丁用百分比定位——它们与底图共享同一个 16:9 盒子，所以永远对齐。
 * @param layers - assets/layers.json 的内容（canvas 尺寸 + 两块补丁的矩形）。
 */
export function splashMarkup(layers, video, greeting) {
  if (video !== undefined && video !== null) {
    const greetingTag = (greeting === undefined || greeting === null)
      ? ''
      : `<video class="dbg-greet" src="${ASSET_PREFIX}/${greeting}" autoplay playsinline preload="auto"></video>`
    // 有视频时：视频当背景，静态图留作解码失败时的兜底；补丁全部停用
    return `
<div id="dsh-begin-root" class="dbg-video-mode" role="dialog" aria-modal="true" aria-label="deepseek 启动页">
  <div class="dbg-art"><div class="dbg-scaler"><div class="dbg-artbox">
    <img class="dbg-base" src="${ASSET_PREFIX}/${ART_FILE}" alt="" decoding="async">
    <video class="dbg-video" src="${ASSET_PREFIX}/${video}" autoplay muted loop playsinline preload="auto"></video>${greetingTag}
  </div></div></div>
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
  }
  let patches = ''
  if (layers !== undefined && layers !== null) {
    const [canvasW, canvasH] = layers.canvas
    const place = (patch) => {
      const [x, y, w, h] = patch.rect
      const pct = (value, total) => `${((value / total) * 100).toFixed(3)}%`
      return `left:${pct(x, canvasW)};top:${pct(y, canvasH)};width:${pct(w, canvasW)};height:${pct(h, canvasH)}`
    }
    patches =
      `\n    <img class="dbg-patch dbg-patch-eyes" src="${ASSET_PREFIX}/${layers.eyes.file}" style="${place(layers.eyes)}" alt="" aria-hidden="true">` +
      `\n    <img class="dbg-patch dbg-patch-mouth" src="${ASSET_PREFIX}/${layers.mouth.file}" style="${place(layers.mouth)}" alt="" aria-hidden="true">`
  }
  return `
<div id="dsh-begin-root" role="dialog" aria-modal="true" aria-label="deepseek 启动页">
  <div class="dbg-art"><div class="dbg-scaler"><div class="dbg-artbox">
    <img class="dbg-base" src="${ASSET_PREFIX}/${ART_FILE}" alt="" decoding="async" fetchpriority="high">${patches}
  </div></div></div>
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
}

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
  var greetEl = document.querySelector('.dbg-greet');
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

  /* ── 眨眼：随机 3.5–6.5s 一次、120ms；5% 概率连眨两下 ── */
  var blinkTimer = null;

  function blinkOnce() {
    if (dismissed) return;
    root.classList.add('dbg-blink');
    setTimeout(function () {
      root.classList.remove('dbg-blink');
      if (Math.random() < 0.05) {
        setTimeout(function () {
          if (dismissed) return;
          root.classList.add('dbg-blink');
          setTimeout(function () { root.classList.remove('dbg-blink'); }, 110);
        }, 130);
      }
      scheduleBlink();
    }, 120);
  }

  function scheduleBlink() {
    if (dismissed) return;
    blinkTimer = setTimeout(blinkOnce, 3500 + Math.random() * 3000);
  }

  /* ── 口型：用 WebAudio 读实时振幅驱动，读不到就按 6Hz 降级 ── */
  var audioCtx = null;
  var analyser = null;
  var mouthRaf = null;
  var mouthFallback = null;

  function stopMouth() {
    if (mouthRaf) { cancelAnimationFrame(mouthRaf); mouthRaf = null; }
    if (mouthFallback) { clearInterval(mouthFallback); mouthFallback = null; }
    root.classList.remove('dbg-talking');
  }

  function attachAnalyser(audio) {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state !== 'running' && audioCtx.resume) audioCtx.resume();
      // 上下文没跑起来时不要接管音频，否则会把本来能播的声音弄哑
      if (audioCtx.state !== 'running') return false;
      var source = audioCtx.createMediaElementSource(audio);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.55;
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      return true;
    } catch (e) {
      return false;
    }
  }

  function startMouth() {
    stopMouth();
    if (analyser) {
      var buf = new Uint8Array(analyser.fftSize);
      (function tick() {
        if (dismissed) return;
        analyser.getByteTimeDomainData(buf);
        var sum = 0;
        for (var i = 0; i < buf.length; i += 1) {
          var v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        var rms = Math.sqrt(sum / buf.length);
        if (rms > 0.055) root.classList.add('dbg-talking');
        else root.classList.remove('dbg-talking');
        mouthRaf = requestAnimationFrame(tick);
      })();
      return;
    }
    if (reduced) return;
    mouthFallback = setInterval(function () {
      if (dismissed) return;
      if (Math.random() < 0.55) root.classList.add('dbg-talking');
      else root.classList.remove('dbg-talking');
    }, 160);
  }

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
      stopMouth();
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
      audio.addEventListener('ended', function () { audioDone = true; stopMouth(); check(); });
      audio.addEventListener('error', function () { audioDone = true; stopMouth(); check(); });
      // 先接分析器再播：口型要跟着真实振幅走
      var hasAnalyser = attachAnalyser(audio);
      var playing = audio.play();
      if (hasAnalyser) startMouth();
      if (playing && typeof playing.catch === 'function') {
        playing.catch(function () {
          // 浏览器拦了自动播放：静音继续，提示用户点一下
          blocked = true;
          audioDone = true;
          stopMouth();
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
    if (index >= lines.length) { linesDone = true; maybeUnlock(); return; }
    var entry = lines[index];
    index += 1;
    currentEntry = entry;
    playOne(entry, function () {
      if (dismissed) return;
      timer = setTimeout(nextLine, 620);
    });
  }

  var linesDone = false;
  var greetDone = greetEl === null;
  var unlocked = false;

  function maybeUnlock() {
    if (unlocked || !linesDone || !greetDone) return;
    unlocked = true;
    if (!btn) return;
    btn.classList.add('dbg-ready');
    btn.setAttribute('aria-disabled', 'false');
  }

  function finishGreeting() {
    if (greetDone) return;
    greetDone = true;
    root.classList.add('dbg-idle-on');   // 问候淡出、待机淡入
    maybeUnlock();
  }

  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    if (timer) clearTimeout(timer);
    if (blinkTimer) clearTimeout(blinkTimer);
    stopMouth();
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

  if (greetEl !== null) {
    var endGreet = function () { finishGreeting(); };
    greetEl.addEventListener('ended', endGreet);
    greetEl.addEventListener('error', endGreet);
    // 兜底：万一 ended 没触发，13 秒后也放行
    setTimeout(endGreet, 13000);
    var gp = greetEl.play();
    if (gp && typeof gp.catch === 'function') {
      gp.catch(function () {
        greetEl.muted = true;
        greetEl.play().catch(function () {});
        showHint();
        hookGesture();
      });
    }
  }

  scheduleBlink();
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
