# Excel剩余67项技术拆分（只读）

日期：2026-11-27。工作树：`/Users/meaili/.codex/worktrees/finish-office-studio/6a665831-e304-4533-acf4-c350d6b31c59`。分支：`codex/finish-office-studio`。读取时HEAD：`077e307da018a6a9a96b4d07d70bf8e44a803c84`。

范围依据原始 `docs/onlyoffice-feature-ledger-2026-11-13.json`，状态参考 `docs/office-studio-goal-status-2026-11-23.json`，并重新读取实际源码与已有证据。**X064已有本批专项实现、原生和实际浏览器证据，等待根最终统一门禁，按要求排除。其余67项各且仅归入下方19批。**

当前台账分类为基础14、部分23、切片9、未实现21；它们不是完整完成数。历史状态与本次源码判断分开保留，本计划不改任何条目状态。

本次没有改生产源码、测试、docs/audits或台账；没有构建、测试、浏览器或启动服务，只写本Markdown和对应JSON。根316项冻结回归结果尚未取得，不宣称通过。

## 工作量与时间判断

**整体XL，Excel剩余仍是数周级以上工程量。** 这是熟悉代码的人员持续投入、逐波串行合入并补原生和实际交互验收的量级判断，不是日历承诺。不能从67个条目或316项回归直接推算完成日期；函数族、透视和绘图对象的有限范围尚未定量，暂不给小时/天数或可靠上限。

| 量级 | 定义 |
| --- | --- |
| S | 局部验收或小修，无持久化模型变化 |
| M | 既有基础上的独立模块/入口及有限验收闭环 |
| L | 跨模型/UI/原生/引用迁移，多轮专项集成 |
| XL | 新对象/计算/布局子系统与依赖链，不能按项数线性估算 |

已确认的源码事实：

- 普通复制及多种选择性粘贴已有基础，但没有onCut或格内富文本模型。
- 预检仍拒绝命名区域、Table、透视/cache/slicer、外部连接、图片/嵌入对象、隐藏工作表和一般密码保护，这些是真实实现工作。
- chart只有bar/line及一个连续range；filter每列只有operator/value；条件格式没有数据条/图标集。
- 实际Excel打印固定A4横向12mm，遍历全book。源pageSetup/printArea/printTitles保留或结构迁移不代表打印编辑器已完成。
- X064已分离逻辑尺寸与屏幕缩放，是后续回归基线；其他窗口metadata保留不是拆分编辑。

## 接下来优先做1–3项

### 1. X030 独立隐藏显示行列 — M

高频且已有持久化/hidden集合/导航，边界较小，不引入新对象体系。

实现：拟新增可见性纯命令模块，独立设置/移除manual hidden rows/columns，保留旧行高列宽和auto/fixed身份；集成者小范围接线。

验收边界：选区隐藏/显示、全表显示、隐藏列与键盘导航，保尺寸公式及筛选状态，原共同验收和两轮XLSX。

风险：studioSetRowHeight正值或undefined会改高度或mode，不能直接冒充仅显示原行高。

准确入口：
- `packages/ui/src/components/OfficeStudio/StudioSheet.tsx:2879` — `隐藏列`
- `packages/ui/src/components/OfficeStudio/studio-sheet-model.ts:2512` — `export function studioSetColumnsHidden`
- `packages/ui/src/components/OfficeStudio/studio-sheet-model.ts:2138` — `export function studioSetRowHeight`
- `packages/ui/src/components/OfficeStudio/studio-sheet-model.ts:2497` — `export function studioHiddenRows`

### 2. X046 删除重复项 — M

真实缺失且业务结果直观，比较键/变更计划器可独立开发，主grid耦合较低。

实现：拟新增studio-sheet-duplicates.ts及独立ZUVI弹窗（本次未创建）。先typed keys/保留删除行映射/计数，再一次事务应用。

验收边界：原始表头/比较列/空值类型/删除计数及六条共同要求，旁列/未选范围保持，原生导入执行历史与两轮保存。

风险：先查固定参考区域压缩/整行删除/相等语义；whole-row delete不是已证实复用结论。若广泛引用迁移则升L，先做X043。

准确入口：
- `packages/ui/src/components/OfficeStudio/StudioSheet.tsx:3120` — `<Tabs.Panel value="data">`
- `packages/ui/src/components/OfficeStudio/studio-sheet-model.ts:1276` — `export function studioInputValue`
- `packages/ui/src/components/OfficeStudio/studio-sheet-model.ts:433` — `export function studioPatchCells`
- `packages/ui/src/components/OfficeStudio/studio-sheet-structure.ts:586` — `export function studioChangeSheetStructure`

### 3. X044 完整自动筛选 — L

值列表日期层级同列多条件明显提高可用性，已有颜色筛选/native XML基础。

实现：先条件判别联合和旧结构迁移，独立匹配/值列表/日期模块与弹窗；schema/validator/codec由一位owner串行接入。

验收边界：原值列表/日期层级/多条件/颜色/清除，不改值公式，保手动隐藏和DXF，实际UI/OOXML/历史两轮重开。

风险：不能只增UI而export仍拒绝多值；类型日期序号颜色池同步。

准确入口：
- `packages/ui/src/components/OfficeStudio/studio-types.ts:176` — `export interface StudioSheetFilter`
- `packages/ui/src/components/OfficeStudio/studio-sheet-model.ts:2391` — `export function studioSetFilter`
- `packages/ui/src/components/OfficeStudio/studio-sheet-model.ts:2439` — `export function studioFilteredRows`
- `packages/ui/src/components/OfficeStudio/StudioSheet.tsx:1917` — `function applyFilter`
- `docs/src/pages/collaboration/office-studio/studio-excel-codec.ts:1589` — `const autoFilter = first`
- `docs/src/pages/collaboration/office-studio/studio-excel-codec.ts:3288` — `function filterXml(`

备选：X043（M）。若X046固定参考语义恢复延迟，先补连续数据块扩展选区询问及实际原生闭环；现多键方向稳定排序已存在。

## 19批总览

量级按整批计，子阶段不是条目完成声明。依赖描述数据/实现接口，不是新增审批。

| 批次 | 条目 | 量级 | 类型 |
| --- | --- | --- | --- |
| E01 已有编辑查找导航合并冻结收尾 | X001 / X013 / X015 / X025 / X062 | M | acceptance-first |
| E02 选择性粘贴既有契约收尾 | X003 / X004 / X005 / X006 / X007 / X008 / X009 / X010 / X012 | M | acceptance-first |
| E03 普通剪切格内格式和链接图片规则粘贴 | X002 / X011 | XL | implementation |
| E04 多段选区和填充格式刷交互 | X014 / X016 / X017 / X018 | L | mixed |
| E05 字体数字颜色边框和文字测量 | X019 / X020 / X021 / X022 / X023 / X024 / X029 | L | mixed |
| E06 结构编辑行列隐藏工作表分组 | X027 / X028 / X030 / X031 / X032 | XL | mixed |
| E07 内容格式批注链接规则分项清除 | X026 | L | implementation |
| E08 公式内核数组函数向导计算控制 | X033 / X036 / X037 / X038 / X039 / X040 / X042 | XL | mixed |
| E09 名称依赖追踪和外部链接 | X034 / X041 / X049 | XL | implementation |
| E10 排序扩展选区与完整自动筛选 | X043 / X044 | L | mixed |
| E11 文本分列和删除重复项 | X045 / X046 | L | implementation |
| E12 数据验证和条件格式完整管理 | X047 / X048 | L | implementation |
| E13 结构化表与结构化引用 | X035 / X050 / X051 | XL | implementation |
| E14 透视缓存字段布局钻取切片器 | X052 / X053 / X054 / X055 / X056 | XL | implementation |
| E15 图表族系列布局迷你图 | X057 / X058 / X059 / X060 | XL | mixed |
| E16 图片形状嵌入对象 | X061 | XL | implementation |
| E17 拆分窗格和命名视图 | X063 | XL | implementation |
| E18 打印区域页面布局页眉页脚 | X065 / X066 / X067 | XL | implementation |
| E19 工作表工作簿范围保护 | X068 | XL | implementation |

