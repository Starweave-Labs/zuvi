# W013 制表位与前导符切片验收（2026-11-25）

基线 9cf1532。目标仍为原始 Word 65 / Excel 68 / PDF 26 共 159 项，本批次不代表整个目标完成。

实际 ZUVI Modal/Input/Select/Button 提供位置、左/中/右/小数点对齐、点线/短线/实线/中点前导符和清除。混合段落仅修改给定位置，其他制表位保留；清除继承使用 native clear 指令。取消和错误不写入，权限变化禁用，IME/字体草稿守卫、每次完整提交一次撤销重做。

模型保留原始制表字符和直接增量；样式定义保留原生制表位，继承、直接覆盖、自动更新、格式刷和清除联动。显示层在视图装饰中保留测量宽度，选区/焦点更新不丢宽度，不写入文档或历史；字体加载、页面尺寸、默认间隔和小数符号变化重算。千位分隔符不再误当小数点，点号/逗号分别有原生连续两次重开与浏览器位置证据。页眉和表格按本区域原点布局，打印使用与内容宽度相符的隐藏 iframe 并重用同一测量器。

原生 tabs-source.docx、tabs-roundtrip-1.docx、tabs-roundtrip-2.docx 为实际浏览器导入/编辑/导出/重开证据。截图覆盖结果、明暗及 320px。浏览器检查四种对齐、位置修改、取消、错误、清除和撤销重做、非打印标记/缩放、插入制表符后输入、页眉/表格及打印位置。

参考固定 sdkjs 提交 9d2138866d929be32f1d107e8b5bfae36156e097：word/api.js:4177 将 Tabs 对象转换后交给 SetParagraphTabs；word/Editor/Document.js:21073 按当前选区逐段应用。w:tabs 的位置合并与 clear 指令在原生文件回读中验证。

限制：每段落/样式合并最多 64 个指令，位置 0–1584pt，步长 0.05pt；bar/num/heavy 等扩展拒绝。多行长文本、其他段落对齐、RTL、复杂浮动及完整自动分页组合仍待完整验收。全仓检查结果见 validation.json 和主完成记录。

附加原生文件：tabs-period-source/roundtrip-1/roundtrip-2 与 tabs-comma-source/roundtrip-1/roundtrip-2.docx。小数符号验证曾复现约 24.8pt 偏移，修复后两个浏览器流程均通过。原全量 E2E 的跟踪文件冲突和 UI DataGrid 警告时序复验记录在 validation.json；不把失败运行记为全绿。
