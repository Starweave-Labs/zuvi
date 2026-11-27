# P003 PDF 目录书签内核设计与交接（2026-11-28）

原始验收：**读取原目录、层级导航与修改保存**，来源为 docs/onlyoffice-feature-ledger-2026-11-13.json 的 P003。本目录只记录独立目录内核，不代表 P003 已完成。共享 UI、模型类型、原生 import/export codec、台账均未接线。

最终归档入口为 final-2026-11-28/verification.json、source-identities.json 和 artifact-manifest.json。所有日期按 Asia/Shanghai；记录中的 UTC 时间保留原始执行时间。本次归档没有修改生产源码，只修改本目录的样本生成脚本以支持独立输出目录；早先样本和失败日志原样保留。

## 新增文件与接口

- docs/src/pages/collaboration/office-studio/studio-pdf-outlines.ts
- docs/tests/studio-pdf-outlines.test.mjs

内核面向已经加载的同一份 pdf-lib PDFDocument，不读取网络、不保存 Blob、不执行原生动作。调用者提供与当前原生页序一一对应且唯一的 pageIds。

~~~ts
interface PdfOutlineNode {
  id: string;
  title: string;
  expanded: boolean;
  children: PdfOutlineNode[];
  nativeId?: string; // 例如 "17 0 R"，只在当前原生来源中有效
  target?: {
    pageId: string;
    view: {
      kind: 'XYZ' | 'Fit' | 'FitH' | 'FitV' | 'FitR' | 'FitB' | 'FitBH' | 'FitBV';
      parameters: (number | null)[];
    };
  } | null;
  passiveNavigation?: string; // 原动作类型的信息投影，不负责执行
}
~~~

readPdfOutlines(pdf, pageIds) 读取可序列化目录树，解析普通 Dest、GoTo、旧 /Dests、/Names/Dests 命名目标及视图参数。层级使用 /Parent/Prev/Next/First/Last 校验，Count 的正负投影为展开状态。

validatePdfOutlines(tree, pageIds) 校验整棵请求树，不修改输入。最多 20000 项、深度 128；节点 ID 唯一，原生引用唯一且与节点 ID 一致。新节点与修改标题须非空，最多 4096 UTF-16 code units；原生已有空标题在未改动时保留。叶节点没有展开/折叠状态，编辑结果会归一为展开。

editPdfOutlineTree(tree, pageIds, edit) 是纯树编辑，命令为 insert/update/remove/move。move 的 index 是移除来源后目标兄弟列表的插入位置；禁止移入自己或后代。返回新树，内容相同则返回原身份。insert 不能冒用原生 ID；显式 target:null 清除导航，target 缺省保留。该函数不创建应用历史，宿主应将一次编辑作为单事务处理。

writePdfOutlines(pdf, pageIds, tree) 在完整读取来源和校验请求后，修改已加载 PDF 的目录。无变化返回 false，否则返回 true。未修改节点继续使用原生对象引用；新节点由 PDFDocument 分配引用，因此保存后调用者须重新读取树，获取新节点原生身份。内核不提供跨文件 sourceHash 校验，不能单靠对象编号证明树与 PDF 属于同一来源。

## 原生保全策略

读取投影不携带 PDFObject。写入时从当前来源字典 clone，重建链接及可见后代 Count，未修改的 Title/Dest/A 保留原生身份。私有 root/item 字段、C/F 样式、未知动作及嵌套私有属性保留；动作只作被动数据，不执行。

仅修改标题、顺序或展开状态时，URI、远程和 VendorAction 等非本地动作完整保留。将被动动作明确替换为本地页面目标或清除目标时，才移除旧 A。GoTo 的本地 D 改变时，clone 原动作并保留 Next 与未知键。命名目标未修改时继续保留原生命名引用；明确改变该节点目标时写显式页面数组，不改其他引用同名目标的节点。

