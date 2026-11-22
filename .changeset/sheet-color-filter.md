---
'@zuvi/react': minor
---

OfficeStudio Excel 筛选支持按颜色

- 筛选条件新增「字体颜色 / 填充颜色」算子：值控件切换为取色器，按单元格 `color` / `background` 与 #hex 归一化后比较（3 位展开为 6 位、大小写不敏感）；无对应颜色的行不匹配。
- `studioSetFilter` 校验颜色算子必须携带合法 #hex 值；文本/数值算子行为不变。
