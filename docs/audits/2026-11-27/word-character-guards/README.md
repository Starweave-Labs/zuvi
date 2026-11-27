# Word 字符命令与原生位置验收

2026-11-27，分支 `codex/finish-office-studio`，来源为 HEAD `077e307` 加本批工作树改动。运行时源码、独立 5270 流程和原生文件的实际 SHA 在 `current-evidence-manifest.json`。`original-acceptance-matrix.json` 分别记录基础四项及五个邻项的原始要求和六条共同验收；159 项整体收尾仍由主任务负责。

| 项目 | 原始要求 | 专项结果 |
| --- | --- | --- |
| W001 字体与小数字号 | 选区与插入点分别应用，保留原选区 | `../word-basic-format/` 保留字体、混合字号、保选区、后续输入、取消、历史与四份原生文件的完整证据。此次 183 项回归包含全部 16 个基础专项。 |
| W003 粗斜下划删除线 | 混合状态、取消格式、撤销重做 | 基础专项证明四种 mixed 状态和逐操作历史，DOCX 逐 run 核对四种标志；本次回归通过。 |
| W004 上标与下标 | 互斥、取消后恢复基线 | 基础专项证明互斥与取消、单次历史、原生 vertAlign；本次回归通过。 |
| W006 高亮与清除 | 选中文字和后续输入均可应用及清除 | 基础专项证明混合清除和 H/C 后续输入的独立历史，原生两轮保留；本次回归通过。 |
| W002 字号增减 | 阶梯、混合字号和上下限 | 新流程实际将 12/16pt 分别增至 14/18pt，撤销、重做、减小与撤销逐次核对。空页眉引用正文 Review14 样式时正确 14→16pt，再输入 H，两轮原生仍为 16pt。1–409pt 阶梯边界及只读/disabled 有明确模型/入口测试。 |
| W007 大小写 | 句首、大小写、词首及切换 | 五种实际菜单操作验证 Greek sigma 的同 locale 上下文；`İΣΟΣ ß` 小写为 `i̇σος ß`，保留原 marks、链接和变长后的选区。五条链接及字号在两轮原生文件中独立核对。 |
| W008 格式刷 | 字符和段落格式、单次与连续、Esc | 单次格式刷的实际 IME 目标拒绝与结束后应用通过。当前 UI 回归覆盖连续刷、字符与段落、Esc、历史与权限；原生连续刷及 320px 的既有明确证据在 `2026-11-25/word-format`，最终整站会重跑同一 `office-studio-word-format.spec.ts`。 |
| W009 清除格式 | 保留文字、结构和链接，明确范围 | 实际正文 IME 拒绝、结束后清除与撤销通过；当前模型/入口回归验证 heading、list、链接及一次历史。清除后原生结构与链接的既有往返证据在 `2026-11-25/word-format`，最终整站会重跑对应精确断言。 |
| W010 间距与位置 | 加宽、紧缩、提升、降低及度量显示 | 0.3pt 间距和 −1.5pt 位置真实应用、IME 拒绝、0.3/1.25pt 非半磅位置拒绝及 1.5pt 恢复通过。原生正文、图片、复杂 PAGE 域的每个 run、样式、页眉页脚、±500pt 和显式零值均按 signed integer 保存并重开两次。旧完整度量/行规则 E2E 的 fixture 和 raw XML 断言已改成合法整数，最终整站负责重跑。 |

W005 继续未完成。普通 HEX 颜色入口不满足其原始“自动颜色、主题色及透明度保存”：当前模型不保存自动/主题引用，ColorPicker 不开放 alpha，codec 仅写解析后的 RGB。它将与 W021 的主题工作合批，未把新的无限外部变体加入本批范围。

本批修复四个真实共同验收问题：字号步进在空页眉中复用共享样式定义；格式刷启用与 armed 选区 effect 遵守 IME/草稿/权限守卫；清除格式在 IME 中拒绝；字符度量弹窗在数字组成期间禁用提交。大小写改为整块文本先生成同 locale 结果，再按原字符转换长度映射 marks/选区，解决 `ΟΣ→ος` 的 final sigma。没有新增 locale API。