页面本身未复制或重写；测试核对各页面 Contents stream 字节 SHA 与原字段值。移除目录项只改变目录可达树，未实现对象垃圾清理或内容脱敏。

## 整次拒绝边界

- 页面身份列表与原生页数不符、重复 ID、来源外页面引用、过期 nativeId、伪造被动导航和未定义的编辑字段。
- 目录循环/节点别名、错误 Parent/Prev/Last、非间接目录项、缺失标题、过深或超过项数限制。
- Dest 与 A 同时存在、命名目标缺失/重复/循环、无效命名树形状、动作 Next 循环或链中 GoTo 指向来源外页面。
- 未知视图种类、错误参数数量、非有限坐标、FitR 含 null 或无正宽高、负 XYZ zoom。
- 非法移动位置、缺失节点或父项、新节点冒用 nativeId、空的新/修改标题、非法纯树编辑命令。

有效请求的所有校验均在目录写入前完成，拒绝测试核对整个 loaded PDF context 字典序列未改变，纯编辑拒绝时原树未改变。模块不接管保存过程的 IO/内存故障，也未提供 Blob 原件事务或撤销栈。

未知的原生 item/root 属性保留在同一来源字典中；本内核不会宣称理解其私有语义。未知动作可被动保留，但动作必须具有字符串 S，已识别的链中本地 GoTo 仍校验目标。删除页面时不会静默裁掉目录节点；宿主须先定义并同步该节点的目标策略，或整次拒绝。

## 本轮验证

最终样本在 final-2026-11-28/native-verified/，包含 source.pdf、roundtrip-1.pdf、roundtrip-2.pdf 与生成器 verification.json。它们全部由 source-identities.json 指定的最终源码生成；完成时再次核对源码 SHA 未变。

final-2026-11-28/native-tests-verified.txt：9 项通过、0 失败、0 跳过。覆盖两轮原生目录编辑重开，8 种视图、命名目标、层级重排/新增/删除、私有属性/被动动作、GoTo Next、页序变化下的稳定 pageId、非法请求及原生结构拒绝、原生空标题和叶状态归一。

verify-native.mjs 独立解析 PDFDict/PDFArray，不调用目录模块，核对三个样本的层级链接、Count、标题、目标页索引、私有 root/item 属性和被动动作；页面正文流 SHA 与字段值相同。结果为 native-independent-verification.json。这是 metadata/正文保全检查，没有执行浏览器、打印或视觉 QA。

早先两文件 eslint 和 docs typecheck 已通过；初轮 TypeScript 控制流缩窄诊断及样本生成路径错误的日志留在上一级目录。最终源码再次专项 lint 的结果单列于 final 目录。没有构建或提交。

## 后续集成清单

1. 在宿主模型增加可序列化 outlines 合同；同时绑定 immutable Blob/sourceHash 和当前 pageIds，防止跨文件对象编号碰撞。
2. import/export 与原生来源 rebasing 接线；签名、加密等已有保存守卫继续由宿主执行，不直接绕过现有 workspace 管线。
3. StudioPdf 层级面板：展开折叠、原目标导航、标题编辑、选择/焦点、移动和新建/删除、错误草稿与取消、IME，以及 readOnly/disabled。
4. 每次编辑必须将新 Blob 与重读后的模型树一次提交，单次撤销/重做恢复完整配对；异步来源变化与受控拒绝保持旧配对。
5. 插入/删除/复制/重排页面后同步目标：现阶段只有“同一 loaded PDF 页引用重新排序并提供匹配 pageIds”的内核测试；尚未接入真实页面命令。
6. 实际原目录导入、层级导航、修改、一次历史、两轮原生保存重开、明暗/320px 及失败原件不变的浏览器验收。

原始六项共通验收中，目前只有内核数据保全、原生往返及内核拒绝原数据不变有聚焦证据；选区/焦点/IME/取消、应用历史、只读禁用与完整实际 UI 流程仍缺失。因此 **P003 保持未完成，不更新完整验收数量**。
