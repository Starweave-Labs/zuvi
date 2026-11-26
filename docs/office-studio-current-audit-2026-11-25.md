# OfficeStudio 159 项当前源码审计（2026-11-25）

源码基线：`2382530`。本次逐项核对 Word 65、Excel 68、PDF 26 项。历史状态保留；本页表示当前源码实现范围，全部条目仍需按原共通验收逐项闭环。

实现分类：基础实现 22 项、切片验证 26 项、部分实现 53 项、未实现 58 项。这不是完整验收完成率。

验收要求：模型与编辑入口、只读/禁用、一次撤销重做、导入编辑导出重开、适用的明暗/320px 浏览器检查及失败原数据不变。已有测试文件不能自动替代每项六维证据。

## Word

| ID   | 功能                   | 当前实现 | 已有行为                                                                        | 功能缺口或未闭环验证                                            | 源码证据                                        |
| ---- | ---------------------- | -------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| W001 | 字体与小数字号 | 基础实现 | 选区字体与字号输入，Enter/失焦/Escape、IME 与历史 | 插入点后续输入、混合字体与全部文件/浏览器矩阵仍需逐项闭环 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W002 | 增大与缩小字号 | 切片验证 | 常用字号阶梯、混合字号分别调整、上下限和插入点后续输入，单事务撤销重做 | 完整共通验收矩阵、复杂样式继承及外部排版软件字号行为仍待核对 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W003 | 粗体斜体下划线删除线 | 基础实现 | 粗体斜体下划线删除线、选区工具状态、撤销 | 混合状态、取消后重做和逐格式 DOCX/UI 对应证据待补 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W004 | 上标与下标 | 基础实现 | 上标下标互斥 Mark 与原生 DOCX 保存 | 交替切换、取消恢复基线的完整 UI/文件矩阵待补 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W005 | 字体颜色与主题颜色 | 部分实现 | RGB 字体颜色；导入解析主题色为直接色 | 缺文档主题色引用、自动颜色和透明度往返 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W006 | 文本高亮与清除高亮 | 基础实现 | 文字背景高亮菜单与无颜色清除 | 后续输入、混合高亮及独立 DOCX 往返证据待补 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W007 | 大小写转换 | 切片验证 | 句首/词首大写、全部大小写/切换，跨文字格式保留链接，Unicode 变长选区和光标所在单词 | 完整共通验收矩阵及地区语言特殊大小写/句子边界规则仍待核对 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W008 | 格式刷单次与连续 | 切片验证 | 字符和段落格式、单次/连续刷、Esc 结束；幂等设置目标格式且保留链接 | 完整原始验收、跨区域/自动更新样式相互影响和全部混合格式仍需核对 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W009 | 清除字符与段落格式 | 切片验证 | 清除直接字符/段落格式，保留标题级别、列表/表格结构与链接；DOCX 重开保持取消格式 | 空插入点、混合选区与跨区域完整验收仍待补齐 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W010 | 字符间距与位置 | 切片验证 | 加宽/紧缩/提升/降低和 pt 预览，混合值保持、样式继承/格式刷/清除、插入点后续输入、单事务与 DOCX 两次重开 | ±500pt/原生精度限制；复杂字体、浮动对象、自动分页和外部 Word/WPS 排版仍待完整验收 | `studio-word-character-layout.ts`；`StudioWordCharacterDialog.tsx`；`office-studio-word-metrics.spec.ts` |
| W011 | 对齐与缩进 | 切片验证 | 对齐/左右/首行/悬挂弹窗、标尺拖动/取消/键盘/单元格坐标、混合值与历史、DOCX 两次重开 | 完整复杂表格/浮动/分页及外部布局验收仍待闭环 | `StudioWordParagraphDialog.tsx`；`StudioWordRuler.tsx`；`office-studio-word-paragraph.spec.ts` |
| W012 | 行距段前段后 | 切片验证 | 倍数/固定/最小值、段前段后、原始单位继承/直接覆盖和打印，DOCX 两次重开及明暗/320px | 复杂混合字体精确裁切、完整自动分页和外部 Word/WPS 布局仍待验收 | `studio-word-paragraph-layout.ts`；`studio-word-codec.ts`；`office-studio-word-paragraph.spec.ts` |
| W013 | 制表位与前导符 | 切片验证 | 四种对齐/点线短线实线中点、位置增量/混合保留/清除继承、样式/历史/权限/原生 DOCX 两次重开/明暗/320px和打印 | 长文本、多行、其他段落对齐/RTL及复杂浮动分页组合待验收；bar/num/heavy拒绝 | `StudioWordTabsDialog.tsx`；`studio-word-tab-extension.ts`；`office-studio-word-tabs.spec.ts` |
| W014 | 项目符号与编号 | 切片验证 | 跨段续编号/中途重启/罗马字母格式/层级、实际 ZUVI 控件和原生 DOCX 两次重开 | 复杂布局与全部混合/跨区域共通验收仍待核对 | `studio-word-numbering-extension.ts`；`office-studio-word-numbering.spec.ts` |
| W015 | 完整多级编号 | 切片验证 | 九级模板/起始/重启/标题关联/字体对齐后缀编辑、原生定义/实例/覆盖与打印/长编号避让 | RTL/浮动/完整自动分页及全部混合列表与外部排版仍待完整验收 | `StudioWordNumberingDialog.tsx`；`studio-word-numbering-codec.ts`；`office-studio-word-numbering.spec.ts` |
| W016 | 段落边框与底纹 | 切片验证 | 逐边/线型/距离/底纹编辑与混合保留、取消/权限/事务/样式/格式刷、DOCX 两次重开和打印及明暗/320px | 复杂线型 CSS 近似、段间/页间连接与完整复杂排版/主题引用仍待验收 | `StudioWordSurfaceDialog.tsx`；`studio-word-surface-codec.ts`；`office-studio-word-surface.spec.ts` |
| W017 | 孤行控制与同下段 | 切片验证 | 段落/样式三种保持属性、继承/直接false/事务/取消权限、实际文字分页与两次 DOCX/打印 PDF 页证据 | 复杂字体/浮动/表格/脚注/真实分页全部组合仍待完整验收 | `studio-word-pagination.ts`；`studio-word-pagination-extension.ts`；`office-studio-word-keep.spec.ts` |
| W018 | 显示非打印字符 | 切片验证 | 空格/制表/NBSP/段落/换行视图标记、区域联动与快捷键；不改模型/选区/历史，DOCX 两次重开及打印隐藏 | 超长文稿和全部字号/文字方向/分页组合仍待完整验收；bar/num/heavy 制表位扩展仍拒绝 | `studio-word-nonprinting.ts`；`StudioWord.tsx`；`office-studio-word-nonprinting.spec.ts` |
| W019 | 标题与正文样式 | 切片验证 | 标题正文样式应用、回显和原生关联 | 原始逐项验收审计和全部共通边界仍未闭环 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W020 | 新增修改继承样式 | 切片验证 | 命名/继承/后续/自动更新样式与 DOCX 重开 | 跨区域事务和全部共通边界仍需完整验收核对 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W021 | 主题字体与颜色 | 未实现 | 主题在导入时解析为实际字体/颜色 | 缺可编辑文档主题与主题引用传播 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W022 | 建表与行列增删 | 基础实现 | 建表、增删行列、标题行与删除表格 | 跨行列选区取消和一次撤销需独立 UI/文件闭环 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W023 | 合并与拆分单元格 | 基础实现 | 矩形合并拆分，原生 colspan/rowspan 往返 | 拆分内容分配、复杂跨合并选区和失败保留证据待补 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W024 | 表格边框底纹样式 | 部分实现 | 单元格背景和默认表格边框 | 缺单边/内外边框、主题表样式编辑及原生保留 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W025 | 行高列宽与分布 | 部分实现 | 行高自动/最小/固定入口、混合/事务/取消/只读/IME、两次DOCX重开及固定裁切实际分页/打印；既有列宽读写拖动；平均行/全列/所选列、合并边界及嵌套原生往返、自然行默认间距修复已验证 | 行高拖动预览/取消/历史与合并两次DOCX切片通过；极小超高/超宽复杂布局/跨页拖动/完整键盘IME浏览器矩阵未闭环 | `docs/audits/2026-11-26/word-row-properties/` |
| W026 | 单元格对齐与边距 | 部分实现 | 单元格内正文可水平对齐 | 缺九宫格垂直对齐、间距和内边距模型/入口 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W027 | 跨页重复标题行 | 部分实现 | 编辑器重复表头预留页高，打印thead；表头编辑/历史/两次DOCX重开/只读/明暗320px | 跨纵向合并、多行超高表头及全部复杂布局仍待验收 | `docs/audits/2026-11-26/word-table-pagination/` |
| W028 | 表格跨页与环绕 | 部分实现 | 行/合并组分页及重复表头；跨页标记入口/历史/原生cantSplit两次重开，固定行高参与测量/打印；单单元格文字段落80行分3页；双列80/50行独立分片、编辑/历史/只读/两次DOCX重开、明暗320px及打印2页全文切片通过 | 通用多列/合并/多段落/图片及重复表头的行内同步分片、复杂布局和浮动定位/环绕仍缺失 | `studio-word-pagination-extension.ts`；`docs/audits/2026-11-26/word-row-properties/`；`docs/audits/2026-11-26/word-table-pagination/` |
| W029 | 文本与表格互转 | 部分实现 | ZUVI分隔/预览/部分文本及嵌套递归选项，取消/IME/历史/权限/受控拒绝；原生完整/部分/嵌套3项与相关模型组件101项通过 | 完整行/纵向合并鼠标选择、各两次DOCX重开及局部列禁用已验收切片；多层复杂内容和完整分隔/合并/焦点组合仍待验收 | `docs/audits/2026-11-26/word-table-conversion/` |
| W030 | 表格公式 | 未实现 | Word 域仅支持页码 | 缺表格引用公式与域刷新；未知域拒绝 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W031 | 内嵌图片插入与尺寸 | 部分实现 | 内嵌图片导入/插入、比例尺寸、删除和保存 | 缺完整替换图片入口及其历史/文件验证 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W032 | 图片裁剪 | 未实现 | 保留原图且可缩放 | 缺可视裁剪与重置；DOCX 裁剪拒绝 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W033 | 浮动图片环绕锚点 | 切片验证 | 六种环绕、锚点、定位、层级、移动与 DOCX 往返 | 完整自动分页、复杂避让和跨页布局未完成 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W034 | 形状与文本框 | 未实现 | Word 节点仅支持文字表格图片等基础内容 | 缺形状/文本框绘制文字及排列、原生对象往返 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W035 | WordArt与SmartArt | 未实现 | 没有对应图形编辑节点 | 缺 WordArt/SmartArt 结构和原生保存 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W036 | 图表与嵌入对象 | 未实现 | Word 内无图表数据/嵌入对象内核 | 缺创建、数据编辑、激活和保存；嵌入对象拒绝 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W037 | 数学公式 | 未实现 | 无数学结构节点 | 缺公式结构与 OMML 文件往返；扩展对象拒绝 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W038 | 超链接 | 部分实现 | 外部链接创建编辑删除与 DOCX 保存 | 缺内部书签链接；原生内部链接拒绝 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W039 | 纸张方向页边距 | 部分实现 | A4/Letter、方向、统一页边距 | 缺按节、自定义纸张及四侧独立边距；多节拒绝 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W040 | 分页符与空白页 | 部分实现 | 显式 pageBreak 可插入和原生保存 | 连续画布没有完整空白页管理及页级删除验收 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W041 | 分节符四种类型 | 未实现 | 页面设置仅单节 | 四种分节类型缺模型/入口，原生分节拒绝 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W042 | 分栏与栏宽间距 | 未实现 | 单栏画布 | 缺分栏与栏间分页；多栏 DOCX 拒绝 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W043 | 不同首页奇偶页页眉页脚 | 部分实现 | 默认页眉页脚编辑、距离和字段 | 不同首页/奇偶页/节继承未实现，原生拒绝 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W044 | 页码格式与起始页码 | 部分实现 | PAGE/NUMPAGES 域原生保存，画布占位 1 | 缺起始值、格式、续节和编辑器域计算 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W045 | 水印与页面背景 | 未实现 | 纸张背景为界面样式 | 缺文档水印/背景模型、透明度与节范围 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W046 | 自动分页与布局重算 | 部分实现 | 文本/标题/内嵌图片行测量、三种保持约束、视图/尺寸/字体/图片加载重算；表格行/合并组分页与重复表头，图片/表头编辑及两次DOCX重开/明暗320px | 浮动避让、复杂表格/脚注/节/重复页眉页脚/页码域和长文稿全部组合仍未完成 | `studio-word-pagination-extension.ts`；`office-studio-word-keep.spec.ts`；`docs/audits/2026-11-26/word-inline-pagination/`；`docs/audits/2026-11-26/word-table-pagination/` |
| W047 | 标尺与页缩略图 | 部分实现 | 标尺缩进键盘/拖动预览/取消/历史和单元格原点；标题导航与缩放 | 缺页边距编辑、真实页缩略图与光标页同步，完整分页仍未实现 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W048 | 打印预览与真实分页 | 部分实现 | 打印 HTML 与图片定位/环绕 | 精确分页、页范围/纸张/域计算及真实打印验收待实现 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W049 | 大纲导航 | 基础实现 | 标题层级列表与光标跳转，随文档更新 | 全部修改/只读/跨区域浏览器验收矩阵待补 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W050 | 自动目录域 | 未实现 | 目录标签仅提供大纲导航 | 缺 TOC 域生成、页码链接、更新删除 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W051 | 脚注与尾注 | 未实现 | 没有脚注/尾注节点 | 引用原生内容拒绝；缺编号、转换与正文联动 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W052 | 书签 | 未实现 | DOCX bookmarkStart/End 被跳过 | 书签身份会丢失；缺校验、管理、跳转、保存 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W053 | 交叉引用 | 未实现 | 仅外部链接和页码域 | 缺高级引用与目标更新 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W054 | 题注与图表目录 | 未实现 | 没有题注类型与编号模型 | 缺章节号、题注和图表目录 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W055 | 域代码与更新 | 部分实现 | PAGE/NUMPAGES 域读写 | 缺任意域代码、锁定、刷新和编辑器结果计算 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W056 | 查找与替换 | 部分实现 | 当前正文/页眉/页脚区域文字与格式查找替换 | 缺整词、特殊字符及跨区域一次完整查询/替换 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W057 | 拼写与语言设置 | 未实现 | 编辑区 spellcheck=false | 缺建议、忽略词典与语言设置 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W058 | 批注回复与解决 | 未实现 | 无 Word 批注线程模型 | 原生批注锚点拒绝；回复、解决/重开未实现 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W059 | 修订记录 | 未实现 | 普通本地编辑历史 | 缺带作者时间的插入删除/格式修订；DOCX 修订拒绝 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W060 | 接受拒绝与修订视图 | 未实现 | 无修订模型 | 缺接受拒绝、原始最终和标记视图 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W061 | 比较与合并文档 | 未实现 | 单个 Word 文档内核 | 缺结构/格式比较与可审阅修订合并 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W062 | 邮件合并 | 未实现 | 无合并数据源或字段 | 缺预览与逐记录原生导出 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W063 | 内容控件与占位符 | 未实现 | 普通富文本节点 | sdt 控件拒绝；缺四种内容控件与边界 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W064 | 表单字段与属性 | 未实现 | Word 不包含表单字段契约 | 缺类型、必填只读提示及原生保存 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |
| W065 | 表单角色与填写模式 | 未实现 | 无字段角色或填写模式 | 缺角色分配/颜色/验证 | `StudioWord.tsx:156`；`studio-word-codec.ts:60` |

