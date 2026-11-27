# P004–P007 原生 PDF 页面操作切片

2026-11-26：保持切片验证、完整验收待审；P008 合并/提取仍未接入，159 项目标未完成。

实际 ZUVI 入口支持空白页尺寸和插入位置、多页选择/删除与最后页限制、复制/移动/缩略图拖动、多页旋转及可见画布尺寸。页面稳定 ID 与 sourcePage 映射保留原始 PDF.js 会话；增加/删除页面不清空事务历史。只读/禁用、无映射能力的 legacy renderer、无效草稿、源或 session 切换有明确守卫。

两项真实浏览器流程通过：导入双页及共享表单，创建/旋转/改尺寸/复制/多页删除、一次撤销重做、连续两次导出重开；另实际拖动首缩略图至末页，记录 dragstart/dragover/drop/dragend，原生页引用确实交换。pages-round-2.pdf 是 480×320 空白页及保留原内容和表单外观的旋转页；原生表单树、V 和 widget 数量正确。明暗与 320px 弹窗截图在目录内，截图等入场动画完成后采集。

原生 26 项回归通过，涵盖嵌套页面继承、原页/副本引用、combined field/widget 拆分、字段继承物化、直接与命名目的地/A/AA/Next/目录/OpenAction 的映射或删除、循环、radio 值与隐藏控件、copy-group 自跳转，以及 Contents 数组和可变 Resources 字典隔离。copy 的内容流、字体、图像与 AP 原引用保留。

hiddenWidgets 通道目前保留带 Hidden/NoView 标志的控件（包括零面积）。未带这些标志的零面积控件、其他未支持字段、密码/签名等来源仍受现有导入约束；不能把这批证据记为完整原生字段兼容。更多多页拖动/滚动组合和每项完整通用验收仍待逐项复核。

first-browser-analysis.md 与 Word 审计子目录保存首次 checkbox 点击遮挡及未重排失败的原始 trace。修复采用实际 ZUVI label 点击和可见缩略图 drag，未 force、未增加 90 秒上限。UI 相关 46 项通过；全 UI 2710、docs 359、类型/lint/Registry/消费者/分发/构建/browser/体积及整站287项均通过。
