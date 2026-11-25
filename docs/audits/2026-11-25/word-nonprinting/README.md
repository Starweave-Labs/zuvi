# Word 非打印字符 W018 验收切片（2026-11-25）

字符标记为空格 `·`、制表 `→`、不换行空格 `°`、段落结束 `¶`、手动换行 `↵`。通过 ProseMirror 装饰绘制，实际 DOM 文本不加入标记，原字符和 UTF-16 位置不变；文档 JSON/HTML 序列化与剪贴板所用正文仍保留原字符。样式通过伪元素显示标记，结束标记为空的非交互 widget。正文、标题、表格、空段落、页眉和页脚同步。

开始工具栏的 ¶ 按钮、视图中的“非打印字符”复选和 Ctrl+Shift+8 / Command+8 使用同一个视图状态。只读允许查看；禁用状态不能改变开关。组合输入事件和表单控件中的快捷键不触发显示切换。新文档/重开创建新的编辑器时默认关闭，开关不保存到 DOCX。切换不会增加文档修改事件或撤销记录，文字编辑的撤销/重做继续工作。

原生 DOCX 以 `w:tab` 保存制表符，保留运行格式、重复空格、NBSP 和 `w:br`。打印 HTML 从文档模型生成，保留空白，编辑器打印样式隐藏伪元素标记。

| 证据                                                                                        | 覆盖                                                                                                                        |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `studio-word-nonprinting.test.ts`（3 项）                                                   | Unicode/位置、纯序列化、无新增历史、编辑/撤销/重做后装饰、只读和外部内容替换                                                |
| `StudioWord.test.tsx`（72 项，其中 2 项新增）                                               | ZUVI 工具栏、视图复选、正文/表格/页眉/页脚联动、选区文本、读写/禁用、IME/控件快捷键和真实格式撤销                           |
| `office-studio-word.test.mjs`（29 项）                                                      | 原生 tabs/重复空格/NBSP/换行的导入→编辑→两次保存重开及运行格式                                                              |
| `studio-print.test.mjs`（24 项）                                                            | 打印正文空白/换行保留与无装饰字符                                                                                           |
| `office-studio-word-nonprinting.spec.ts`                                                    | 浏览器文字/选区/段落高度不变，按键编辑和一次撤销/重做，两次原生 DOCX 重开，启用状态下导出无显示标记，打印媒体隐藏、只读查看 |
| `nonprinting-source.docx` / `nonprinting-roundtrip-1.docx` / `nonprinting-roundtrip-2.docx` | 原生来源及连续两次导出文件，独立解压核对 XML                                                                                |
| `nonprinting-light.png` / `nonprinting-dark.png`                                            | 桌面显示标记、工具栏、正文和表格                                                                                            |
| `nonprinting-light-320.png` / `nonprinting-dark-320.png`                                    | 320px 明暗主题，切换显示并使用 50% 缩放查看标记                                                                             |

实际读取 ONLYOFFICE 固定版本 [Toolbar.js 的非打印切换](https://github.com/ONLYOFFICE/web-apps/blob/f79972a400c3a696490094961772d1f86fac1b82/apps/documenteditor/main/app/controller/Toolbar.js#L1852-L1878)：菜单与按钮共同设置显示开关；本实现使用 ZUVI 控件和现有 Tiptap 内核，不引入参考项目运行时。

这是 W018 切片证据。超长文稿及全部字号、文字方向和分页组合仍需完整共通验收；现有自定义制表位 DOCX 导入限制保留。159 项整体完成仍未证明。

全仓收尾：UI 120 文件/2,297 项、文档站 280 通过/1 原有跳过、全仓 E2E 232 项通过；类型、lint、Registry（92 项）、332 个消费者源码文件编译、分发/打包、UI/browser/docs 构建通过。React ESM 入口 gzip 124,908 字节，预算 <124,928 字节。
