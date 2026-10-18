# assets/

美术资源目录。**当前为空** —— v1 的立绘位用抽象声呐环占位。

分层清单、交付格式与降级方案见 [../docs/ART.md](../docs/ART.md)。

## 放进来之后要改哪里

1. 把分层 PNG 按 `docs/ART.md` 的命名放进本目录的同名子目录（例如 `assets/deepseek/`）；
2. 在 `lib/splash.js` 的 `splashMarkup` 里，把 `.dbg-figure` 内的占位 `<svg>` 换成
   各层的 `<img>`（每层一个绝对定位的 `<img>`，同一 `viewBox` 坐标系）；
3. 在 `splashStyle` 里为每层写定位，以及 `dbg-breathe` / `dbg-blink` 的关键帧；
4. 素材需要经宿主路由伺服时，在 `lib/index.js` 里用 `ctx.webServer.register(...)`
   注册前缀路由（不要在启动页里引用外部 CDN）。

## 授权提醒

本目录下的一切角色形象与音频均为 **CC BY-NC-SA 4.0**，不是 MIT。
提交前请确认 `NOTICE` 里的署名完整。
