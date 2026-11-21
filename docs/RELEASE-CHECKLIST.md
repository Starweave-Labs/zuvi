# ZUVI 发布清单

适用包：`@zuvi/react`、`@zuvi/tokens`、`@zuvi/icons`、`@zuvi/i18n`、`@zuvi/cli`、`@zuvi/mcp`、`@zuvi/blocks`。

## Starweave Labs 仓库迁移（2026-11-17）

- 代码仓库入口为 [Starweave-Labs/zuvi](https://github.com/Starweave-Labs/zuvi)，文档入口为 <https://starweave-labs.github.io/zuvi/>；Pages 的基础路径继续使用 `/zuvi/`，浏览器产物为 `cdn/v1.0.0/`。
- 已发布的 v1.0.0 包继续通过 `@yeyouyuan/zuvi-*` 和 `@zuvi/*` npm aliases 安装。不要重打包覆盖现有版本、改写历史 tarball 或完整性记录；组织 scope 需要先明确发布目标，完成发布及真实消费者安装校验后，再更新公开示例。
- 迁移验收需检查新站组件页面、页面搭建器、OfficeStudio、CDN 演示和 JS/CSS 资源；Pages 部署不等于包发布，本次迁移不发布 npmjs 包。
- 页面搭建器使用 localStorage，OfficeStudio 使用 IndexedDB；两者均受网站来源隔离。迁移前从旧站导出作品，之后导入新站；仓库迁移不会删除旧来源的浏览器数据，也不会自动迁移这些数据。

下列旧版本基线保留当时的版本、提交与验收记录，不代表当前版本的发布状态。

## 当前源码集成基线（未发布）

- `Globe`、`Chart` 与 `DataGrid` 增量对应 76 个组件、16 个业务区块，共 92 个 Registry 条目；独立数据可视化板块与 DataGrid 文档页使文档公开导航为 86 个，DataGrid 已接入搭建器目录，builder 根导出计数为 76。历史发布与测试快照保持原样。
- 本轮不变更包版本，不执行发布、Gist 或已发布 metadata 更新；构建与 Registry / CLI / MCP 数据副本由集成者统一重新生成。
- [x] 复核 `Globe` 根导出、`@zuvi/react/globe` 子路径与公共类型，十套 locale / 局部覆盖、MCP 两点一弧示例，以及 CLI add/diff 幂等性。
- [x] 复核无浏览器环境 ESM / CommonJS 导入、SSR、分发与消费者类型检查；复制渲染器源码时安装 `three` 与 `@types/three`。按需加载渲染器，不在模块导入时访问 DOM / WebGL。
- [x] 复核 `Chart` 根导出、`@zuvi/react/chart` 子路径与完整公共类型，原生 `HTMLDivElement` ref、十套 21 键 locale / 局部覆盖和独立隐藏系列 / 数据选择 / 范围回调。
- [x] 复核 13 个 Chart 类型与 17 种形态的 MCP 生成、调用方数据覆盖和严格 TSX 编译；数字与缺口、雷达轴、热力缺格、仪表范围及瀑布增量遵守各自契约，不混入不兼容字段。
- [x] 复核 Chart 状态、图例、数据表、键盘与 320px 明暗主题；真实十字准线、缩放框选、双指 / 第三指 / 取消、CSV、减少动效、17 类 CDN 与断网搭建器 HTML 均已验证。View 按需加载、无新增图形依赖、CLI add/diff 幂等。
- 2026-11-18 本地门禁：工作区构建 / 类型检查、UI 2133 项、文档 253 项、完整 E2E 201 项、Registry / 分发 / 消费者检查全部通过；ESM 静态入口 122631 gzip 字节，小于 122880 字节。库范围 lint 通过；默认 `pnpm lint` 包含其他会话 `outputs/` 的既有 lint 问题，未改写这些产物。本轮未提交、推送或发布。

## v0.5.0 发布基线（2026-11-14）

- 七个公开包统一为 `0.5.0`，GitHub Release 标签必须为 `v0.5.0`；`@zuvi/mcp` 运行时自报版本同步。
- Registry 保持 73 个组件、16 个业务区块（89 条目）；`Table` 新增数据驱动模式：显式排序循环（受控 `sortState`、`manual` 服务端模式）、专用手柄列移动、高级字段管理，语义化用法向后兼容。
- 发布前门禁与 v0.4.0 相同：Registry 校验、工作区构建与类型检查、ESLint、全量单元测试、浏览器 E2E、浏览器包构建、分发检查、源码消费者检查、包体预算及 GitHub Packages 本地真实安装检查。
- 发布流程：`main` CI 与 Pages 在同一提交成功后发布 GitHub Release `v0.5.0`，等待 Publish GitHub Packages 工作流完成。
- CLI 与 MCP 的 `data/registry` 副本通过 `node registry/scripts/bundle.mjs cli|mcp` 重新生成，已随本次发布核对。

## v0.4.0 发布基线（2026-11-13）

- 七个公开包统一为 `0.4.0`，GitHub Release 标签必须为 `v0.4.0`；`@zuvi/mcp` 运行时自报版本与包版本一致。
- Registry 为 73 个组件、16 个业务区块，共 89 个条目；`OfficeEditor` 与 `OfficeStudio` 已进入公共导出、子路径、Registry、CLI 和 MCP。
- 发布前必须完成 Registry 校验、工作区构建与类型检查、ESLint、全量单元测试、浏览器 E2E、浏览器包构建、分发检查、源码消费者检查、包体预算及 GitHub Packages 本地真实安装检查。
- `main` 的 CI 与 Pages 必须在同一提交成功；之后发布 GitHub Release，等待 GitHub Packages 工作流完成，并从真实 registry 重新安装七个包核对 SHA-512 完整性。
- Pages 生产路径为 `/zuvi/`，CDN 产物位于 `cdn/v0.4.0/`；发布页与公开安装说明使用 `@yeyouyuan/zuvi-*` 名称和 `@zuvi/*` npm aliases。

## v0.2.0 发布基线（2026-11-07 历史记录）

- 七包版本和 CHANGELOG 已更新至 `0.2.0`，原 changeset 已消费。**不要再次执行 `changeset version`**。
- Registry 为 66 个组件、16 个业务区块；Anchor 已有源码、导出、文档和 Registry 条目。
- 七包已有独立 LICENSE，`@zuvi/react` 已有 README；`@zuvi/blocks` 对 `@zuvi/react` 的依赖已移入 `dependencies`。
- GitHub `main` 已包含质量提交 `c7fec2f` 与 Pages 依赖构建修复 `e60a06f`；对应 CI、Pages、`v0.2.0` JS/CSS 和在线脚本演示均已验证成功。远端仍无 `v0.2.0` tag，npm/unpkg 仍等待发布认证。
- 文档 71 个导航路由已完成 320px 暗色静态布局审计；概览、图标库和 16 个业务区块另做桌面/窄屏/暗色及关键交互复核。66 个组件的全部打开态、长文案和原生 200% 缩放仍属于持续增强验收，不作为本次本地发布门禁的阻塞项。

## 开发分支快照（2026-11-09 历史记录）

- 源码现有 71 个组件、16 个业务区块，Registry 共 87 个条目；文档有 77 个公开导航路由。
- 文档完成导航分组、切页保留正文与 77 页四组显示矩阵；内容协作为设计原型。67 条 E2E 全部通过，最新验证与边界见 [本轮审计](quality-audit-2026-11-09.md)。
- Combobox / MultiCombobox、SideNav、Splitter、CommandPalette 已实现，五份 minor changeset 和一份 patch changeset 等待下一版本统一消费。包版本仍为 `0.2.0`；此处源码数量不代表 npm 已发布内容。
- CommandPalette 仍需真实中文输入法、VoiceOver / NVDA 和 macOS / Windows 热键人工验收，见 [RFC 第 15 节](./rfcs/command-palette.md)。DataGrid 处于性能原型与 RFC 评审阶段。
- 本次已重新核验 GitHub 认证和远端分支；用户授权先同步 GitHub 并部署 Pages，npm 稍后继续。npm 当前未登录，包版本与 changeset 本轮不消费；正式 npm 发布前再确认 scope 权限和版本。

## 1. 发布前验证

在仓库根目录运行，任何一步失败都先修复，再继续：

```bash
pnpm install --frozen-lockfile
node registry/scripts/generate.mjs --check
pnpm -r build
pnpm -r typecheck
pnpm lint
pnpm -r test
ZUVI_E2E_PORT=5175 pnpm test:e2e
pnpm --filter @zuvi/react build:browser
node scripts/check-distribution.mjs
node scripts/check-consumer.mjs
```

E2E 可用 `ZUVI_E2E_PORT` 选空闲端口，避免复用已有文档服务。CI 安装 Chromium 并运行同一套浏览器测试。检查 ESM gzip 小于 CI 的 96 KiB 门槛。

### 交互与适配专项复核

- [ ] Windows 高对比度 / `forced-colors: active` 下，边框、选中态、当前项与焦点轮廓仍可辨识。
- [ ] `prefers-reduced-motion: reduce` 下，非必要入场、退场、位移与加载动画已停用或降级，状态变化仍可理解。
- [ ] `dir="rtl"` 下，布局、方向键、展开/收起图标、前后翻页和浮层定位符合逻辑方向。
- [ ] 鼠标以外使用触控或 Pointer Events 复核拖拽、滑动及点击；交互目标尺寸与间距适合触控，页面滚动不会被误阻断。
- [ ] 受控组件的父级拒绝更新时，显示值、编辑草稿、焦点和展开态在当前提交周期恢复；之后接受相同值不套用已过期请求，也不重复触发回调。

## 2. 检查发布产物

- [x] 七包 `package.json` 的版本均为 `0.2.0`，内部依赖可由 workspace 构建和消费者检查正确解析。
- [x] 七包 `CHANGELOG.md` 条目已按 66 个组件、10 套语言包、142 枚图标和 16 个业务区块核对。
- [x] 每包 tarball 包含构建产物、README、LICENSE；CLI/MCP 包还包含 `data/registry/registry.json`。
- [x] `@zuvi/react` tarball 包含 `dist/browser/zuvi.global.js`、`zuvi.css`、`LICENSE.txt`，`unpkg` 字段指向浏览器脚本。
- [x] `docs/dist/cdn/v0.2.0/` 有同一组三个浏览器产物，`docs/public/cdn-demo.html` 已指向公开的 `v0.2.0`。
- [x] 七包 `npm pack --dry-run` 不含测试、stories、`node_modules` 等开发文件；`@zuvi/tokens` 的 CSS 导出和源码令牌、`@zuvi/blocks` 的源码分发均按包清单保留。

## 3. 发布 npm 与 unpkg

发布账号需要 `@zuvi` scope 的公开包发布权限，并先在本机或受控 CI 完成 npm 认证。凭据只存 npm/CI 安全配置，不写入仓库。

```bash
npm whoami
npx changeset publish
npm view @zuvi/react@0.2.0 version
```

发布后核对七包版本及 `@zuvi/react` tarball 的浏览器产物，再用真实 URL 验证 unpkg 的 JS 与 CSS 返回成功且可在普通 HTML 页面调用 `window.ZUVI`。unpkg 是 npm 包的 CDN，不需要单独上传；npm 未发布前不能引用其 URL 作为已上线资源。

## 4. GitHub 与 Pages

确认工作区改动和最终 diff 后，提交并推送 `main`，再创建并推送 `v0.2.0` tag。Pages 工作流在 `main` 推送后会重建文档和 `cdn/v0.2.0/`。

- [x] GitHub 上确认 `e60a06f` 已进入 `main`，对应 CI 全绿、Pages 部署成功。
- [x] `e60a06f` 对应部署的 `v0.2.0` JS、CSS 与演示页返回成功，入口引用与最终产物哈希一致。
- [x] 在线打开该部署的脚本演示，确认 `ZUVI.createRoot`、Button 样式与点击交互正常，且无页面异常或 console error。
- [ ] 发布完成后核对 Git tag、npm 七包版本、unpkg 和 Pages 版本一致。
