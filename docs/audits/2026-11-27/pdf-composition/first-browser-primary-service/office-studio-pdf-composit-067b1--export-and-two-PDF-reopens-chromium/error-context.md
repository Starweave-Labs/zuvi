# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-pdf-composition.spec.ts >> merges native pages and fields with editable marks, paired history, persistence, old-version export and two PDF reopens
- Location: e2e/office-studio-pdf-composition.spec.ts:47:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator: getByRole('region', { name: 'PDF 页面编辑区', exact: true }).first()
Expected: "false"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toHaveAttribute" getByRole('region', { name: 'PDF 页面编辑区', exact: true }).first() with timeout 5000ms
  - waiting for getByRole('region', { name: 'PDF 页面编辑区', exact: true }).first()

```

```yaml
- banner:
  - link "Z ZUVI v1.1.0":
    - /url: "#/"
  - text: 开发文档 OfficeStudio 独立文档工作台
  - button "打开文档命令面板": 搜索页面或命令 ⌘ / Ctrl K
  - button "切换暗色"
  - link "GitHub":
    - /url: https://github.com/Starweave-Labs/zuvi
  - status
- text: 文档 组件、规范与实践
- search "搜索文档导航":
  - searchbox "按名称过滤导航项"
- navigation "文档导航":
  - group "开始":
    - text: 开始
    - list:
      - listitem:
        - link "概览":
          - /url: "#/"
      - listitem:
        - link "设计令牌":
          - /url: "#/tokens"
      - listitem:
        - link "主题调参":
          - /url: "#/theme"
      - listitem:
        - link "国际化与翻译":
          - /url: "#/i18n"
      - listitem:
        - link "设计资源":
          - /url: "#/design"
      - listitem:
        - link "图标库":
          - /url: "#/icons"
      - listitem:
        - link "页面搭建器":
          - /url: "#/builder"
      - listitem:
        - link "业务区块":
          - /url: "#/blocks"
      - listitem:
        - link "内容协作实验室":
          - /url: "#/collaboration"
      - listitem:
        - link "组件创意工坊":
          - /url: "#/lab"
  - group "基础组件":
    - text: 基础组件
    - list:
      - listitem:
        - link "Button 按钮":
          - /url: "#/components/button"
      - listitem:
        - link "Typography 排版":
          - /url: "#/components/typography"
  - group "布局":
    - text: 布局
    - list:
      - listitem:
        - link "Splitter 可调分栏":
          - /url: "#/components/splitter"
      - listitem:
        - link "Divider 分割线":
          - /url: "#/components/divider"
      - listitem:
        - link "Layout 布局":
          - /url: "#/components/layout"
  - group "导航":
    - text: 导航
    - list:
      - listitem:
        - link "CommandPalette 命令面板":
          - /url: "#/components/command-palette"
      - listitem:
        - link "SideNav 侧边导航":
          - /url: "#/components/side-nav"
      - listitem:
        - link "Tabs 标签页":
          - /url: "#/components/tabs"
      - listitem:
        - link "DropdownMenu 下拉菜单":
          - /url: "#/components/dropdown-menu"
      - listitem:
        - link "Pagination 分页":
          - /url: "#/components/pagination"
      - listitem:
        - link "Breadcrumb 面包屑":
          - /url: "#/components/breadcrumb"
      - listitem:
        - link "Affix 固钉":
          - /url: "#/components/affix"
      - listitem:
        - link "BackTop 返回顶部":
          - /url: "#/components/back-top"
      - listitem:
        - link "FloatButton 悬浮按钮":
          - /url: "#/components/float-button"
      - listitem:
        - link "Steps 步骤条":
          - /url: "#/components/steps"
      - listitem:
        - link "Anchor 锚点":
          - /url: "#/components/anchor"
  - group "数据录入":
    - text: 数据录入
    - list:
      - listitem:
        - link "Input 输入框":
          - /url: "#/components/input"
      - listitem:
        - link "Checkbox 复选框":
          - /url: "#/components/checkbox"
      - listitem:
        - link "Radio 单选框":
          - /url: "#/components/radio"
      - listitem:
        - link "Switch 开关":
          - /url: "#/components/switch"
      - listitem:
        - link "Select 选择器":
          - /url: "#/components/select"
      - listitem:
        - link "Combobox 自动完成":
          - /url: "#/components/combobox"
      - listitem:
        - link "OfficeEditor 文档编辑器":
          - /url: "#/components/office-editor"
      - listitem:
        - link "OfficeStudio 独立文档工作台":
          - /url: "#/components/office-studio"
      - listitem:
        - link "Form 表单":
          - /url: "#/components/form"
      - listitem:
        - link "Slider 滑块":
          - /url: "#/components/slider"
      - listitem:
        - link "Rate 评分":
          - /url: "#/components/rate"
      - listitem:
        - link "InputNumber 数字输入":
          - /url: "#/components/input-number"
      - listitem:
        - link "ColorPicker 取色器":
          - /url: "#/components/color-picker"
      - listitem:
        - link "DatePicker 日期选择":
          - /url: "#/components/date-picker"
      - listitem:
        - link "TreeSelect 树选择":
          - /url: "#/components/tree-select"
      - listitem:
        - link "Transfer 穿梭框":
          - /url: "#/components/transfer"
      - listitem:
        - link "Cascader 级联选择":
          - /url: "#/components/cascader"
      - listitem:
        - link "TimePicker 时间选择":
          - /url: "#/components/time-picker"
      - listitem:
        - link "Mentions 提及":
          - /url: "#/components/mentions"
      - listitem:
        - link "Segmented 分段控制器":
          - /url: "#/components/segmented"
      - listitem:
        - link "Upload 上传":
          - /url: "#/components/upload"
      - listitem:
        - link "DateRangePicker 日期范围":
          - /url: "#/components/date-range-picker"
  - group "数据展示":
    - text: 数据展示
    - list:
      - listitem:
        - link "Table 表格":
          - /url: "#/components/table"
      - listitem:
        - link "Chart 数据图表":
          - /url: "#/components/chart"
      - listitem:
        - link "Globe 3D 地球":
          - /url: "#/components/globe"
      - listitem:
        - link "Badge 徽标":
          - /url: "#/components/badge"
      - listitem:
        - link "Tag 标签":
          - /url: "#/components/tag"
      - listitem:
        - link "Avatar 头像":
          - /url: "#/components/avatar"
      - listitem:
        - link "Card 卡片":
          - /url: "#/components/card"
      - listitem:
        - link "Empty 空状态":
          - /url: "#/components/empty"
      - listitem:
        - link "Calendar 日历":
          - /url: "#/components/calendar"
      - listitem:
        - link "Descriptions 描述列表":
          - /url: "#/components/descriptions"
      - listitem:
        - link "Statistic 统计数值":
          - /url: "#/components/statistic"
      - listitem:
        - link "Timeline 时间轴":
          - /url: "#/components/timeline"
      - listitem:
        - link "VirtualTable 虚拟滚动表格":
          - /url: "#/components/virtual-table"
      - listitem:
        - link "DataGrid 数据网格":
          - /url: "#/components/data-grid"
      - listitem:
        - link "Tree 树形控件":
          - /url: "#/components/tree"
      - listitem:
        - link "Collapse 折叠面板":
          - /url: "#/components/collapse"
      - listitem:
        - link "List 列表":
          - /url: "#/components/list"
      - listitem:
        - link "Image 图片":
          - /url: "#/components/image"
      - listitem:
        - link "QRCode 二维码":
          - /url: "#/components/qrcode"
      - listitem:
        - link "Watermark 水印":
          - /url: "#/components/watermark"
  - group "数据可视化":
    - text: 数据可视化
    - list:
      - listitem:
        - link "图表画廊":
          - /url: "#/charts"
      - listitem:
        - link "交互与联动":
          - /url: "#/charts/interactions"
      - listitem:
        - link "可视化实验室":
          - /url: "#/charts/playground"
  - group "反馈":
    - text: 反馈
    - list:
      - listitem:
        - link "Modal 对话框":
          - /url: "#/components/modal"
      - listitem:
        - link "Message 全局提示":
          - /url: "#/components/message"
      - listitem:
        - link "Tooltip 文字提示":
          - /url: "#/components/tooltip"
      - listitem:
        - link "Popover 气泡卡片":
          - /url: "#/components/popover"
      - listitem:
        - link "Alert 警告提示":
          - /url: "#/components/alert"
      - listitem:
        - link "Skeleton 骨架屏":
          - /url: "#/components/skeleton"
      - listitem:
        - link "Drawer 抽屉":
          - /url: "#/components/drawer"
      - listitem:
        - link "Spin 加载中":
          - /url: "#/components/spin"
      - listitem:
        - link "Progress 进度条":
          - /url: "#/components/progress"
      - listitem:
        - link "Notification 通知提醒框":
          - /url: "#/components/notification"
      - listitem:
        - link "Popconfirm 气泡确认":
          - /url: "#/components/popconfirm"
      - listitem:
        - link "Tour 漫游引导":
          - /url: "#/components/tour"
      - listitem:
        - link "Result 结果":
          - /url: "#/components/result"
  - group "全局配置":
    - text: 全局配置
    - list:
      - listitem:
        - link "ConfigProvider 全局配置":
          - /url: "#/components/config"
      - listitem:
        - link "App 容器":
          - /url: "#/components/app"
