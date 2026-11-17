# GitHub Packages

当前 v1.0.0 的安装入口为 GitHub Packages（https://npm.pkg.github.com），发布名称保持 `@yeyouyuan/zuvi-*`，源码与导入路径始终是 `@zuvi/*`。仓库迁移和 Pages 部署不代表 npmjs 已发布；当前继续使用本文的 GitHub Packages 安装方式。

## 仓库与文档迁移

代码仓库已迁至 [Starweave-Labs/zuvi](https://github.com/Starweave-Labs/zuvi)，文档与 CDN 位于 <https://starweave-labs.github.io/zuvi/>。已发布 v1.0.0 的包名、安装 scope、tarball 和完整性记录保留原值。未来组织 scope 的包需要先完成发布、权限和真实消费者安装验证，再更新安装示例；不能仅因仓库 owner 改变就替换现有包名。

| 源码与安装别名 | GitHub Packages 名称  |
| -------------- | --------------------- |
| @zuvi/react     | @yeyouyuan/zuvi-react  |
| @zuvi/blocks    | @yeyouyuan/zuvi-blocks |
| @zuvi/icons     | @yeyouyuan/zuvi-icons  |
| @zuvi/tokens    | @yeyouyuan/zuvi-tokens |
| @zuvi/i18n      | @yeyouyuan/zuvi-i18n   |
| @zuvi/cli       | @yeyouyuan/zuvi-cli    |
| @zuvi/mcp       | @yeyouyuan/zuvi-mcp    |

## 安装

在项目 .npmrc 中配置：

```ini
@yeyouyuan:registry=https://npm.pkg.github.com
```

GitHub Packages 的 npm 安装需要身份验证。使用有读取包权限的 GitHub 账号和 classic PAT 的 read:packages 权限登录，token 作为 npm login 的密码输入；组织启用 SSO 时还需要授权该 token。不要提交令牌。

```bash
npm login --scope=@yeyouyuan --auth-type=legacy --registry=https://npm.pkg.github.com
npm install @zuvi/react@npm:@yeyouyuan/zuvi-react@1.0.0 @zuvi/blocks@npm:@yeyouyuan/zuvi-blocks@1.0.0
```

```tsx
import '@zuvi/react/styles.css';
import { Button } from '@zuvi/react';
import { DashboardBlock } from '@zuvi/blocks';
```

按需安装其他包时使用同样的别名形式，例如：

```bash
npm install @zuvi/tokens@npm:@yeyouyuan/zuvi-tokens@1.0.0 @zuvi/icons@npm:@yeyouyuan/zuvi-icons@1.0.0
npm install --save-dev @zuvi/cli@npm:@yeyouyuan/zuvi-cli@1.0.0 @zuvi/mcp@npm:@yeyouyuan/zuvi-mcp@1.0.0
npx zuvi list
```

内部依赖也使用 npm aliases，确保区块中的 @zuvi/react 导入和声明能够解析。直接安装发布名称仍可使用该包，但生成的代码示例使用 @zuvi/*，推荐上面的别名方式。

## 发布流程

七个包保持相同版本。以下流程用于未来的新版本，不重打包或覆盖现有 v1.0.0。先完成全站回归、工作区检查、构建和分发检查，再明确发布 owner 与版本。迁移后的组织发布目标可以暂存为 `starweave-labs`，但在发布并验证前不能把它当作现有安装入口。Publish GitHub Packages 工作流只面向 npm.pkg.github.com，通过拥有对应包写权限的仓库令牌认证。发布 job 仅在仓库变量 `ENABLE_GITHUB_PACKAGES` 等于字符串 `true` 时执行；该变量默认不设置。本次迁移保持关闭，未来核对 owner、版本与权限后，才开启变量并发布 Release 或手动运行工作流。

```bash
pnpm build
pnpm --filter @zuvi/react build:browser
node scripts/check-distribution.mjs
node scripts/check-consumer.mjs
node scripts/prepare-github-packages.mjs --owner starweave-labs
node scripts/check-github-packages.mjs --local
```

prepare 脚本从 npm pack 实际文件清单创建暂存包，按明确的 owner 重写发布名称和内部依赖，关联 `Starweave-Labs/zuvi` 仓库，输出七个 tarball、SHA-512 完整性值和清单。上面的命令只暂存未来组织 scope 的产物，不执行发布；它不修改源码名称，不包含测试、依赖目录或开发脚本。

local 检查通过临时本机 registry 安装这些 tarball，以验证真实 npm aliases 解析及内部依赖；同时执行 ESM、CommonJS、React 19 SSR、CSS 导出、CLI、MCP stdio 和严格 TypeScript 声明检查。发布之后，工作流重新从 GitHub registry 安装七个版本并重复检查，结果保存为工作流附件。

发布脚本只允许清单中的 owner scope，校验 tarball 的 SHA-512；重跑时只跳过同版本且内容相同的包。发现已存在但内容不同的版本会停止，不覆盖版本。

包的实际可见性和访问权限以 GitHub 包设置为准；工作流安装成功代表对应仓库的令牌可读取。需要向其他仓库开放时，配置包的 Actions access 或使用拥有该包读取权限的凭据。

## npm 公网发布与 provenance

仓库保留可选的 Publish npm 工作流（`.github/workflows/publish-npm.yml`），用于将来按明确发布计划把 `@zuvi/*` 发到 npmjs.com。它在发布 Release 或手动运行时触发，未配置 `NPM_TOKEN` 时跳过包发布；没有额外的发布开关。实际发布需要有效的 `NPM_TOKEN` 与 `@zuvi` scope 权限，存在工作流不代表包已在 npmjs 上线。本次仓库迁移与 Pages 部署不配置 `NPM_TOKEN`，不启用 npmjs 发布。

**将来启用前需核对：**

1. 发布账号拥有 `@zuvi` scope 的包发布权限，并完成 npm 要求的身份验证。
2. 发布凭据仅保存在 CI Secret，权限与有效期按实际发布需要配置。
3. 七个包的 `repository` 指向 `Starweave-Labs/zuvi`，工作流身份与仓库一致，并明确启用该发布目标。

**Provenance 验证：** 启用发布时，`npm publish --provenance` 使用 GitHub Actions 的 OIDC 身份附加来源证明。发布后应检查目标版本的 attestations、实际 tarball 与消费者安装结果；仅通过发布前的 OIDC 身份检查，不能作为包已发布或来源证明已生成的证据。

**发布后验证：**

```bash
npm view @zuvi/react dist.attestations   # 有 Sigstore 证明即签名成功
npm audit signatures                      # 校验当前依赖树内签名完整性
```

npmjs 与 unpkg 需要在将来实际发布后单独验证。当前浏览器 IIFE 使用 GitHub Pages 的版本化地址：

```html
<link rel="stylesheet" href="https://starweave-labs.github.io/zuvi/cdn/v1.0.0/zuvi.css" />
<script src="https://starweave-labs.github.io/zuvi/cdn/v1.0.0/zuvi.global.js"></script>
```

## 前端功能范围

页面搭建器是页面设计工具。导出包含页面样式和交互的 HTML；多页原型共享一个 HTML，可离线打开。工作区、主组件和本地内容协作数据保存在当前浏览器，建议定期导出备份。REST 数据源为浏览器端只读 GET，受目标服务的 CORS 约束，不包含业务后端或账号服务。

页面搭建器的 localStorage 和 OfficeStudio 的 IndexedDB 均按网站来源隔离。从旧文档域名切换到组织域名时，需要先在旧站导出作品，再到新站导入；仓库迁移不会删除旧来源的浏览器数据，也不会自动复制到新来源。
