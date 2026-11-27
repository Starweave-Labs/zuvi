# W005 与 W021 下一批实现入口

2026-11-27。以下是当前源码和真实 DOCX 诊断所得的实施准备，不是已完成功能。当前批次的最终整站报告单独保存；不能用本文件把 W005 或 W021 升级为完成。

## 已重现的问题

运行 `node docs/audits/2026-11-27/word-sheet-pdf-integration/validation/word-theme-gap-probe.mjs` 可生成三种输入及各两次保存结果。`word-theme-gap-probe/results.json` 记录实际模型与原生 XML：

- 主题字体与主题颜色变成解析后的固定值，原生引用身份丢失。
- 显式自动颜色被解析成普通颜色，连续保存没有恢复自动身份。
- 含透明度的文字填充输入被接受，但保存结果不保留该透明度。

这些结果来自现有原生 codec，不依赖新增界面，也没有修改生产源码。诊断输入仅用于定位缺口，不能作为已经通过兼容验收的最终文档。

## 必须贯通的现有代码

| 环节 | 当前入口与约束 | 下一批需要覆盖的变化 |
| --- | --- | --- |
| 类型 | `studio-types.ts` 的 `StudioWordCharacterStyle` 只有固定字体及六位颜色 | 区分主题引用、自动、固定值和透明度；保留继承、直接覆盖及显式清除的身份 |
| 样式 | `studio-word-styles.ts` 的 `WORD_BODY_RUN`、`RUN_KEYS`、`validateStudioWordParagraphStyles`、`studioWordNodeRun` 与 `studioWordRunMarks` | 验证、继承、快照、自动更新和物化均需理解新增身份；不能只向 textStyle 塞额外字段 |
| 原生读取 | `studio-word-codec.ts` 的 `resolveTheme`、`runProperties`、`parseStyles` 和区域导入 | 当前 resolveTheme 修改 XML 后解析固定值；需另外保留原引用和文档主题定义，并识别直接值对继承引用的覆盖 |
| 编辑 schema | `StudioWord.tsx` 的 `EXTENSIONS`、`TextStyleKit`、`FontFamily` 与 `WordParagraphStyles` | 字符及 doc 属性必须进入 schema，保证编辑、HTML 与 JSON 重开不会剥离身份 |
| 区域与历史 | `StudioWord.tsx` 的 body onUpdate、`RegionEditor`、共享样式 props | 文档主题修改需传播到正文、表格、页眉页脚和插入点；只发生一次历史操作；活动区域切换不应造成权限误判或丢失焦点 |
| 字符操作 | `prepareCharacterAction`、`wordCaptureFormat`、`wordApplyFormat`、`wordClearFormat` 与字号/字体入口 | 沿用草稿、IME、权限、文档和选区快照守卫；格式刷及清除同时处理引用身份，固定颜色/字体编辑应解除相应主题引用 |
| 原生保存 | `studio-word-codec.ts` 的 textStyle 属性白名单、run/style writer 及最后的包处理 | 保留原生主题部件及关系，按当前主题生成适用的显示回退值；自动、引用、透明度分别保存；继续使用已经修复的整数 position |
| 打印 | `studio-print.ts` 的文字 mark 和样式预处理 | 与画布采用同一主题解析约定，文字透明度不影响同段落的链接、其他文字或背景 |
| 分发 | Word 懒加载入口与 `registry/registry.json` | 将 Word 专属实现保留在既有按需边界，不能提高 124928 gzip 字节入口预算；更新 Registry 与 CLI/MCP 消费者源码 |

表中未带目录的组件文件位于 `packages/ui/src/components/OfficeStudio/`；codec 与打印文件位于 `docs/src/pages/collaboration/office-studio/`。

## 建议实施顺序

先定义并验证主题及引用模型，明确缺省、继承、显式自动和直接覆盖；为新语义建立固定色、主题色、自动色与透明度的独立回归。接着保留原生输入身份，再接入实际 ZUVI 入口和一次事务的主题修改。主题解析应与存储身份分开，避免主题变化把原有直接格式误认成需要回写的继承值。字体的原生不同脚本槽需要明确保留，不能仅以一个解析后的 fontFamily 代替全部来源。

写入新字段时同时覆盖样式、插入点、格式刷、清除及区域共享路径。导入尚未支持的文字填充形态应明确拒绝或保持来源，避免再次出现“接受后静默丢失”的结果。

最后通过真实来源的导入、实际入口编辑、取消与非法草稿、一次撤销重做、权限/IME/过期快照、两次 DOCX 保存重开，独立解析原生引用与透明度，并使用规范 renderer 检查可见效果。主题变化应同时影响所有引用并保持直接覆盖不变；浅色、暗色及 320px 必须检查实际入口。按原始 W005、W021 的要求逐项验收后，再运行全仓门禁。

## 本批证据的读取方式

历史审计原件保持原字节；本轮重生成的文件由独立 restoration receipt 指向 `regenerated-history/`，不能把恢复后的旧路径当成本轮新文件。`continuation-native-summary.json` 给出本轮独立核对文件的 SHA、retainedPath 与压缩编码；`source-freeze-final.json` 绑定最终生产源码、测试修正及构建产物。最终验收只认完成的浏览器 JSON 与逐项矩阵，不把中断日志、零用例启动或本文中的建议算作完成。
