# W026 单元格对齐与边距验收记录

2026-11-26：本项切片已验证，完整验收保持待审；159 项目标未完成。Word 本项浏览器证据共 11 个流程，分布于 cell-properties（7）、cell-regions（2）、cell-mapping（2）。PDF 页面操作的两项独立记入 pdf-pages。

实际 ZUVI 弹窗提供九宫格、四侧直接内边距、恢复表格默认边距、表格默认四侧内边距与整表间距。选中状态使用 primary，其他选择使用 outline。直接边距留空保留，默认边距与间距留空清除；显式零值保留覆盖身份。只提交修改过的侧，组合修改为一个历史事务，之后输入不并入此事务。取消、错误、IME、权限变化、过期文档/区域与受控拒绝在实际组件测试中验证。

模型分别保留 `table.defaultCellMargins`、`table.cellSpacing`、`row.cellSpacing` 与 `cell.cellMargins`；直接边距为 null 时恢复继承。DOCX 边距读写 twips，精度 0.05pt；模型间距是完整物理间距，原生 tblCellSpacing 保存半间距，精度 0.1pt。未指定原生边距回退上下 0pt、左右 5.4pt；新建表格显式定义上下 6pt、左右 7.5pt。

固定行预算使用 `H + maxTopMargin + maxBottomMargin - physicalGap - topBorder` 计算内框，外框再加上下边框。cell-source.docx 的 H=24pt、下边距=5pt、零间距，画布与实际打印外框约 39.656px。72pt 九宫格外框约 103.656px，实际文字顶部约 3/37/71px；旧记录中的 32px、96px 已被正确的原生预算取代。

- cell-defaults 两次 DOCX 重开保持默认与直接覆盖身份、列网格和实际间距，恢复默认与历史也通过。
- cell-nested 验证内外表格属性独立，固定内框、文字位置、两次重开与打印相同。
- cell-row-spacing 验证三行 6/12/0pt 物理间距共享 300/300px 列网格；可见间距 8/16/0px，内框约 95.656/87.656/103.656px。段落底边误差约 0.011px，编辑、两次重开和打印一致。
- cell-column 验证真实列拖动预览、取消、单次历史与两次 DOCX 网格保存，不跳换模型和原生列宽。
- cell-auto 验证高自动行中短段落的实际对齐、两次重开与打印。NodeView 保留内部 contentDOM，精确忽略其布局 style；观察器恢复外部移除的 min-height，过滤自己的回填。
- mapping/ 验证 mixed 间距与 rowspan/colspan、真实鼠标四格 CellSelection、文本/加粗/斜体/底纹保持、一次历史、两次 DOCX/XML、实际打印。另验证 cellMargins=null 恢复后两轮重开，再清除默认侧与所有间距、保留显式 top=0 后两轮重开。
- ../word-cell-regions/ 验证页眉/页脚独立修改、取消和权限守卫；明暗 1280/320px 弹窗无横向溢出，九宫格与固定底部按钮可用。小屏表单通过内部滚动访问。

Chromium 158 把 flex-start / safe flex-end 分别规范化为 flow-start / safe flow-end。css-align-equivalence.json 记录独立同坐标验证；相关测试接受等价序列化值，并保留严格的实际框、文字与打印坐标断言。

首次浏览器六个失败及后续 CSSOM 序列化失败均归档；mapping 首次默认 start/left 测量失败按真实 direction 解析修复，未放宽整体属性或几何断言。冷加载编辑器的单位测试改为先准备真实懒加载模块，再验证输入事务，未增加等待上限。

仍需完成完整原始验收：超大合法边距/间距、更多合并与固定行组合、完整自动分页/浮动对象和文档表格样式继承，以及外部 Word/WPS 排版的适用组合。bundled LibreOffice 可核对本批字形、合并与零间距边距，但它对已有 spacing 0/6 对照夹具给出相同渲染，不能据此认定物理间距验收。

本批当前检查：全 UI 2710、docs 359（无跳过）、类型/lint/Registry 92、消费者 385 文件、构建/browser build、分发与入口体积均通过。整站首轮 284/287，三项行高/分页回归修复后 287 项全部通过（15.0分钟）；最终日志和提交将补录。