## Excel

| ID   | 功能                     | 当前实现 | 已有行为                                                   | 功能缺口或未闭环验证                                      | 源码证据                                            |
| ---- | ------------------------ | -------- | ---------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------- |
| X001 | 单格公式栏与矩形选区 | 基础实现 | 矩形选区、地址导航、公式栏提交取消、IME/草稿守卫 | 完整共通验收矩阵与窄屏文件编辑证据待补 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X002 | 普通复制剪切粘贴 | 部分实现 | 普通 TSV/内部富剪贴板复制粘贴和公式重定位，Ctrl/Command+C 虚拟选区快照已补 | 无 onCut/剪切移动引用迁移；普通剪切语义未实现 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X003 | 仅公式粘贴 | 基础实现 | 仅公式含常量与相对引用平移 | 独立浏览器原生文件链路和共通边界待补 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X004 | 仅值粘贴 | 基础实现 | 冻结复制时公式值，保留标量类型 | 独立浏览器 XLSX 往返与空白/错误类型验收待补 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X005 | 仅格式粘贴 | 基础实现 | 目标内容保留、格式默认覆盖 | 完整默认/混合格式和原生浏览器往返待补 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X006 | 公式或值加数字格式 | 基础实现 | 公式或值与数字格式两种粘贴 | 完整函数缓存类型及浏览器往返待补 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X007 | 保留源格式粘贴 | 基础实现 | 源格式快照覆盖目标旧格式 | 主题/复杂样式仍不支持；完整支持契约验收待补 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X008 | 无边框粘贴 | 基础实现 | 复制内容/其他格式而保留目标边框 | 合并区域复杂边界与浏览器文件链路待补 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X009 | 列宽粘贴 | 基础实现 | 源列宽映射且目标内容保留 | 窄屏入口和原生导出后的独立列宽验收待补 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X010 | 转置粘贴 | 基础实现 | 转置引用、合并与超链接映射 | 完整合并冲突、取消/IME与原生浏览器链路待补 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X011 | 粘贴链接图片与条件规则 | 部分实现 | 内部复制可保留原生超链接 | 缺链接源单元格、图片与条件规则重定位粘贴 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X012 | 跳过空格与运算粘贴 | 切片验证 | 真正空白跳过、加减乘除、目标公式/快照/重定位、失败整批取消；键盘复制、原生空串及两次 XLSX 重开/明暗/320px | 运算拒绝实际合并/数组；完整混合与跨应用共通验收仍待核对 | `studio-sheet-model.ts`；`StudioSheet.tsx`；`office-studio-sheet-paste-options.spec.ts` |
| X013 | 查找替换与通配符 | 基础实现 | 范围/工作簿、通配符、大小写整格、公式/值查找替换 | 按格式搜索不在本项当前支持范围；原生浏览器全矩阵待补 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X014 | 多段不连续选区 | 未实现 | 单一 anchor/focus 矩形 | 缺 Ctrl 追加非连续范围模型及批量命令 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X015 | Ctrl方向键与数据块选择 | 切片验证 | Ctrl/Command 方向键跨数据块导航，Shift 保留起点扩展；隐藏行列、合并与数组结果参与导航 | 全部合并/冻结/滚动组合及完整原始共通验收仍待审计 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X016 | 可拖动填充柄 | 部分实现 | 填充柄预览、数字日期/文本、取消与单事务 | 复杂滚动/冻结/合并坐标、公式种子和原生浏览器链路待核对 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X017 | 向下向右与序列填充 | 切片验证 | 向下/向右复制与线性序列、停止值、正负/双种子/独立轨道；相对公式复制与 XLSX 两次重开及明暗/320px | 原始共通验收的全部适用组合仍待逐项核对 | `studio-sheet-fill.ts`；`StudioSheetRuleDialog.tsx`；`office-studio-sheet-series.spec.ts` |
| X018 | 格式刷 | 切片验证 | 矩形格式快照、单次/连续、拖选/键盘、取消与单事务；原生 XLSX 两次重开、明暗/320px | 跨表与全部冻结/滚动/合并组合仍待完整验收；换表取消，布局冲突整次拒绝 | `studio-sheet-painter.ts`；`StudioSheet.tsx`；`office-studio-sheet-painter.spec.ts` |
| X019 | 字体字号与常用文字格式 | 部分实现 | 字体小数、加粗斜体下划线与颜色保存 | 混合选区回显/默认字体契约及更多文字格式待补 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X020 | 数字格式与自定义格式 | 切片验证 | 自定义代码/条件/四分节，中美地区日期时间及数字/文本；类型保留、历史、权限、打印/筛选和 XLSX 两次重开 | 其他地区/ColorN/1904 日期系统、宽度填充和外部应用完整验收仍待补齐 | `studio-number-format.ts`；`StudioSheetNumberFormatDialog.tsx`；`office-studio-sheet-number-format.spec.ts` |
| X021 | 完整边框与斜线 | 部分实现 | 所有/外侧/无边框、六线型与颜色 | 缺单边/内横内竖/斜线；复杂合并边界待补 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X022 | 填充与主题颜色 | 部分实现 | 直接 RGB 填充/无填充 | 缺主题引用和色调往返；普通源样式保留不代表编辑支持 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X023 | 对齐缩进旋转文字 | 部分实现 | 左中右、顶中底对齐 | 缺分散、跨选区居中、缩进与旋转模型/入口 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X024 | 换行缩小字体 | 部分实现 | 自动换行和手动自动行高 | 缺 shrinkToFit 与编辑后自动行高联动 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X025 | 合并拆分 | 基础实现 | 合并冲突/非空拒绝、拆分和 XLSX 保存 | 完整浏览器失败恢复/历史/原生重开矩阵待补 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X026 | 清除分项菜单 | 部分实现 | 清空内容、清除格式和链接/规则独立管理 | 缺统一清除分项菜单、批注管理/选择性清除 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X027 | 行列插入删除 | 基础实现 | 行列结构日志、公式尺寸合并规则图表链接迁移 | 数组新增边界及全原生浏览器矩阵待完整审计 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X028 | 单元格插入删除并移位 | 未实现 | 只支持整行/整列结构编辑 | 缺单元格右下左上移位及引用变更 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X029 | 行高列宽自动适配 | 部分实现 | 行高列宽拖动/键盘/自动适配 | 复杂合并字体测量、读入隐藏尺寸和文件链路待补 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X030 | 独立隐藏显示行列 | 部分实现 | 手动隐藏行列、全列恢复、导航跳隐藏 | 行选区显示/隐藏独立入口不完整，隐藏列仅活动列操作 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X031 | 工作表复制移动隐藏 | 部分实现 | 新增删除重命名/选表和跨表引用迁移 | 缺工作表复制移动隐藏及恢复；隐藏工作表原文件拒绝 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X032 | 分组与分级显示 | 未实现 | 源结构保存时部分保留 outlineLevel | 无分组/层级 UI 和独立模型，不能按透传视为实现 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X033 | 公式解析与计算错误 | 部分实现 | 解析器、跨表引用、循环/预算/错误传播 | 支持函数/引用子集及导入缓存边界仍需逐函数审计 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X034 | 名称管理器 | 未实现 | 无名称模型和管理器 | 命名区域文件拒绝；作用域/冲突/引用更新缺失 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X035 | 结构化表引用 | 未实现 | 普通单元格引用 | 原生数据表拒绝，缺结构化引用和自动扩展 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X036 | 数组与动态溢出 | 切片验证 | 固定/动态数组、矩阵、溢出/保护冲突、结果格限制和 XLSX 往返 | 更多动态函数/外部应用重算及完整共通验收仍待完成 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X037 | 函数向导与分类帮助 | 部分实现 | SUM/AVERAGE/COUNT/IF 插入按钮和简短提示 | 缺分类向导、参数校验、引用选择/预览 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X038 | 数学统计逻辑函数 | 部分实现 | 解析器提供数学统计逻辑，数组支持已补 | 没有逐函数完整参数/空值/数组/误差证据 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X039 | 文本日期查询函数 | 部分实现 | 日期 1900 日历与 HYPERLINK/IF 语义专项修正 | 其他文本查询函数、地区语义仍需逐函数核对 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X040 | 财务工程数据库函数 | 部分实现 | 依赖解析器可调用部分财务工程统计函数 | 未证明全部函数精度/边界和原生缓存一致 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X041 | 追踪引用与显示公式 | 未实现 | 公式栏可看活动公式 | 无前后依赖箭头、跨表追踪与全表显示公式 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X042 | 计算设置与单变量求解 | 未实现 | 当前自动计算、全量加载重算 | 缺手动/迭代设置和单变量求解控制 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X043 | 多关键字排序 | 基础实现 | 多键优先级/方向、稳定排序、引用调整 | 扩展选区询问、浏览器原生排序链路和全边界待补 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X044 | 完整自动筛选 | 切片验证 | 文字/数字单条件和字体填充颜色原生保存 | 缺值列表、日期层级、同列多个条件 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X045 | 文本分列 | 未实现 | TSV 解析用于粘贴 | 缺分隔/固定宽度分列、预览与列类型 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X046 | 删除重复项 | 未实现 | 没有去重命令 | 缺表头/比较列、类型空值语义及计数 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X047 | 数据验证完整管理 | 部分实现 | 七类规则管理、来源/空白/提示/严重度、事务校验 | 命名来源/复杂范围/扩展 XML 不支持；完整原要求逐项闭环待补 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X048 | 条件格式完整管理 | 部分实现 | 八类条件格式、色阶、优先级/停止和原生保存 | 缺数据条/图标集、完整阈值与复杂差异样式 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X049 | 外部链接与导入 | 未实现 | 普通工作簿内公式和原生超链接 | 外部计算链接/连接文件拒绝；来源更新和权限失败恢复缺失 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X050 | 表样式与汇总行 | 未实现 | 普通区域可筛选排序 | 原生 Table 对象拒绝，缺表样式/汇总/自动扩展 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X051 | 表范围重命名与转普通区域 | 未实现 | 没有原生 Table 模型 | 缺范围重命名/转普通区域和结构引用迁移 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X052 | 创建透视表与字段布局 | 未实现 | 没有透视缓存或字段模型 | 透视文件拒绝，创建/字段拖放/汇总缺失 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X053 | 值汇总与显示方式 | 未实现 | 普通单元格求和/计数 | 透视值汇总及显示方式缺失 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X054 | 分组排序筛选刷新 | 未实现 | 普通区域排序筛选 | 透视分组/展开/刷新缺失 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X055 | 钻取明细与计算字段 | 未实现 | 没有透视模型 | 钻取/新表明细/计算字段缺失 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X056 | 切片器与时间线 | 未实现 | 没有切片器/时间线对象 | 原生对象拒绝，多选/连接和保存缺失 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X057 | 原生柱状与折线图 | 部分实现 | 原生二维柱状/折线、标题/数据范围保存 | 系列分类独立编辑入口不完整，完整浏览器链路待补 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X058 | 饼散点面积雷达组合图 | 未实现 | 图表类型限 bar/line | 缺饼散点面积雷达组合/次轴等，复杂原生图表拒绝 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X059 | 图表布局格式与数据标签 | 部分实现 | 图表标题可修改，基本 SVG 轴/图例 | 缺轴格式、数据标签、趋势线/误差线与布局编辑 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X060 | 迷你图 | 未实现 | 无 Sparkline 模型 | 缺数据范围/分组/坐标与原生保存 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X061 | 图片形状与嵌入对象 | 未实现 | Sheet 没有图片形状对象 | 图片/绘图/嵌入文件拒绝，锚点裁剪排列缺失 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X062 | 冻结窗格 | 基础实现 | 冻结首行首列/指定模型边界、取消与原生保存 | 全部滚动/合并/隐藏/只读浏览器矩阵待补 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X063 | 拆分窗格与命名视图 | 未实现 | 仅冻结窗格 | 拆分窗格文件拒绝，缺命名视图和独立滚动 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X064 | 缩放网格线与标题 | 未实现 | 固定画布网格/标题 | 缺 25–400% 缩放、网格标题显示和文件属性编辑 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X065 | 打印区域与标题行列 | 部分实现 | 原文件打印范围可透传/结构迁移 | 无多个区域/标题行列编辑与当前表/全书打印选择 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X066 | 页面布局与分页预览 | 部分实现 | 原文件页面设置和断页可保留 | 缺编辑纸张边距/断页/缩放到页和分页预览 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X067 | 页眉页脚与打印选项 | 部分实现 | 普通源页眉页脚与打印选项保留 | 缺字段编辑、打印居中/黑白/网格选项 UI 与准确预览 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |
| X068 | 工作表工作簿与范围保护 | 部分实现 | 本地范围保护/取消和无密码原生保存 | 完整工作表/工作簿结构锁、密码/可编辑范围互操作未实现 | `StudioSheet.tsx:284`；`studio-excel-codec.ts:1267` |

