# Excel 文字排版与自动行高切片验收

2026-11-27，`codex/finish-office-studio` 工作树。对应原始台账 X023／X024；包含跨表数组有效显示范围的相关回归。本文记录已验证切片，不能代替整个 159 项目标或全部 Excel 排版兼容性的最终验收。

实际 ZUVI 编辑入口是“开始 → 文字排版”，使用 Modal、Select、Input、Checkbox、Button。水平常规／左／中／右／填充／两端／跨选区居中／分散，垂直五种对齐，缩进、正负旋转和竖排、自动换行与缩小字体均已接入。修改属性按操作顺序在内存准备，整组选区只提交一次；公式、数组和原生链接保留。只读／disabled 禁用编辑，受保护选区整次拒绝，非法数字及当前单元格草稿不能进入提交，取消不产生历史。

绘制和打印使用同一文字几何。缩小字体保留原始字号，只改变实际绘制字号；合法下限为 1pt，极长输入达到该下限仍可明确 overconstrained。先前原型的 2.5pt 下限没有固定参考源码依据，已替换，历史原字节保留。自动换行／两端／分散对齐优先于缩小字体，两个原生标志独立保留。

自动行高是派生值，编辑器没有 Effect 回写文档或新增历史。跨选区居中按占用、原生链接、冻结、隐藏列和合并边界计算同一整段宽；末列边框只计一次。逻辑合并起点的行或列隐藏时，内容、字体和链接保留；应用完整 hidden/filter 状态后仅一个物理可见行的合并可自动适配，多可见纵向合并继续排除自动分配。隐藏起点不会生成零宽／零高的普通 cell 或虚假的 resize header。XLSX exporter 在临时导出副本刷新相关 auto 缓存，保留 fixed/auto 身份与原始编辑器历史。

真实 XLSX 源文件 `text-source.xlsx` 包含实际 font0 Arial 9.5pt＋粗斜体、auto `ht="18.75" customHeight="0"` 缓存、固定行、数组、跨表引用、链接、隐藏合并起点和字体／颜色覆盖。两轮 `text-roundtrip-1.xlsx`、`text-roundtrip-2.xlsx` 由实际编辑器导出并重开；每轮通过 ExcelJS 与 ZIP/XML 核对，新的 auto `ht` 对应实际绘制高度，原字体、字号、标志、值、公式、固定行高、合并和原始链接保持。标准行高属性是 **ht**；早期误写成 h 的测试失败与原文件单独归档，没有计入当前证据。

`array-view-source.xlsx` 与两轮 `array-view-roundtrip-*.xlsx` 覆盖 Counter 200→205。Main 的原始存储行数维持 200，实际 grid 从 calculated arrays 得到有效 205 行，不额外提交；第 201 行首次导出已有 auto `ht`，两轮原生重开可显示 A205。

`text-print.html` 是真实打印回调捕获的 HTML，`text-print.pdf` 从该 HTML 的真实打印样式产生。实际浏览器逐项比较 grid 与打印的 cell、文字容器、行和变换位置；隐藏列后的 colspan、隐藏行后的 rowspan、后续 D 列及逻辑 master 都经过实际 DOM 几何核对。PDF 由 pypdf 严格重开，5 个非空 A4 页面、两条 `/URI` Link 注释，完整 62 字符缩小样本与 CJK 语义文本均确认；Poppler 五页 PNG 已逐页检查。原始 Other 单元格未开启 wrap，按当前普通 cell 显示策略裁剪，完整值仍保留于 XLSX；本切片不声称已实现普通文字向相邻空白单元格溢出的全面兼容。

系统 CJK fallback 的 ToUnicode 映射会产生兼容部首（例如 `⾃`／`⽂`）。Poppler 字形与原句一致；独立检查同时保留 raw text，并以 NFKC 做语义比对，没有声称 raw Unicode codepoint 完全相同。

验证记录：

- `validation/focused-ui-146.txt`：6 个相关 UI／模型文件 146／146。
- `validation/print-45.txt`：打印 45／45。
- `validation/ui-types.txt`、`validation/scoped-lint.txt`：类型与 scoped lint 通过。
- `validation/targeted-browser-3-passed.txt`：独立端口 5268，fresh dist 的 3／3 真实浏览器流程通过。
- `validation/targeted-master-screenshot.txt`：将逻辑 master 实际滚入视野后补充主流程截图，1／1。
- `independent-native-inspection.json`、`validation/independent-native.txt`：独立 ZIP/XML 与 pypdf 检查。
- `text-dialog-light.png`、`text-dialog-dark.png` 与各自 `-320.png`：真实明暗／320px 弹窗；应用、取消可见且没有水平溢出。
- `text-results-light.png`、`text-hidden-master-grid.png`、`array-view-205.png`、`text-protected-rejection.png`：实际结果、隐藏逻辑起点、数组范围和事务拒绝。

可重复检查：

```sh
ZUVI_E2E_PORT=5268 pnpm exec playwright test --config e2e/playwright.config.ts e2e/office-studio-sheet-text.spec.ts --workers=1
python3 docs/audits/2026-11-27/sheet-text-layout/inspect-native-evidence.py
pdftoppm -png -r 120 docs/audits/2026-11-27/sheet-text-layout/text-print.pdf docs/audits/2026-11-27/sheet-text-layout/pdf-render/text-print
```

仍未完整证实的范围包括复杂 RTL／竖排多列换行／斜角换行的原生等价、tab stop、普通文字向空白相邻 cell 溢出、跨隐藏或冻结边界桥接，以及多可见纵向合并的自动分配。本切片与整站／全仓收尾结果分别登记。