### E01 已有编辑查找导航合并冻结收尾 — M

条目：X001、X013、X015、X025、X062。

源码现状：公式栏/矩形selection、通配符查找替换、Ctrl数据块导航、merge/split和freeze有代码，X015有原生/浏览器专项。

实现/验收边界：逐原始短语及共同要求补缺证据，发现可复现缺陷才补实现；核对当前非左上角非空内容拒绝提示是否满足原始非空警告。

前置：无硬前置，可先做纯模块或原始验收；协调：E04、E06、E17。

子阶段：
- 有限验收矩阵映射已有证据
- 补实际编辑/历史/权限/原生重开缺项
- 依赖合入后回归焦点与坐标

主要文件：`packages/ui/src/components/OfficeStudio/StudioSheet.tsx`；`packages/ui/src/components/OfficeStudio/studio-sheet-editing.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-navigation.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-model.ts`。

可复用测试源码：`packages/ui/src/components/OfficeStudio/StudioSheet.test.tsx`；`packages/ui/src/components/OfficeStudio/StudioSheetSearch.test.tsx`；`packages/ui/src/components/OfficeStudio/studio-sheet-navigation.test.ts`；`e2e/office-studio-sheet-navigation.spec.ts`；`docs/tests/studio-excel.test.mjs`。本次只读，没有执行。

合并风险：导航/焦点/滚动/冻结坐标共享，不重做已有功能。

### E02 选择性粘贴既有契约收尾 — M

条目：X003、X004、X005、X006、X007、X008、X009、X010、X012。

源码现状：多种paste mode、typed快照、相对公式、列宽、转置/合并/链接与skip/运算均有模型，原生有version3 Paste Special和运算两轮保存。

实现/验收边界：九项分别验收默认样式覆盖、复制时缓存类型、无边框保留、转置冲突原子性；不把X012专项等同全部粘贴完成。

前置：无硬前置，可先做纯模块或原始验收；协调：E03、E05、E12。

子阶段：
- 确认各模式原文合同
- 复用原生快照夹具补证据
- 仅修真实类型/格式差异

主要文件：`packages/ui/src/components/OfficeStudio/studio-sheet-model.ts`；`packages/ui/src/components/OfficeStudio/StudioSheet.tsx`。

可复用测试源码：`packages/ui/src/components/OfficeStudio/studio-sheet-model.test.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-paste-options.test.ts`；`packages/ui/src/components/OfficeStudio/StudioSheet.test.tsx`；`docs/tests/studio-excel.test.mjs`；`e2e/office-studio-sheet-paste-options.spec.ts`。本次只读，没有执行。

合并风险：clipboard schema和默认样式共享，hyperlink复制不等于图片/规则粘贴。

### E03 普通剪切格内格式和链接图片规则粘贴 — XL

条目：X002、X011。

源码现状：UI只有onCopy/onPaste，无onCut。StudioCell是单input和整格格式，无rich runs；clipboard有hyperlinks但没有图片/条件规则负载。

实现/验收边界：剪切来源身份/目标移动/外部受影响引用迁移和一次事务；格内富文本单独模型编辑；规则重定位与链接图片分阶段，X011等E16。

前置：无硬前置，可先做纯模块或原始验收；协调：E06、E09、E12、E16。

子阶段：
- 剪切事务与引用移动
- 格内富文本/剪贴板/原生
- 规则/源定位
- 依赖E16完成链接图片

主要文件：`packages/ui/src/components/OfficeStudio/StudioSheet.tsx`；`packages/ui/src/components/OfficeStudio/studio-sheet-model.ts`；`packages/ui/src/components/OfficeStudio/studio-types.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-structure.ts`；`docs/src/pages/collaboration/office-studio/studio-excel-codec.ts`。

可复用测试源码：`packages/ui/src/components/OfficeStudio/studio-sheet-model.test.ts`；`packages/ui/src/components/OfficeStudio/StudioSheet.test.tsx`；`docs/tests/studio-excel.test.mjs`。本次只读，没有执行。

合并风险：copy+clear不能代替cut；未改源richText可保留不等于可编辑/复制richText。

### E04 多段选区和填充格式刷交互 — L

条目：X014、X016、X017、X018。

源码现状：SheetSelection只有anchor/focus，无Ctrl追加多段；填充柄、线性数字日期文本stop、单次连续格式刷已有专项。

实现/验收边界：先补验X016/17/18；多段选区须定义命令适用/拒绝及旧矩形适配，不把增长/任意日期策略自动新增为X017要求。

前置：无硬前置，可先做纯模块或原始验收；协调：E01、E05、E06、E17。

子阶段：
- 已有三项有限收尾
- 多段模型和命令能力表
- 鼠标键盘/IME取消/权限历史/坐标

主要文件：`packages/ui/src/components/OfficeStudio/StudioSheet.tsx`；`packages/ui/src/components/OfficeStudio/studio-sheet-model.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-fill.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-painter.ts`。

可复用测试源码：`packages/ui/src/components/OfficeStudio/studio-sheet-fill.test.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-painter.test.ts`；`packages/ui/src/components/OfficeStudio/StudioSheet.test.tsx`；`e2e/office-studio-sheet-series.spec.ts`；`e2e/office-studio-sheet-painter.spec.ts`。本次只读，没有执行。

合并风险：多段影响格式/清除/粘贴/排序，先统一接口再串行接线。

### E05 字体数字颜色边框和文字测量 — L

条目：X019、X020、X021、X022、X023、X024、X029。

源码现状：整格字体/小数字号/number format、RGB填充、四边框和共享text/auto row存在。边框仅all/outer/none，无斜线/可编辑theme/tint身份。

实现/验收边界：混合字体回显、单边/内横内竖/斜线、主题引用色调和合并测量逐原项闭环；X020/23/24先有限原文差距审计，README全部外部变体不是新门槛。

前置：无硬前置，可先做纯模块或原始验收；协调：E02、E06、E12、E18。

子阶段：
- 已有文字/数字格式/字体收尾
- 边框方向斜线模型原生
- 主题色身份/tint
- 合并适配和打印一致

主要文件：`packages/ui/src/components/OfficeStudio/studio-types.ts`；`packages/ui/src/components/OfficeStudio/studio-cell-format-core.ts`；`packages/ui/src/components/OfficeStudio/studio-cell-style.ts`；`packages/ui/src/components/OfficeStudio/studio-number-format.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-editing.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-text-layout.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-text-display.ts`；`packages/ui/src/components/OfficeStudio/StudioSheetTextDialog.tsx`；`packages/ui/src/components/OfficeStudio/StudioSheet.tsx`；`docs/src/pages/collaboration/office-studio/studio-excel-codec.ts`；`docs/src/pages/collaboration/office-studio/studio-print.ts`。

