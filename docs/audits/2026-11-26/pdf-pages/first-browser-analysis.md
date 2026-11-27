# PDF 页面首轮浏览器失败定位

本记录分析首轮失败，修复后的浏览器结论待复验，不能记为验收完成。

主流程已通过导入、真实空白画布320×480、白色像素与撤销/重做2→3页。最终 pending call 是 itwn@86：`getByLabel('选择 PDF 第 2 页').uncheck()`。日志反复记录 Checkbox 可见 control span 截获隐藏 input 的指针点击。修改为实际点击对应 ZUVI Checkbox label，并保留 checked 状态断言，未使用 force 或改变90秒超时。

拖动测试 xpzg@59 完成了API dragAndDrop，但导出页引用仍是原序[5,6]，没有重排。trace输入记录：起点box(x332,y589.859,width235,height210)、point(449.5,694.85)；目标在自动滚动后box(x332,y227.859,width235,height210)、point(352,429.85)。旧trace没有记录DOM drag/drop生命周期，不能据此确认生产drop handler收到事件。

修改将真正的缩略图按钮设为draggable，外层row只作为drop目标；事件指定move语义，drop位置在处理器内先捕获，保留文档快照守卫。测试拖动前滚动编辑器并校验两缩略图在可见区域，记录dragstart/dragover/drop/dragend的实际target、row索引和point到pages-drag-events.json；继续要求正确drop到row1、当前原页移到第2页及原生引用[6,5]。focused handler测试不能替代这次实际浏览器复验。

原始trace与总日志已由根代理归档在word-cell-properties/first-expanded-e2e-failures/，本批仅阅读，未重写。