- text: React 19 CSS 变量驱动
- main:
  - heading "OfficeStudio 独立文档工作台" [level=1]
  - paragraph: 使用 ZUVI 的工具栏、菜单和表单，在页面内直接编辑文档。Word、Excel、PDF 共用文件操作与保存状态，编辑内容保存在当前浏览器，也可以导出为实际文件。
  - text: ZUVI 界面 页面内编辑 本地恢复 DOCX / XLSX / PDF
  - region "从预览，到完成一份文档":
    - heading "从预览，到完成一份文档" [level=3]
    - paragraph: 选择一种文档开始。修改会自动保存到当前浏览器；导出后可在 Word、Excel 或 PDF 阅读器中继续使用。
    - group "选择示例文档":
      - button "Word 文档排版 · 图片与页眉页脚" [pressed]:
        - strong: Word
        - text: 文档排版 · 图片与页眉页脚
      - button "Excel 行列编辑 · 公式与图表":
        - strong: Excel
        - text: 行列编辑 · 公式与图表
      - button "PDF 全文查找 · 批注与手写":
        - strong: PDF
        - text: 全文查找 · 批注与手写
    - text: 本地文档 打开本地文档
    - button "打开本地文档 项目提案.docx": 项目提案.docx
    - button "历史版本"
    - switch "只读预览"
    - region "Word 文档编辑器":
      - status "已保存"
      - textbox "文档名称": 项目提案.docx
      - button "新建"
      - button "导入"
      - button "导出文件"
      - button "打印"
      - button "保存"
      - button "全屏编辑"
      - alert:
        - text: 表单“Image”包含签名、按钮或列表等不受支持的字段，无法完整编辑此 PDF。
        - button "重试"
      - button "文件"
      - tablist "Word 工具":
        - tab "开始" [selected]
        - tab "插入"
        - tab "布局"
        - tab "引用"
        - tab "审阅"
        - tab "视图"
      - tabpanel "开始":
        - group "剪贴板":
          - button "粘贴"
          - button "剪切" [disabled]
          - button "复制" [disabled]
          - text: 剪贴板
        - button "格式刷" [disabled]
        - group "历史":
          - button "撤销"
          - button "重做" [disabled]
          - text: 历史
        - group "字体":
          - combobox "字体": 思源黑体
          - button "展开选项"
          - combobox "字号": "12"
          - button "展开选项"
          - button "增大字号"
          - button "减小字号"
          - button "粗体"
          - button "斜体" [pressed]
          - button "下划线": U
          - button "删除线": S
          - button "上标":
            - text: x
            - superscript: "2"
          - button "下标":
            - text: x
            - subscript: "2"
          - button "文字颜色": A
          - button "清除格式"
          - button "文字高亮"
          - button "变更大小写"
          - text: 字体
        - group "段落":
          - button "项目符号"
          - button "编号列表"
          - button "列表下沉缩进" [disabled]
          - button "列表上提缩进" [disabled]
          - button "减少缩进" [disabled]: ← ≡
          - button "增加缩进": ≡ →
          - text: 段落行距
          - button "段落行距 1.75 倍": 1.75 倍
          - button "左对齐" [pressed]
          - button "居中"
          - button "右对齐"
          - button "两端对齐"
          - text: 段落
        - group "样式":
          - button "正文样式" [pressed]: 正文
          - button "无间距样式": 无间距
          - button "标题 1样式": 标题 1
          - text: 段落样式
          - button "段落样式 正文": 正文
          - text: 样式
        - group "编辑":
          - button "查找与替换": 查找
          - button "文档大纲": 大纲
          - text: 编辑
      - toolbar "Word 文档工具":
        - button "打开查找与替换"
        - button "打开文档大纲"
        - button "打开字数统计"
      - article "文档纸张":
        - region "页眉区域"
        - textbox "Word 文档正文":
          - paragraph: ZUVI STUDIO / 项目工作文档
          - heading "让想法，成为下一步。" [level=1]
          - paragraph: 在页面中直接编辑正文，用清晰的结构记录目标、计划与成果。选中文字后，可以调整字体、颜色和段落样式。
          - heading "01 项目目标" [level=2]
          - paragraph:
            - strong: 建立一个顺手的文档空间，让预览、编辑和交付保持连贯。
          - list:
            - listitem:
              - paragraph: 把重要内容写在前面，让每次沟通都有明确结论。
            - listitem:
              - paragraph: 在同一张画布完成排版、表格和内容修改。
            - listitem:
              - paragraph: 保存进度，并导出可继续编辑的 DOCX 文件。
          - heading "02 交付计划" [level=2]
          - table:
            - rowgroup:
              - row "阶段 交付内容 状态":
                - columnheader "阶段":
                  - paragraph: 阶段
                - columnheader "交付内容":
                  - paragraph: 交付内容
                - columnheader "状态":
                  - paragraph: 状态
              - row "本周 完成项目提案与预算 进行中":
                - cell "本周":
                  - paragraph: 本周
                - cell "完成项目提案与预算":
                  - paragraph: 完成项目提案与预算
                - cell "进行中":
                  - paragraph: 进行中
              - row "下周 评审并确认实施计划 待开始":
                - cell "下周":
                  - paragraph: 下周
                - cell "评审并确认实施计划":
                  - paragraph: 评审并确认实施计划
                - cell "待开始":
                  - paragraph: 待开始
          - paragraph:
            - emphasis: 从这里开始，写下你的下一步。
        - region "页脚区域"
      - text: 226 字 · A4 · 纵向 缩放 Word 缩放
      - button "Word 缩放 适应宽度": 适应宽度
    - paragraph: 文件保存在当前浏览器的本地文档空间。需要长期留存时，请导出文件。
    - group: 示例代码
  - heading "编辑能力" [level=2]
  - table:
    - rowgroup:
      - row "文档 支持的操作 当前范围":
        - columnheader "文档"
        - columnheader "支持的操作"
        - columnheader "当前范围"
    - rowgroup:
      - row "Word 字体与小数字号输入、正文排版、列表、表格、图片、页眉页脚、页码、查找替换、页面设置、撤销重做；导入与导出 DOCX 支持内嵌图片与单节文档。修订、目录、浮动对象等复杂结构会提示暂不支持。":
        - cell "Word"
        - cell "字体与小数字号输入、正文排版、列表、表格、图片、页眉页脚、页码、查找替换、页面设置、撤销重做；导入与导出 DOCX"
        - cell "支持内嵌图片与单节文档。修订、目录、浮动对象等复杂结构会提示暂不支持。"
      - row "Excel 单元格与矩形选区、字体与小数字号输入、手动与自动行高/列宽、查找替换、边框与垂直对齐、清除格式、公式和跨表引用、格式、复制粘贴、工作表增删、行列插入删除、合并、冻结、排序、筛选、柱状图与折线图；导入与导出 XLSX 10,000 行、256 列、32 张表、100,000 个已使用单元格。透视、宏、数组公式及复杂图表暂不支持。":
        - cell "Excel"
        - cell "单元格与矩形选区、字体与小数字号输入、手动与自动行高/列宽、查找替换、边框与垂直对齐、清除格式、公式和跨表引用、格式、复制粘贴、工作表增删、行列插入删除、合并、冻结、排序、筛选、柱状图与折线图；导入与导出 XLSX"
        - cell "10,000 行、256 列、32 张表、100,000 个已使用单元格。透视、宏、数组公式及复杂图表暂不支持。"
      - row "PDF 分页与缩略图、缩放、旋转、全文查找、文字与高亮、矩形和手写批注、已有表单、撤销重做；导出 PDF 批注和表单编辑。任意原始文字修改、原文重排及扫描件 OCR 暂不支持。":
        - cell "PDF"
        - cell "分页与缩略图、缩放、旋转、全文查找、文字与高亮、矩形和手写批注、已有表单、撤销重做；导出 PDF"
        - cell "批注和表单编辑。任意原始文字修改、原文重排及扫描件 OCR 暂不支持。"
  - heading "组件接入" [level=2]
  - paragraph: UI 组件使用 Tiptap / ProseMirror 和公式计算库；文件适配使用 docx、ExcelJS、pdf-lib 与 PDF.js。本页无需文档服务器。宿主可以替换保存与导入导出回调，接入自己的文件系统。
  - paragraph:
    - text: PDF 的 worker、字体与渲染由
    - code: pdfRenderer
    - text: 提供。本页的适配代码位于
    - code: docs/src/pages/collaboration/office-studio/
    - text: 。组件自 v0.4.0 起随
    - code: "@zuvi/react"
    - text: 和 Registry 发布。
  - region "组件属性表，可横向滚动":
    - table:
      - rowgroup:
        - row "属性名 类型 默认值 说明":
          - columnheader "属性名"
          - columnheader "类型"
          - columnheader "默认值"
          - columnheader "说明"
      - rowgroup:
        - row "value / defaultValue OfficeStudioDocument — 受控文档或非受控初始文档；支持 Word、Excel、PDF 三种模型。":
          - cell "value / defaultValue"
          - cell "OfficeStudioDocument":
            - code: OfficeStudioDocument
          - cell "—":
            - code: —
          - cell "受控文档或非受控初始文档；支持 Word、Excel、PDF 三种模型。"
        - row "onChange (document) => void — 内容或文件名称变化。":
          - cell "onChange"
          - cell "(document) => void":
            - code: (document) => void
          - cell "—":
            - code: —
          - cell "内容或文件名称变化。"
        - row "source / pdfRenderer Blob / StudioPdfRenderer — 原始文件及 PDF 渲染适配；worker 资源由宿主管理。":
          - cell "source / pdfRenderer"
          - cell "Blob / StudioPdfRenderer":
            - code: Blob / StudioPdfRenderer
          - cell "—":
            - code: —
          - cell "原始文件及 PDF 渲染适配；worker 资源由宿主管理。"
        - row "onSave / onExport / onPrint (document) => void | Promise<void> — 宿主处理保存、导出或打印；返回后更新状态，失败可重试。":
          - cell "onSave / onExport / onPrint"
          - cell "(document) => void | Promise<void>":
            - code: (document) => void | Promise<void>
          - cell "—":
            - code: —
          - cell "宿主处理保存、导出或打印；返回后更新状态，失败可重试。"
        - row "onImport / onCreate (file | kind) => void | Promise<void> — 宿主解析文件或创建模型，并更新受控值。":
          - cell "onImport / onCreate"
          - cell "(file | kind) => void | Promise<void>":
            - code: (file | kind) => void | Promise<void>
          - cell "—":
            - code: —
          - cell "宿主解析文件或创建模型，并更新受控值。"
        - row "readOnly / disabled boolean false 只读预览或禁用编辑与文件操作。":
          - cell "readOnly / disabled"
          - cell "boolean":
            - code: boolean
          - cell "false":
            - code: "false"
          - cell "只读预览或禁用编辑与文件操作。"
        - row "saveState 'saved' | 'saving' | 'unsaved' | 'error' — 宿主自动保存状态。":
          - cell "saveState"
          - cell "'saved' | 'saving' | 'unsaved' | 'error'":
            - code: "'saved' | 'saving' | 'unsaved' | 'error'"
          - cell "—":
            - code: —
          - cell "宿主自动保存状态。"
        - row "height number | string 760 编辑器高度；100% 需要父容器设置确定高度。":
          - cell "height"
          - cell "number | string":
            - code: number | string
          - cell "760":
            - code: "760"
          - cell "编辑器高度；100% 需要父容器设置确定高度。"
        - row "fullscreen / onFullscreenChange boolean / (value) => void — 全屏布局，切换时编辑内容保持挂载。":
          - cell "fullscreen / onFullscreenChange"
          - cell "boolean / (value) => void":
            - code: boolean / (value) => void
          - cell "—":
            - code: —
          - cell "全屏布局，切换时编辑内容保持挂载。"
        - row "ref OfficeStudioHandle — getDocument()、save()、export()、print()、setFullscreen()。":
          - cell "ref"
          - cell "OfficeStudioHandle":
            - code: OfficeStudioHandle
          - cell "—":
            - code: —
          - cell "getDocument()、save()、export()、print()、setFullscreen()。"
        - 'row "classNames { root?; header?; title?; actions?; stage?; status?; error? } — 追加语义结构类名，配合 data-part 与 CSS 变量定制。"':
          - cell "classNames"
          - 'cell "{ root?; header?; title?; actions?; stage?; status?; error? }"':
            - code: "{ root?; header?; title?; actions?; stage?; status?; error? }"
          - cell "—":
            - code: —
          - cell "追加语义结构类名，配合 data-part 与 CSS 变量定制。"
