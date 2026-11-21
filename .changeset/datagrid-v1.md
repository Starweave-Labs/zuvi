---
'@zuvi/react': minor
---

新增 DataGrid 数据网格组件：10k+ 行固定行高虚拟滚动、单列排序（asc → desc → 清除）、行选择与全选（含半选与 isRowSelectable 过滤）、完整 role="grid" 键盘模型（方向键 / Home / End / Ctrl+Home / Ctrl+End / PageUp / PageDown / Space）与 aria-activedescendant 焦点恢复；实现层按需异步加载，新增顶层 locale.dataGrid 十语言文案与 ./data-grid 子路径。列宽拖拽与键盘调整（±16px、Home/End，受控 columnWidths）与 sticky 固定列（≤左 2）已随 v1.1 交付；筛选与服务端模式接口按 RFC-005 在 v1.2 交付。
