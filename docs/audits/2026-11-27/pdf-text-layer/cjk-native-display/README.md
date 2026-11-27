# P012 实际 App 中文叠字诊断

源文件：`actual-source.pdf`，SHA-256 `7a4e322ddf8384e9631f64f8add9e940458270b07f203aae438bfb46a5032965`。

实际 App 中 `中文自由文本：原生迁入后保留` 叠字、末字换行的原因已确认：PDF.js 的 FreeText `AnnotationLayer` 额外生成 `.annotationTextContent[role=comment]`，这份 DOM 是无障碍文字。OfficeStudio 缺少 PDF.js `pdf_viewer.css` 1254 起的隐藏样式，导致 DOM 使用继承的系统 16px 字体、静态布局、48px 高度，第一行 208px、第二行 16px，叠在已绘制的 15pt AP 上。

`original/` 保存首次发现的 App 图、源 PDF 与生产源码版本。`baseline/` 保存本次实际 App 原始图、DOM/FontFace/绘制调用、所有 canvas PNG、测试源码与 trace。用同一个 App 临时加入 SDK 的透明无障碍样式后，中文清晰单行，所有 canvas PNG SHA 与绘制调用数组完全一致。嵌入 CJK 字体已 loaded，14 个 glyph 各绘制一次，字体选项未改变。两份真实样本的完整 App 截图差分也只落在重复中文 DOM 的墨迹区域，其他区域不变。

`minimal-freetext.pdf` 保留同一 AP 原字节，仅剩一页、一个 FreeText；`minimal-baseline/` 在实际 App 中复现相同 DOM 问题并保存透明样式反证。原生 AP 与字体不是本次修复对象。

生产修改只在 `StudioPdfTextLayer.css` 给 `.freeTextAnnotation .annotationTextContent` 补 `position:absolute`、100% 尺寸、`opacity:0`、透明颜色与 `user-select:none`。保留 `role=comment`，未使用 `display:none`；未改 `disableFontFace`、adapter 字体处理或增加兼容层。

最终验证已通过父任务统一 fresh UI：原始十二类批注文件的实际 App 1/1（4.5s）与最小文件实际 App 1/1（4.5s），均不注入任何诊断 CSS。`actual-final.json` 与 `minimal-production/actual-final.json` 逐项确认透明/absolute DOM、保留 comment role 与正常 display、AP 14 次 glyph 绘制、所有 canvas SHA 等于修复前正确 AP、持久化 source SHA 不变。`actual-production-fixed.png` 与最小正式图已目视确认清晰完整单行。

P002 五项在这次 fresh UI 中也全部通过；最新原生两轮导出再次由独立 pypdf/Poppler 验证。UI 生命周期 6/6、reader 回归 17/17、scoped lint 与 diff 检查通过。第一次生产回归因在冷启动画布加载完成前只等待输入 enabled 5 秒而超时，原件保存在 `first-production-attempt/`；改为先等待真实 annotationLayer ready 后通过，未放松 DOM、paint 或源文件检查。