可复用测试源码：`packages/ui/src/components/OfficeStudio/StudioSheetText.test.tsx`；`packages/ui/src/components/OfficeStudio/studio-sheet-editing.test.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-text-layout.test.ts`；`docs/tests/studio-excel.test.mjs`；`docs/tests/studio-print.test.mjs`；`e2e/office-studio-sheet-number-format.spec.ts`；`e2e/office-studio-sheet-text.spec.ts`。本次只读，没有执行。

合并风险：theme flatten为RGB非无损；字号/font0/行高单位和X064逻辑尺寸须保留。

### E06 结构编辑行列隐藏工作表分组 — XL

条目：X027、X028、X030、X031、X032。

源码现状：整行列insert/delete有引用/尺寸/合并/规则/图表/链接迁移和log。hidden集合存在但列UI仅活动列，行借0行高；无局部移位/复制移动隐藏表/outline模型。

实现/验收边界：先X030独立显隐保原尺寸和X027补验；再X028局部变换、X031稳定sheet身份/跨表引用、X032嵌套层级与汇总位置。

前置：无硬前置，可先做纯模块或原始验收；协调：E04、E09、E12、E13、E17、E18、E19。

子阶段：
- X030和X027
- X028局部四向移位
- X031表身份/复制顺序隐藏
- X032outline/折叠原生

主要文件：`packages/ui/src/components/OfficeStudio/studio-sheet-structure.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-model.ts`；`packages/ui/src/components/OfficeStudio/studio-types.ts`；`packages/ui/src/components/OfficeStudio/studio-model.ts`；`packages/ui/src/components/OfficeStudio/StudioSheet.tsx`；`docs/src/pages/collaboration/office-studio/studio-excel-codec.ts`。

可复用测试源码：`packages/ui/src/components/OfficeStudio/studio-sheet-structure.test.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-model.test.ts`；`packages/ui/src/components/OfficeStudio/StudioSheet.test.tsx`；`docs/tests/studio-excel.test.mjs`；`docs/tests/studio-sheet-view.test.mjs`。本次只读，没有执行。

合并风险：整行列日志不等于局部cell shift；hidden/filter/outline独立，复制表需新name/rel身份。

### E07 内容格式批注链接规则分项清除 — L

条目：X026。

源码现状：已有清input/格式/链接/独立规则管理，缺统一菜单。模型无可编辑批注，源note透传不是显式清除能力。

实现/验收边界：统一五类精确范围和一次事务，补批注寻址/原生删除；未选类别、不相交规则保持。

前置：无硬前置，可先做纯模块或原始验收；协调：E02、E05、E12。

子阶段：
- 五类命令计划
- 批注寻址与显式原生删除
- 混合对象历史权限失败原生

主要文件：`packages/ui/src/components/OfficeStudio/StudioSheet.tsx`；`packages/ui/src/components/OfficeStudio/studio-sheet-editing.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-model.ts`；`packages/ui/src/components/OfficeStudio/studio-types.ts`；`docs/src/pages/collaboration/office-studio/studio-excel-codec.ts`。

可复用测试源码：`packages/ui/src/components/OfficeStudio/studio-sheet-editing.test.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-hyperlinks.test.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-rules.test.ts`；`docs/tests/studio-excel.test.mjs`。本次只读，没有执行。

合并风险：undefined保留与空集合显式删除要一致，导出不能恢复已清源note。

### E08 公式内核数组函数向导计算控制 — XL

条目：X033、X036、X037、X038、X039、X040、X042。

源码现状：fast-formula-parser封装已有1900日历/错误/循环/预算/数组，X036有专项；UI仅SUM/AVERAGE/COUNT/IF模板，无分类参数向导、计算模式或Goal Seek状态。

实现/验收边界：先核定原三类函数有限清单及参数/空值/数组/错误/精度样本，再按族并行。数组按原矩阵/溢出/限制收尾；计算模式迭代求解控制独立状态机，不扩成新分析工具。

前置：无硬前置，可先做纯模块或原始验收；协调：E09、E13、E14。

子阶段：
- 解析预算错误/数组有限验收
- X038/39/40按族纯适配与数据
- 分类参数引用选择/预览
- 计算模式迭代/求解取消无收敛及缓存

主要文件：`packages/ui/src/components/OfficeStudio/studio-sheet-model.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-arrays.ts`；`packages/ui/src/components/OfficeStudio/studio-types.ts`；`packages/ui/src/components/OfficeStudio/studio-model.ts`；`packages/ui/src/components/OfficeStudio/StudioSheet.tsx`；`docs/src/pages/collaboration/office-studio/studio-excel-codec.ts`。

可复用测试源码：`packages/ui/src/components/OfficeStudio/studio-sheet-model.test.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-arrays.test.ts`；`packages/ui/src/components/OfficeStudio/StudioSheet.test.tsx`；`docs/tests/studio-excel.test.mjs`；`e2e/office-studio-sheet-arrays.spec.ts`。本次只读，没有执行。

合并风险：studioCalculate由一个owner接入，函数族独立模块；库存在不是全函数验收。

### E09 名称依赖追踪和外部链接 — XL

条目：X034、X041、X049。

源码现状：自定义definedNames/externalLinks导入拒绝；结构重写遇names/非A1/动态引用会拒绝；无公开依赖图/箭头/全表显示公式。

实现/验收边界：共享引用身份/解析层，依次names作用域冲突更新、依赖追踪跨表定位/显示公式、外链来源更新许可/失败保值，保持无新增后端。

前置：无硬前置，可先做纯模块或原始验收；协调：E03、E06、E08、E12、E13。

子阶段：
- 引用身份/解析接口
- names和definedNames原生
- 依赖追踪/显示公式
- 有限外链来源/更新事务

主要文件：`packages/ui/src/components/OfficeStudio/studio-sheet-model.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-structure.ts`；`packages/ui/src/components/OfficeStudio/studio-types.ts`；`packages/ui/src/components/OfficeStudio/studio-model.ts`；`packages/ui/src/components/OfficeStudio/StudioSheet.tsx`；`docs/src/pages/collaboration/office-studio/studio-excel-codec.ts`。

可复用测试源码：`packages/ui/src/components/OfficeStudio/studio-sheet-structure.test.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-model.test.ts`；`docs/tests/studio-excel.test.mjs`。本次只读，没有执行。

合并风险：names/table/external共同影响移动排序改名，不能只解除拒绝而丢元数据。

### E10 排序扩展选区与完整自动筛选 — L

条目：X043、X044。

源码现状：多键优先级/逐键方向/稳定排序与表头选择存在，无扩展询问。filter每列单operator/value，原生拒绝多值/动态筛选；颜色专项未覆盖值列表日期树同列多条件。

实现/验收边界：X043补连续数据块扩展询问及实际原生；X044条件联合补值列表/日期层级/多条件并保留颜色清除/手动隐藏。

前置：无硬前置，可先做纯模块或原始验收；协调：E06、E08、E12、E13。

子阶段：
- X043扩展范围询问/验收
- X044条件联合/值列表日期
- UI/native filter XML/颜色池回归

主要文件：`packages/ui/src/components/OfficeStudio/StudioSheetSortDialog.tsx`；`packages/ui/src/components/OfficeStudio/studio-sheet-model.ts`；`packages/ui/src/components/OfficeStudio/studio-types.ts`；`packages/ui/src/components/OfficeStudio/studio-model.ts`；`packages/ui/src/components/OfficeStudio/StudioSheet.tsx`；`docs/src/pages/collaboration/office-studio/studio-excel-codec.ts`。