独立浏览器第二次尝试进一步发现 W010 原生问题：docx 库把 position 的 unit string 原样写入 `w:val`。旧 own importer 会把 `-1.5pt` 正确读回，掩盖实际 LibreOffice 漂移。2006 schema 的 `ST_SignedHpsMeasure` 是 signed half-point integer；保留的原始文件与只改为 `-3` 的诊断副本，target 原生 top 分别为 136.848763779528 和 137.898763779528pt。最终两份实际导出都为 `-3`，native glyph 坐标与正确整数副本一致。诊断是针对当前真实文件和 reader，没有声称所有 OOXML 版本均不支持 UniversalMeasure。

最小 codec 修复在已有 MetricTextRun、MetricImageRun 与样式 builder 统一使用 `nativeRunPosition`。它先执行原有 0.5pt 校验，再向 docx 原样 writer 提交整数**字符串**，包含 `0`，同时保持复杂域的全部 run 属性传播。局部类型断言用于绕过 docx 将 position 误限为 UniversalMeasure 的声明；避免只改外层 run 而丢失复杂域内部属性。原生测试原先锁定 `2pt` 的断言已改为正确 `4`。UI/model 本已拒绝非半磅位置，无需改 UI 运行时或 dist。

最终专项结果为原 181+新 2＝183/183 UI，原 72+新 2＝74/74 native，全部零跳过。UI/docs 类型、scoped lint、修正后的两个 E2E 文件 lint 全通过。独立 5270 的最新 1 个综合流程通过，21.3s test / 26.8s total；浅色、暗色与 320px 弹窗，以及全部六个只读命令禁用均有实际断言和截图。UI 使用主任务最终 fresh dist，入口 124129 gzip bytes，预算严格小于 124928；此后只有 host codec 与测试改变，未重新构建或改变 UI 运行时。

`final-browser-run/` 冻结本次成功的源 DOCX、两份实际下载、模型记录、脚本、原始日志、三份 PDF/PNG和浏览器截图。`inspect-native.py` 独立解析 ZIP/XML、样式继承、字号、标志、五条链接、UTF-8 文本、整数 position 与 twips spacing；三份 DOCX 都使用文档技能 canonical renderer 和 bundled LibreOffice 生成一页并逐页目视检查，字号层次、Greek/Latin 字形、页眉和位置清晰，无裁切或遮盖。实际 bundled reader 的字体替代不改变 DOCX 字体名称的保留证据。

原始失败均保全：`before-fix/` 保存四个守卫及 Greek 的原型失败；`first-browser-run/` 是脚本单击正文而未退出页眉模式的原件，后来改为真实双击退出并断言正文 editable；`second-browser-run/` 是真实 unit position 的 DOCX、XML、PNG、原始 trace 与日志。`position-diagnosis/` 保存 schema、整数诊断副本、字体坐标对照、旧 codec 和 native tests，以及修复前两个 signed tests 的失败。中间 native 测试的 unused Lowered fixture 引用误差单独记录；最终 fixture 显式使用 Lowered 段落，全部 74 项通过。旧 metrics 原生文件和脚本在 `position-diagnosis/legacy-metrics-before/`，未提前重新生成旧审计目录。

最终全仓类型/lint、构建、Registry、消费者、distribution 与整站 316 项归主任务处理。矩阵明确区分历史有效专项与本次实际证据，要求最终精确重跑 format、metrics、case-size、basic-format 后再登记；未用全仓绿灯替代每项原始验收，也未在此修改台账或提交。

可复跑：

```sh
pnpm --filter @zuvi/react exec vitest run src/components/OfficeStudio/StudioWord.test.tsx src/components/OfficeStudio/StudioWord.basic-format.test.tsx src/components/OfficeStudio/StudioWord.character-guards.test.tsx src/components/OfficeStudio/studio-word-character-layout.test.ts src/components/OfficeStudio/StudioFontControl.test.tsx
node --test docs/tests/office-studio-word.test.mjs
ZUVI_E2E_PORT=5270 pnpm exec playwright test --config e2e/playwright.config.ts e2e/office-studio-word-character-guards.spec.ts --workers=1
/Users/meaili/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 docs/audits/2026-11-27/word-character-guards/inspect-native.py
/Users/meaili/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 docs/audits/2026-11-27/word-character-guards/render-native.py --renderer /Users/meaili/.codex/plugins/cache/openai-primary-runtime/documents/26.1123.11515/skills/documents/render_docx.py
```
