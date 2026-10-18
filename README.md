# dsh-begin

> DeepSeek 启动页 —— 重启 DSH 时先见到她，问候结束再进入今天的工作。

一个 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（`dsh`）启动页插件。
重启应用时不直接落到加载框，而是先出现一段全屏启动画面：她在那儿等着，说几句话，
然后弹出「开始今天的对话」。

## 现在是什么状态

| 项 | 状态 |
|---|---|
| 首帧注入（抢在自带加载卡片之前） | ✅ 已实现 |
| 打字机台词 + 进入按钮 + Esc 跳过 | ✅ 已实现 |
| 按「离线时长 / 时段 / 来访次数」选台词 | ✅ 已实现 |
| 20 秒兜底撤场 | ✅ 已实现 |
| 角色立绘（分层） | ⏳ 待接入，见 [docs/ART.md](docs/ART.md) |
| 语音 / 眨眼 / 视线跟随 | ⏳ 未做，等素材 |

当前版本是 **preview build**：立绘位用抽象声呐环占位，其余链路全部真实。

## 安装

```bash
# 从本地目录装进当前 profile
dsh plugin --profile <profile> add link:/path/to/dsh-begin
```

或在 DSH 里用 `plugin_manager` 的 `install_bundle`，目标是本仓库目录的绝对路径。
安装后**刷新页面**即可看到效果；改动 `lib/` 后无需重装。

## 它是怎么抢在加载框之前的

`index.html` 本体几乎是空的（只有 `<div id="root"></div>` 和一个 module script），
自带加载卡片是前端 JS 在挂载后才用原生 DOM 创建的元素（`[data-dsh-boot]`）。
所以任何 client 侧插件都来不及。

本插件走宿主提供的结构化注入通道：

```js
ctx.on('webserver/index-inject', (table) => {
  table.push({ kind: 'global', name: '__DSH_BEGIN__', value: { lines } })
  table.push({ kind: 'style', text: splashStyle })
  table.push({ kind: 'html', placement: 'body', html: splashMarkup })
  table.push({ kind: 'script', placement: 'body', text: watchdogScript })
  table.push({ kind: 'script', placement: 'body', text: splashScript })
}, { prepend: true })
```

这些行由服务端直接渲染进 HTML 正文，因此**必然先于加载卡片绘制**。

### 三条安全设计

1. **只覆盖，不隐藏** —— 不碰 `#root`，不藏 `[data-dsh-boot]`。覆盖层 z-index 顶到
   `2147483000`，脚本失效最坏情况是「多看一眼加载卡片」，而不是黑屏。
2. **兜底脚本独立成段** —— 主交互脚本抛错时，watchdog 仍会执行并在 20 秒后撤场。
3. **不声明 client 半区** —— 不依赖 `slots` / `uiSession`，不会出现 static inject
   pending 把整个 GUI 拖死。

## 台词从哪来

参考 *Detroit: Become Human* 主菜单的设计（Quantic Dream 官方复盘：
[How Chloe Became Human](https://blog.quanticdream.com/how-chloe-became-human/)）——
Chloe 不是 AI，是「海量台词 × 条件变量」：

```
来访次数 == 0        → 完整自我介绍（唯一一次长台词）
离线 < 10 分钟       → 「又见面了。」
离线 < 1 天          → 「今天想做点什么？」
离线 < 3 天          → 「昨天没怎么见到你。」
离线 < 7 天          → 「有一阵子没来了。」
离线 >= 7 天         → 「好久不见。」
+ 时段修饰（深夜 / 清晨 / 夜深）
```

**说多少由离线时长决定**：刚退出又回来只说一句，隔一周才多说两句。
台词量本身就是表演预算。

状态存在 `$DSH_HOME/dsh-begin/state.json`：

```json
{ "firstSeen": 1792294589747, "lastSeen": 1792294589747, "visits": 3 }
```

## 授权

- **代码**（`lib/`、`docs/`）：MIT
- **美术资源**（`assets/` 中的角色形象、立绘、音频）：**CC BY-NC-SA 4.0**，
  须署名 上善无形 与 ZipZipPipe，非商业，相同方式共享

详见 [NOTICE](NOTICE)。角色形象并非本项目原创，请勿将立绘宣称为原创作品。

## 结构

```
dsh-begin/
├── package.json          # dsh.bundle 清单（无 dsh.client）
├── cordis.patch.yml      # 插入 dsh-begin 一行
├── lib/
│   ├── index.js          # Host 半区：状态 + 注入表
│   ├── splash.js         # 样式 / 标记 / 两段注入脚本
│   └── lines.js          # 台词库与选择逻辑
├── assets/               # 立绘与音频（待接入，CC BY-NC-SA）
├── docs/
│   ├── DESIGN.md         # 设计取舍与路线图
│   └── ART.md            # 美术资源契约（分层清单）
├── LICENSE
└── NOTICE
```
