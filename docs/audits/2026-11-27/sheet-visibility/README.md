# 行列隐藏显示与非打印视图验收（2026-11-27）

本批完成 X030 与 W018 的原始要求及六项共通验收。源码提交见 `verification.json` 的 `sourceCommit`，逐项证据见 `original-acceptance-matrix.json`。159 项范围中累计完整验收 17 项，剩余 142 项，整个目标继续进行。

X030 提供所选行/列隐藏、选区显示与全部显示六个入口。命令保留数据、公式、尺寸、行高 auto/fixed 身份、其他工作表和筛选；一次撤销重做完整恢复。隐藏后焦点移到可见位置，方向键、Shift 扩展与 Home/End 跳过隐藏行列，合并区域保持可导航。只读、禁用、组合输入与非法草稿均有拒绝和恢复检查。

XLSX 的原生 hidden 只能表示最终隐藏状态。为保留手动隐藏与筛选隐藏的重叠，导出在原有 ZUVI 命名空间写入可忽略的 manualHiddenRows 属性，导入同时要求真实原生 hidden 标志，外部取消隐藏可覆盖陈旧属性。普通来源保持原有推断；旧工作区结构编辑先迁移索引。原生四项回归覆盖两轮重开、外部取消隐藏、非法元数据与旧工作区插入行；实际浏览器导入、编辑、下载重开两轮，再显示、清除筛选、重开和只读检查均通过。`browser/` 的四份 XLSX 另有独立 ZIP/XML 核对。

W018 原始要求是“显示空格制表与段落结束，导出不写入可见符号”。现有装饰实现已满足此要求，本批没有修改 Word 生产代码。开关保留 JSON、HTML、原字符、选区与历史；正文、表格、页眉页脚联动，保存重开后本地查看偏好默认关闭。`w018/browser/` 是本轮完整回归实际生成的三个 DOCX 和截图；独立检查正文及页眉页脚文本、原生 tab/break 和重复空白，无新增可见符号。历史同源码审查保留于 `w018/review/`。

## 最终检查

- 同源码完整浏览器回归第二轮 317/317，通过且零跳过、零重试；报告在 `validation/resumed/`。
- UI 177 文件、2900 项，docs 666 项，其他包 144 项通过。类型、lint、Registry 92 条、消费者 408 文件、构建、分发均通过。React ESM 入口 gzip 124129 字节，原预算为小于 124928 字节。
- 冻结核对 1035 份源码/测试、53 份 UI dist 与 182 份 docs JS。全程没有提高超时、放宽断言或跳过用例。
- 首轮完整回归为 315 通过、2 失败，原报告和失败 trace 在 `validation/initial/`。Builder 拖拽目标暂时没有布局框，DataGrid 列宽延迟 73.2ms 超出 64ms；原用例各重复三次均通过，随后完整回归也通过。未据此宣称已确定首轮失败的根因。

## 历史与新产物

交接遗留的 486 份已变化历史文件先逐字节另存，再恢复 Git 中的历史原件；随后对 5416 份普通文件建立第二轮基线，运行后核对恢复。保全清单与回执在 `validation/resumed/`。完整重生成副本与临时备份仍保留于本地 `.release/office-continuation/x030/validation/resumed/`，最终实际 XLSX 与本批 W018 原生输出已复制到本目录独立保留。恢复后的旧审计路径继续表示旧记录。

`validation/initial/` 保存交接中的原始记录与脚本；其中最初矩阵仍标记等待集成，旧校验脚本针对首轮记录，不作为最终通过结论。最终结论以本目录的逐项矩阵、`verification.json` 与 `verify.py` 为准。`artifact-manifest.json` 记录归档文件的字节数与 SHA-256；运行 `python3 -B docs/audits/2026-11-27/sheet-visibility/verify.py` 可只读复核当前源码、原生文件、原始要求和归档身份。

交接遗留的未跟踪测试 checkpoint 原件已校验后移入 `validation/initial/before-composition-checkpoint.pdf`；来源及身份见 `validation/generated-checkpoint-relocation.json`。
