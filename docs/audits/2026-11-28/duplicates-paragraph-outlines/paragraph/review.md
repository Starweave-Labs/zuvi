# Word 段落格式有限验收候选（2026-11-28）

W011/W012/W013/W016 均保持 **candidate-awaiting-final-integration**。未修改共享目标状态或旧审计文件，也未执行浏览器、构建或提交。原始验收及六项共通要求逐字取自 `docs/onlyoffice-feature-ledger-2026-11-13.json`；机器矩阵在 `candidate-matrix.json`，当前源码/日志/历史产物身份在 `source-and-evidence.json`。

当前审阅 HEAD 为 `d0ffefd93313dc30a95381db619cf77932dfdb91`。三个 Dialog 的未提交修复、新增组件测试及新增浏览器测试不属于此提交；最终源码提交由主集成分配。不能将 HEAD 本身当成修复后的源码证明。

## 实际缺陷及修复

段落设置、制表位、段落边框底纹三个独立弹窗原本仅依赖编辑器组合状态，弹窗自己的数值输入组合不会设置 `editor.view.composing`。合法数值草稿在 `compositionstart` 后点击应用会调用 `onSave`；独立复现为三个失败、三个通过，原日志保留在 `dialogs-before.txt`。

三个 Dialog 现通过本地 composition capture 记录 ref/state，组合期间禁用应用并在回调再次检查；制表位设置和清除也暂停。取消仍可退出；结束组合后继续受错误草稿/权限守卫限制。修复无需修改 `StudioWord.tsx` 或 codec。最后一次生产 Dialog 修改后执行的聚焦结果：

| 检查 | 结果 | 日志 |
| --- | --- | --- |
| 段落/制表位/边框模型与独立 Dialog | 42 项通过，含新增 12 项 | `dialogs-models-final.txt` |
| 实际 StudioWord 段落/标尺组件组 | 8 项通过；132 项按名称过滤 | `component-current.txt` |
| DOCX/打印原生聚焦 | 9 项通过；110 项按名称过滤 | `native-print-current.txt` |
| docs 类型检查 | 通过 | `docs-types.txt` |
| UI 类型检查首次执行 | 失败，诊断来自并行 Excel 新测试的 `ByRoleOptions.exact`；本记录不宣称通过，主集成另复验 | `ui-types.txt` |
| 新浏览器测试解析 | `--list` 发现 1 项；没有执行浏览器 | `e2e-list.txt` |

新增独立组件测试覆盖三个弹窗各四条路径：合法数字的 IME/Enter/apply、非法草稿与取消、权限切换及 IME Escape、onSave 失败后草稿保留与取消。每条路径都检查未授权阶段没有调用 onSave；旧模型/实际组件继续证明格式修改的事务历史。

## 原始功能候选

| 项目 | 原始验收（原文） | 当前依据与最终待验 |
| --- | --- | --- |
| W011 | 左右居中两端，首行悬挂缩进 | 四对齐的模型/命令/入口与 native both/firstLine/hanging 已核对，混合段落与格式/历史的聚焦测试通过。新 E2E 明确四个实际按钮、首行及悬挂、两轮 native XML，待执行。 |
| W012 | 单倍多倍固定值最小值及单位转换 | auto 倍数与 exact/atLeast 点值、240/20 原生单位、继承规则独立转换和两轮 codec 聚焦通过。新 E2E 已补独立 Single spacing 段落选择倍数 1、computed lineHeight/fontSize 比值≈1、两轮 auto/line240；另有 1.5 倍、18pt 固定、24pt 最小及段前后，均待实际浏览器执行。 |
| W013 | 左中右小数点制表位，点线前导符 | 四种对齐计算、位置/clear 增量、dot leader、字符不变、一次历史和两轮 codec 聚焦通过。新 E2E 对四种位置/对齐和点线逐一设置并回读，需消费本轮 Dialog 修复后构建执行。 |
| W016 | 边框每边、线型、距离、底纹及取消 | 每边独立 delta、线型/精度/距离、shading、nil 与继承、取消/权限/失败原件不变的聚焦通过。新 E2E 四个不同外边线型及距离、底纹、全部边框与底纹清除、历史、两轮 XML 待执行。 |

原始六项共通要求按每项保存在机器矩阵：操作前后数据及格式；选区、焦点、IME和取消；一次撤销、重做；只读和禁用命令；原生文件保存重开；失败后原数据不变。矩阵给出当前源码/测试的准确路径和行锚点，每条保持 `focused-verified-awaiting-final-integration`，没有将聚焦单元结果冒充最终浏览器通过。

## 历史证据的身份与限度

旧最终 317 项回归中，段落 1 项、制表位 2 项、边框底纹 1 项均单次通过、零重试。此次从归档 JSON 中重新读取并验证；没有重新执行浏览器。29 份对应重生成产物（15 个 DOCX、14 个 PNG）与旧恢复回执中的 SHA-256/字节数完全相同，并独立解压原生 DOCX 记录段落属性。此处只核对截图字节，未重新声明逐张目视 QA。

25 个当前源码/测试文件中，20 个与旧 317 冻结 SHA 完全相同；三个 Dialog 已改变，两个新增测试在旧冻结中不存在。因此旧 317 只作为前次行为/未变内核参考，不能证明本轮新增输入法修复。旧审计原路径没有被改写，新核对读取 `.release/office-continuation/x030/validation/resumed/regenerated/` 中的实际旧运行副本。

本轮新增 E2E：`e2e/office-studio-word-paragraph-acceptance.spec.ts`，输出限定在 `.release/office-continuation/paragraph-acceptance/browser/`。包含三个弹窗实际组合草稿/Enter/取消、四对齐、首行悬挂、行距单位、制表位、四边/清除、一次撤销重做、原生两轮及只读入口。最终仍需主集成构建与执行该用例、既有相关专项和相应公共门禁，绑定最终源码及原生输出，之后才可修改四项状态。

当前有限原要求不额外加入“全部字体、方向、浮动和分页组合”作为阻塞；通用分页/主题扩展归各自原始条目。现有范围校验和明确拒绝的额外制表位/复杂边框视觉近似仍按原实现边界保存，不以无限矩阵替代本次有限原验收。

只读复核：`python3 -B .release/office-continuation/paragraph-acceptance/verify-current.py`。若源码/测试被主集成继续修改，此命令会显示身份不符；应在复验后重新记录身份，保留旧记录作为历史，不直接改写旧测试结果。
