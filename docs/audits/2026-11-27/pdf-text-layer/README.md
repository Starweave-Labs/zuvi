# PDF 原文层与原生批注外观验收

日期：2026-11-27。范围：P002 的原文选择、复制、真实全文查找，以及四种原生文字标记使用的源 QuadPoints；父任务负责原生编辑器、模型与源文件事务。

当前状态：本边界验收完成。父任务加入“选择文字”入口后的 fresh UI，最新实际 App/renderer/组件浏览器 P002 五项通过，P012 中文原始/最小样本分别 1/1 通过（均 4.5s）。最新两轮导出经 pypdf、Poppler 与 PNG 目视复核通过；全仓收尾与全 159 项登记由父任务统一执行。

## 实现与证据边界

- `studio-pdf-adapter.ts` 使用本地 `pdfjs-dist@6.5.438` 的实际 `TextLayer`、`AnnotationLayer`、`annotationCanvasMap` 与 Viewport 构造器，未新增 SDK 兼容层。
- 原文 DOM 透明，只提供真实 Range、浏览器复制和 QuadPoints。偏移由实际 DOM 文字与字体测量得到，QuadPoints 保留源运行的角度与 PDF 坐标，页面旋转不重新旋转保存的坐标。
- 原生 AP 在底稿或实际 AnnotationLayer 中绘制一次。Widget 不创建第二套 HTML 表单；Link 与附件不扩大交互范围；不启用 PDF scripting 或动态 actions。
- PDF.js 声明 NoZoom 标志但未实现显示几何。仅在不写回的派生视图中提取必要的 own-canvas，固定 NoZoom 外观尺寸并保留原 NoRotate 语义；原 Blob 哈希保持不变。
- UserUnit 归入实际 Viewport 的 scale，避免 own-canvas 的尺寸与 transform 不一致。CSS 为 SDK 的小数尺寸设置实际取整变量。
- 销毁会取消本层任务与监听，并在加载任务销毁后调用真实 `TextLayer.cleanup()`。SDK 自身的 pending-layer guard 保证其他未完成文本层继续工作。

## 六维验收矩阵

| 维度 | 已有证据 | 当前结论 |
| --- | --- | --- |
| 模型与编辑入口 | StudioPdfSession 两个层接口、实际 Ctrl/Cmd+A/C、全文查找入口；四种文字标记保存原生 QuadPoints | 通过；每轮重开后显式“选择文字”，实际拖选已高亮 ECTABLE 并使用原生剪贴板 |
| 只读与禁用 | 实际 App 只读后保持第 2 页、原文复制；独占组件 disabled 的真实浏览器复制、鼠标与键盘禁用 | 通过；复制与预览不改原 Blob |
| 事务撤销重做 | 实际 App 四种标记应用后，源文件与模型一起撤销、重做；SHA 回到前后快照 | 通过；文字复制前后 source SHA、revision、模型一致，撤销仍禁用 |
| 原生文件往返 | 真正导入、编辑、导出、再导入两轮；字段树/Widget/AP、原 Contents 哈希与 Poppler 像素 | 通过；两轮字节 SHA 相同，原文本页流和原有 AP 不变，字段逻辑值与控件外观一致 |
| 浏览器 | 实际 App 浅色、暗色与 320px；真实 renderer 的 12 组 zoom/rotation；组件禁用/取消/销毁/并发 | 通过的独立与实际 App 证据分开保留 |
| 检查 | adapter 11 + 选择几何 6；UI 生命周期 6；isolated strict 类型与 scoped lint；父组织 fresh UI build | 本边界通过；全仓收尾由父任务统一执行 |

## 已保全的诊断

- `renderer-before-round-vars/`：缺少 SDK `--scale-round-x/y` 变量时的原始失败；源 PDF、源码、日志与 trace 均按原字节保留。
- `app-round-1/`：初次实际 App 两项通过、只读定位项等待第 2 页失败的原件。后来独立复现确认临时禁用重跑搜索会跳到首匹配；父已修复，后续实际 App 已通过。
- `app-round-2-marker-hit/`：统一 fresh 后 4/5 通过的原件。已高亮 `ECTABLE` 的真实拖选得到空 Range，高亮变成选中、撤销可用；不是文本提取失败。第二轮 PDF 尚未在该次运行生成。

失败原件与旧成功结果保留在对应目录。顶层的两轮 PDF、JSON 与 PNG 均来自最后通过的运行。

## 最终结果

- 实际源 PDF：`app-source.pdf`（选择/只读）与 `app-markup-source.pdf`（原生文字标记）。两种来源单独保存，避免不同创建时间的文件混为一个 SHA。
- 两轮 PDF：`app-text-markups-round-1.pdf`、`app-text-markups-round-2.pdf`。SHA-256 均为 `385fcdeda20299933c29deedb8db3aaeb25bc48a65281249e5ec58c2543541e1`。
- `app-markups-results.json`：四次创建、成对撤销/重做、两轮重开；两次已高亮文字的真实鼠标复制均为 `ECTABLE`，无新增历史或文件改变。
- `app-selection-results.json`：真实原文鼠标选择、原生复制、三处全文查询匹配、只读保持第 2 页、浅/暗/320px。320px 使用实际 50% 缩放，让旋转页的源文字在视区内可见。
- `renderer-matrix.json`：crop `[40,30,440,530]`、UserUnit `1.5`、三种缩放与四个旋转组合；NoZoom/NoRotate、NoAP 图标、无重复 Widget HTML、单层透明度、虚拟复制/空白页。
- `components-browser-results.json` 与 `concurrent-browser-results.json`：禁用复制/批注、真实 AbortError、清理选区、销毁隐藏测量 canvas；另一真实 SDK 文本流 pending 时缓存不被清理，全部销毁后归零。
- `independent-round-trips.json`：pypdf 检查 canonical field、Widget、AP、原页流和原批注；Poppler 差分显示新标记范围外变化 `0`、第二页变化 `0`、两轮像素变化 `0`，原高亮采样 `[255,255,178]`。Poppler 比较相同 crop/DPI 的视觉结果，UserUnit 的 CSS 尺寸由 PDF.js 矩阵另行验证。
- 最新源/两轮 Poppler PNG 与实际 App 浅色/暗色/320px PNG 已目视检查：原文、字段、原批注、斜行删除线与四类文字标记可见，没有文字重绘或标记重复加深。

## 复现

```sh
node --test docs/tests/studio-pdf-adapter.test.mjs docs/tests/studio-pdf-text-layer.test.mjs
pnpm --filter @zuvi/react exec vitest run src/components/OfficeStudio/StudioPdfTextLayer.test.tsx --reporter=dot
ZUVI_E2E_PORT=5273 pnpm exec playwright test --config e2e/playwright.config.ts e2e/office-studio-pdf-text-layer.spec.ts --workers=1
/Users/meaili/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 docs/audits/2026-11-27/pdf-text-layer/verify_round_trips.py
```

5273 为本任务独立端口；5174 未使用或关闭。真实 App 必须消费父任务统一 fresh 后的 UI dist，独立 renderer 与组件 harness 不替代 App 闭环。
