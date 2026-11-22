---
'@zuvi/react': minor
---

OfficeStudio Word 查找与替换支持按格式筛选

- 查找面板新增格式筛选（粗体/斜体/下划线/删除线）：只有完整落在满足格式区间内的匹配被保留，跨格式边界的匹配排除；区间无文本节点（如纯手写笔迹）视为不满足。
- 模型层 `wordFindMatches` 新增可选 `WordFormatCriteria` 参数；替换沿用作范围，全部替换/逐处替换均按筛选后的匹配执行。
