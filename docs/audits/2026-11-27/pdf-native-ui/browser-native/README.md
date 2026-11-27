# 原生批注实际 UI 与文件往返

最终 fresh dist 在独立 5275 的实际 OfficeStudio 入口运行 **10/10 passed**。这不是 host 单测或替换 renderer 的页面：文件使用真实输入导入，操作使用 ZUVI 控件、鼠标/键盘，保存调用真实宿主并下载 PDF，再导入重开两轮。独立 pypdf 核对 19 个浏览器输出 PDF，Poppler 20 页和 PDF.js 18 页渲染均另行检查。来源/脚本/生产源码/dist/PDF/PNG/日志 SHA 与逐项六维矩阵在 `manifest.json` 和 `acceptance-matrix.json`。

本切片覆盖 P012 新增自由文本、P014 四种文字标记、P015 便签与原生讨论、P016 几何/墨迹。12 个标准 subtype 均有实际创建入口；箭头使用原生 Line 的 LE。P009-P011/P013 和原始 159 项其它功能由根代理独立验收，不能用此切片代替完整目标。

## 实际已验证行为

FreeText 输入 CJK、调整内容/坐标/尺寸/字号/文字颜色/对齐/透明度，并以一次历史事务撤销、重做。DOM composition 期间不会提交，结束后正常接受；错误数值保留草稿，Escape 后 Doc/Blob 保持删改前内容。

四类 marker 来自实际鼠标选择原文。已有 marker 覆盖的文字通过“选择文字”继续鼠标选择、复制到真实 clipboard，再重新标记。颜色/透明度/删除与撤销，以及真实 Annots 的 QuadPoints、C、CA 都通过两轮保存重开核对。

矩形、椭圆、直线、箭头、多边形、折线、墨迹用真实 pointer 创建；属性可修改填充、线型、线宽、透明度、端点与顶点。错误顶点草稿不会提交。移动显示 ghost，Escape 不新增历史，pointerup 只接受一个可撤销事务；键盘与尺寸调整同步到原生几何。

便签可读取原始跨页 IRT 回复，新增署名、作者时间和回复，解决/重新打开讨论，删除回复及父批注。撤销恢复完整旧 Doc/Blob；历史按现有设计清除对象选中状态，重新选择父批注后回复仍可见。源 fixture 已有一条跨页回复，新增两条后的可见计数是三条。回复的 DOM IME Enter 不发送，compositionend 后正常 Enter 发送。

旧四类文档从实际 IndexedDB 存储恢复后在一次接受事务迁为原生，撤销恢复原 source。持久化非空 recipe 连续 copy/reorder/edit 后实际 canvas、原文选择、paint、缩略图使用当前顺序预览；读取不接受新 pair，外部 source 字节/存储 revision 保持不变。

只读、真实 source locks、零 Rect 无 AP note 的实际 22px hit/paint bbox、异步中文字体准备期间的禁用和取消均通过。浏览器演示没有通用 disabled prop 开关：此处直接验证 busy-disabled 命令和原生锁定；显式 disabled prop 由根的 UI 回归验证。浅色、暗色、320px 的文字/marker/端点/多边形弹窗与讨论侧栏有实际截图。

## 清色和实际 CJK 显示修正

清色缺陷由真实 host 公共命令证实：删除 C/IC 后再调透明度或线宽会使 AP 恢复黑/黄。原生 none 现在明确写 `[]`，source 缺失键只投影有效默认而不在不相关编辑时物化，未改 Gray/CMYK 保留原 components/colorspace。FreeText 缺 IC 与新建未传 fill 的边框默认 black，显式 null 是 none，边框颜色与背景独立。最终 UI 的 black/RGB→none→两轮重开→opacity/stroke 不复活，真实 C[]/IC[]、透明 AP 和保留文字均通过。

实际 App 曾将 SDK `.annotationTextContent` 作为有色 DOM 再绘制，导致 CJK 叠字/换行。Text 代理依据 SDK 规则令该可访问文本透明，实际 canvas/FontFace 不变。最终 `all-native-types-light.png` 已单层清晰；独立 `disableFontFace` 渲染只是另一渲染器的证据，不能冒称它证明 App 修复。

## 原始失败与证据边界

first/second/third/fifth/sixth-attempt 保留 locator/共享 Vite 504/fixture 错误的 trace、截图及实际 dist 字节。`failed-active-pairs` 保留失败时实际 Doc/Blob；`before-fixture-geometry-fix` 保留错误相对 Ink 点和人为重叠的旧 PDF/PNG/hash。老 Ink 的点为原生绝对坐标，已纠正；移动 fixture 改向左 10，并保留精确坐标/撤销/尺寸断言，避免撞到源 Ink。

独立清色复现的第一次 after 调用误复用了临时输出名，首轮 CLI 保留但首轮 PDF 副本被覆盖。`color-none/before-pinned` 明确是用冻结四个核心模块重建的修前实现，其每个源码 SHA 与原 source-contract 完全一致；`after-fixed` 使用最终核心。两者有真实 PDF/AP 和 hash，未冒称重建文件就是那次首轮原字节。修前字体黑框的更早冻结原型仍保持原字节。

两个清色探针的原始可执行源码按字节保存在各自的 `probe.mjs.txt`，与 `/tmp` 冻结原件一致。当前 `probe.mjs` 仅显式导入 Node 的 Blob/TextDecoder、去掉未用 mkdir，并要求新的空输出目录，避免复验覆盖固定 PDF。原件/可执行版本 SHA 与改动说明在 `color-none/probe-source-map.json`，核心和已有 PDF/CLI 字节未改。

两个可执行版本已分别真实复跑，原生颜色/样式结果与各自旧结果完全一致；缺输出目录或非空目录均拒绝执行。新复跑字节单独保存在 `color-none/replayed-probes`，检查在 `color-none/replay-validation.json`。随后全仓 ESLint exit 0，日志为 `logs/global-eslint-after-probe-repair.txt`；这项只修正审计工具，不改变产品代码或此前 UI/原生验收输出。

最终没有发现未处理的本切片产品失败。完整台账、全仓门禁、整站 E2E、提交由根代理处理；此处不声称其它条目完成。

## 复验命令

```sh
ZUVI_E2E_PORT=5275 pnpm exec playwright test --config=e2e/playwright.config.ts e2e/office-studio-pdf-native-annotations.spec.ts --workers=1
```

`verify-native-ui.py`、`render-native-ui.py`、`render-native-ui-pdfjs.mjs` 在本目录对实际下载输出复验，使用 Codex bundled Python/Poppler/Node。普通开发/生产缓存配置未改变，标准 E2E 按端口/进程隔离 Vite cache。`dev-server.mjs` 仅保留独立诊断，不用于最终路径。

清色探针复验时先创建新的空目录，再执行 `node color-none/before-pinned/probe.mjs /tmp/新空目录` 或 `node color-none/after-fixed/probe.mjs /tmp/另一新空目录`。运行结果写入传入目录；不传参数、传固定证据目录或非空目录都会拒绝执行。原始 `.mjs.txt` 仅供字节审计。
