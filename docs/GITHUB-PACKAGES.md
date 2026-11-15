# GitHub Packages

组件包发布到两个 registry：GitHub Packages（https://npm.pkg.github.com，名称 `@yeyouyuan/zuvi-*`）与 npmjs.com（公网，名称 `@zuvi/*`，即源码包名本身）。源码与导入路径始终是 `@zuvi/*`；装 npm 公网版无需别名与令牌。

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

七个公开包保持相同版本。先完成全站回归、工作区检查、构建和分发检查，再在对应提交发布同版本 GitHub Release（例如 v1.0.0）。Publish GitHub Packages 工作流只向 npm.pkg.github.com 发布，通过 GITHUB_TOKEN 的 packages:write 权限认证；也可手动触发工作流。

```bash
pnpm build
pnpm --filter @zuvi/react build:browser
node scripts/check-distribution.mjs
node scripts/check-consumer.mjs
pnpm release:prepare
node scripts/check-github-packages.mjs --local
```

prepare 脚本从 npm pack 实际文件清单创建暂存包，重写发布名称和内部依赖，关联 yeyouyuan/zuvi 仓库，输出七个 tarball、SHA-512 完整性值和清单。它不修改源码名称，不包含测试、依赖目录或开发脚本。

local 检查通过临时本机 registry 安装这些 tarball，以验证真实 npm aliases 解析及内部依赖；同时执行 ESM、CommonJS、React 19 SSR、CSS 导出、CLI、MCP stdio 和严格 TypeScript 声明检查。发布之后，工作流重新从 GitHub registry 安装七个版本并重复检查，结果保存为工作流附件。

发布脚本只允许清单中的 owner scope，校验 tarball 的 SHA-512；重跑时只跳过同版本且内容相同的包。发现已存在但内容不同的版本会停止，不覆盖版本。

包的实际可见性和访问权限以 GitHub 包设置为准；工作流安装成功代表对应仓库的令牌可读取。需要向其他仓库开放时，配置包的 Actions access 或使用拥有该包读取权限的凭据。

## npm 公网发布与 provenance

Publish npm 工作流（`.github/workflows/publish-npm.yml`）在 GitHub Release 发布或手动触发时运行，把 `@zuvi/*` 七包按依赖拓扑顺序发到 npmjs.com。与 GitHub Packages 双轨并行：同一个版本号，两个 registry 各一份。

**配置一次：**

1. npmjs.com 注册账号，创建组织 `zuvi`（scope 归属），开启 2FA
2. Access Tokens → Generate New Token → Granular Access Token：Packages 选 *All packages*，Permissions 选 *Read and write*
3. 写入仓库 Secret：`gh secret set NPM_TOKEN --repo yeyouyuan/zuvi`

**Sigstore provenance 签名：** 发布用 `npm publish --provenance`，工作流声明 `id-token: write`，npm 通过 GitHub Actions OIDC 向 Sigstore 取证，把「该版本由此仓库此提交构建」的签名证明附着在包上。前提由代码强制：七个 package.json 声明了指向本仓库的 `repository` 字段；工作流在每次运行（包括未配置 token 的跳过模式）先做 OIDC 自检，验证令牌可达且 `repository` 声明匹配。供应链监测方（如 UNPKG Shield 的发布分类器）把「缺 provenance 认证」计入风险判定，签名是免费的第一方信任信号。

**发布后验证：**

```bash
npm view @zuvi/react dist.attestations   # 有 Sigstore 证明即签名成功
npm audit signatures                      # 校验当前依赖树内签名完整性
```

npm 公网版经 unpkg 自动托管，免 token 直引浏览器 IIFE：

```html
<link rel="stylesheet" href="https://unpkg.com/@zuvi/react/dist/browser/zuvi.global.css" />
<script src="https://unpkg.com/@zuvi/react/dist/browser/zuvi.global.js"></script>
```

## 前端功能范围

页面搭建器是页面设计工具。导出包含页面样式和交互的 HTML；多页原型共享一个 HTML，可离线打开。工作区、主组件和本地内容协作数据保存在当前浏览器，建议定期导出备份。REST 数据源为浏览器端只读 GET，受目标服务的 CORS 约束，不包含业务后端或账号服务。
