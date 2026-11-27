# PDF 原生批注宿主迁入验收

本记录覆盖 P012/P014/P015/P016 的原生宿主切片。12 个标准 subtype 为 FreeText、Text、Highlight、Underline、StrikeOut、Squiggly、Square、Ink、Circle、Line、Polygon、PolyLine；箭头采用 Line/PolyLine 的原生 LE。P009-P011 页面功能和 P013 图片/链接仍有独立验收要求。

当前原生、codec 与高层 composition 回归 **150/150**，生产源严格 noEmit 与自有 ESLint 均 exit 0。实际 OfficeStudio 最新浏览器 **10/10**，19 个下载 PDF 经独立 pypdf 核对，20 页 Poppler、18 页 PDF.js 和 13 张实际 App PNG 已目视，详见 [browser-native](../../pdf-native-ui/browser-native/README.md)。该真实终态包括显式清色后的两轮重开及实际 CJK 单层显示。

本目录保留首次迁入的 6 个宿主 PDF、10 张 Poppler 和 3 张 PDF.js 页面及其视觉 SHA；这些文件生成在 none 修复之前，原始字节保持不变。当前文件往返证据使用上述 browser-native 新下载输出，不能把这里的旧 PDF 冒称最新源码重建结果。源码 SHA 已刷新；原 `source-contract.json` 完整保存为 `source-contract-before-none.json`，并用于核对清色修前同字节源码重建。首次隔离 117/117 和组合 143/143 的历史日志同样保留。

此前组合迁入 143/143 已通过。新增非空 recipe 回归后，共 144 项的当时组合运行是 130 passed / 14 failed：旧 codec 测试的 `pageCommands()` 手动 VM 未加载页面 helper 新导入的 `studio-pdf-source-id`，均在 fixture loader 抛出 `require is not defined`。随后根代理修复共享测试加载器并运行全部低层 compose、catalog、resources、annotations、SHA 套件。原始失败日志已保留，不能将历史 143/143 当作当前全仓验收。

该加载器问题现已由根代理解决：改为递归 `pdfTestRuntime` 后，codec、低层 compose/catalog/resources/annotations/SHA 六文件 **134/134 passed**。对应原始终态位于 [codec-and-compose.txt](../../pdf-native-ui/validation/codec-and-compose.txt)。历史 144 项失败记录继续保留用于对照；修复没有改变原生批注内核行为。实际 UI 的独立证据在 [browser-native](../../pdf-native-ui/browser-native/README.md)。

## 实际 API 与持久化合同

`studio-pdf-annotation-editor.ts` 提供 `studioPdfAnnotationEditor` 及可注入字体服务的 factory。`inspect({document,source})` 从真实来源读取/回放，返回可序列化 recipe 与派生 snapshot；source、权限和私有 provenance 不来自 UI snapshot。

`apply({snapshot,command,now,signal?,next?})` 先迁移未绑定 nativeId 的旧四类、物化字段与旋转，再执行原生命令、完成字节/字体/fit/refs 校验，并 checkpoint/reimport 返回完整新 Doc/Blob。UI 使用既有 paired callback 接受一次，撤销恢复旧 pair。`next` 仅提供页面展示 metadata，目前用于计算旋转增量；它不授权来源、字段或权限。日期和 identity 在接受命令时捕获，重复导出不生成新时间。`nativeAnnotations` 仅保存 version/sourceHash/bindings/commands，不保存 snapshot/capabilities。

`preview({document,source})` 是只读派生渲染合同，尤其适用于持久化的非空 recipe。其 Blob 已包含当前顺序与旋转；binding 的 sourcePage=index、rotations={}，canvas/text/paint/缩略图不能再应用旧 sourcePage/copyGroup/旋转。`annotations` 从最终派生字节重读 stable ID、实际 object key 与 flags，避免沿用旧 source ref；`nativeBodyIds`/`noApIconIds` 区分原生 AP 与无 AP note。原 document/source 仍用于历史和 apply，预览不能隐式接受 pair。

`exportStudioPdf()` replay recipe 后处理 fields/rotations，并跳过 nativeId 的 legacy body。未编辑文件返回当前 Blob 的同一对象。真正 field-only 重写前也 stamp 已验证 annotation/page IDs。`importStudioPdf(...,{pageIds?,native?})` 支持宿主稳定 UUID aliases；widget-only 文档默认保持旧模式。P008 native 分支准备已接受 native，incoming scope 分离碰撞 ID，调用真实 `composePdf` 后建立新稳定页 alias 和空 recipe。

`workspace-composition.ts` **已经移除 IRT/Popup stage/restore workaround**。跨页线程、Popup、combined Field/Widget refs 由实际低层 copier 处理；适配器只负责来源 ID stamp、incoming scope 和结果页 ID。NativePdfWorkspace 本身仍支持连续 copy/move/delete/edit/reply/new 与 JSON serialize/restore，不存在“保存重开后才能再次复制”的限制。

## 原生保真与实际 UI 证据

保留源 Contents、未编辑 AP/字体/链接、IRT/R 线程及 review 状态。opaque、Group、未知 actions、locked、签名、加密、真实 XFA 以及无法重建的源字体继续使用严格拒绝/只读策略；直接和间接 dictionary null 按实际 pdf-lib lookup 视为 absent，数组 null 坐标保留。Gray/CMYK 未改色时仍使用原 components/colorspace。显式 0/null 与默认 paint 独立。

实际浏览器已覆盖拖动单次事务、取消、IME、撤销/重做、只读/source lock/busy-disabled、浅色/暗色/320px、零 Rect 无 AP Text、非空 recipe 当前顺序派生视图、旧四类迁移与两轮原生重开。过期/权限切换/拒绝受控接受及显式 disabled prop 由根的实际 UI 组件回归补充。详细六维矩阵与 PNG/字节 SHA 位于 browser-native；本宿主记录不替代整个 159 项台账或根的整站门禁。

显式 none 用 C[]/IC[] 持久化，缺失 C/IC 的有效默认投影与原键身份独立，未改 Gray/CMYK 不量化。真实 black/RGB→none→重开→opacity/线宽→第二轮仍无 paint；FreeText 文字保留。首轮清色 CLI 日志保留，最初 PDF 副本被一次错误输出名覆盖；修前 PDF 已明确标为以冻结四模块重建，并核对每个源码 SHA，不冒称首轮原字节。

冻结原型 `/tmp/zuvi-pdf-native-marks-typescript/` 的 124/124 与 `evidence-before-default-paint/` 的黑框 PNG/修前源码保持原字节，其摘要在 manifest 中单列。本目录使用新的生产迁入证据，避免混用原型验收。

## 可重复验证

```sh
node --test --test-reporter=spec docs/tests/studio-pdf-native*.test.mjs docs/tests/studio-pdf-codec.test.mjs docs/tests/studio-pdf-composition.test.mjs
node docs/tests/studio-pdf-native-evidence.mjs
python verify-native.py
python render.py
node render-pdfjs.mjs
node verify-source.mjs
```

后四条在本审计目录执行，Python/Poppler 使用 Codex bundled runtime。`finalize-evidence.mjs --record-visual-review` 只能在实际检查新 PNG 后执行；不带该参数会验证 PNG 与已记录的视觉 SHA 完全一致。源码严格类型配置为 `strict-source-types.json`，直接映射当前 UI 源合同，不使用旧 dist 的 snapshot 类型。
