# @zuvi/react

## 1.2.0

### Minor Changes

- 2ca8929: Add named paragraph styles to OfficeStudio Word, including inheritance, editing, next-paragraph styles, automatic updates, direct-format preservation and undo/redo. Style definitions and bindings survive native DOCX import/export and repeated saves. Align Word font controls with the supported 1–409pt file range.
- 2717f3b: Add Word floating image wrapping, position and anchor controls, pointer and keyboard movement, preview cancellation and undo. Preserve native DOCX anchor coordinates, wrapping contours and z-order across repeated saves, including header/footer images. Keep detailed positioning in an accessible dialog and validate persisted layout before editing or exporting.
- 075603f: OfficeStudio PDF 批注支持回复线程

  - 批注模型新增可选 `replies`（`StudioPdfMarkReply[]`），随文档 JSON 持久化，宿主保存/导入导出无需适配。
  - 选中标注后，检视器内出现回复区：查看/添加/删除回复，Enter 直接发送（IME 组合期间不拦截由调用方输入默认行为保证），每个标注上限 99 条。

- ef00c22: OfficeStudio Excel 筛选支持按颜色

  - 筛选条件新增「字体颜色 / 填充颜色」算子：值控件切换为取色器，按单元格 `color` / `background` 与 #hex 归一化后比较（3 位展开为 6 位、大小写不敏感）；无对应颜色的行不匹配。
  - `studioSetFilter` 校验颜色算子必须携带合法 #hex 值；文本/数值算子行为不变。

- 602b725: StudioSheet 筛选新增值列表算子：从筛选区域数据行选择要显示的值（含空白），支持原生 XLSX `<filters>` 多值与 `<blankFilter/>` 往返；列间仍为 AND 关系。
- d60e73a: OfficeStudio Excel 新增多关键字排序

  - 数据工具组新增「多关键字排序」对话框：层级式排序键列表（列 + 逐键升降序、上移/下移、增删层级），键列限定在当前选区内，首行标题可选。
  - 模型层新增 `studioSortRangeByKeys`：首键定序、后键破平局；空单元格在每个键上恒沉底（与方向无关）；完全相等的行保持原始顺序（稳定排序）；相对引用公式随行置换重写、超链接随行迁移（沿用单键排序契约）。
  - 单键 `studioSortRange` 保持原签名并委托多键实现，行为与错误消息不变。

- a57d202: OfficeStudio Word 查找与替换支持按格式筛选

  - 查找面板新增格式筛选（粗体/斜体/下划线/删除线）：只有完整落在满足格式区间内的匹配被保留，跨格式边界的匹配排除；区间无文本节点（如纯手写笔迹）视为不满足。
  - 模型层 `wordFindMatches` 新增可选 `WordFormatCriteria` 参数；替换沿用作范围，全部替换/逐处替换均按筛选后的匹配执行。

- a6c7c16: OfficeStudio Word 多级编号列表

  - 画布中嵌套有序列表以层级编号显示（1.1.1），与 DOCX 导出的多级编号（%1.%2. 格式，最多 9 级）一致；无序列表不参与编号链。
  - 段落组新增「列表下沉缩进 / 上提缩进」按钮（对应 Tab / Shift+Tab）：有前兄弟项时可下沉为下一级，顶层上提会把列表项还原为段落。
  - DOCX 导入/导出的多级编号映射此前已支持，本期补齐编辑器内的显示与操作入口。

### Patch Changes

- ccfe0b4: Preserve Excel color filters in document validation and native XLSX files, including font/fill DXF references and repeated saves. Filter against displayed conditional formatting colors and retain cells with calculation errors when their colors match. Reset incompatible text values when switching to a color criterion.

## 1.1.0

### Minor Changes

- 20572bf: DropdownMenu 支持右键上下文菜单（`DropdownMenu.ContextTrigger`）

  - 新增 `DropdownMenu.ContextTrigger`：包裹任意内容形成右键触发区域，`contextmenu` 时在指针坐标处打开菜单并拦截原生菜单；再次右键移动菜单位置。
  - 键盘等价手势：菜单键 / `Shift+F10` 按触发区域锚元素定位打开（与指针打开共用同一菜单实现，APG 键盘模型、typeahead、Esc 归还焦点全部继承）。
  - 选择菜单项或 Esc 关闭后焦点归还触发区域（区域为 `tabIndex=-1` 的可编程聚焦目标，非 Tab 停靠点）。
  - `FloatingPanel` 新增 `anchorPoint` 视口坐标锚点（内部通用能力）：零尺寸矩形走既有 `floatingPosition` 视口钳制，右缘/底缘越界自动收进视口。

- 20572bf: DataGrid v1.2：枚举筛选与服务端模式接口

  - 列声明 `filterable` + `filterValues` 后，表头出现筛选 disclosure（`aria-expanded`），面板为原生 checkbox 列表；Esc 关闭并把焦点还给触发钮，点击面板外关闭。
  - 新增受控筛选 `filters` / `defaultFilters` / `onFiltersChange`（`DataGridFilters`）：空选择 = 无约束，全部清空回调 `null`；未声明或未 `filterable` 的列忽略并告警。
  - 过滤先于排序：`aria-rowcount`、`aria-rowindex`、全选范围随过滤后数据集收缩；被过滤掉的已选 key 保留；过滤到 0 行时显示筛选空态文案（`filterEmpty`）并携带 `data-filtered-empty`。
  - 服务端模式对齐 RFC-005：`loading` 时正文显示 loadingContent，排序与筛选保持可用，选择输入禁用。
  - 修复：非 sticky 列的列宽拖拽 handle 此前锚定到表头行右端，现正确锚定到自身表头单元格。

