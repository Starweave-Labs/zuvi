# P008、X023、X024 本批全仓验收

本批实现 PDF 合并/提取及 Excel 文字排版切片，完整 159 项目标保持未完成。详细交互、原生文件、视觉证据与范围限制在 `../pdf-composition/README.md` 和 `../sheet-text-layout/README.md`。日志的原始字节、可读副本及 SHA256 在 `validation-manifest.json`。

| 检查 | 实际结果与来源 |
| --- | --- |
| UI | 168 文件、2784 项通过，`validation/ui-tests.txt` |
| docs | 523 项通过、无跳过，`validation/docs-tests.txt`；使用 `CHART_DOCS_CHECK_DIST=1` |
| 类型、lint | 全仓通过，`validation/types.txt`、`validation/lint.txt` |
| Registry | 92 项通过，`validation/registry.txt` |
| 消费者源码 | 395 文件、76 MCP 例子与公开子路径通过，`validation/consumer.txt` |
| 构建与分发 | UI、browser、docs、CLI/MCP 及其他包构建通过；ESM/CommonJS、client boundary、tree shaking 和七包本地 npm pack 通过 |
| 入口预算 | gzip 124924 bytes，小于既有 124928 bytes 上限；未修改预算 |
| 完整浏览器 | 293/293 通过、0 失败/跳过/flaky，耗时 934181 ms；`validation/e2e.txt`、`validation/e2e.json` |

整站浏览器命令为 `ZUVI_E2E_PORT=5269 PLAYWRIGHT_JSON_OUTPUT_FILE=/tmp/zuvi-office-composition-text-full-e2e.json pnpm exec playwright test --config e2e/playwright.config.ts --workers=1 --output=/tmp/zuvi-office-composition-text-full-e2e-output --reporter=list,json`。实际服务来自本工作树，docs 消费当前 UI dist，Vite 强制重新预构建；没有使用主工作区 5174 服务。类型检查在 UI build 完成后执行。

整站之后澄清了 XFA null 误拒假设：`PDFDict.lookup` 已规范化直接和间接 null，宿主功能代码无需修补，仅添加说明注释与三项原生回归。其后 PDF 原生 171/171、docs 全量 526/526、docs 类型/lint/build 再次通过；最终 CLI/MCP 源码重建后，消费者 395 文件再次通过。补验日志在 `validation/post-run/`，清单的 `postRunChecks` 和 `postRunFiles` 单独登记；没有将此前 293 项整站结果写成补验后重新执行。最后的 PDF 与 Excel 打印渲染已目视复核，原生独立解析也已通过。

整站会重生成旧日期的证据，因此运行前快照保全 1663 份历史文件（226520898 bytes），结束后逐字节恢复。完整旧文件集合与原 SHA256 在 `historical-evidence-manifest.json`；其中 1599 份已跟踪文件保持原件，64 份被 Git 忽略的旧日志（390044 bytes）另存于 `preserved-ignored-history/` 的 gzip，并在 `legacy-evidence-preservation.json` 的 `preExistingIgnoredEvidence` 登记压缩及解压 SHA，使保全记录可随提交复核。当前运行生成的 367 份变化文件保存在 `regenerated-history/`，与同一清单的原路径、前后 SHA256 一一对应。源码快照改为 `.mjs.txt` 及日志可读副本的空白规范化均保留原始字节与清单，不把旧证据改写为当前结果。