## PDF

| ID   | 功能                   | 当前实现 | 已有行为                                      | 功能缺口或未闭环验证                                            | 源码证据                                   |
| ---- | ---------------------- | -------- | --------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------ |
| P001 | 分页缩略图缩放导航 | 基础实现 | 原页预览、分页缩略图/懒绘制、页码缩放旋转同步 | 完整真实浏览器导航/空页/只读/宽度矩阵待补 | `studio-types.ts:350`；`StudioPdf.tsx:411` |
| P002 | 选择复制与全文搜索 | 部分实现 | 逐页提取文字、全文查找、命中坐标导航 | 无可选择文本层，原文选择复制未实现 | `studio-types.ts:350`；`StudioPdf.tsx:411` |
| P003 | 目录书签导航 | 未实现 | 左侧导航只有搜索批注缩略图表单 | 缺 PDF 原目录读取/层级编辑与保存 | `studio-types.ts:350`；`StudioPdf.tsx:411` |
| P004 | 插入空白页 | 未实现 | pageCount 与原文件绑定 | 缺空白页创建/尺寸位置/撤销保存 | `studio-types.ts:350`；`StudioPdf.tsx:411` |
| P005 | 删除页面 | 未实现 | 原页数不变 | 缺多页删除、最后页限制及引用/批注映射 | `studio-types.ts:350`；`StudioPdf.tsx:411` |
| P006 | 复制移动重排页面 | 未实现 | 缩略图只能导航 | 缺复制移动重排和页面引用历史 | `studio-types.ts:350`；`StudioPdf.tsx:411` |
| P007 | 旋转与页面尺寸 | 部分实现 | 当前页追加 90 度旋转保存 | 缺页面尺寸修改、多页选区旋转；现有旋转重复保存另审 | `studio-types.ts:350`；`StudioPdf.tsx:411` |
| P008 | 合并文件与提取页面 | 未实现 | 单个 source PDF | 缺合并提取及资源/链接/字段冲突处理 | `studio-types.ts:350`；`StudioPdf.tsx:411` |
| P009 | 原页面转换为可编辑对象 | 未实现 | 只在原页叠加模型内容 | 缺原页字体图片路径解析/可编辑转换 | `studio-types.ts:350`；`StudioPdf.tsx:411` |
| P010 | 原文文字编辑 | 未实现 | 原文 canvas 只读 | 缺段落重排、字体映射、真实原内容修改 | `studio-types.ts:350`；`StudioPdf.tsx:411` |
| P011 | 字体段落与对象排列 | 部分实现 | 新增标注位置/大小可编辑，局部移动 | 缺对象层级/分组、原文字段落属性与图像裁剪 | `studio-types.ts:350`；`StudioPdf.tsx:411` |
| P012 | 新增自由文本 | 部分实现 | 新增文字和格式/位置大小 | 导出写页面内容流，非原生 FreeText 批注；重开未恢复标注编辑身份 | `studio-types.ts:350`；`StudioPdf.tsx:411` |
| P013 | 插入图片与超链接 | 部分实现 | 可创建图片表单字段显示图片 | 缺独立页面图片与原生超链接编辑/目标页保存 | `studio-types.ts:350`；`StudioPdf.tsx:411` |
| P014 | 高亮下划线删除线波浪线 | 部分实现 | 矩形透明高亮 | 缺文字 QuadPoints、下划线/删除线/波浪线；导出非原生文字批注 | `studio-types.ts:350`；`StudioPdf.tsx:411` |
| P015 | 便利贴与回复解决 | 部分实现 | 模型内标注列表及回复增删 | 缺原生便利贴/回复作者时间/解决状态；PDF 导出回复未保存 | `studio-types.ts:350`；`StudioPdf.tsx:411` |
| P016 | 墨迹矩形椭圆箭头多边形 | 部分实现 | 笔迹/矩形拖动、宽度、位置和原生矢量内容 | 缺椭圆/箭头/多边形、完整填充/透明度及原生可编辑批注 | `studio-types.ts:350`；`StudioPdf.tsx:411` |
| P017 | 图章与签名图片 | 部分实现 | 手写签名作为 ink 轨迹，图片表单可承载图片 | 缺预设/自定义图章和独立签名图片批注，未覆盖图章原生外观流 | `studio-types.ts:350`；`StudioPdf.tsx:411` |
| P018 | 已有字段填写 | 部分实现 | 已有文本复选单选下拉填写、只读同步及导出 | 普通列表/显示导出值不同的下拉等原生字段仍拒绝，完整字段兼容待审 | `studio-types.ts:350`；`StudioPdf.tsx:411` |
| P019 | 创建文本日期图片字段 | 切片验证 | 文本日期图片字段创建/重复控件/原生保存 | 日期外部动作/更多原生字段格式和完整共通验收待审 | `studio-types.ts:350`；`StudioPdf.tsx:411` |
| P020 | 创建复选单选下拉列表 | 切片验证 | 复选单选下拉列表、导出标签/值、多选默认值 | 完整原生字段兼容和共通验收审计待完成 | `studio-types.ts:350`；`StudioPdf.tsx:411` |
| P021 | 字段布局外观与限制 | 切片验证 | 布局/外观、必填只读多行字符上限提示边框 | 填写时必填的提交策略、任意原文件设计兼容仍需审计 | `studio-types.ts:350`；`StudioPdf.tsx:411` |
| P022 | 字段计算与验证 | 部分实现 | 本编辑器日期 YYYY-MM-DD 验证 | 缺数字范围、原生动作/计算顺序与外部格式校验 | `studio-types.ts:350`；`StudioPdf.tsx:411` |
| P023 | 签名字段与角色 | 未实现 | 图片/笔迹不能代表签名字段 | 缺签名字段角色/状态/外观，原生签名字段拒绝 | `studio-types.ts:350`；`StudioPdf.tsx:411` |
| P024 | 选区搜索页面脱敏 | 未实现 | 高亮只叠加色块 | 缺真正内容/图片/元数据删除及搜索后脱敏 | `studio-types.ts:350`；`StudioPdf.tsx:411` |
| P025 | 密码与权限 | 未实现 | 加密文件直接拒绝 | 缺密码读写和修改打印复制权限保存 | `studio-types.ts:350`；`StudioPdf.tsx:411` |
| P026 | 证书数字签名 | 未实现 | 手写 ink 非数字签名 | 缺证书签名/有效性与文件修改校验，原生签名拒绝 | `studio-types.ts:350`；`StudioPdf.tsx:411` |

