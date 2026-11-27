# X064 工作表缩放、网格线与标题验收

X064 原始要求范围已完成专项验收，最终统一 dist 的三项实际浏览器流程一次全部通过。全仓库集成门禁由根任务继续执行。功能以原始 X064「25 至 400 缩放、隐藏标题网格与文件属性」及共同交互验收为准；不把 X065 的完整打印设置算入本项。

实现将文档布局与屏幕坐标分开：列宽和文字测量使用文档像素，行高仍以磅保存；屏幕 offsets、冻结区、选区、填充预览、鼠标命中和拖动尺寸使用缩放后的像素。文字矩阵独立乘以缩放系数，自动行高与换行结果不因缩放而改变。行列标题保留 40×24 像素的工具尺寸，关闭后真正移除标题 DOM，并调整网格的 ARIA 索引。

视图页使用 ZUVI Input、Select、Checkbox 和 Button，支持 25–400% 整数输入、预设和加减按钮；网格聚焦时 Ctrl/Meta 与加、减、0 可调整或恢复比例。Enter 与失焦提交，Escape 在移走焦点前取消草稿；非法数值及未完成的 IME 输入保持错误守卫。可编辑视图按一次事务保存、撤销和重做；只读调整保留在当前工作表的本地预览，不发布文档修改；禁用时不接受命令。保护单元格不阻止视图调整。本地预览按 Map 保存，合法工作表标识 `__proto__` 与 `toString` 的只读渲染和修改有实际回归；原崩溃及原码见 `prototype-id-review/`。

原生 XLSX 可读取 10–400% 的整数比例，10–24% 保留到用户明确调整比例为止。源 `sheetViews` 的所有窗口及未知属性原样恢复，主视图优先选择 `workbookViewId=0`，没有 0 时取第一个。只差分修改 `zoomScale`、`showGridLines` 和 `showRowColHeaders`，未修改值保留原来的省略与布尔词法。冻结身份未变时保留 pane、topLeftCell 和 selections；改变冻结时只替换主视图的 pane 与关联选区，其它窗口的 sheetView 属性保持原样。工作簿主窗口使用当前活动页签；其它窗口的 activeTab 与 firstSheet 按原 Worksheet 对象身份迁移，被删除或无效时分别回落到当前页签与第 0 页。原生回归覆盖删除前置页、重命名、编号复用及两轮重开。主视图拆分窗格仍沿既有 X063 合同拒绝；保存其它窗口的拆分元数据不表示提供拆分编辑功能。

打印使用文档比例。屏幕缩放及显示开关不修改原生 `printOptions` / `pageSetup` 的比例、网格和标题设置。原生测试覆盖保存源打印比例 83% 与原打印开关；实际浏览器已比较缩放前后的打印 HTML、几何与 PDF；100% 与 400% 的打印 HTML 完全相同。

固定参考见 [reference-evidence.json](reference-evidence.json)：SDK 的 get/setZoom、Drawing/overlay/scroll 联动、打印时暂时使用 100% 比例，以及 web-apps 的快捷键调用。该固定版本的控制器范围为 10–500%，25–400% 是本应用原始验收范围。完整原码及 ExcelJS 4.4.0 的 view 转换器均按原字节保存为 `.js.txt`，SHA-256 记录在 manifest 中。

| 证据                                                     | 当前结果                                                                                     |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 视图纯模型、实际 Sheet 控件、文字布局回归                | 31 / 31 通过                                                                                 |
| 原生 XLSX 新 8 项与既有 Excel 56 项                      | 64 / 64 通过                                                                                 |
| Workspace 缺 view hydration 与完整 native 身份守卫       | 38 / 38 通过，根集成日志在 `root-integration/`                                               |
| 独占代码、相关测试 lint 和 UI types                      | 通过                                                                                         |
| 实际浏览器缩放 / 输入 / 保护 / 只读 / 两轮 XLSX          | 两项通过，记录与附件在当前目录                                                               |
| 实际打印 / 隐藏 master / 明暗 1280 与 320px / 可读编辑器 | 一项通过；声明尺寸精确比例与 Blink 1/64px 实测上界均通过                                     |
| 最终统一 dist 的三项单轮复验                             | 3 / 3 通过，零重试；`browser-final/runner/results.json`                                      |
| 独立文件与打印复核                                       | 两轮 XLSX、4 页 PDF、完整预期文字与第 3 页 URI 已读取；4 页 Poppler PNG 和四张 UI PNG 已检查 |

独立浏览器脚本为 `e2e/office-studio-sheet-view.spec.ts`，使用 5272 端口。任何失败将在重跑前保存当轮 trace、输入输出文件及原始诊断；最终验收不使用主工作区 5174 或旧 dist。

前三轮失败的 runner trace、当轮文件、原始 spec 与日志分别保存在 `first-browser-failure/`、`second-browser-failure/` 和 `third-browser-failure/`。失败均为可分离的脚本定位或测量问题：全页 API 表格标题、XLSX 隐式锁定、换行 span 空白、Blink 子像素量化，以及 ZUVI Input 内外层尺寸。产品源码自 Map 修复后未改；原始文件按 SHA-256 归档后才重跑。

输入中的 HiddenMaster 控制列最终使用 18 字符宽，以完整展示原始未换行的 CONTROL_ROW；合并区 B/C 列宽及高度测量合同没有改变。最终脚本额外保存 `view-editor-320.png`，用于视觉核对 112×24 像素的可读编辑覆盖层。

最终构建为 `StudioSheet-DtZGxBC4.js`，SHA-256 为 `4dab9e6c80ed90daf81c187df2d688ce6c2a364f485c1c9d5d369e6276d29f6c`。实际浏览器 5272 端口、单 worker、零重试，3 项一次通过，耗时约 68 秒。静态入口闭包 124131 gzip 字节，低于既有 124928 预算。

最终范围与数字见 [audit-evidence.json](audit-evidence.json)，完整文件 SHA-256 见 `artifact-manifest.json`。两轮 XLSX 的独立读取确认视图 400%、标题 / 网格关闭、其它窗口活动页签保留、填充值 C7=13、原公式与打印比例 83%；最后的 4 页打印 PDF 经 pypdf 和 Poppler 重开，预期文字完整，第 3 页保留一条原超链接。最终 1280 / 320px 明暗截图、320px 编辑覆盖层和四页打印渲染均已视觉核对。

本项不新增拆分窗格、多窗口编辑或 RTL / page-layout 视图编辑；保留这些源属性不表示提供其渲染功能。打印使用文档比例，原生 printOptions / pageSetup 保真独立于屏幕视图，本记录不宣称完成 X065 的全部打印设置。未修改 159 项台账，也未提交代码。
