# 首轮真实浏览器失败

5272、新 dist `StudioSheet-C865rpBe.js`、`workers=1`、`retries=0`。runner trace、原始日志 / JSON、当轮 XLSX / HTML / PNG 和当轮 spec / dist 快照均在重跑前复制，SHA-256 见 `archive.json`。

三处失败均已定位为脚本问题：

- 隐藏标题后的全页 `columnheader` 计数包含页面下方 API 表格的 7 个标题；实际 Sheet 的标题 DOM 已移除。修正为当前 grid 内的标题计数。
- `C4` 使用 XLSX 隐式 `locked=true`，ExcelJS 未返回显式 `protection` 对象。独立原生读取确认 `sheetProtection.sheet=true`，相邻 `C5` 明确 `locked=false`；脚本按有效锁定状态核对，并同时断言保护已启用和相邻格未被锁定。
- 打印文字按换行 span 绘制，视觉间距不需要节点间空格，因此完整字符串 `hasText` 不能定位行。100% 与 400% 的实际打印 HTML 已完全相等；改用原始行号与隐藏行计算后的物理行定位，并另核对去空白后的完整文字及几何。

上述修正仅修改验收脚本，没有修改产品实现或降低几何 / 文件往返断言。