可复用测试源码：`packages/ui/src/components/OfficeStudio/studio-sheet-model.test.ts`；`packages/ui/src/components/OfficeStudio/StudioSheet.test.tsx`；`docs/tests/studio-excel.test.mjs`；`e2e/office-studio-sheet-colors.spec.ts`。本次只读，没有执行。

合并风险：筛选隐藏不能覆盖manual hide；类型日期序号明确，排序不能误移旁列。

### E11 文本分列和删除重复项 — L

条目：X045、X046。

源码现状：data tab只有验证排序筛选，未见分列/去重模型和入口。typed input/范围/原子patch可复用，整行结构API不是选区内压缩。

实现/验收边界：两个纯计划器可并行：分隔/固定宽度/引号/预览/列类型；表头/比较列/空值类型/计数。先查去重区域压缩及引用语义。

前置：无硬前置，可先做纯模块或原始验收；协调：E06、E08、E12。

子阶段：
- 固定参考核对范围类型
- 分列解析/预览计划器
- 去重比较键/行映射/计数
- 共用事务冲突/实际交互原生

主要文件：`packages/ui/src/components/OfficeStudio/StudioSheet.tsx`；`packages/ui/src/components/OfficeStudio/studio-sheet-model.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-editing.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-structure.ts`；`docs/src/pages/collaboration/office-studio/studio-excel-codec.ts`。

可复用测试源码：`packages/ui/src/components/OfficeStudio/studio-sheet-editing.test.ts`；`packages/ui/src/components/OfficeStudio/StudioSheet.test.tsx`；`docs/tests/studio-excel.test.mjs`。本次只读，没有执行。

合并风险：拟新独立text-columns/duplicates及弹窗后小范围接线；不能whole-row delete破坏旁列或猜显示文本相等。

### E12 数据验证和条件格式完整管理 — L

条目：X047、X048。

源码现状：DV有常用类型提示，source限单A1行列；CF有cellIs/expression/text/重复/top10/平均/colorScale和priority/stop，无dataBar/iconSet/完整threshold。

实现/验收边界：按原始范围/下拉来源/allowBlank/提示收尾；CF补数据条图标阈值/差异样式/优先级停止管理，源XML透传不是UI管理。

前置：无硬前置，可先做纯模块或原始验收；协调：E05、E06、E08、E09、E10。

子阶段：
- DV范围来源提示
- CF阈值/数据条图标纯模型
- 顺序stop样式和原生

主要文件：`packages/ui/src/components/OfficeStudio/studio-types.ts`；`packages/ui/src/components/OfficeStudio/studio-model.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-rules.ts`；`packages/ui/src/components/OfficeStudio/StudioSheetRuleDialog.tsx`；`packages/ui/src/components/OfficeStudio/StudioSheet.tsx`；`docs/src/pages/collaboration/office-studio/studio-excel-codec.ts`；`docs/src/pages/collaboration/office-studio/studio-print.ts`。

可复用测试源码：`packages/ui/src/components/OfficeStudio/studio-sheet-rules.test.ts`；`packages/ui/src/components/OfficeStudio/StudioSheet.test.tsx`；`docs/tests/studio-excel.test.mjs`；`docs/tests/studio-print.test.mjs`。本次只读，没有执行。

合并风险：CF绘制/颜色筛选/打印共享style；names来源依赖E09但不阻塞其他DV。

### E13 结构化表与结构化引用 — XL

条目：X035、X050、X051。

源码现状：无Table模型，原生tables目录拒绝，结构重写不接受结构化引用。

实现/验收边界：共享Table身份/列名/范围/样式/表头/筛选/带状/汇总/扩展与结构引用，再做改名/转区域，三项同一合同。

前置：E09:引用身份与names契约；协调：E06、E08、E10、E12、E18、E19。

子阶段：
- Table原生parts/关系/身份
- 结构引用求值迁移
- 样式汇总自动扩展
- 改名/转区域保内容样式引用

主要文件：`packages/ui/src/components/OfficeStudio/studio-types.ts`；`packages/ui/src/components/OfficeStudio/studio-model.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-model.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-structure.ts`；`packages/ui/src/components/OfficeStudio/StudioSheet.tsx`；`docs/src/pages/collaboration/office-studio/studio-excel-codec.ts`；`docs/src/pages/collaboration/office-studio/studio-print.ts`。

可复用测试源码：`packages/ui/src/components/OfficeStudio/studio-sheet-model.test.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-structure.test.ts`；`docs/tests/studio-excel.test.mjs`。本次只读，没有执行。

合并风险：解除tables拒绝后只保cells不是支持；table/names/filter/改名交叉。

### E14 透视缓存字段布局钻取切片器 — XL

条目：X052、X053、X054、X055、X056。

源码现状：无pivot/cache/slicer/timeline模型，相应原生目录拒绝，无创建字段布局。

实现/验收边界：先缓存和行列值筛选字段布局，再值显示/分组排序刷新、明细计算字段，最后slicer/timeline连接与原生；汇总网格不等于透视。

前置：E08:求值类型和聚合契约；协调：E06、E09、E10、E13、E16。

子阶段：
- X052原生cache/字段布局
- X053值显示/X054分组刷新
- X055钻取新表计算字段
- X056对象多选连接保存

主要文件：`packages/ui/src/components/OfficeStudio/studio-types.ts`；`packages/ui/src/components/OfficeStudio/studio-model.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-model.ts`；`packages/ui/src/components/OfficeStudio/StudioSheet.tsx`；`docs/src/pages/collaboration/office-studio/studio-excel-codec.ts`。

可复用测试源码：`docs/tests/studio-excel.test.mjs`。本次只读，没有执行。

合并风险：先固定cache ID/来源/刷新协议，独立cache/layout/codec；不能五项各自造汇总结果。

### E15 图表族系列布局迷你图 — XL

条目：X057、X058、X059、X060。

源码现状：chart仅id/type(bar|line)/title/range，导入限本表连续二维簇状柱/标准线；无次轴标签趋势误差或sparkline。

实现/验收边界：先X057独立系列分类编辑和原生，再X058/59图表族组合轴/布局标签趋势误差，迷你图独立范围位置分组坐标。

前置：无硬前置，可先做纯模块或原始验收；协调：E05、E06、E08、E16、E18。

子阶段：
- X057编辑/闭环
- X058图表族轴系列
- X059布局标签趋势误差
- X060迷你图原生分组

主要文件：`packages/ui/src/components/OfficeStudio/studio-types.ts`；`packages/ui/src/components/OfficeStudio/studio-model.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-model.ts`；`packages/ui/src/components/OfficeStudio/StudioSheet.tsx`；`docs/src/pages/collaboration/office-studio/studio-excel-codec.ts`；`docs/src/pages/collaboration/office-studio/studio-print.ts`。

可复用测试源码：`packages/ui/src/components/OfficeStudio/studio-sheet-model.test.ts`；`packages/ui/src/components/OfficeStudio/StudioSheet.test.tsx`；`docs/tests/studio-excel.test.mjs`；`docs/tests/studio-print.test.mjs`。本次只读，没有执行。

合并风险：与E16共享drawing关系；当前导出删除重建charts/drawings，先统一part所有权。SVG渲染不是原生图表。

