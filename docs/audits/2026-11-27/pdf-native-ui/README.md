# PDF 原生批注编辑器与交互验收

本批将 P012 自由文本、P014 四种文字标记、P015 便签讨论及 P016 绘图接入实际 OfficeStudio。宿主原生解析、字体与外观保真见 [宿主迁入记录](../pdf-native-annotations/host-migration/README.md)；文字选择复制和 PDF.js 渲染见相邻 `pdf-text-layer/`。P009–P011、P013 及其他未验证条目保持原有范围，159 项目标未完成。

编辑器使用 ZUVI 工具栏、Input、Select、ColorPicker、Checkbox、Modal 与 Button。12 类原生批注及 Line 箭头有创建入口；属性弹窗按来源能力开放文字、字体、对齐、位置、尺寸、颜色、填充、不透明度、线型、线端与顶点。未改动的颜色不会转换原 Gray/CMYK components。拖动仅画 ghost，松开后准备一次原生候选；取消、IME、只读、禁用、过期对象与宿主拒绝均受守卫。

每次接受操作先生成并重新验证完整 Doc/Blob，再由宿主 paired callback 同步接受一次。历史记录恢复原文件与模型；字段编辑保留独立事务。持久化仅保存 sourceHash、bindings 和 commands recipe，能力及私有 provenance 从真实来源重读。已保存的非空 recipe 使用只读派生 PDF 及当前页序 binding 渲染画布、文字、外观与缩略图；派生文件不进入历史，不重复应用旧页码或旋转。改写后的对象引用取自宿主 preview 的实际 annotations 映射。

| 验收维度 | 当前证据 |
| --- | --- |
| 模型与入口 | 新原生交互、dialog/layer/service 接口与 source-bound recipe 已集成；实际 5275 浏览器专项另记结果 |
| 权限与失败 | 签名读取完成前禁用修改；只读可选择/检查属性，移动、填写、删除、回复、历史禁用；无 provider 不接受原生投影的模型修改 |
| 事务与取消 | IME、非法草稿、ghost/cancel、过期 Doc/Blob/editor、controlled 拒绝及不完整候选有实际 UI 测试；错误同时显示在属性弹窗中 |
| 原生往返 | 宿主独立 117 项及本批 codec/低层 compose 六文件 134 项通过；实际入口的导出重开待 browser-native 专项收尾 |
| 明暗与窄屏 | 实际入口专项运行后登记，当前不能仅据 unit 或独立 renderer 记完成 |
| 全仓集成 | 当前 fresh UI 与 browser build、入口预算已通过；全 UI/docs/types/lint/Registry/消费者/分发/构建/E2E 另记最终结果 |

`validation/current-pdf-ui.txt` 是五文件 **93/93**（Pdf 37、composition 14、native transaction/preview 27、gesture layer 9、TextLayer/PaintLayer 生命周期 6）；`native-model-and-pages.txt` 是三文件 **41/41**（model 25、page identity 5、native recipe/独立 SHA 合同 11）。`codec-and-compose.txt` 是真实 PDF codec 与低层 compose、catalog、resources、annotations、SHA 六文件 **134/134**，覆盖跨页 IRT/Popup、combined Widget 引用、复制组隔离及原 Contents 保留。宿主 117 项不与这些数字合并成虚构的单次全仓结果。

首次 UI 19 项发现 Checkbox children 误用会令属性弹窗崩溃、IME 中输入变 disabled、未完成签名读取时可填写，以及无 provider 时可修改 native projection；源码与日志保存在 `validation/first-*`。后续纠正测试中的 Modal.Title 名称、Blob identity 比较、只读数组 fixture 及提交事件后通过。一次真实 controlled 拒绝还发现错误只显示在 modal 外部，已在属性弹窗中显示宿主失败原因。所有失败日志保留原字节，没有用通过日志覆盖。

查找状态按真实 session、请求与页映射绑定；临时 disabled/只读切换保留当前命中及页码，新请求或原文件变化才重新查找。批注数量取原生可见 roots 与未迁移旧标注。命中框优先使用 PDF.js 已渲染 section 的物理边界，处理 NoZoom/NoRotate 与无 AP 便签的实际图标语义。

可重复运行：

```sh
pnpm --filter @zuvi/react exec vitest run src/components/OfficeStudio/StudioPdf.native-annotations.test.tsx src/components/OfficeStudio/StudioPdfNativeLayer.test.tsx src/components/OfficeStudio/studio-pdf-native-model.test.ts
node --test docs/tests/studio-pdf-codec.test.mjs docs/tests/studio-pdf-compose.test.mjs docs/tests/studio-pdf-compose-catalog.test.mjs docs/tests/studio-pdf-compose-resources.test.mjs docs/tests/studio-pdf-compose-annotations.test.mjs docs/tests/studio-pdf-compose-sha256.test.mjs
node docs/audits/2026-11-27/pdf-native-ui/generate-manifest.mjs
```

最终 SHA 清单由上述脚本生成，绑定当前生产源码、验证日志和实际浏览器产物；它记录证据，不将未验收条目自动升级为完成。
