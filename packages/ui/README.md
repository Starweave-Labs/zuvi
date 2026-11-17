# @zuvi/react

> v1.0.0 发布到 GitHub Packages：`@yeyouyuan/zuvi-react`，npmjs 暂不发布。先在项目 `.npmrc` 配置 `@yeyouyuan:registry=https://npm.pkg.github.com`，再用拥有包读取权限的 GitHub 账号登录。

```bash
npm login --scope=@yeyouyuan --auth-type=legacy --registry=https://npm.pkg.github.com
pnpm add @zuvi/react@npm:@yeyouyuan/zuvi-react@1.0.0
```

源码导入继续使用 `@zuvi/react`。完整认证和安装说明见仓库 [GitHub Packages 文档](https://github.com/Starweave-Labs/zuvi/blob/main/docs/GITHUB-PACKAGES.md)。

仓库已迁至 [Starweave-Labs/zuvi](https://github.com/Starweave-Labs/zuvi)，文档为 <https://starweave-labs.github.io/zuvi/>。已发布的 v1.0.0 继续使用上面的 `@yeyouyuan/zuvi-*` 名称；未来组织 scope 的包完成发布与安装验证后，才会更新安装入口。

ZUVI 组件库核心包：v1.0.0 含 73 个 Registry 组件条目，令牌驱动、零运行时样式、无障碍优先。

```bash
pnpm add @zuvi/react@npm:@yeyouyuan/zuvi-react@1.0.0
```

```tsx
import '@zuvi/react/styles.css';
import { Button } from '@zuvi/react';

<Button variant="primary">开始使用</Button>;
```

- 73 个 Registry 组件条目覆盖表单 / 数据展示 / 反馈 / 导航 / 浮层 / 文档编辑；包含 Combobox / MultiCombobox、SideNav、Splitter、CommandPalette、OfficeEditor 与 OfficeStudio（完整清单见仓库根 README）
- 三层 Design Token（CSS 变量），`ConfigProvider locale` 内置 10 套语言包
- 组合式 API（`Modal.Trigger` 等）+ `data-part` / `classNames` / 组件级 CSS 变量三件套定制出口
- 附带 CDN IIFE 构建（`build:browser` → `dist/browser/zuvi.global.js`，随 GitHub Pages 部署）

文档：仓库 `docs/` 站（`pnpm --filter @zuvi/docs dev`）。