### E16 图片形状嵌入对象 — XL

条目：X061。

源码现状：无绘图对象模型，media/embeddings与drawing pic/sp/grpSp拒绝，现chart drawing导出会重建。

实现/验收边界：对象ID/锚点/裁剪/尺寸/排列/媒体关系与命中移动/保护/打印/重开一致；嵌入对象有限类型待查，不扩成任意宏执行。

前置：无硬前置，可先做纯模块或原始验收；协调：E03、E06、E14、E15、E18、E19。

子阶段：
- 对象媒体part/rel合同
- 图片形状锚点裁剪交互
- 有限嵌入对象和排列
- 原生打印及X011整合

主要文件：`packages/ui/src/components/OfficeStudio/studio-types.ts`；`packages/ui/src/components/OfficeStudio/studio-model.ts`；`packages/ui/src/components/OfficeStudio/StudioSheet.tsx`；`docs/src/pages/collaboration/office-studio/studio-excel-codec.ts`；`docs/src/pages/collaboration/office-studio/studio-print.ts`。

可复用测试源码：`docs/tests/studio-excel.test.mjs`；`docs/tests/studio-print.test.mjs`。本次只读，没有执行。

合并风险：先统一drawing分配器；行列移动/隐藏/冻结/缩放的锚点保文档单位。

### E17 拆分窗格和命名视图 — XL

条目：X063。

源码现状：只有一个虚拟grid和freeze，主视图非frozen/frozenSplit pane拒绝；X064保其他窗口metadata不是拆分编辑。

实现/验收边界：独立滚动窗格/命名视图筛选隔离/保存恢复及customSheetViews，复用X064逻辑屏幕分离和冻结合同。

前置：无硬前置，可先做纯模块或原始验收；协调：E01、E04、E06、E10。

子阶段：
- 窗格视图身份原生
- 独立滚动命中/选区编辑
- 命名视图筛选隔离保存

主要文件：`packages/ui/src/components/OfficeStudio/studio-sheet-view.ts`；`packages/ui/src/components/OfficeStudio/StudioSheetViewControls.tsx`；`packages/ui/src/components/OfficeStudio/StudioSheet.tsx`；`packages/ui/src/components/OfficeStudio/StudioSheet.css`；`packages/ui/src/components/OfficeStudio/studio-types.ts`；`docs/src/pages/collaboration/office-studio/studio-excel-codec.ts`。

可复用测试源码：`packages/ui/src/components/OfficeStudio/StudioSheetView.test.tsx`；`packages/ui/src/components/OfficeStudio/studio-sheet-view.test.ts`；`docs/tests/studio-sheet-view.test.mjs`；`e2e/office-studio-sheet-view.spec.ts`。本次只读，没有执行。

合并风险：X064仅作回归基线不重列待办；复制DOM不等于独立窗格编辑。

### E18 打印区域页面布局页眉页脚 — XL

条目：X065、X066、X067。

源码现状：pageSetup/printArea/printTitles/断页源保留或随结构迁移；模型无print setup。实际打印全book/A4横向12mm，无区域标题页眉页脚真实分页。

实现/验收边界：统一打印设置/分页计划，多区域标题/当前表全书、纸张边距方向断页fit/预览、字段居中黑白网格逐项闭环。

前置：无硬前置，可先做纯模块或原始验收；协调：E05、E06、E08、E15、E16。

子阶段：
- 模型hydration原生
- 多区域重复标题/当前表全书
- 纸张断页缩放/统一预览
- 页眉页脚字段选项

主要文件：`packages/ui/src/components/OfficeStudio/studio-types.ts`；`packages/ui/src/components/OfficeStudio/studio-model.ts`；`packages/ui/src/components/OfficeStudio/StudioSheet.tsx`；`docs/src/pages/collaboration/office-studio/studio-excel-codec.ts`；`docs/src/pages/collaboration/office-studio/studio-print.ts`。

可复用测试源码：`docs/tests/studio-excel.test.mjs`；`docs/tests/studio-print.test.mjs`；`e2e/office-studio-sheet-view.spec.ts`。本次只读，没有执行。

合并风险：print.ts由Word等共用，仅改Excel分支；屏幕zoom/grid/headers与print设置独立。

### E19 工作表工作簿范围保护 — XL

条目：X068。

源码现状：仅本地protectedRanges与无密码sheet.protect，普通原生sheetProtection密码/workbookProtection拒绝，无结构锁/原生可编辑范围身份。

实现/验收边界：原三层保护/范围/密码往返，统一能力表与原生hash保留验证，不扩成文件加密或账号后端。

前置：无硬前置，可先做纯模块或原始验收；协调：E03、E04、E06、E08、E13、E16。

子阶段：
- 层级权限原生hash
- 结构锁范围授权各入口
- 密码草稿错误取消原生重开

主要文件：`packages/ui/src/components/OfficeStudio/studio-types.ts`；`packages/ui/src/components/OfficeStudio/studio-model.ts`；`packages/ui/src/components/OfficeStudio/studio-sheet-model.ts`；`packages/ui/src/components/OfficeStudio/StudioSheet.tsx`；`docs/src/pages/collaboration/office-studio/studio-excel-codec.ts`。

可复用测试源码：`packages/ui/src/components/OfficeStudio/studio-sheet-model.test.ts`；`packages/ui/src/components/OfficeStudio/StudioSheet.test.tsx`；`docs/tests/studio-excel.test.mjs`。本次只读，没有执行。

合并风险：不能仅禁toolbar；源保护字节保留不是完整在线保护。

## 并行与合入规则

当前只写本计划两文件，冻结结束前不开始实现/验收执行。

- X030可见性纯命令/小入口、X046纯比较计划器、X044条件设计可分工；主组件/schema/codec由集成者串行接入。
- X046固定参考语义恢复延迟时，改做M级X043扩展选区询问和原生验收。
- E08函数族分数学统计逻辑、文本日期查询、财务工程数据库的纯适配和测试数据，计算内核一位owner。
- E11分列/去重各自计划器；E12 DV/CF各自纯规则模块。
- E15/E16可并行UI/渲染，但须先统一drawing part/rel分配。
- E18独立Excel分页模块，避免Word分支。

共享文件：

- `packages/ui/src/components/OfficeStudio/StudioSheet.tsx`、`packages/ui/src/components/OfficeStudio/StudioSheet.css`：toolbar/state/selection/history/keyboard共享。纯模块/弹窗可并行，同一时段主组件接线只由一位集成者。
- `packages/ui/src/components/OfficeStudio/studio-types.ts`、`packages/ui/src/components/OfficeStudio/studio-model.ts`：公共schema/strict validator/旧草稿兼容，Word/PDF也共享。先固定接口，schema owner统一接入，不放松validator冒充支持。
- `packages/ui/src/components/OfficeStudio/studio-sheet-model.ts`、`packages/ui/src/components/OfficeStudio/studio-sheet-structure.ts`：patch/计算/引用/排序/剪贴板/log交叉。引用与计算各设owner，函数族分独立模块，核心调用点串行。
- `docs/src/pages/collaboration/office-studio/studio-excel-codec.ts`：hydrate/原ZIP/ExcelJS/OOXML补丁集中，chart重建可能删drawing。先定names/table/pivot/drawing/print/protection的parts/rel所有权，再独立codec模块、串行接入。
- `docs/src/pages/collaboration/office-studio/studio-print.ts`：Word/Excel共享HTML和CSS。只改Excel分支或独立模块，屏幕视图和打印设置分开。
- `docs/tests/studio-excel.test.mjs`、`packages/ui/src/components/OfficeStudio/StudioSheet.test.tsx`、`docs/office-studio-goal-status-2026-11-23.json`：通用fixture/mock和台账多写冲突。新增专属测试夹具，不改他人fixture；最终证据和台账仅根依据冻结门禁统一销项。

