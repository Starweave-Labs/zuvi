# @zuvi/tokens

> v1.0.0 发布到 GitHub Packages：`@yeyouyuan/zuvi-tokens`，npmjs 暂不发布。先在项目 `.npmrc` 配置 `@yeyouyuan:registry=https://npm.pkg.github.com`，再用拥有包读取权限的 GitHub 账号登录。

```bash
npm login --scope=@yeyouyuan --auth-type=legacy --registry=https://npm.pkg.github.com
pnpm add @zuvi/tokens@npm:@yeyouyuan/zuvi-tokens@1.0.0
```

源码导入继续使用 `@zuvi/tokens`。完整认证和安装说明见仓库 [GitHub Packages 文档](https://github.com/Starweave-Labs/zuvi/blob/main/docs/GITHUB-PACKAGES.md)。

仓库已迁至 [Starweave-Labs/zuvi](https://github.com/Starweave-Labs/zuvi)，文档为 <https://starweave-labs.github.io/zuvi/>。已发布的 v1.0.0 继续使用上面的 `@yeyouyuan/zuvi-*` 名称；未来组织 scope 的包完成发布与安装验证后，才会更新安装入口。

ZUVI 设计令牌：三层结构 + TS 常量 + DTCG JSON。设计原则「简洁中性」——克制灰阶 + 单一主色（蓝，参考 `#1677ff` 感），颜色以 `oklch()` 书写，对比度按 WCAG AA 校准（正文 `fg` 与 `bg` ≥ 4.5:1，`primary-fg` 与 `primary` ≥ 4.5:1，明暗两套均满足）。

## 三层结构

| 层               | 文件               | 命名                                                                                    | 谁消费                    |
| ---------------- | ------------------ | --------------------------------------------------------------------------------------- | ------------------------- |
| Primitive 基础层 | `src/base.css`     | 无语义色阶/刻度：`--zuvi-neutral-50..950`、`--zuvi-brand-*`、`--zuvi-space-*`、`--zuvi-radius` …    | 仅供语义层引用、画色板    |
| Semantic 语义层  | `src/semantic.css` | 语义名：`--zuvi-color-bg / fg / border / primary / danger…`（与 CONTRACTS.md §3 逐字一致） | **组件唯一消费入口**      |
| Theme 主题层     | `src/dark.css`     | 同语义名，只做重映射                                                                    | 自动（系统/`data-theme`） |

- `src/base.css` 还包含 `@property` 注册（关键颜色变量 `<color>`、`--zuvi-radius` 为 `<length>`），主题切换时类型确定、平滑过渡，防换肤闪烁。
- 组件 CSS 只消费语义层与本组件 `--zuvi-<name>-*` 变量；禁止硬编码色值（透明度叠加除外，用 `color-mix()`）。

## 如何换肤（明 / 暗）

暗色覆盖了 semantic 层全部 `--zuvi-color-*` 变量，映射到深色 primitive 色阶。

**主动切换**（最高优先级）：

```js
document.documentElement.dataset.theme = 'dark'; // 暗色
document.documentElement.dataset.theme = 'light'; // 强制浅色
```

**跟随系统**：不设置 `data-theme`（或只设 `'dark'`）时，`prefers-color-scheme: dark`
下 `:root:not([data-theme='light'])` 自动应用同一套暗色映射。设 `data-theme='light'` 可强制保持浅色。

```css
/* 引入顺序：base → semantic → dark */
@import '@zuvi/tokens/css/base';
@import '@zuvi/tokens/css/semantic';
@import '@zuvi/tokens/css/dark';
```

## 品牌换肤（只覆盖 semantic 层）

换肤不必动 primitive 色阶：在你的样式表（或 `:root` 上）覆盖语义变量即可，
所有组件自动生效。例如换成紫色系品牌：

```css
:root {
  --zuvi-color-primary: oklch(0.55 0.2 300);
  --zuvi-color-primary-hover: oklch(0.48 0.18 300);
  --zuvi-color-primary-active: oklch(0.41 0.15 300);
  --zuvi-color-primary-subtle: oklch(0.97 0.02 300);
  --zuvi-color-primary-subtle-fg: oklch(0.48 0.18 300);
  --zuvi-color-link: oklch(0.55 0.2 300);
  --zuvi-color-link-hover: oklch(0.48 0.18 300);
  --zuvi-color-focus-ring: oklch(0.55 0.2 300);
  /* 注意保持 AA 对比度：primary-fg 与 primary ≥ 4.5:1 */
}
```

暗色同理，只覆盖 `[data-theme='dark']` 下的语义变量。

## tokens.json（DTCG 核心格式）

`src/tokens.json` 为 `{"zuvi": {"primitives": {...}, "semantic": {...}}}` 结构，
每个 token 是 `{"$type": "color"|"dimension"|"fontFamily"|"fontWeight"|"duration"|"shadow"|"number", "$value": ...}`，
semantic 层 `$value` 用 DTCG 别名语法指向 primitives（如 `"{zuvi.primitives.neutral.50}"`），
可直接供 Figma / Tokens Studio / Style Dictionary 消费，体现「primitive → semantic」别名链。
（暗色映射在 CSS 变量层完成，见 `dark.css`。）

## TS 常量

```ts
import { tokens, colorScales, type TokenPath } from '@zuvi/tokens';

tokens.color.primary; // 'var(--zuvi-color-primary)'
tokens.space[4]; // 'var(--zuvi-space-4)'
colorScales.brand['500']; // 'var(--zuvi-brand-500)'（文档画色板用）
```

值均为 `var(--zuvi-…)` 引用，明暗换肤自动生效，无 DOM API。

## 源文件

- `src/base.css` — primitive 层 + `@property` 注册
- `src/semantic.css` — semantic 层（组件消费入口）
- `src/dark.css` — 暗色语义重映射
- `src/tokens.json` — DTCG 核心格式导出
- `src/index.ts` — TS 常量（`tokens` / `colorScales` / `TokenPath`）