```

# Test source

```ts
  1   | import { expect, test, type Page, type Locator } from '@playwright/test';
  2   | import { mkdir, readFile, writeFile } from 'node:fs/promises';
  3   | import path from 'node:path';
  4   | import { createHash } from 'node:crypto';
  5   | import { PDFDocument, PDFName, PDFDict } from '../docs/node_modules/pdf-lib/cjs/index.js';
  6   | import { basicPdf, sevenFields, addLink } from '../docs/tests/studio-pdf-compose-fixtures.mjs';
  7   |
  8   | const audit = path.resolve('docs/audits/2026-11-27/pdf-composition');
  9   | const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
  10  | async function ready(page: Page) {
> 11  |   await expect(page.getByRole('region', { name: 'PDF 页面编辑区', exact: true }).first()).toHaveAttribute('aria-busy', 'false');
      |                                                                                      ^ Error: expect(locator).toHaveAttribute(expected) failed
  12  | }
  13  | async function snapshot(page: Page) {
  14  |   return page.evaluate(async () => {
  15  |     const database = await new Promise<IDBDatabase>((resolve, reject) => {
  16  |       const request = indexedDB.open('zuvi-office-studio', 2); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  17  |     });
  18  |     const id = await new Promise<string>((resolve, reject) => {
  19  |       const request = database.transaction('preferences').objectStore('preferences').get('active'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  20  |     });
  21  |     const file = await new Promise<{ id: string; revision: number; document: { kind: string; pageCount: number; sourcePageCount: number; name: string; pages: { id: string; sourcePage: number }[]; marks: { id: string; page: number }[]; fields: { name: string; value: string | boolean; type: string; readOnly: boolean; widgets?: { page: number }[] }[] }; source: Blob }>((resolve, reject) => {
  22  |       const request = database.transaction('files').objectStore('files').get(id); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  23  |     });
  24  |     database.close();
  25  |     const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await file.source.arrayBuffer()))).map((value) => value.toString(16).padStart(2, '0')).join('');
  26  |     return { id: file.id, revision: file.revision, document: file.document, sourceHash: digest, sourceSize: file.source.size };
  27  |   });
  28  | }
  29  | async function save(page: Page) {
  30  |   await page.getByRole('button', { name: '保存', exact: true }).click();
  31  |   await expect(page.locator('.zuvi-office-studio [data-save-state]').first()).toHaveAttribute('data-save-state', 'saved');
  32  | }
  33  | async function imported(page: Page, bytes: Uint8Array, name: string) {
  34  |   await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name, mimeType: 'application/pdf', buffer: Buffer.from(bytes) }); await ready(page);
  35  | }
  36  | async function exported(page: Page, name: string, scope: Page | Locator = page) {
  37  |   const pending = page.waitForEvent('download'); await scope.getByRole('button', { name: '导出文件', exact: true }).click();
  38  |   const bytes = await readFile((await (await pending).path())!); await writeFile(path.join(audit, name), bytes); return bytes;
  39  | }
  40  | async function merge(page: Page, bytes: Uint8Array, name: string) {
  41  |   await page.getByRole('button', { name: '合并 PDF 文件', exact: true }).click();
  42  |   const dialog = page.getByRole('dialog', { name: '合并 PDF 文件', exact: true });
  43  |   await dialog.getByLabel('选择合并 PDF 文件', { exact: true }).setInputFiles({ name, mimeType: 'application/pdf', buffer: Buffer.from(bytes) });
  44  |   await expect(dialog.getByLabel('加入 PDF 页码', { exact: true })).toHaveValue('1-2'); return dialog;
  45  | }
  46  |
  47  | test('merges native pages and fields with editable marks, paired history, persistence, old-version export and two PDF reopens', async ({ page }) => {
  48  |   test.setTimeout(180000); await mkdir(audit, { recursive: true });
  49  |   const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  50  |   const first = await sevenFields(), second = await basicPdf({ pages: 2, fieldName: 'Text', value: 'Incoming', label: 'INCOMING' });
  51  |   const vendor = first.pdf.getForm().createTextField('Vendor'); vendor.setText('PASSIVE'); vendor.addToPage(first.pages[0], { x: 20, y: 30, width: 150, height: 27, font: first.font }); vendor.enableReadOnly(); vendor.updateAppearances(first.font); vendor.acroField.dict.set(PDFName.of('FT'), PDFName.of('VendorPassive'));
  52  |   addLink(second.pdf, second.pages[0], second.pages[1], { NM: 'incoming-link' });
  53  |   const original = await first.bytes(), incoming = await second.bytes();
  54  |   await writeFile(path.join(audit, 'primary-source.pdf'), original); await writeFile(path.join(audit, 'incoming-source.pdf'), incoming);
  55  |   await page.goto('/#/components/office-studio'); await imported(page, original, 'Primary.pdf');
  56  |   await page.getByLabel('PDF 页面表单 Text', { exact: true }).fill('合并前的中文');
  57  |   await page.getByRole('tab', { name: '批注', exact: true }).click(); await page.getByRole('button', { name: '矩形', exact: true }).click();
  58  |   const paper = page.locator('.zuvi-studio-pdf-paper'); await paper.scrollIntoViewIfNeeded(); const box = await paper.boundingBox();
  59  |   await page.mouse.move(box!.x + 210, box!.y + 330); await page.mouse.down(); await page.mouse.move(box!.x + 260, box!.y + 350, { steps: 4 }); await page.mouse.up();
  60  |   await page.getByRole('tab', { name: '开始', exact: true }).click();
  61  |   await page.getByRole('button', { name: '复制所选页', exact: true }).click();
  62  |   const copy = page.getByRole('dialog', { name: '复制所选 PDF 页面', exact: true }); await copy.getByLabel('PDF 页面插入位置').fill('3'); await copy.getByRole('button', { name: '应用 PDF 页面操作' }).click();
  63  |   await save(page); const before = await snapshot(page); expect(before.document.pageCount).toBe(3); expect(before.document.marks).toHaveLength(2); expect(before.sourceHash).toBe(hash(original));
  64  |   let dialog = await merge(page, incoming, 'Incoming.pdf');
  65  |   await dialog.getByLabel('合并 PDF 插入位置').fill('2'); await dialog.getByLabel('加入 PDF 页码').fill('2,1'); await dialog.getByRole('button', { name: '取消', exact: true }).click();
  66  |   expect(await snapshot(page)).toEqual(before);
  67  |   dialog = await merge(page, incoming, 'Incoming.pdf'); await dialog.getByLabel('合并 PDF 插入位置').fill('2'); await dialog.getByLabel('加入 PDF 页码').fill('2,1'); await dialog.getByRole('button', { name: '应用 PDF 合并', exact: true }).click();
  68  |   await expect(dialog).not.toBeVisible(); await ready(page); await save(page);
  69  |   const combined = await snapshot(page); expect(combined.document.pageCount).toBe(5); expect(combined.document.sourcePageCount).toBe(5); expect(combined.sourceHash).not.toBe(before.sourceHash);
  70  |   expect(combined.document.fields.map((field) => field.name)).toContain('Text__2'); expect(combined.document.fields.find((field) => field.name === 'Vendor')?.readOnly).toBe(true);
  71  |   expect(combined.document.marks.map((mark) => mark.page)).toEqual([0, 4]);
  72  |   await page.getByLabel('PDF 页面表单 Text', { exact: true }).first().fill('After merge');
  73  |   await page.getByRole('button', { name: '撤销', exact: true }).click(); await expect(page.getByLabel('PDF 页面表单 Text', { exact: true }).first()).toHaveValue('合并前的中文'); await save(page);
  74  |   expect((await snapshot(page)).sourceHash).toBe(combined.sourceHash);
  75  |   await page.getByRole('button', { name: '撤销', exact: true }).click(); await ready(page); await save(page);
  76  |   const undone = await snapshot(page); expect(undone.document.pageCount).toBe(3); expect(undone.sourceHash).toBe(before.sourceHash); expect(undone.document.marks).toEqual(before.document.marks);
  77  |   await page.getByRole('button', { name: '重做', exact: true }).click(); await ready(page); await save(page); expect((await snapshot(page)).sourceHash).toBe(combined.sourceHash);
  78  |   await page.reload(); await ready(page); const fresh = await snapshot(page); expect(fresh.document.pageCount).toBe(5); expect(fresh.sourceHash).toBe(combined.sourceHash); expect(fresh.document.marks).toEqual(combined.document.marks);
  79  |   await page.getByRole('button', { name: '历史版本', exact: true }).click(); const history = page.getByRole('dialog', { name: '文档历史版本', exact: true });
  80  |   await history.getByRole('button', { name: new RegExp(`^版本 ${before.revision} ·`) }).click(); await expect(history.getByLabel('PDF 页面表单 Text', { exact: true }).first()).toHaveValue('合并前的中文');
  81  |   const historical = await PDFDocument.load(await exported(page, 'before-composition-history.pdf', history)); expect(historical.getPageCount()).toBe(3); expect(historical.getForm().getTextField('Text').getText()).toBe('合并前的中文'); expect(historical.getForm().getFields().some((field) => field.getName() === 'Text__2')).toBe(false);
  82  |   await history.getByRole('button', { name: '关闭', exact: true }).click();
  83  |   await page.getByRole('button', { name: '页面缩略图', exact: true }).click(); await expect(page.getByRole('button', { name: /PDF 第 \d+ 页缩略图/ })).toHaveCount(5);
  84  |   await page.screenshot({ path: path.join(audit, 'combined-light.png'), fullPage: true, animations: 'disabled' });
  85  |   for (let round = 1; round <= 2; round++) {
  86  |     const bytes = await exported(page, `combined-round-${round}.pdf`), native = await PDFDocument.load(bytes); expect(native.getPageCount()).toBe(5); expect(native.getForm().getTextField('Text').getText()).toBe('合并前的中文'); expect(native.getForm().getTextField('Text__2').getText()).toBe('Incoming'); expect(native.getForm().getTextField('Text').acroField.getWidgets()).toHaveLength(2);
  87  |     const link = native.getPages()[2].node.Annots()!.asArray().map((ref) => native.context.lookup(ref)).find((dict) => dict instanceof PDFDict && dict.lookup(PDFName.of('Subtype')) === PDFName.of('Link')) as PDFDict;
  88  |     expect(link.lookup(PDFName.of('Dest')).get(0).toString()).toBe(native.getPages()[1].ref.toString());
  89  |     await imported(page, bytes, `Reopened-${round}.pdf`); await expect(page.getByLabel('PDF 页面表单 Text', { exact: true }).first()).toHaveValue('合并前的中文');
  90  |   }
  91  |   await writeFile(path.join(audit, 'paired-history-and-refresh.json'), JSON.stringify({ before, combined, undone, fresh, errors }, null, 2) + '\n'); expect(errors).toEqual([]);
  92  | });
  93  |
  94  | test('extracts radio pages with an explicit value policy, native V/DV checks, undo and repeated reopens', async ({ page }) => {
  95  |   test.setTimeout(120000); await mkdir(audit, { recursive: true });
  96  |   const fixture = await basicPdf({ pages: 2, form: false, label: 'RADIO' }), radio = fixture.pdf.getForm().createRadioGroup('Choice'); radio.disableMutualExclusion();
  97  |   radio.addOptionToPage('A', fixture.pages[0], { x: 40, y: 120, width: 20, height: 20 }); radio.addOptionToPage('B', fixture.pages[1], { x: 40, y: 120, width: 20, height: 20 }); radio.select('B'); radio.acroField.dict.set(PDFName.of('DV'), radio.acroField.getWidgets()[0].getOnValue()!);
  98  |   const bytes = await fixture.bytes(); await writeFile(path.join(audit, 'radio-source.pdf'), bytes); await page.goto('/#/components/office-studio'); await imported(page, bytes, 'Radio.pdf'); const before = await snapshot(page);
  99  |   await page.getByRole('button', { name: '提取 PDF 页面', exact: true }).click(); const dialog = page.getByRole('dialog', { name: '提取 PDF 页面', exact: true }); await dialog.getByLabel('提取 PDF 页码').fill('1'); await dialog.getByRole('button', { name: '应用 PDF 提取', exact: true }).click(); await expect(dialog.getByRole('alert')).toContainText('单选值'); expect((await snapshot(page)).sourceHash).toBe(before.sourceHash);
  100 |   const clearing = dialog.getByRole('checkbox', { name: '清除在所选页面中已无控件的单选值', exact: true }); await dialog.locator('label.zuvi-checkbox').filter({ has: clearing }).click(); await expect(clearing).toBeChecked(); await dialog.getByRole('button', { name: '应用 PDF 提取', exact: true }).click(); await expect(dialog).not.toBeVisible(); await ready(page); await save(page);
  101 |   const extracted = await snapshot(page); expect(extracted.document.pageCount).toBe(1); expect(extracted.document.fields[0].value).toBe('');
  102 |   let native = await PDFDocument.load(await exported(page, 'radio-cleared.pdf')), field = native.getForm().getRadioGroup('Choice'); expect(field.getSelected()).toBeUndefined(); expect(field.acroField.dict.lookup(PDFName.of('DV')).toString()).toBe(field.acroField.getWidgets()[0].getOnValue()!.toString());
  103 |   await page.getByRole('button', { name: '撤销', exact: true }).click(); await ready(page); await save(page); expect((await snapshot(page)).sourceHash).toBe(before.sourceHash); expect((await snapshot(page)).document.pageCount).toBe(2);
  104 |   await page.getByRole('button', { name: '重做', exact: true }).click(); await ready(page);
  105 |   const choose = page.getByRole('radio', { name: 'PDF 页面表单 Choice A', exact: true }); await choose.locator('..').click(); await expect(choose).toBeChecked();
  106 |   for (let round = 1; round <= 2; round++) { const output = await exported(page, `radio-round-${round}.pdf`); native = await PDFDocument.load(output); field = native.getForm().getRadioGroup('Choice'); expect(native.getPageCount()).toBe(1); expect(field.getSelected()).toBe('A'); expect(field.acroField.dict.lookup(PDFName.of('DV')).toString()).toBe(field.acroField.getWidgets()[0].getOnValue()!.toString()); await imported(page, output, `Radio-reopened-${round}.pdf`); }
  107 |   await writeFile(path.join(audit, 'radio-policy.json'), JSON.stringify({ before, extracted }, null, 2) + '\n');
  108 | });
  109 |
  110 | test('keeps rejected field conflicts unchanged and verifies the actual merge and extraction dialogs in light, dark and 320px', async ({ page }) => {
  111 |   test.setTimeout(120000); await mkdir(audit, { recursive: true });
```