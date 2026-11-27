# W026 合并选区和继承身份验收记录

2026-11-26：两个真实浏览器流程均通过；后续与行高/分页及其他本批流程联合复验，26 项全部通过。此处记录切片证据，完整 W026 和 159 项验收仍待审计。

两个流程覆盖：

- mixed 行间距的 3×3 原生网格，同时包含 rowspan 和 colspan。实际鼠标形成四格合并闭包，修改九宫格、直接边距和表格默认边距；取消不写入，一次撤销和重做恢复整个事务；两次导出及重开逐格检查原生属性、合并延续、未选中格式与标记。打印入口生成的真实文档测量可见边界、跨度、行间隙、回填高度与文字底部和右侧坐标。
- 独立继承夹具先恢复第一格 `cellMargins=null`，再完成两轮原生往返。随后清空表格默认 left 及整表 spacing，同时写入直接 top=0；保留其他默认侧和未选中单元格，检查行间距覆盖清除、缺项继承和显式零值的独立身份；再次两轮原生往返和打印。

明色、暗色及各自 320px 通过实际弹窗编辑和取消检查。九宫格选中按钮为 primary，其余八个为 outline；检查弹窗和底部按钮的实际位置与横向溢出。对齐验收使用坐标，不依赖 CSSOM 的 flex/flow 等价序列化。

`build-fixtures.py` 使用 bundled Python 标准库生成 ZIP/OOXML；`source-reference.docx` 保留原始参考包。`fixture.json` 登记原生单位、夹具哈希和预检状态，`*-source.xml` 为对应输入字节中的主文档 XML。

主任务已用 bundled LibreOffice 渲染 merged/cleared 的第二轮 DOCX，并逐页检查字形、合并、边距和零间距。该渲染器忽略已有 spacing 对照，因此物理间距仍依赖独立原生字段、当前画布与实际打印坐标证据。使用的 bundled LibreOffice 路径：

`/Users/meaili/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/MacOS/soffice`

首次 start/left 默认方向测量失败保留 trace/context/run；修正按真实 computed direction 解析物理方向，整体属性和坐标断言保持严格。后续原生与浏览器终态及代码提交由主任务补录，不在本目录把 159 项目标记为完成。
