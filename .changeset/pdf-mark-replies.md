---
'@zuvi/react': minor
---

OfficeStudio PDF 批注支持回复线程

- 批注模型新增可选 `replies`（`StudioPdfMarkReply[]`），随文档 JSON 持久化，宿主保存/导入导出无需适配。
- 选中标注后，检视器内出现回复区：查看/添加/删除回复，Enter 直接发送（IME 组合期间不拦截由调用方输入默认行为保证），每个标注上限 99 条。
