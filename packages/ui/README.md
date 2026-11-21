# @zuvi/react

> v1.0.0 发布到 GitHub Packages：`@yeyouyuan/zuvi-react`，npmjs 暂不发布。先在项目 `.npmrc` 配置 `@yeyouyuan:registry=https://npm.pkg.github.com`，再用拥有包读取权限的 GitHub 账号登录。

```bash
npm login --scope=@yeyouyuan --auth-type=legacy --registry=https://npm.pkg.github.com
pnpm add @zuvi/react@npm:@yeyouyuan/zuvi-react@1.0.0
```

源码导入继续使用 `@zuvi/react`。完整认证和安装说明见仓库 [GitHub Packages 文档](https://github.com/Starweave-Labs/zuvi/blob/main/docs/GITHUB-PACKAGES.md)。

仓库已迁至 [Starweave-Labs/zuvi](https://github.com/Starweave-Labs/zuvi)，文档为 <https://starweave-labs.github.io/zuvi/>。已发布的 v1.0.0 继续使用上面的 `@yeyouyuan/zuvi-*` 名称；未来组织 scope 的包完成发布与安装验证后，才会更新安装入口。

v1.1.0 新增 `Globe` 地球可视化、`Chart` 数据图表、`DataGrid` 数据网格（v1.0–v1.2）与 `DropdownMenu.ContextTrigger` 右键菜单，共 76 个组件条目；v1.1.0 的 GitHub Packages 包以组织 scope `@starweave-labs/zuvi-*` 发布，安装示例在上面的真实安装校验通过后随更新入口一并切换。

```bash
pnpm add @zuvi/react@npm:@yeyouyuan/zuvi-react@1.0.0
```

```tsx
import '@zuvi/react/styles.css';
import { Button } from '@zuvi/react';

<Button variant="primary">开始使用</Button>;
```

- 当前源码 75 个 Registry 组件条目覆盖表单 / 数据展示 / 反馈 / 导航 / 浮层 / 文档编辑；包含 Combobox / MultiCombobox、SideNav、Splitter、CommandPalette、OfficeEditor、OfficeStudio、Chart 与 Globe（完整清单见仓库根 README）
- `Globe` 支持经纬度点位、分类图例与可控隐藏分类、点位标签、本地搜索、数值比例标记、按点位 ID 连接的具名弧线与独立连接选择/详情；保留键盘操作、可访问列表与 2D 回退。源码入口为 `@zuvi/react` 或 `@zuvi/react/globe`，导出 `GlobeCategory`、`GlobeValueScale`、`GlobeFocusRequest`、`GlobeLabelMode` 及基础类型
- `Globe` 的 `value` 只控制点位选择，程序化变更不隐式移动相机；`focus={{ pointId, key?, zoom? }}` 只定位相机，不改变点位或 `arcValue` 连接选择。`transitionDuration` 默认 `0`，可用 `700` 开启短飞行；减少动效时瞬时完成，受控 `view` 需父组件响应 `onViewChange`
- `Globe valueScale` 使用完整数据的有限数字值做平方根面积映射（默认半径范围 `[0.012, 0.036]`），显式 `point.size` 优先；保留原始数字用于比例，单位与展示格式用 `renderTooltip`/`renderArcDetails`，字符串值原样展示、不转成数字。`labels` 支持局部覆盖 28 个文案，含 `searchResults` 的 `{count}` 与 `focusPoint` 的 `{name}` 模板
- `Chart` 使用按需加载的原生 SVG View，无新增图形依赖；支持 `line` / `area` / `bar` / `pie` / `donut` / `scatter` / `radar` / `heatmap` / `treemap` / `funnel` / `gauge` / `waterfall` / `sparkline`，配合 `stack`、`orientation="horizontal"` 和 `bubble` 提供 17 种形态。分类图使用 `categories` + 有限数字或 `null` 缺口的 `series.values`；雷达要求至少三轴且无缺口/负值；比例图使用非负切片；散点的 `x` / `y` 连续、气泡 `value` 以面积映射；热力图使用 `{ id, row, col, value }`，瀑布图使用有符号增量，仪表单值必须在 `min` / `max` 内
- `Chart` 入口为 `@zuvi/react` 或 `@zuvi/react/chart`，原生 `ref` 指向 `HTMLDivElement`；`hiddenSeries`、所选数据 `value` 和 `viewRange` 相互独立，完整数据表 / CSV 不删除原始数据。`height` 默认 `300`，`legend` / `grid` / `tooltip` / `showDataTable` 默认 `true`；`sparkline` 默认高度 `64` 且省略图例、网格和表。21 个 `labels` 文案可局部覆盖十语言 `ConfigProvider locale.chart`
- `tooltipMode="crosshair"`、`zoom`、`brush`、`animated`、`csv` 都显式开启。触控缩放在手势中预览、结束提交；Shift + 图例点击或 Enter / Space 只强调、不覆写隐藏集合；系统减少动态效果设置优先。文档源码有独立画廊、联动与可视化实验室，组件目录和版本不拆分
- 三层 Design Token（CSS 变量），`ConfigProvider locale` 内置 10 套语言包
- 组合式 API（`Modal.Trigger` 等）+ `data-part` / `classNames` / 组件级 CSS 变量三件套定制出口
- 附带 CDN IIFE 构建（`build:browser` → `dist/browser/zuvi.global.js`，随 GitHub Pages 部署）

文档：仓库 `docs/` 站（`pnpm --filter @zuvi/docs dev`）。
