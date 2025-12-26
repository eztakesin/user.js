/***********************************************************
 * user-overrides.js（适配 arkenfox user.js）
 *
 * 目标：
 * - 隐私/反指纹优先：RFP + 禁 WebRTC + 禁 WebGL
 * - 性能/现代网站可用性保持：JS JIT 开启、WASM 开启、Service Worker 开启
 * - Push 通道关闭（不使用站点后台推送）
 *
 * 环境参考：
 * - macOS + Firefox 146.0.1
 * - Stash（Clash 系）系统级 TUN，启用 dns-hijack
 *
 * 应用方式（每次修改本文件后）：
 * 1) 关闭 Firefox
 * 2) 在 profile 根目录运行：./updater.sh && ./prefsCleaner.sh
 * 3) 启动 Firefox
 *
 * 快速校验是否生效：
 * - about:config 搜索：_my_overrides.parrot
 ***********************************************************/

user_pref("_my_overrides.parrot", "START: user-overrides.js loaded (2025-12-25)");


/*** ========== 0100 启动行为 ========== */
/* 3 = 恢复上次会话
 * 说明：该选项会保留更多本地状态信息；与“退出清理历史/下载”等组合时，
 * 在某些情况下可能影响会话恢复的稳定性（取决于 Firefox 版本与具体清理项）。
 */
user_pref("browser.startup.page", 3);


/*** ========== 0700 DNS / DoH：交由 Stash 解析 ========== */
/* 目标：避免 Firefox 直接与第三方 DoH 服务器通信，把 DNS 解析统一交给 Stash 的 DNS 模块处理。
 *
 * 方式：关闭 Firefox 内置 TRR/DoH，让 Firefox 回退到系统 DNS。
 * 前提：系统 DNS 查询被 Stash TUN + dns-hijack(any:53) 接管，并由 Stash 决定上游 DoH。
 *
 * network.trr.mode:
 * - 5 = 关闭（并避免自动 rollout/启用）
 */
user_pref("network.trr.mode", 5);
user_pref("network.trr.uri", "");
user_pref("network.trr.custom_uri", "");


/*** ========== 0700 代理旁路兜底（不允许 bypass） ========== */
/* network.proxy.allow_bypass:
 * - false：当系统/内部请求失败时，不允许自动绕过代理兜底
 * - 影响面：可能影响某些内部服务的“失败回退”行为（取决于版本与环境）
 */
user_pref("network.proxy.allow_bypass", false);


/*** ========== 1200 HTTPS-Only 与本地开发 ========== */
/* 本地资源升级（localhost/127.0.0.1）：
 * - true：会尝试把 http://localhost / http://127.0.0.1 升级为 https://...
 *         本地开发服务未配置 TLS 时，可能导致访问失败/需要例外
 * - false：不升级本地地址，减少对本地开发环境的干扰
 */
user_pref("dom.security.https_only_mode.upgrade_local", false);

/* Mixed Content（被动内容）：更严格
 * - true：在 HTTPS 页面阻止加载 HTTP 被动资源（图片/音视频等）
 * - 可能影响少数站点资源加载
 */
user_pref("security.mixed_content.block_display_content", true);


/*** ========== 1700 容器标签页（使用习惯） ========== */
user_pref("privacy.userContext.newTabContainerOnLeftClick.enabled", true);


/*** ========== 2700 反追踪兼容性补救（更严格） ========== */
/* false：关闭 ETP 的 webcompat/heuristics（SmartBlock 等兼容性补救）
 * 影响：部分第三方登录/跨站跳转/嵌入资源可能更容易异常
 */
user_pref("privacy.antitracking.enableWebcompat", false);


/*** ========== 4500 反指纹（核心）：RFP ========== */
/* Resist Fingerprinting + Letterboxing */
user_pref("privacy.resistFingerprinting", true);
user_pref("privacy.resistFingerprinting.letterboxing", true);

/* 语言统一：
 * 2 = 强制英文环境（更统一）
 */
user_pref("privacy.spoof_english", 2);

/* 为了配置可读性：显式设置为空，表示不对任何域名做 RFP 豁免 */
user_pref("privacy.resistFingerprinting.exemptedDomains", "");


/*** ========== 2000 WebRTC：禁用 ========== */
user_pref("media.peerconnection.enabled", false);


/*** ========== 4520 WebGL：禁用 ========== */
user_pref("webgl.disabled", true);


/*** ========== 7000 现代网站能力 ========== */
/* Service Worker：开启（现代网站/PWA 兼容性更好） */
user_pref("dom.serviceWorkers.enabled", true);

/* Push：关闭（禁用站点后台推送通道） */
user_pref("dom.push.enabled", false);

/* Web Notifications：保持关闭（减少站点通知打扰与相关权限面） */
user_pref("dom.webnotifications.enabled", false);


/*** ========== 性能 / 架构 ========== */
/* WebRender：强制开启（可能影响渲染稳定性/性能表现，取决于设备/驱动） */
user_pref("gfx.webrender.all", true);

/* Fission（站点隔离）：开启（更偏安全增强，通常增加内存占用） */
user_pref("fission.autostart", true);

/* JS JIT：开启（性能/兼容性） */
user_pref("javascript.options.ion", true);
user_pref("javascript.options.baselinejit", true);

/* WebAssembly：开启（性能/兼容性） */
user_pref("javascript.options.wasm", true);


/*** ========== 2800 退出即清理：历史 / 下载 / 表单 ========== */
/* 说明：这组清理项属于非常激进的“减少跨会话本地痕迹”策略 */
user_pref("privacy.clearOnShutdown_v2.historyFormDataAndDownloads", true);
user_pref("privacy.clearOnShutdown_v2.browsingHistoryAndDownloads", true);
user_pref("privacy.clearOnShutdown_v2.downloads", true);
user_pref("privacy.clearOnShutdown_v2.formdata", true);

/* 手动清理 UI 默认范围：0=全部 */
user_pref("privacy.sanitize.timeSpan", 0);


/*** ========== 0800 地址栏等  ========== */
user_pref("browser.urlbar.clipboard.featureGate", false);
user_pref("browser.urlbar.recentsearches.featureGate", false);
user_pref("browser.urlbar.suggest.engines", false);
user_pref("browser.urlbar.maxRichResults", 0);
user_pref("browser.urlbar.autoFill", false);
user_pref("keyword.enabled", false);

/*** 书签工具栏显示策略
 * always = 始终显示
 * never  = 始终隐藏
 * newtab = 仅新标签页显示
 */
user_pref("browser.toolbars.bookmarks.visibility", "never");

/*** 新版侧边栏（Firefox 136+ 的 sidebar revamp）
 * false = 关闭新版侧边栏/垂直标签相关 UI
 */
user_pref("sidebar.revamp", false);


/*** ========== 字体偏好 ========== */
user_pref("font.cjk_pref_fallback_order", "ja,zh-cn,zh-hk,zh-tw");
user_pref("font.name.sans-serif.zh-CN", "Source Han Sans SC");
user_pref("font.name.serif.zh-CN", "Source Han Serif SC");
user_pref("font.name.monospace.zh-CN", "Sarasa Mono SC");


user_pref("_my_overrides.parrot", "END: user-overrides.js loaded (2025-12-25)");