- 20572bf: 新增 DataGrid 数据网格组件：10k+ 行固定行高虚拟滚动、单列排序（asc → desc → 清除）、行选择与全选（含半选与 isRowSelectable 过滤）、完整 role="grid" 键盘模型（方向键 / Home / End / Ctrl+Home / Ctrl+End / PageUp / PageDown / Space）与 aria-activedescendant 焦点恢复；实现层按需异步加载，新增顶层 locale.dataGrid 十语言文案与 ./data-grid 子路径。列宽拖拽与键盘调整（±16px、Home/End，受控 columnWidths）与 sticky 固定列（≤左 2）已随 v1.1 交付；筛选与服务端模式接口按 RFC-005 在 v1.2 交付。

## 0.5.0

### Minor Changes

- 发布 ZUVI v0.5.0：Table 新增专业数据驱动模式——字段点击循环升序、降序与清除（受控 `sortState` 与服务端 `manual` 模式）、专用手柄与键盘移动列顺序、高级字段管理（搜索、显隐、恢复默认）；语义化用法保持向后兼容。

## 0.4.0

### Minor Changes

- 发布 ZUVI v0.4.0：新增可自部署的 `OfficeEditor` 和完全使用 ZUVI 控件的 `OfficeStudio`，覆盖 Word、Excel、PDF 的页面内编辑、真实文件导入导出、打印、恢复与历史版本；Registry、CLI 和 MCP 同步提供 73 个正式组件与 16 个业务区块。

  本版本同时完成全组件 P1/P2 交互、无障碍、视觉、RTL 和性能审计修复，并完善 OfficeStudio 的图片缩放、Word 页眉页脚常规编辑流程、Excel 行高调整和 PDF 批注尺寸调整。

### Patch Changes

- Updated dependencies
  - @zuvi/icons@0.4.0
  - @zuvi/tokens@0.4.0
  - @zuvi/i18n@0.4.0

## 0.2.0

### Minor Changes

- # ZUVI v0.2.0：66 组件与分发生态（minor）

  本次发布将七个公开包统一更新至 0.2.0，包含组件、语言包、图标、业务区块及浏览器脚本分发。

  ## 组件库（@zuvi/react）
  - 组件规模扩展至 **66 个 Registry 组件条目**，包括 Upload、Steps、DateRangePicker、Anchor、Typography、Row、Col、Flex 和 Space，并保留 `./config` 子路径导出。
  - **共享浮层引擎**：统一 `floatingPosition` 定位计算与 `FloatingPanel` / portal 基础设施，Modal、Drawer、DropdownMenu、Popover、Tooltip、Select 等浮层类组件共用同一套定位、焦点圈闭（FocusTrap）、点击外部关闭与滚动锁定逻辑。
  - 新增 Upload、Steps、DateRangePicker、Anchor，以及布局与排版组件。
  - 零运行时样式与 `use client` 边界保持不变，CSS 以 `@zuvi/react/styles.css` 提供。

  ## CDN 构建（@zuvi/react）
  - 新增 `build:browser`：产出可直接 `<script>` 引用的 **IIFE 单文件** `dist/browser/zuvi.global.js`（全局变量 `ZUVI`）、配套 `zuvi.css` 与聚合的 `LICENSE.txt`（含 ZUVI / React / React DOM 许可证）。
  - 构建时自动把 CDN 产物拷贝到 `docs/dist/cdn/v{version}`，供文档站与 CDN 直接分发；`package.json` 补充 `unpkg` 字段指向浏览器产物。

  ## 设计令牌（@zuvi/tokens）
  - 三层 CSS 变量体系（base / semantic / dark）+ TS 常量 + DTCG `tokens.json`，支撑全部新组件的主题化与暗色模式。

  ## 图标（@zuvi/icons）
  - 提供 **142 枚** 24 视窗线性图标组件（Feather/Lucide 风格），供组件与业务区块使用。

  ## 国际化（@zuvi/i18n + 文档站翻译代理）
  - 组件文案默认表扩充至 **10 套语言包**：zh-CN、zh-TW、en-US、ja-JP、ko-KR、fr-FR、de-DE、es-ES、ru-RU、pt-BR。
  - `useAutoTranslate` AI 自动翻译（openai / deepl / youdao / custom 多 provider + localStorage 缓存），配套文档站 **AI 翻译安全代理**（`docs/translate-proxy.mjs`）：固定上游路径、限制请求体大小与并发、剥离凭据的 SSRF 安全约束。

  ## 生态：registry / CLI / MCP
  - `registry/registry.json` 包含 **66 个组件与 16 个业务区块**，由源码生成并校验。
  - **@zuvi/cli**：`init` / `add` / `diff` / `list` 四命令，把 registry 组件源码复制进用户项目，内置 registry 数据快照。
  - **@zuvi/mcp**：纯 stdio JSON-RPC 2.0 的 MCP server（零 SDK 依赖），提供组件搜索与代码生成工具，供 AI 编码助手直连。

  ## 业务区块（@zuvi/blocks）
  - 提供 **16 个页面级业务区块**，基于 `@zuvi/react` 组件拼装。

### Patch Changes

- Updated dependencies
  - @zuvi/tokens@0.2.0
  - @zuvi/icons@0.2.0
  - @zuvi/i18n@0.2.0