关键依赖链：

- 引用身份E09 → names → E13结构化表/引用。
- 计算契约E08 → E14原生cache/透视 → 分组刷新钻取 → slicer/timeline。
- drawing所有权协议 → E15/E16原生写入 → X011链接图片粘贴。
- 每波合入 → 专项实际UI/原生/历史权限证据 → 冻结统一门禁 → 根按原条目正式销项。

## 原始范围与完成边界

- 只覆盖原Excel68项中的67项，X064排除
- 原始acceptance及六项commonAcceptance是完成依据，其他remaining只作线索
- 切片/模型测试/整站回归均不等于完整完成，每个原始行为需可追溯
- 只选改变实现或结果的代表边界，不穷举应用/地区/字体/浏览器笛卡尔积
- 保留自研和无新增后端范围
- 原始acceptance每个短语有实现和证据，或经原文论证的适用边界。
- 数据格式、选区焦点、IME取消、一次撤销重做、只读禁用按原共同要求检查。
- 真实原生保存重开；有metadata/关系变化时独立查OOXML及第二轮重开。
- 受控拒绝不产生部分模型/源字节/历史修改；不能用拒绝提示替代必需行为。
- 布局相关才做适用主题/窄屏/打印有限样本，不添加无限外部变体。
- 统一门禁由根执行并绑定源码产物，之后才更新台账，本计划不改完成状态。

## 待查

- X038–X040所需有限函数清单、误差预算和参数矩阵未逐函数核定。inventory所指/private/tmp/zuvi-onlyoffice-reference-20261112当前不存在；应恢复原固定commit参考或使用保存证据，不追赶上游最新函数全集。
- X046区域压缩还是整行删除，以及格式/公式空串/错误/大小写的相等语义待查；不能凭猜测whole-row delete。
- X049无新增后端范围内的外部来源入口和更新权限策略待定，先明确原始外链契约，不扩成ETL或凭据服务。
- X061原始嵌入对象有限类型集合待查，不新增任意OLE/ActiveX/宏执行。
- X019混合/默认字体、X020地区和X023/24复杂布局的README限制哪些阻挡原文验收，需要逐项判定；不把全部浏览器/应用/地区/字体做笛卡尔积。
- 本次未独立打开/重算历史XLSX，未执行工程测试/浏览器；已有证据仅按其记录范围使用。根316项冻结回归结果未取得，不声称通过。

## 关键源码入口与已有证据

行号来自本次工作树，JSON记录相关文件SHA-256；HEAD不替代未提交源码的内容身份。

- `packages/ui/src/components/OfficeStudio/studio-types.ts:116` — `export interface StudioCell`
- `packages/ui/src/components/OfficeStudio/studio-types.ts:168` — `export interface StudioSheetChart`
- `packages/ui/src/components/OfficeStudio/studio-types.ts:176` — `export interface StudioSheetFilter`
- `packages/ui/src/components/OfficeStudio/studio-types.ts:290` — `export interface StudioSheet {`
- `packages/ui/src/components/OfficeStudio/studio-sheet-model.ts:361` — `export interface SheetSelection`
- `packages/ui/src/components/OfficeStudio/studio-sheet-model.ts:922` — `export function studioPasteCells`
- `packages/ui/src/components/OfficeStudio/studio-sheet-model.ts:1351` — `export function studioCalculate`
- `packages/ui/src/components/OfficeStudio/studio-sheet-model.ts:2138` — `export function studioSetRowHeight`
- `packages/ui/src/components/OfficeStudio/studio-sheet-model.ts:2512` — `export function studioSetColumnsHidden`
- `packages/ui/src/components/OfficeStudio/studio-sheet-model.ts:2669` — `export function studioSortRangeByKeys`
- `packages/ui/src/components/OfficeStudio/StudioSheet.tsx:2217` — `function copySelection`
- `packages/ui/src/components/OfficeStudio/StudioSheet.tsx:2294` — `function onPaste`
- `packages/ui/src/components/OfficeStudio/StudioSheet.tsx:1917` — `function applyFilter`
- `packages/ui/src/components/OfficeStudio/StudioSheet.tsx:2879` — `隐藏列`
- `packages/ui/src/components/OfficeStudio/StudioSheetSortDialog.tsx:11` — `export interface StudioSortDialogState`
- `packages/ui/src/components/OfficeStudio/studio-sheet-structure.ts:586` — `export function studioChangeSheetStructure`
- `packages/ui/src/components/OfficeStudio/studio-sheet-editing.ts:314` — `export function studioApplyBorders`
- `packages/ui/src/components/OfficeStudio/studio-sheet-rules.ts:380` — `export function studioConditionalCellStyle`
- `docs/src/pages/collaboration/office-studio/studio-excel-codec.ts:1703` — `async function checkSupportedWorkbook`
- `docs/src/pages/collaboration/office-studio/studio-excel-codec.ts:1070` — `function importedChart`
- `docs/src/pages/collaboration/office-studio/studio-excel-codec.ts:1781` — `function importedCell`
- `docs/src/pages/collaboration/office-studio/studio-excel-codec.ts:2398` — `function updateCell`
- `docs/src/pages/collaboration/office-studio/studio-excel-codec.ts:2719` — `export async function exportStudioExcel`
- `docs/src/pages/collaboration/office-studio/studio-excel-codec.ts:3627` — `contentTypes = contentTypes.replace(`
- `docs/src/pages/collaboration/office-studio/studio-print.ts:626` — `function sheetTable(`
- `docs/src/pages/collaboration/office-studio/studio-print.ts:785` — `: 'A4 landscape';`

现有证据只按其记录范围使用：

- `docs/audits/2026-11-27/sheet-view/README.md`（X064）：已有专项实现/原生/实际浏览器证据，排除本计划，根最终门禁尚未取得。
- `docs/audits/2026-11-24/sheet-arrays/verification.json`（X036）：数组专项，保留remaining，不能推出全部函数矩阵。
- `docs/audits/2026-11-25/sheet-navigation/verification.json`（X015）：导航原生/浏览器切片，按原文补共同边界。
- `docs/audits/2026-11-25/sheet-paste-options/README.md`（X012）：运算跳空专项，不包含普通剪切。
- `docs/audits/2026-11-25/sheet-series/README.md`（X017）：线性停止值切片，不自动增加增长/任意日期策略。
- `docs/audits/2026-11-25/sheet-painter/README.md`（X018）：矩形刷/历史/原生切片，跨表行为按原文判断。
- `docs/audits/2026-11-25/sheet-number-format/README.md`（X020）：中美分节格式专项，地区支持范围须有限核定。
- `docs/audits/2026-11-27/sheet-text-layout/README.md`（X023 / X024 / X029）：共享文字几何/auto行高切片，不替代完整原始验收。
- `docs/tests/studio-excel.test.mjs`（X003 / X004 / X005 / X006 / X007 / X008 / X009 / X010 / X019 / X027 / X030 / X043 / X044 / X047 / X048 / X057 / X062）：读取原生测试源码确认对应案例存在，本次未执行。
- `e2e/office-studio-sheet-colors.spec.ts`（X044）：颜色专项脚本存在，不代表完整filter验收。

