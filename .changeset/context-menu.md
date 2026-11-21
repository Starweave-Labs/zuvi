---
'@zuvi/react': minor
---

DropdownMenu 支持右键上下文菜单（`DropdownMenu.ContextTrigger`）

- 新增 `DropdownMenu.ContextTrigger`：包裹任意内容形成右键触发区域，`contextmenu` 时在指针坐标处打开菜单并拦截原生菜单；再次右键移动菜单位置。
- 键盘等价手势：菜单键 / `Shift+F10` 按触发区域锚元素定位打开（与指针打开共用同一菜单实现，APG 键盘模型、typeahead、Esc 归还焦点全部继承）。
- 选择菜单项或 Esc 关闭后焦点归还触发区域（区域为 `tabIndex=-1` 的可编程聚焦目标，非 Tab 停靠点）。
- `FloatingPanel` 新增 `anchorPoint` 视口坐标锚点（内部通用能力）：零尺寸矩形走既有 `floatingPosition` 视口钳制，右缘/底缘越界自动收进视口。