## 优先补齐方向

- Word：清除格式/格式刷本批次已补；字号阶梯和五种大小写已补；继续补地区语义与各项共通验收。复杂分页和引用/审阅仍缺内核。
- Excel：完整筛选值列表/日期/同列组合、工作表管理及条件格式；Ctrl+Shift 数据块选择和格式刷已有切片证据；数组外部应用重算和更多函数仍待验证。
- PDF：新增标注与回复写入原生批注并重开恢复，文本选择复制、页面管理、字段计算/角色。

完整来源、行号、已有测试路径和逐项缺口见 `docs/office-studio-goal-status-2026-11-23.json` 的 `currentAudit`。

W008/W009 续修：格式刷已改幂等赋值并补齐段落/连续模式；清除格式保留链接和结构并保持标题原生正文样式与大纲级别。原生 DOCX 28 项、Word UI 60 项、真实浏览器两次往返与明暗/320px 已通过；完整验收仍待进一步核对。

W002/W007 续修：字号按钮按常用档位处理混合字号；大小写补齐句首/词首及当前单词，保留链接和每段文字格式，Unicode 变长后恢复选区/光标。浏览器两次原生 DOCX 重开已验证，完整地区语义仍未全部证明。

X018 续修：矩形格式刷与指针/键盘交互已补，保留公式/数组/链接/规则，默认填充映射修正为真正清除页面旧颜色，隐藏末行保持完整选区和活动单元格；原生 XLSX 两次往返及明暗/320px 已验证。证据在 `docs/audits/2026-11-25/sheet-painter/`。

W018 续修：非打印字符显示已补，视图设置不进入文档历史或 DOCX；导出原生 `w:tab`，打印保留原空白且隐藏标记。75 项模型/Word UI、53 项 DOCX/打印和真实浏览器两次重开、明暗/320px 已验证；新编辑器默认关闭显示，可再次开启。证据在 `docs/audits/2026-11-25/word-nonprinting/`。

X017 续修：停止值已补，包含端点，不能整步到达时停在边界前；保留边界之后原有内容/格式/合并/链接/保护/数组，校验提示只针对实际目标。116 项模型/Sheet UI、42 项 XLSX 和真实浏览器四类序列/撤销重做/两次重开/明暗/320px 已验证。证据在 `docs/audits/2026-11-25/sheet-series/`。

X012 续修：跳过真正空白及四种运算已补，保留被跳过目标的全部属性，源/目标公式与值快照按所选模式处理，最终批次验证和一次历史。键盘复制与原生空串类型往返同时修复；152 项专项、43 项 XLSX 与真实浏览器两次重开/明暗/320px 已通过。证据在 `docs/audits/2026-11-25/sheet-paste-options/`。
