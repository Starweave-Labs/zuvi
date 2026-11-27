# Word 字符格式、Excel 视图与 PDF 原生批注集成

工作树 `codex/finish-office-studio`，开始时提交 `077e307`。本批包含 Word W001/W003/W004/W006 的完整基础字符格式证据、Excel X064 视图、PDF P002/P012/P014/P015/P016 的原文与原生批注接入。邻项审计再发现 W002/W007/W008/W009/W010 的共享样式、Unicode 上下文和 IME 缺口，已纳入本批修复。159 项目标保持 active，未按测试总数推定所有需求完成。

## 第一次冻结门禁

以下结果是后续 Word 字符守卫、PDF 显式空颜色与 CJK 无障碍层修复之前的第一轮集成记录，不能替代最后一次源码验收。

| 检查              | 实际结果                                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| UI                | 175 文件、2876 项通过；最初 2872/2874 的两个 5 秒超时完整保留，隔离 OfficeStudio 18 项通过，再以 4 workers 全量通过；断言和超时未改 |
| docs              | 654/654、无跳过，使用 `CHART_DOCS_CHECK_DIST=1`                                                                                     |
| 其他包            | i18n 37、blocks 68、CLI 26、MCP 13，共 144 项通过                                                                                   |
| 类型、lint        | 全仓通过；Registry 新文件清单和脚本三项 lint 诊断修复后通过，初始失败日志保留                                                       |
| Registry 与消费者 | 92 条、408 文件、76 MCP 例子、公开子路径及幂等复制通过，CLI/MCP 源码副本已更新                                                      |
| 构建与分发        | UI、browser、docs、其他六包构建，ESM/CommonJS、client boundary、tree shaking、七包本地 npm pack 通过                                |
| 入口预算          | 同次真实静态 closure 124131 gzip bytes，既有预算 `<124928`，没有修改预算或转移校验                                                  |

日志在 `validation/`。新的源码/测试修复需要最终重建、消费者与完整 E2E 复验；最终结果另行登记。

## 真实交互暴露的问题

“选择文字”入口解决已有高亮的命中框抢占拖选问题；实际重开后拖选 ECTABLE、原生剪贴板、source SHA/模型/历史不变已经验证。搜索请求与真实 session 绑定，临时 disabled/只读切换保持当前匹配和第 2 页。Word 邻项修复复用共享 getStyles、字符命令草稿/IME 守卫与整段 Unicode 大小写的长度映射，保持原标记和选区。

独立 PDF 显示检查随后找到 SDK `.annotationTextContent` 无障碍层缺少隐藏样式：原生 AP 和 Canvas 绘制正确，浏览器额外绘制系统 16px 文字。按实际 SDK CSS 隐藏可视层，保留 role=comment；实际 Canvas SHA、glyph paint 数组和原文件没有改变。最终 UI 需要消费新构建验证。

真实 host 的 RGB→null→保存重开→修改不透明度复现还证明：删除 C/IC 键会回到原生默认黑/黄或 FreeText 黑边。显式无颜色应写入空颜色数组，并与原文件中未改动的省略键区分；当前修复与两轮原生回归在专项记录中登记，不把已导入的空数组保全当作清除颜色的验收。

多个独立端口曾共享 Vite 预编译缓存并出现 504 Outdated optimize dep。标准 E2E 启动器现在为每轮端口/进程分配私有缓存，docs 仅在指定环境变量时使用它，普通 Vite 默认不变。缓存原始失败 trace 与源文件保留，测试继续使用相同实际编辑器。

## 原有 PDF 合同续验

原生批注编辑/复制现在接受真实新 Blob 与顺序归一化模型。旧 P008 用例改为核对 sourceHash 与原件不同、sourceHash/recipe 对应、实际存储 PDF 三页/原字段/两个原生 Square AP 及所有原 Contents SHA 保留，撤销仍恢复完整前一对文件和模型。

`legacy-pdf-e2e.txt` 的 P008 三项与 P004–P007 两项 **5/5** 实际通过。运行前保护旧两个审计目录 146 文件、50263931 bytes，18 个变化/新增文件另存于 `legacy-pdf-regression/outputs/`；原目录已逐字节恢复。`legacy-pdf-regression/preservation.json` 与 `results.json` 绑定本轮产物和旧 SHA，不把原历史文件改写成当前结果。

## 证据保全与最终状态

整站前/后完整 audits 保全入口在 `evidence-preservation/preserve-audits.py`，只在明确的快照/恢复阶段运行，变化另存 `regenerated-history/`。被 Git 忽略的日志按原字节 gzip 并记录原路径与解压 SHA，原生 PDF/DOCX/XLSX/PNG/trace 保持原件；运行时字体 cache 与可复核证据分别记录。

本记录不改变任何项目的完整验收状态。逐项台账只会在最终门禁、原生与浏览器矩阵实际闭环后，锚定对应功能提交更新。
