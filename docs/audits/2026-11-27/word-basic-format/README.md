# W001 W003 W004 W006 基础字符格式验收

2026-11-27，`codex/finish-office-studio` 工作树。按原始四项指定要求和六项共通验收核对模型、真实 ZUVI 入口、历史、权限、DOCX 往返及浏览器行为；本记录不将整个 159 项目标标记完成。全仓集成收尾由主任务另行登记。

| 项目 | 原始要求 | 当前已验证行为 |
| --- | --- | --- |
| W001 字体与小数字号 | 选区与插入点分别应用，保留原选区 | 混合字体/字号显示空值，选择首段现有 Arial/12pt 也能统一整段；字体和字号分别撤销/重做，保留其他格式。插入点连续设 Times New Roman 和 17.3pt 时保持两个属性，按 Word 半磅规则变为 17.5pt，仅应用于后续输入。12.5pt 中文与原有 14.5pt 字号在原生文件中核对。 |
| W003 粗体斜体下划线删除线 | 混合选区状态、取消格式、撤销重做 | 四种混合选区均呈现 `aria-pressed=mixed`，应用后整组选区为 true；取消变为 false，每一步独立撤销/重做，文本与未选内容不变。原生 WML 的四种标志逐 run 检查。 |
| W004 上标与下标 | 互斥切换，取消后恢复基线 | 上标→下标整次替换，取消回到原模型；三次撤销/重做逐项恢复。真实 DOCX 的 2/3 字符分别保存 superscript/subscript，重开后继续保持，逻辑字号仍为原始 12pt。 |
| W006 高亮与清除高亮 | 选中文字和后续输入均可应用及清除 | 首段只有字体属性而后段高亮时仍可清除整段；选区颜色/清除可撤销重做。插入点 H 高亮、清除后 C 无高亮，H/C 分别撤销，后续输入保留其他字体属性；两轮原生保存保持着色与清除状态。 |

真实入口仍使用现有 ZUVI Combobox、Button、DropdownMenu。选区格式汇总只派生工具状态，不回写文档。字体快照保存 selection、doc 和 storedMarks，防止第二次字号命令清空已设置的插入点字体。字符命令先处理输入草稿、检查 IME/权限与当前 editor，再以历史边界提交；高亮清除后的输入不会并入前一次输入历史。页眉共享样式使用主文档定义，已有页眉回归已通过。

新增 16 项 `StudioWord.basic-format.test.tsx` 与现有 Word 140 项、FontControl 6 项，共 162/162 通过。包括选区/焦点、字体输入 IME 与 Escape、编辑器 IME 拒绝、非法字号拒绝、只读/disabled 控件和快捷键、原模型不变及单事务撤销重做。`office-studio-word.test.mjs` 的 72/72 原生回归通过；UI 类型、scoped lint、fresh UI build 通过，日志在 `validation/`。

`office-studio-word-basic-format.spec.ts` 的两个真实 Chromium 流程均通过，独立端口 5270，docs 消费当前 UI dist，Vite force 重新预构建。实际 Python-docx `source.docx` 导入后，经工具栏编辑、两次下载与重新导入成为 `roundtrip-1.docx` 和 `roundtrip-2.docx`。浅色、暗色与 320px 的工具和高亮菜单检查包括实际几何、可见清除项、后续应用及只读命令。最后恢复专项再通过 1/1：非法字号拒绝导出后，Escape/IME 取消使同一编辑器成功下载 `after-cancel.docx`，模型和原有格式保持不变。没有将此专项写成又一次全站 E2E。

`inspect-native.py` 用独立 ZIP/XML 解析按文档默认、段落样式、字符样式和直接属性计算真实 run 格式；核对四份 DOCX 的文本、三种字体、半磅字号、四种标志、上下标、着色/清除、原链接及 UTF-8 中文。两轮保存的有效 run 值相同，取消后导出的有效值与来源相同。来源文件 SHA 与构建时的源码/dist SHA 在 `build-provenance.json`，最终文件和日志 SHA 在 `current-evidence-manifest.json`。

四份 DOCX 都用文档技能的 `render_docx.py` 和 bundled LibreOffice 重新打开，生成各自一页 PDF/PNG 并逐页目视检查。中文、标志、大小、上下标和高亮均可见，没有新增裁切或遮盖。原生渲染使用一次性的私有 FONTCONFIG_FILE 加载实际 Noto Sans SC 程序及 bundled LibreOffice 字体；未修改 runtime 或安装系统字体。Noto 程序源于锁定依赖的 400-normal WOFF，经仓库 `office-fonts.mjs` 解包，TTF、OFL 和来源 SHA 在 `fonts/`。Arial/Times 的字体名称保留在 DOCX，实际 bundled viewer 使用自身字体替代规则。

首次七个真实交互失败和扩展输入边界的五个失败均保留原始日志。首次浏览器 `_Typed_` 样本触发现有 Markdown 斜体输入规则，后改普通 Typed；第二轮原生颜色值为小写而断言写大写，后按 hex 语义比较。两次浏览器原始日志、源码、trace、旧来源与截图在 `first-browser-run/` 和 `second-browser-run/`。原模板 Title 的蓝色边框以及缺 CJK 字体的旧渲染也保留于第二归档；最终来源去除模板 Title 边框并明确 Noto Sans SC 后重新导入、编辑、导出、重开与渲染，未把旧渲染记作最终通过。

可重复检查：

```sh
pnpm --filter @zuvi/react exec vitest run src/components/OfficeStudio/StudioWord.basic-format.test.tsx src/components/OfficeStudio/StudioWord.test.tsx src/components/OfficeStudio/StudioFontControl.test.tsx
ZUVI_E2E_PORT=5270 pnpm exec playwright test --config e2e/playwright.config.ts e2e/office-studio-word-basic-format.spec.ts --workers=1
/Users/meaili/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 docs/audits/2026-11-27/word-basic-format/inspect-native.py
/Users/meaili/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 docs/audits/2026-11-27/word-basic-format/render-native.py --renderer /Users/meaili/.codex/plugins/cache/openai-primary-runtime/documents/26.1123.11515/skills/documents/render_docx.py
```
