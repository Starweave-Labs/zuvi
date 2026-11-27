# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-pdf-native-annotations.spec.ts >> P014 saves four text markers from actual original-text selections with exact native quads, alpha, removal and undo
- Location: e2e/office-studio-pdf-native-annotations.spec.ts:336:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('dialog', { name: 'PDF 批注属性', exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('dialog', { name: 'PDF 批注属性', exact: true }) with timeout 5000ms
  - waiting for getByRole('dialog', { name: 'PDF 批注属性', exact: true })

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
      - button "Word 文档排版 · 图片与页眉页脚":
        - strong: Word
        - text: 文档排版 · 图片与页眉页脚
      - button "Excel 行列编辑 · 公式与图表":
        - strong: Excel
        - text: 行列编辑 · 公式与图表
      - button "PDF 全文查找 · 批注与手写" [pressed]:
        - strong: PDF
        - text: 全文查找 · 批注与手写
    - text: 本地文档 打开本地文档
    - button "打开本地文档 Native-original.pdf": Native-original.pdf
    - button "历史版本"
    - switch "只读预览"
    - region "PDF 文档编辑器":
      - status "已保存"
      - textbox "文档名称": Native-original.pdf
      - button "新建"
      - button "导入"
      - button "导出文件"
      - button "打印"
      - button "保存"
      - button "退出全屏" [pressed]
      - button "文件"
      - tablist "PDF 功能区选项卡":
        - tab "开始" [selected]
        - tab "批注"
      - group "PDF 编辑工具栏":
        - group "编辑":
          - button "撤销"
          - button "重做" [disabled]
          - button "选择" [pressed]
          - button "选择文字"
        - tabpanel "开始":
          - group "插入":
            - button "文字"
            - button "矩形"
            - button "新建表单字段"
          - group "页面":
            - button "插入空白页"
            - button "删除所选页"
            - button "移动所选页"
            - button "复制所选页"
            - button "合并 PDF 文件"
            - button "提取 PDF 页面"
            - button "旋转所选页"
            - button "页面尺寸"
            - button "旋转当前页"
            - button "页面"
          - group "查看":
            - button "查找"
            - button "PDF 批注与表单侧栏" [pressed]: 侧栏
      - navigation "PDF 侧边导航":
        - button "PDF 文本查找侧栏"
        - button "PDF 批注侧栏" [pressed]
        - button "PDF 页面缩略图侧栏"
        - button "PDF 表单侧栏"
      - region "PDF 页面编辑区":
        - img "PDF 第 1 页原文"
        - document "PDF 第 1 页原文选择复制": "Native PDF host migration: page 1 Original Contents remain independent from native annotations."
        - region "PDF 批注 Highlight"
        - group "PDF 原生批注交互层":
          - button "PDF 批注 高亮 43339ac2-52d8-4120-90fe-cd99ad99fdbc" [pressed]
        - img "PDF 页面标注"
        - textbox "PDF 页面表单 reviewer": Initial
        - text: 第 1 页 · 100%
      - complementary "PDF 批注与表单":
        - group "PDF 侧栏内容":
          - button "批注 1" [pressed]
          - button "表单 2"
          - button "文本查找"
          - button "页面缩略图"
        - strong: 高亮
        - paragraph: 未填写内容
        - text: 未署名 · 11/27/2026, 6:47:15 AM
        - button "编辑批注属性"
        - strong: 回复（0）
        - textbox "PDF 回复内容"
        - button "回复" [disabled]
        - button "解决讨论"
        - button "删除选中标注"
        - button "新增批注"
        - text: 新批注与回复署名
        - textbox "PDF 批注署名"
        - button "第 1 页 · 高亮 未填写内容" [pressed]:
          - strong: 第 1 页 · 高亮
          - text: 未填写内容
      - group "PDF 状态栏":
        - group "PDF 页面导航":
          - button "PDF 上一页" [disabled]
          - spinbutton "PDF 跳转页": "1"
          - button "增加"
          - button "减少" [disabled]
          - text: / 2
          - button "PDF 下一页"
        - text: 选择工具
        - group "PDF 视图缩放":
          - button "PDF 缩小视图"
          - text: PDF 缩放
          - button "PDF 缩放 100%": 100%
          - button "PDF 放大视图"
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
- dialog "高亮属性":
  - heading "高亮属性" [level=2]
  - button "关闭 PDF 批注属性"
  - text: 批注内容
  - textbox "PDF 批注内容"
  - text: 横坐标
  - textbox "PDF 批注横坐标": "41.553813442371585"
  - text: "-14400–14400 纵坐标"
  - textbox "PDF 批注纵坐标": "661.688"
  - text: "-14400–14400 宽度"
  - textbox "PDF 批注宽度": "83.57961461794025"
  - text: 0.01–14400 高度
  - textbox "PDF 批注高度": "14.800000000000068"
  - text: 0.01–14400 线条颜色
  - button "PDF 批注线条或背景颜色": "#f5c542"
  - checkbox "无颜色"
  - text: 无颜色 填充
  - button "PDF 批注填充颜色" [disabled]: "#000000"
  - checkbox "无填充" [checked]
  - text: 无填充 不透明度百分比
  - textbox "PDF 批注不透明度百分比": "30"
  - text: 0–100 线宽
  - textbox "PDF 批注线宽": "1"
  - text: 0–72 线型 PDF 批注线型
  - button "PDF 批注线型 实线": 实线
  - button "取消"
  - button "应用批注属性"
```

# Test source

```ts
  73  |         opacity: alpha instanceof PDFNumber ? alpha.asNumber() : 1,
  74  |         border: border instanceof PDFDict ? { width: numbersAsScalar(border, 'W'), style: decoded(border, 'S') } : undefined,
  75  |         appearanceSha256: normal instanceof PDFRawStream ? sha(normal.getContents()) : undefined,
  76  |         replyTo: reply instanceof PDFRef ? annotations.find(parent => parent.ref.toString() === reply.toString())?.id : undefined,
  77  |         replyType: decoded(item.dict, 'RT'), state: decoded(item.dict, 'State'), stateModel: decoded(item.dict, 'StateModel'),
  78  |       };
  79  |     }),
  80  |     fields: pdf.getForm().getFields().map(field => ({ name: field.getName(), readOnly: field.isReadOnly(), widgets: field.acroField.getWidgets().length })),
  81  |   };
  82  | }
  83  | function numbersAsScalar(dict: PDFDict, key: string): number | undefined {
  84  |   const value = dict.lookup(PDFName.of(key));
  85  |   return value instanceof PDFNumber ? value.asNumber() : undefined;
  86  | }
  87  | 
  88  | async function waitReady(page: Page) {
  89  |   await expect(page.locator('.zuvi-studio-pdf-paper > canvas').first()).toBeVisible();
  90  |   await expect(page.getByLabel('PDF 批注署名', { exact: true })).toBeEnabled();
  91  | }
  92  | async function waitSaved(page: Page) {
  93  |   await expect(page.locator('[data-save-state="saved"]')).toBeVisible();
  94  | }
  95  | async function activeRecord(page: Page) {
  96  |   await waitSaved(page);
  97  |   return page.evaluate(async () => {
  98  |     const modulePath = '/src/pages/collaboration/office-studio/studio-storage.ts';
  99  |     const module = await import(modulePath) as typeof import('../docs/src/pages/collaboration/office-studio/studio-storage');
  100 |     const storage = module.createStudioStorage(), id = await storage.activeId();
  101 |     const file = id ? await storage.load(id) : undefined;
  102 |     if (!file || !file.source || file.document.kind !== 'pdf') throw new Error('Active persisted PDF pair is missing');
  103 |     const hash = await crypto.subtle.digest('SHA-256', await file.source.arrayBuffer());
  104 |     return { revision: file.revision, document: file.document,
  105 |       sourceHash: [...new Uint8Array(hash)].map(value => value.toString(16).padStart(2, '0')).join('') };
  106 |   });
  107 | }
  108 | async function open(page: Page, name = 'original.pdf', fullscreen = true, input?: Uint8Array) {
  109 |   await mkdir(audit, { recursive: true });
  110 |   const bytes = input ? Buffer.from(input) : await readFile(path.join(hostEvidence, name));
  111 |   await writeFile(path.join(audit, 'fixture-' + name), bytes);
  112 |   await page.setViewportSize({ width: 1440, height: 1100 });
  113 |   await page.goto('/#/components/office-studio');
  114 |   await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name: 'Native-' + name, mimeType: 'application/pdf', buffer: bytes });
  115 |   await waitReady(page);
  116 |   if (fullscreen) await page.getByRole('button', { name: '全屏编辑', exact: true }).click();
  117 |   await waitReady(page);
  118 |   return bytes;
  119 | }
  120 | async function lockedAndNoApFixture() {
  121 |   const pdf = await PDFDocument.load(await readFile(path.join(hostEvidence, 'native-twelve-types.pdf')));
  122 |   const paper = pdf.getPages()[0], square = annots(pdf).find(item => item.subtype === 'Square')!;
  123 |   const locked = pdf.context.register(pdf.context.obj({ Type: 'Annot', Subtype: 'Square', P: paper.ref,
  124 |     Rect: [315, 425, 445, 465], F: 4 | 64, C: [0.1, 0.2, 0.3],
  125 |     AP: square.dict.get(PDFName.of('AP')), Contents: PDFHexString.fromText('Source locked square'),
  126 |     ZuviAnnotationId: PDFHexString.fromText('native-ui-locked-square'), NM: PDFHexString.fromText('native-ui-locked-square') }));
  127 |   paper.node.addAnnot(locked);
  128 |   const note = pdf.context.register(pdf.context.obj({ Type: 'Annot', Subtype: 'Text', P: paper.ref,
  129 |     Rect: [430, 520, 430, 520], F: 4, Name: 'Note', Contents: PDFHexString.fromText('Source zero-rect no-AP note'),
  130 |     ZuviAnnotationId: PDFHexString.fromText('native-ui-noap-note'), NM: PDFHexString.fromText('native-ui-noap-note') }));
  131 |   paper.node.addAnnot(note);
  132 |   return new Uint8Array(await pdf.save({ updateFieldAppearances: false, useObjectStreams: false }));
  133 | }
  134 | async function nativeIds(page: Page) {
  135 |   return page.locator('.zuvi-studio-pdf-native-hit').evaluateAll(elements => elements.map(element => element.getAttribute('data-native-id')!));
  136 | }
  137 | function hit(page: Page, id: string): Locator {
  138 |   return page.locator(`.zuvi-studio-pdf-native-hit[data-native-id="${id}"]`);
  139 | }
  140 | async function choose(page: Page, tool: Tool) {
  141 |   await waitReady(page);
  142 |   const select = page.getByRole('button', { name: /^PDF 新增批注类型/ });
  143 |   if (!(await select.count())) await page.getByRole('button', { name: '新增批注', exact: true }).click();
  144 |   await select.click();
  145 |   await page.getByRole('option', { name: labels[tool], exact: true }).click();
  146 | }
  147 | async function point(page: Page, x: number, y: number) {
  148 |   const paper = page.locator('.zuvi-studio-pdf-paper');
  149 |   const box = await paper.boundingBox();
  150 |   if (!box) throw new Error('Native paper has no rendered bounds');
  151 |   return { x: box.x + x * box.width / 500, y: box.y + (700 - y) * box.height / 700 };
  152 | }
  153 | async function create(page: Page, tool: Tool, points: readonly (readonly [number, number])[], contents = '') {
  154 |   const previous = await nativeIds(page);
  155 |   await choose(page, tool);
  156 |   await page.getByLabel('PDF 新增文字', { exact: true }).fill(contents);
  157 |   const first = await point(page, points[0][0], points[0][1]);
  158 |   await page.mouse.move(first.x, first.y); await page.mouse.down();
  159 |   for (const [x, y] of points.slice(1)) {
  160 |     const target = await point(page, x, y); await page.mouse.move(target.x, target.y, { steps: 4 });
  161 |   }
  162 |   await page.mouse.up();
  163 |   await expect.poll(async () => (await nativeIds(page)).length).toBe(previous.length + 1);
  164 |   await waitReady(page);
  165 |   const added = (await nativeIds(page)).find(id => !previous.includes(id));
  166 |   if (!added) throw new Error('No accepted native annotation identity');
  167 |   return added;
  168 | }
  169 | async function properties(page: Page, id: string) {
  170 |   await hit(page, id).click();
  171 |   await page.getByRole('button', { name: '编辑批注属性', exact: true }).click();
  172 |   const dialog = page.getByRole('dialog', { name: 'PDF 批注属性', exact: true });
> 173 |   await expect(dialog).toBeVisible();
      |                        ^ Error: expect(locator).toBeVisible() failed
  174 |   return dialog;
  175 | }
  176 | async function selectValue(page: Page, scope: Locator, label: string, option: string) {
  177 |   await scope.getByRole('button', { name: new RegExp('^' + label) }).click();
  178 |   await page.getByRole('option', { name: option, exact: true }).click();
  179 | }
  180 | async function color(page: Page, scope: Locator, label: string, value: string) {
  181 |   await scope.getByRole('button', { name: label, exact: true }).click();
  182 |   const input = page.locator('.zuvi-color-picker-panel input[data-part="hex"]');
  183 |   await input.fill(value); await input.press('Enter'); await input.press('Escape');
  184 | }
  185 | async function saveProperties(page: Page, dialog: Locator) {
  186 |   await dialog.getByRole('button', { name: '应用批注属性', exact: true }).click();
  187 |   await expect(dialog).toHaveCount(0); await waitReady(page);
  188 | }
  189 | async function exported(page: Page, name: string) {
  190 |   const pending = page.waitForEvent('download');
  191 |   await page.getByRole('button', { name: '导出文件', exact: true }).click();
  192 |   const download = await pending, file = await download.path();
  193 |   if (!file) throw new Error('Native PDF download has no bytes');
  194 |   const bytes = await readFile(file); await writeFile(path.join(audit, name), bytes);
  195 |   await writeFile(path.join(audit, name.replace(/\.pdf$/, '.json')), JSON.stringify(await inspect(bytes), null, 2));
  196 |   return bytes;
  197 | }
  198 | async function reopenTwice(page: Page, prefix: string, original: Uint8Array, verify: (pdf: PDFDocument, round: number) => Promise<void> | void) {
  199 |   const originalHashes = contentRecords(await PDFDocument.load(original)).map(item => item.sha256);
  200 |   let bytes: Uint8Array = original;
  201 |   for (let round = 1; round <= 2; round++) {
  202 |     bytes = await exported(page, `${prefix}-round-${round}.pdf`);
  203 |     const pdf = await PDFDocument.load(bytes), hashes = contentRecords(pdf).map(item => item.sha256);
  204 |     for (const hash of originalHashes) expect(hashes).toContain(hash);
  205 |     for (const hash of hashes) expect(originalHashes).toContain(hash);
  206 |     await verify(pdf, round);
  207 |     await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name: `${prefix}-round-${round}.pdf`, mimeType: 'application/pdf', buffer: Buffer.from(bytes) });
  208 |     await waitReady(page);
  209 |   }
  210 |   return bytes;
  211 | }
  212 | async function persistFixture(page: Page, kind: 'legacy' | 'recipe') {
  213 |   await mkdir(audit, { recursive: true });
  214 |   const bytes = await readFile(path.join(hostEvidence, 'original.pdf'));
  215 |   await page.goto('/');
  216 |   const document = await page.evaluate(async ({ bytes, kind }) => {
  217 |     const codecPath = '/src/pages/collaboration/office-studio/studio-pdf-codec.ts';
  218 |     const storagePath = '/src/pages/collaboration/office-studio/studio-storage.ts';
  219 |     const codec = await import(codecPath) as typeof import('../docs/src/pages/collaboration/office-studio/studio-pdf-codec');
  220 |     const storageModule = await import(storagePath) as typeof import('../docs/src/pages/collaboration/office-studio/studio-storage');
  221 |     const source = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
  222 |     let document = await codec.importStudioPdf(source, `Persisted-${kind}.pdf`, { native: false });
  223 |     if (kind === 'legacy') {
  224 |       document = { ...document, marks: [
  225 |         { id: 'legacy-ui-text', type: 'text', page: 0, x: 45, y: 570, size: 14, color: '#253044', text: '旧中文批注继续编辑', replies: [{ id: 'legacy-ui-reply', text: '旧回复保留一次' }] },
  226 |         { id: 'legacy-ui-highlight', type: 'highlight', page: 0, x: 45, y: 520, width: 250, height: 18, size: 12, text: 'Old highlight', color: '#f5c542' },
  227 |         { id: 'legacy-ui-square', type: 'rectangle', page: 0, x: 45, y: 430, width: 180, height: 45, size: 12, text: 'Old square', color: '#253044', lineWidth: 2 },
  228 |         { id: 'legacy-ui-ink', type: 'ink', page: 0, x: 270, y: 420, width: 140, height: 50, size: 12, text: 'Old ink', color: '#253044', lineWidth: 2, points: [[0, 10], [45, 45], [90, 0], [140, 40]] },
  229 |       ] };
  230 |     } else {
  231 |       const workspacePath = '/src/pages/collaboration/office-studio/studio-pdf-native/workspace.ts';
  232 |       const documentPath = '/src/pages/collaboration/office-studio/studio-pdf-native-document.ts';
  233 |       const native = await import(workspacePath) as typeof import('../docs/src/pages/collaboration/office-studio/studio-pdf-native/workspace');
  234 |       const helpers = await import(documentPath) as typeof import('../docs/src/pages/collaboration/office-studio/studio-pdf-native-document');
  235 |       let workspace = await native.NativePdfWorkspace.read(new Uint8Array(bytes), document.pages!.map(page => page.id));
  236 |       const now = new Date().toISOString();
  237 |       workspace = workspace.accept({ type: 'create', now, annotation: {
  238 |         id: 'recipe-ui-main', pageId: document.pages![0].id, kind: 'freeText', rect: [45, 430, 330, 480],
  239 |         contents: '未保存记录原生中文', font: { family: 'Noto Sans SC', size: 16, color: [0.1, 0.2, 0.3] },
  240 |       } });
  241 |       const targets = [
  242 |         { id: document.pages![1].id, fromPageId: document.pages![1].id },
  243 |         { id: 'recipe-ui-copy', fromPageId: document.pages![0].id, copyGroup: 'recipe-ui-copy-group' },
  244 |         { id: document.pages![0].id, fromPageId: document.pages![0].id },
  245 |       ];
  246 |       workspace = workspace.layout(targets);
  247 |       const copied = workspace.snapshot().annotations.find(item => item.originId === 'recipe-ui-main' && item.pageId === 'recipe-ui-copy');
  248 |       if (!copied) throw new Error('Recipe copy is missing');
  249 |       workspace = workspace.accept({ type: 'update', id: copied.id, patch: { kind: 'freeText', contents: '复制记录有独立中文' }, now });
  250 |       const mapped = helpers.remapNativePdfFields(document, targets);
  251 |       document = helpers.withNativePdfState({ ...document, ...mapped, rotations: { '1': 90 },
  252 |         fields: mapped.fields.map(field => field.name === 'reviewer' ? { ...field, value: 'Recipe current field' } : field) }, workspace);
  253 |     }
  254 |     const storage = storageModule.createStudioStorage();
  255 |     await storage.commit({ id: document.id, document, source, revision: 1, savedAt: Date.now() }, 0);
  256 |     await storage.select(document.id);
  257 |     return document;
  258 |   }, { bytes: [...bytes], kind });
  259 |   await writeFile(path.join(audit, `fixture-${kind}-source.pdf`), bytes);
  260 |   await writeFile(path.join(audit, `fixture-${kind}-model.json`), JSON.stringify(document, null, 2));
  261 |   await page.setViewportSize({ width: 1440, height: 1100 });
  262 |   await page.goto('/#/components/office-studio'); await waitReady(page);
  263 |   await page.getByRole('button', { name: '全屏编辑', exact: true }).click();
  264 |   return { bytes, document };
  265 | }
  266 | 
  267 | test.beforeEach(async ({ page }) => {
  268 |   const errors: string[] = [];
  269 |   page.on('pageerror', error => errors.push(error.message));
  270 |   await page.exposeFunction('nativeBrowserErrors', () => errors);
  271 | });
  272 | test.afterEach(async ({ page }, info) => {
  273 |   const errors = await page.evaluate(async () => {
```