## 67项逐项归属

保留原始验收短语。源码判断不表示完成，原固定参考、现状缺口与六项共同要求见JSON。

| ID | 功能与原始验收 | 批次 | 本次源码判断 |
| --- | --- | --- | --- |
| X001 | 单格公式栏与矩形选区：编辑提交取消、地址导航与选区保持 | E01 | 公式栏/矩形selection、通配符查找替换、Ctrl数据块导航、merge/split和freeze有代码，X015有原生/浏览器专项。 |
| X002 | 普通复制剪切粘贴：文本内部格式、剪切移动与公式引用迁移 | E03 | 没有onCut或格内rich runs；普通剪切引用迁移和文本内部格式缺失。 |
| X003 | 仅公式粘贴：常量一起粘贴，公式相对引用正确调整 | E02 | 多种paste mode、typed快照、相对公式、列宽、转置/合并/链接与skip/运算均有模型，原生有version3 Paste Special和运算两轮保存。 |
| X004 | 仅值粘贴：公式变成复制时结果，文本数字布尔类型保留 | E02 | 多种paste mode、typed快照、相对公式、列宽、转置/合并/链接与skip/运算均有模型，原生有version3 Paste Special和运算两轮保存。 |
| X005 | 仅格式粘贴：保留目标内容，覆盖源格式的默认值 | E02 | 多种paste mode、typed快照、相对公式、列宽、转置/合并/链接与skip/运算均有模型，原生有version3 Paste Special和运算两轮保存。 |
| X006 | 公式或值加数字格式：只复制对应内容和数字格式 | E02 | 多种paste mode、typed快照、相对公式、列宽、转置/合并/链接与skip/运算均有模型，原生有version3 Paste Special和运算两轮保存。 |
| X007 | 保留源格式粘贴：格式及内容一致，目标旧格式不残留 | E02 | source-formatting已有，但theme/格内richText不能由现单格模型完整表达。 |
| X008 | 无边框粘贴：复制其他格式内容，保留目标边框 | E02 | 多种paste mode、typed快照、相对公式、列宽、转置/合并/链接与skip/运算均有模型，原生有version3 Paste Special和运算两轮保存。 |
| X009 | 列宽粘贴：源列宽与目标列映射，内容保持 | E02 | 多种paste mode、typed快照、相对公式、列宽、转置/合并/链接与skip/运算均有模型，原生有version3 Paste Special和运算两轮保存。 |
| X010 | 转置粘贴：行列互换，公式与合并映射正确 | E02 | 多种paste mode、typed快照、相对公式、列宽、转置/合并/链接与skip/运算均有模型，原生有version3 Paste Special和运算两轮保存。 |
| X011 | 粘贴链接图片与条件规则：链接源定位、图片关系及规则重定位 | E03 | clipboard只含cells/values/widths/merges/hyperlinks，无图片/规则。 |
| X012 | 跳过空格与运算粘贴：跳过真正空格，加减乘除，失败整批撤销 | E02 | 多种paste mode、typed快照、相对公式、列宽、转置/合并/链接与skip/运算均有模型，原生有version3 Paste Special和运算两轮保存。 |
| X013 | 查找替换与通配符：范围、大小写、整格、公式和值；格式搜索另补 | E01 | 原始验收明确格式搜索另补；不自动把格式搜索全部加入本项。 |
| X014 | 多段不连续选区：Ctrl追加范围，批量命令适用范围明确 | E04 | SheetSelection只有单组anchor/focus，无Ctrl追加多范围集合。 |
| X015 | Ctrl方向键与数据块选择：连续与空白边界，Shift组合扩展选区 | E01 | 公式栏/矩形selection、通配符查找替换、Ctrl数据块导航、merge/split和freeze有代码，X015有原生/浏览器专项。 |
| X016 | 可拖动填充柄：复制或序列、预览范围、取消与一次撤销 | E04 | SheetSelection只有anchor/focus，无Ctrl追加多段；填充柄、线性数字日期文本stop、单次连续格式刷已有专项。 |
| X017 | 向下向右与序列填充：相对公式、日期步长、文本数字及停止值 | E04 | SheetSelection只有anchor/focus，无Ctrl追加多段；填充柄、线性数字日期文本stop、单次连续格式刷已有专项。 |
| X018 | 格式刷：单次连续、复制矩形格式、Esc退出 | E04 | SheetSelection只有anchor/focus，无Ctrl追加多段；填充柄、线性数字日期文本stop、单次连续格式刷已有专项。 |
| X019 | 字体字号与常用文字格式：混合格式回显、小数、默认字体与保存 | E05 | 小数字号及继承/font0已有原生测试，active cell回显不能代替mixed回显。 |
| X020 | 数字格式与自定义格式：分节规则、日期时间地区、小数与文本 | E05 | 整格字体/小数字号/number format、RGB填充、四边框和共享text/auto row存在。边框仅all/outer/none，无斜线/可编辑theme/tint身份。 |
| X021 | 完整边框与斜线：所有单边内横内竖线型颜色及合并边界 | E05 | 四物理边、all/outer/none存在，单边内线/对角线入口模型不全。 |
| X022 | 填充与主题颜色：无填充、主题和色调，保存不失真 | E05 | RGB/none可编辑；theme/tint身份未在cell颜色模型中。 |
| X023 | 对齐缩进旋转文字：常规、分散、跨选区居中、缩进与旋转 | E05 | 整格字体/小数字号/number format、RGB填充、四边框和共享text/auto row存在。边框仅all/outer/none，无斜线/可编辑theme/tint身份。 |
| X024 | 换行缩小字体：显示适配与导出一致，自动行高联动 | E05 | 整格字体/小数字号/number format、RGB填充、四边框和共享text/auto row存在。边框仅all/outer/none，无斜线/可编辑theme/tint身份。 |
| X025 | 合并拆分：合并范围冲突、非空警告、文件重开 | E01 | 公式栏/矩形selection、通配符查找替换、Ctrl数据块导航、merge/split和freeze有代码，X015有原生/浏览器专项。 |
| X026 | 清除分项菜单：内容格式批注链接规则分别清除 | E07 | 缺统一五类菜单和批注寻址显式清除，源note保留不等于实现。 |
| X027 | 行列插入删除：公式、尺寸、合并、规则、图表引用同步 | E06 | 整行列insert/delete有引用/尺寸/合并/规则/图表/链接迁移和log。hidden集合存在但列UI仅活动列，行借0行高；无局部移位/复制移动隐藏表/outline模型。 |
| X028 | 单元格插入删除并移位：右移下移左移上移引用变更与越界 | E06 | structure edit只含整row/column，无局部四向cell shift。 |
| X029 | 行高列宽自动适配：拖动、合并、字体测量和尺寸限制 | E05 | 整格字体/小数字号/number format、RGB填充、四边框和共享text/auto row存在。边框仅all/outer/none，无斜线/可编辑theme/tint身份。 |
| X030 | 独立隐藏显示行列：隐藏列、选区显示、全表显示与键盘导航 | E06 | hidden集合持久化存在；行借0行高，列UI只active firstCol及全显。恢复行高会改mode，需独立unhide。 |
| X031 | 工作表复制移动隐藏：顺序、重名、跨表公式、隐藏恢复 | E06 | 新增删除改名已有；复制移动隐藏恢复缺失，hidden sheet原生拒绝。 |
| X032 | 分组与分级显示：嵌套层级、汇总位置、展开折叠 | E06 | 无outline模型和层级UI，原文件metadata保留非编辑支持。 |
| X033 | 公式解析与计算错误：引用、错误传播、循环与计算预算 | E08 | fast-formula-parser封装已有1900日历/错误/循环/预算/数组，X036有专项；UI仅SUM/AVERAGE/COUNT/IF模板，无分类参数向导、计算模式或Goal Seek状态。 |
| X034 | 名称管理器：工作簿表作用域、冲突、引用更新 | E09 | 自定义definedNames拒绝，scope/冲突/引用更新缺失。 |
| X035 | 结构化表引用：列名、当前行、汇总行与自动扩展 | E13 | tables原生拒绝，模型无Table和结构化引用。 |
| X036 | 数组与动态溢出：矩阵结果、溢出冲突、数组编辑限制 | E08 | fast-formula-parser封装已有1900日历/错误/循环/预算/数组，X036有专项；UI仅SUM/AVERAGE/COUNT/IF模板，无分类参数向导、计算模式或Goal Seek状态。 |
| X037 | 函数向导与分类帮助：参数校验、引用选择、结果预览 | E08 | 四个模板函数按钮不等于分类参数/引用选择/预览向导。 |
| X038 | 数学统计逻辑函数：逐函数核对参数类型、空值、数组与错误 | E08 | fast-formula-parser封装已有1900日历/错误/循环/预算/数组，X036有专项；UI仅SUM/AVERAGE/COUNT/IF模板，无分类参数向导、计算模式或Goal Seek状态。 |
| X039 | 文本日期查询函数：地区日期、查找匹配、引用与字符语义 | E08 | fast-formula-parser封装已有1900日历/错误/循环/预算/数组，X036有专项；UI仅SUM/AVERAGE/COUNT/IF模板，无分类参数向导、计算模式或Goal Seek状态。 |
| X040 | 财务工程数据库函数：逐函数验证精度、边界和原文件缓存 | E08 | fast-formula-parser封装已有1900日历/错误/循环/预算/数组，X036有专项；UI仅SUM/AVERAGE/COUNT/IF模板，无分类参数向导、计算模式或Goal Seek状态。 |
| X041 | 追踪引用与显示公式：前置后置箭头、跨表导航、切换不改值 | E09 | 没有公开依赖graph/箭头/跨表追踪/显示公式。 |
| X042 | 计算设置与单变量求解：自动手动计算、迭代及求解过程控制 | E08 | 没有计算模式/迭代/求解过程状态。 |
| X043 | 多关键字排序：优先级、升降序、扩展选区和稳定排序 | E10 | 多键方向稳定排序和表头已有，无扩展当前selection询问。 |
| X044 | 完整自动筛选：值列表、日期层级、多条件、颜色和清除 | E10 | 每列单operator/value，多值/动态native拒绝，颜色专项不等于完整filter。 |
| X045 | 文本分列：分隔固定宽度、引号、预览与列类型 | E11 | data tab没有分列/列类型/预览计划器。 |
| X046 | 删除重复项：表头与比较列、空值类型及删除计数 | E11 | data tab没有去重比较列/类型空值键/删除计数实现。 |
| X047 | 数据验证完整管理：规则范围、下拉来源、忽略空格、输入错误提示 | E12 | 常用DV提示已有，source限单A1行列，names/复杂范围待补。 |
| X048 | 条件格式完整管理：数据条图标集、颜色刻度、公式、优先级与停止 | E12 | 已有priority/stop/colorScale，缺dataBar/iconSet/完整threshold。 |
| X049 | 外部链接与导入：引用来源、更新权限、失败保留旧值 | E09 | externalLinks/connections/queryTables拒绝，无更新许可/失败保旧值。 |
| X050 | 表样式与汇总行：表头、筛选、带状行、汇总和自动扩展 | E13 | 无Table身份样式汇总扩展，tables原生拒绝。 |
| X051 | 表范围重命名与转普通区域：保留内容样式并迁移结构引用 | E13 | 无Table改名/转区域及结构引用迁移。 |
| X052 | 创建透视表与字段布局：缓存、行列值筛选、拖放与汇总 | E14 | 无pivot/cache/slicer/timeline模型，相应原生目录拒绝，无创建字段布局。 |
| X053 | 值汇总与显示方式：求和计数百分比累计差异及格式 | E14 | 无pivot/cache/slicer/timeline模型，相应原生目录拒绝，无创建字段布局。 |
| X054 | 分组排序筛选刷新：日期数字组、展开折叠、数据源变更 | E14 | 无pivot/cache/slicer/timeline模型，相应原生目录拒绝，无创建字段布局。 |
| X055 | 钻取明细与计算字段：明细新表、计算字段和缓存一致性 | E14 | 无pivot/cache/slicer/timeline模型，相应原生目录拒绝，无创建字段布局。 |
| X056 | 切片器与时间线：对象样式、多选、连接透视表与保存 | E14 | 无pivot/cache/slicer/timeline模型，相应原生目录拒绝，无创建字段布局。 |
| X057 | 原生柱状与折线图：系列分类编辑、选区范围、保存重开 | E15 | bar/line连续range有实现，系列分类不可独立配置。 |
| X058 | 饼散点面积雷达组合图：坐标轴、系列类型、次轴、图例标签与保存 | E15 | type只bar/line，其他族/组合/次轴缺失。 |
| X059 | 图表布局格式与数据标签：标题轴格式、标签定位、趋势线误差线 | E15 | chart只有title/range/type，缺轴标签趋势误差线。 |
| X060 | 迷你图：数据范围、位置、分组与坐标边界 | E15 | 无sparkline位置范围分组坐标保存。 |
| X061 | 图片形状与嵌入对象：锚点、裁剪、移动尺寸与排列 | E16 | media/embeddings和drawing图片形状拒绝，无锚点裁剪排列。 |
| X062 | 冻结窗格：滚动定位、首行首列及取消 | E01 | 公式栏/矩形selection、通配符查找替换、Ctrl数据块导航、merge/split和freeze有代码，X015有原生/浏览器专项。 |
| X063 | 拆分窗格与命名视图：独立滚动、视图筛选隔离与保存 | E17 | primary split pane拒绝，一个grid不是独立窗格或命名视图。 |
| X065 | 打印区域与标题行列：多个区域、重复标题、当前表或全书 | E18 | 源printArea/title保留及迁移非编辑；实际打印全book。 |
| X066 | 页面布局与分页预览：纸张边距方向、断页、缩放至页与预览 | E18 | 固定A4横向12mm，源pageSetup/断页部分保留，不是fit/分页预览。 |
| X067 | 页眉页脚与打印选项：页码日期文件名、网格线、居中与黑白 | E18 | 无Excel页眉页脚字段或居中/黑白/网格控制，X064屏幕开关独立。 |
| X068 | 工作表工作簿与范围保护：可编辑范围、结构锁、密码及文件往返 | E19 | 只有本地protectedRanges和空密码sheet protect，结构/范围/密码不完整。 |

静态校验：67个原始ID各且仅映射一个批次，不含X064；所有作为既有入口、测试或证据引用的路径均已检查存在。本次没有执行工程测试或重跑历史文件。
