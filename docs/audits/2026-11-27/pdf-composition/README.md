# P008 PDF 合并与提取验收记录

2026-11-27：本批真实编辑器与原生文件切片已验证；完整 159 项目标仍未完成。最终全仓门禁与提交来源在本批收尾记录中登记。

实际 ZUVI 入口是“合并 PDF 文件”和“提取 PDF 页面”弹窗，可填写加入/提取页码及顺序、插入位置、文件名称、同名字段策略和失去控件的单选值策略。模型与原始 Blob 通过 `StudioPdfSnapshot` 配对，宿主 `onPdfSourceChange` 同步返回 true 后才接受；模型和原文件同时进入一次历史事务。拒绝、取消、权限变化、文件/session 切换和过期异步结果保留当前内容；撤销拒绝不消费历史记录。旧模型回调的显式 source 替换仍保留其既有历史合同。

合并前把当前字段、虚拟页映射、尺寸和旋转写入新底稿，模型中的可编辑标注只迁移页码，避免重复烧入。当前全部页面保留，加入页面可选序；提取按输入次序。页面稳定 ID 保持，输出重新基于连续 sourcePage。PDF 导入/组合上限 50 MB、200 页，DOCX/XLSX 上限仍 20 MB。

原生内核按受控对象闭包复制页面、内容流、资源、表单、控件、外观、直接/命名链接、目录与动作。同名字段默认改名，也可连接兼容字段；值冲突默认拒绝。first/last 仅安全处理复选和单选；文本、图片和选项字段冲突不能借此覆盖陈旧 AP。单选 V 与 DV 分别保留，失去对应控件时需明确 clear。签名、XFA、动态脚本以及不能安全保持的资源/目录语义按明确边界整次拒绝，未声称支持任意来源 PDF。

密码、富文本、文件选择、普通按钮、未知 FT 和不在当前编辑契约中的列表进入 opaque 只读通道。模型不保存它们的原生值，保存指纹并保护值/类型/结构；原 AP 保留。Invisible/Hidden/NoView 和零面积控件参与映射而不生成可编辑控件。完整字段树、父子关系、页面唯一归属、重复引用和循环先于 pdf-lib 公共枚举校验。

独立检查复现并修复了 indirect null 读取问题：字典中直接/间接 null 都等价缺项，数组中的 null 坐标仍是实值；先物化 terminal 的有效继承属性，再构建原生字段 wrapper，防止错误读取父 V/DV、把密码或单选误分类。原 Blob 未修改，未编辑导出仍逐字节返回原件。旧页面操作准备阶段也补齐 PageLabels 样式/前缀/起始编号及 PrintPageRange 的映射，后续合并/提取才能对应真实页序。

另行复核了宿主 XFA guard：pdf-lib 1.17.1 的 `PDFDict.lookup` 默认已将直接和间接 null 视为缺项，交接中提出的误拒假设没有复现，无需功能修补。新增三项原生回归证明两种 null 来源均可导入、编辑、保存、重开两轮，原 Blob 保持不变；真实 XFA stream 和 packet array 在导入及导出时继续拒绝。补验原生专项 171/171、docs 全量 526/526，来源与完整整站记录见 `../full-e2e/README.md`。

| 验收层 | 证据 |
| --- | --- |
| UI 和历史 | `StudioPdf.composition.test.tsx` 的 14 项，包括配对历史、下一次字段输入独立撤销、IME、取消、readOnly/disabled、源和 renderer 切换、受控拒绝 |
| 原生文件 | `studio-pdf-compose*.test.mjs`、codec/reader/adapter 和 `studio-pdf-page-catalog.test.mjs`；完整闭包、字体/AP、值、动作、null、目录、字段替换和多轮重开 |
| 真实浏览器 | `office-studio-pdf-composition.spec.ts`，3 个流程全部通过，最新日志 `browser-run-final.txt` |
| 实际文件 | `primary-source.pdf`、`incoming-source.pdf`、历史导出、两轮 combined PDF 与 radio PDF；`paired-history-and-refresh.json` 比较旧/新/撤销/刷新 source hash |
| 独立解析 | `verify-native.py`、`independent-native-verification.json` 检查 7 份实际下载 PDF 的规范字段树、控件、V/DV、AP、页序、链接与重复导出字节一致性 |
| 页目录和继承复核 | `native-page-catalog/` 保存 3 个真实目录 PDF、pypdf 验证和 Poppler 四页；`native-field-review/` 保存首次缺陷、修复后 63 条诊断路径与四类继承字段各两轮保存 |
| 视觉 | `combined-light.png` 和明暗/320px 弹窗；`native-render/` 保存 Poppler 144dpi 的 16 页、来源 SHA256 和参数，已逐页目视核对 |

中文值、图片、复选/单选、列表、被动字段外观和绘图均显示正确，未出现新遮盖或裁切。测试故意使用了非标准 FT=VendorPassive：原件 Poppler 本身有两条 non-terminal field 警告，保留两份控件后是四条；原生值和 AP 逐项保留。来源文件和完整 stderr 留在 `native-render/source.json`，未把这些警告记作无警告输出。

首次误用主工作区 5174 服务、工作树定位器修正和历史弹窗关闭动画期间的失败分别归档；当前验收使用本工作树独立 5267 服务。归档清单保持原字节与 SHA256。最终检查不将旧提交的全仓测试数字套用到本批源码。
