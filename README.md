# Firefox macOS Hardening Pack (arkenfox overrides + userChrome auto-hide)

> 中文 / English README
> 目标：在 macOS 上提供一套可分享、可复用的 Firefox 隐私/安全配置框架：
>
> - `user-overrides.js`：基于 arkenfox `user.js` 的偏好覆盖（prefs overrides）
> - `userChrome.css`：浏览器 UI（顶部工具栏）自动隐藏/显示
> - 适配：macOS 桌面 Firefox（不适用于 Firefox iOS）

---

## 概览 / Overview

### 中文

本仓库包含两个核心文件：

- `user-overrides.js`
  用于覆盖（override）arkenfox `user.js` 中的偏好项（prefs）。配合 arkenfox 的 `updater.sh`，可以在每次更新 arkenfox `user.js` 时自动把本文件追加到最终 `user.js` 末尾，从而实现“升级不丢配置”。

- `chrome/userChrome.css`
  用于修改 Firefox 浏览器自身 UI（不是网页 CSS）。当前实现目标是：
  - 隐藏标签栏（Tabs Toolbar）/隐藏标题栏（Titlebar）
  - 地址栏（nav-bar）默认隐藏，鼠标移动到顶部触发区或键盘交互时再显示
  - 在 macOS 全屏场景下，通过 `padding-top` 避免工具栏被系统菜单栏遮挡

### English

This repository provides two main files:

- `user-overrides.js`
  Preference overrides intended to be appended after arkenfox `user.js` via `updater.sh`, so updates do not wipe personal settings.

- `chrome/userChrome.css`
  Firefox UI customization (not webpage CSS). Current goal: hide tab bar/title bar, and auto-hide the address bar toolbar with hover/keyboard reveal, with macOS fullscreen menu bar considerations.

---

## 适用范围 / Scope

- ✅ Firefox Desktop on macOS
- ✅ arkenfox `user.js` workflow (with `updater.sh` + `prefsCleaner.sh`)
- ❌ Firefox iOS (iOS 版 Firefox 使用 WKWebView/WebKit，且不支持桌面扩展体系；桌面 `user.js` 机制无法原样迁移)
- ⚠️ Tor Browser：该项目不以 Tor Browser 为目标环境

---

## 文件结构 / File layout

```text
.
├── README.md
├── LICENSE
├── user-overrides.js
└── chrome/
    └── userChrome.css
```

---

## 核心概念 / Core concepts

### 1) `user.js` / `prefs.js` / `user-overrides.js` 的关系（简述）

- Firefox 启动时会读取 profile 根目录的 `user.js`，并把偏好写入 `prefs.js`（运行时文件）。
- arkenfox 的推荐维护方式是：不要手动改 arkenfox `user.js`，而是把个人改动写到 `user-overrides.js`。
- `updater.sh` 会下载最新版 arkenfox `user.js`，并把 `user-overrides.js` 追加到末尾。由于“同名 pref 以最后出现为准”，因此 overrides 会覆盖 arkenfox 的默认值。

- Firefox reads `user.js` on startup and writes preferences into `prefs.js`.
- arkenfox recommends not editing `user.js` directly; instead keep personal changes in `user-overrides.js`.
- `updater.sh` downloads the latest arkenfox `user.js` and appends `user-overrides.js` at the end. Since prefs are last-write-wins, overrides take precedence.

---

### 2) `userChrome.css` 的加载条件（重要）

Firefox 只有在以下条件成立时才会加载 `userChrome.css`：

- profile 中存在 `chrome/userChrome.css`
- `toolkit.legacyUserProfileCustomizations.stylesheets = true`

Firefox loads `userChrome.css` only if:

- `chrome/userChrome.css` exists in the profile
- `toolkit.legacyUserProfileCustomizations.stylesheets = true`

---

## 安装与更新 / Install & update

1. 找到当前 profile 路径
   - Firefox 地址栏输入：`about:profiles`
   - 在 “Default Profile: yes” 的那一栏打开 Root Directory

2. 将本仓库的文件复制到 profile
   - `user-overrides.js` → profile 根目录
   - `chrome/userChrome.css` → profile 的 `chrome/` 目录（没有就新建）

3. 将 arkenfox 的脚本放入 profile 根目录（如果使用自动更新）
   - `updater.sh`
   - `prefsCleaner.sh`
   然后执行（脚本是 bash；在 fish/zsh 下通过 `./updater.sh` 执行即可；避免 `source`）：

   ```sh
   ./updater.sh
   ./prefsCleaner.sh
   ```

4. 重启 Firefox

---

## 关键设置说明 / Key settings explained

### A) DNS / DoH 与 Stash（策略）

在 `user-overrides.js` 中将：

- `network.trr.mode = 5`
表示关闭 Firefox 内置 DoH/TRR，使 Firefox 回退到系统 DNS。  
在启用 Stash TUN + DNS hijack 的前提下，DNS 查询由 Stash 处理，并由 Stash 决定上游 DoH。

Setting `network.trr.mode = 5` disables Firefox TRR/DoH and falls back to system DNS. With Stash TUN + DNS hijack enabled, DNS is handled by Stash.

---

### B) RFP（Resist Fingerprinting）

- `privacy.resistFingerprinting = true`：启用 Firefox 内置反指纹机制（强约束/统一多个可观测指标）
- `privacy.resistFingerprinting.letterboxing = true`：对窗口内尺寸做分级对齐，降低窗口尺寸指纹可用性

- `privacy.resistFingerprinting = true` enables strong built-in anti-fingerprinting.
- `letterboxing = true` rounds inner window sizes to reduce size-based fingerprinting.

---

### C) WebRTC / WebGL

- `media.peerconnection.enabled = false`：禁用 WebRTC
- `webgl.disabled = true`：禁用 WebGL

- Disables WebRTC and WebGL, reducing related attack surface and fingerprinting vectors.

---

## `userChrome.css` 技术细节 / How the auto-hide UI works

当前 `userChrome.css` 采用的思路是：

- 通过对 `#nav-bar` 设置负 `margin-top`，将导航栏向上“收起”
- 保留一个很薄的可 hover “触发条”（`--uc-nav-reveal`）
- 当 hover/focus/popup 条件满足时，把 `margin-top` 置回 0，从而显示 nav-bar
- 全屏时增加 `padding-top` 以避免 nav-bar 被 macOS 菜单栏遮挡

The CSS hides `#nav-bar` by applying a negative `margin-top` and leaves a small reveal strip for hover. On hover/focus/popup triggers, it resets the margin to 0 to reveal the toolbar. In fullscreen, padding is added to avoid the macOS menu bar overlay.

---

## 已知问题 / Known issues

- Google 搜索页在某些输入框焦点/切换操作下可能出现滚动异常（环境依赖性较强）。
  现象在其他站点（例如 DuckDuckGo/GitHub）不一定复现。

- Google Search may exhibit scroll quirks depending on focus/space switching and extension/script-blocking behavior; other sites may not reproduce it.

---

## License

MIT License. See `LICENSE`.
