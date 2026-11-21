---
'@zuvi/react': minor
---

DataGrid v1.2：枚举筛选与服务端模式接口

- 列声明 `filterable` + `filterValues` 后，表头出现筛选 disclosure（`aria-expanded`），面板为原生 checkbox 列表；Esc 关闭并把焦点还给触发钮，点击面板外关闭。
- 新增受控筛选 `filters` / `defaultFilters` / `onFiltersChange`（`DataGridFilters`）：空选择 = 无约束，全部清空回调 `null`；未声明或未 `filterable` 的列忽略并告警。
- 过滤先于排序：`aria-rowcount`、`aria-rowindex`、全选范围随过滤后数据集收缩；被过滤掉的已选 key 保留；过滤到 0 行时显示筛选空态文案（`filterEmpty`）并携带 `data-filtered-empty`。
- 服务端模式对齐 RFC-005：`loading` 时正文显示 loadingContent，排序与筛选保持可用，选择输入禁用。
- 修复：非 sticky 列的列宽拖拽 handle 此前锚定到表头行右端，现正确锚定到自身表头单元格。
