# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-pdf-native-annotations.spec.ts >> P015 reads native notes, writes authored IRT replies and resolve/reopen state, and deletes replies/parents transactionally
- Location: e2e/office-studio-pdf-native-annotations.spec.ts:516:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('第二条原生回复', { exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('第二条原生回复', { exact: true }) with timeout 5000ms
  - waiting for getByText('第二条原生回复', { exact: true })

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
    - button "打开本地文档 Native-native-twelve-types.pdf": Native-native-twelve-types.pdf
    - button "历史版本"
    - switch "只读预览"
    - region "PDF 文档编辑器":
      - status "已保存"
      - textbox "文档名称": Native-native-twelve-types.pdf
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
          - button "重做"
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
        - region "PDF 批注 浏览器新增便签":
          - img "PDF 便利贴"
        - region "PDF 批注 中文自由文本：原生迁入后保留": 中文自由文本：原生迁入后保留
        - region "PDF 批注 Native note with IRT discussion":
          - img "PDF 便利贴"
        - region "PDF 批注 Native single-layer highlight"
        - region "PDF 批注 Underline"
        - region "PDF 批注 StrikeOut"
        - region "PDF 批注 Squiggly"
        - region "PDF 批注 Native Square"
        - region "PDF 批注 Native Ink"
        - region "PDF 批注 Line"
        - region "PDF 批注 Circle"
        - region "PDF 批注 Polygon"
        - region "PDF 批注 PolyLine"
        - group "PDF 原生批注交互层":
          - button "PDF 批注 文字 中文自由文本：原生迁入后保留"
          - button "PDF 批注 高亮 Native single-layer highlight"
          - button "PDF 批注 矩形 Native Square"
          - button "PDF 批注 墨迹 Native Ink"
          - button "PDF 批注 便签 Native note with IRT discussion"
          - button "PDF 批注 下划线 native-underline"
          - button "PDF 批注 删除线 native-strikeout"
          - button "PDF 批注 波浪线 native-squiggly"
          - button "PDF 批注 椭圆 native-circle"
          - button "PDF 批注 直线 native-line"
          - button "PDF 批注 多边形 native-polygon"
          - button "PDF 批注 折线 native-polyline"
          - button "PDF 批注 便签 浏览器新增便签"
        - img "PDF 页面标注"
        - textbox "PDF 页面表单 reviewer": Accepted fields and annotations
        - text: 第 1 页 · 100%
      - complementary "PDF 批注与表单":
        - group "PDF 侧栏内容":
          - button "批注 13" [pressed]
          - button "表单 2"
          - button "文本查找"
          - button "页面缩略图"
        - strong: 添加文字批注
        - text: 类型 PDF 新增批注类型
        - button "PDF 新增批注类型 文字": 文字
        - text: 文字或说明
        - textbox "PDF 新增文字": 浏览器新增便签
        - text: 字体 PDF 新增批注字体
        - button "PDF 新增批注字体 Noto Sans SC": Noto Sans SC
        - text: 字号
        - textbox "PDF 文字字号": "16"
        - text: 线宽
        - textbox "PDF 绘图线宽": "2"
        - text: 文字与线条颜色
        - button "PDF 标注颜色": "#253044"
        - text: 文字标记颜色
        - button "PDF 文字标记颜色": "#f5c542"
        - paragraph: 文字或便签点击页面放置；图形按住拖动，墨迹和多边形沿指针轨迹绘制。选中批注后可用方向键移动，Enter 编辑属性。
        - text: 新批注与回复署名
        - textbox "PDF 批注署名": 原生浏览器审阅者
        - button "第 1 页 · 文字 中文自由文本：原生迁入后保留":
          - strong: 第 1 页 · 文字
          - text: 中文自由文本：原生迁入后保留
        - button "第 1 页 · 高亮 Native single-layer highlight":
          - strong: 第 1 页 · 高亮
          - text: Native single-layer highlight
        - button "第 1 页 · 矩形 Native Square":
          - strong: 第 1 页 · 矩形
          - text: Native Square
        - button "第 1 页 · 墨迹 Native Ink":
          - strong: 第 1 页 · 墨迹
          - text: Native Ink
        - button "第 1 页 · 便签 Native note with IRT discussion":
          - strong: 第 1 页 · 便签
          - text: Native note with IRT discussion
        - button "第 1 页 · 下划线 未填写内容":
          - strong: 第 1 页 · 下划线
          - text: 未填写内容
        - button "第 1 页 · 删除线 未填写内容":
          - strong: 第 1 页 · 删除线
          - text: 未填写内容
        - button "第 1 页 · 波浪线 未填写内容":
          - strong: 第 1 页 · 波浪线
          - text: 未填写内容
        - button "第 1 页 · 椭圆 未填写内容":
          - strong: 第 1 页 · 椭圆
          - text: 未填写内容
        - button "第 1 页 · 直线 未填写内容":
          - strong: 第 1 页 · 直线
          - text: 未填写内容
        - button "第 1 页 · 多边形 未填写内容":
          - strong: 第 1 页 · 多边形
          - text: 未填写内容
        - button "第 1 页 · 折线 未填写内容":
          - strong: 第 1 页 · 折线
          - text: 未填写内容
        - button "第 1 页 · 便签 浏览器新增便签":
          - strong: 第 1 页 · 便签
          - text: 浏览器新增便签
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
```

# Test source

```ts
  445 |   await dialog.getByLabel('PDF 批注宽度').fill('160'); await dialog.getByLabel('PDF 批注高度').fill('70'); await saveProperties(page, dialog);
  446 |   for (const tool of ['line', 'arrow'] as const) {
  447 |     dialog = await properties(page, ids.get(tool)!);
  448 |     await selectValue(page, dialog, 'PDF 批注起点形状', '圆形');
  449 |     await selectValue(page, dialog, 'PDF 批注终点形状', '实心箭头'); await saveProperties(page, dialog);
  450 |   }
  451 |   dialog = await properties(page, ids.get('polygon')!);
  452 |   await dialog.getByLabel('PDF 批注顶点坐标').fill('55, 340\n110, 390\n175, 345'); await saveProperties(page, dialog);
  453 |   dialog = await properties(page, ids.get('polyLine')!);
  454 |   await dialog.getByLabel('PDF 批注顶点坐标').fill('270, 340\n290, 380\n330, 345\n385, 375');
  455 |   await selectValue(page, dialog, 'PDF 批注终点形状', '空心箭头'); await saveProperties(page, dialog);
  456 |   dialog = await properties(page, ids.get('ink')!);
  457 |   const inkWidth = Number(await dialog.getByLabel('PDF 批注宽度').inputValue());
  458 |   await dialog.getByLabel('PDF 批注宽度').fill(String(inkWidth + 20)); await saveProperties(page, dialog);
  459 |   await reopenTwice(page, 'p016-geometry', original, pdf => {
  460 |     const records = annots(pdf);
  461 |     expect([...new Set(records.filter(item => item.subtype !== 'Widget').map(item => item.subtype))].sort()).toEqual(['Circle', 'Ink', 'Line', 'PolyLine', 'Polygon', 'Square']);
  462 |     for (const id of ids.values()) expect(records.find(item => item.id === id)?.dict.lookup(PDFName.of('AP'))).toBeInstanceOf(PDFDict);
  463 |     const square = records.find(item => item.id === ids.get('square'))!;
  464 |     expect(numbers(square.dict, 'IC')).toEqual([170 / 255, 221 / 255, 1]); expect(numbersAsScalar(square.dict, 'CA')).toBe(0.6);
  465 |     expect(decoded(square.dict.lookup(PDFName.of('BS')) as PDFDict, 'S')).toBe('D');
  466 |     for (const tool of ['line', 'arrow'] as const) {
  467 |       const ends = records.find(item => item.id === ids.get(tool))!.dict.lookup(PDFName.of('LE')) as PDFArray;
  468 |       expect(ends.asArray().map(value => value.toString())).toEqual(['/Circle', '/ClosedArrow']);
  469 |     }
  470 |     expect(numbers(records.find(item => item.id === ids.get('polygon'))!.dict, 'Vertices')).toEqual([55, 340, 110, 390, 175, 345]);
  471 |     const ink = records.find(item => item.id === ids.get('ink'))!.dict.lookup(PDFName.of('InkList')) as PDFArray;
  472 |     expect((pdf.context.lookup(ink.asArray()[0]) as PDFArray).size()).toBeGreaterThanOrEqual(8);
  473 |   });
  474 |   await writeFile(path.join(audit, 'p016-created-ids.json'), JSON.stringify(Object.fromEntries(ids), null, 2));
  475 |   await page.screenshot({ path: path.join(audit, 'p016-geometry.png'), fullPage: true, animations: 'disabled' });
  476 | });
  477 | 
  478 | test('P012/P016 moving and resizing show ghosts, cancel without history and accept one undoable pointer transaction', async ({ page }) => {
  479 |   test.setTimeout(180000);
  480 |   const original = await open(page, 'native-twelve-types.pdf');
  481 |   const id = await page.locator('.zuvi-studio-pdf-native-hit[data-native-kind="square"]').first().getAttribute('data-native-id');
  482 |   if (!id) throw new Error('Native source square is missing');
  483 |   await expect(page.getByRole('button', { name: '撤销', exact: true })).toBeDisabled();
  484 |   const before = await activeRecord(page), box = await hit(page, id).boundingBox(); if (!box) throw new Error('Native source hit bounds are missing');
  485 |   await hit(page, id).focus(); await page.mouse.move(box.x + 15, box.y + 15); await page.mouse.down();
  486 |   await page.mouse.move(box.x + 45, box.y + 25, { steps: 8 });
  487 |   await expect(page.locator('.zuvi-studio-pdf-native-preview rect[stroke-dasharray]')).toBeVisible();
  488 |   await expect(page.getByRole('button', { name: '撤销', exact: true })).toBeDisabled();
  489 |   await page.keyboard.press('Escape'); await page.mouse.up();
  490 |   await expect(page.locator('.zuvi-studio-pdf-native-preview rect[stroke-dasharray]')).toHaveCount(0);
  491 |   expect((await activeRecord(page)).sourceHash).toBe(before.sourceHash);
  492 |   await page.mouse.move(box.x + 15, box.y + 15); await page.mouse.down();
  493 |   await page.mouse.move(box.x + 45, box.y + 25, { steps: 8 }); await page.mouse.up(); await waitReady(page);
  494 |   let dialog = await properties(page, id);
  495 |   const movedX = Number(await dialog.getByLabel('PDF 批注横坐标').inputValue()), movedY = Number(await dialog.getByLabel('PDF 批注纵坐标').inputValue());
  496 |   const old = before.document.marks.find(item => item.nativeId === id)!;
  497 |   expect(movedX).toBeCloseTo(old.x + 30, 1); expect(movedY).toBeCloseTo(old.y - 10, 1);
  498 |   await dialog.getByRole('button', { name: '取消', exact: true }).click();
  499 |   await page.getByRole('button', { name: '撤销', exact: true }).click(); await waitReady(page);
  500 |   expect((await activeRecord(page)).sourceHash).toBe(before.sourceHash);
  501 |   await expect(page.getByRole('button', { name: '撤销', exact: true })).toBeDisabled();
  502 |   await page.getByRole('button', { name: '重做', exact: true }).click(); await waitReady(page);
  503 |   await hit(page, id).focus(); await hit(page, id).press('Shift+ArrowRight'); await waitReady(page);
  504 |   dialog = await properties(page, id); await expect(dialog.getByLabel('PDF 批注横坐标')).toHaveValue(String(movedX + 10));
  505 |   await dialog.getByRole('button', { name: '取消', exact: true }).click();
  506 |   await hit(page, id).click();
  507 |   const resize = hit(page, id).locator('.zuvi-studio-pdf-native-resize'), handle = await resize.boundingBox(); if (!handle) throw new Error('Resize handle is missing');
  508 |   await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2); await page.mouse.down();
  509 |   await page.mouse.move(handle.x + handle.width / 2 + 20, handle.y + handle.height / 2 + 10, { steps: 6 }); await page.mouse.up(); await waitReady(page);
  510 |   dialog = await properties(page, id); await expect(dialog.getByLabel('PDF 批注宽度')).toHaveValue(String(old.width! + 20));
  511 |   await expect(dialog.getByLabel('PDF 批注高度')).toHaveValue(String(old.height! + 10));
  512 |   await dialog.getByRole('button', { name: '取消', exact: true }).click();
  513 |   await reopenTwice(page, 'gesture-history', original, pdf => expect(annots(pdf).find(item => item.id === id)?.rect).toEqual([movedX + 10, movedY - 10, movedX + 10 + old.width! + 20, movedY + old.height!]));
  514 | });
  515 | 
  516 | test('P015 reads native notes, writes authored IRT replies and resolve/reopen state, and deletes replies/parents transactionally', async ({ page }) => {
  517 |   test.setTimeout(180000);
  518 |   const original = await open(page, 'native-twelve-types.pdf'), id = 'native-note';
  519 |   const originalAnnotations = annots(await PDFDocument.load(original));
  520 |   const originalParent = originalAnnotations.find(item => item.id === id)!;
  521 |   const originalReplyCount = originalAnnotations.filter(item => item.dict.get(PDFName.of('IRT'))?.toString() === originalParent.ref.toString() && decoded(item.dict, 'RT') === 'R').length;
  522 |   await page.getByLabel('PDF 批注署名', { exact: true }).fill('原生浏览器审阅者');
  523 |   const createdNote = await create(page, 'note', [[435, 650]], '浏览器新增便签');
  524 |   const noteProperties = await properties(page, createdNote);
  525 |   await noteProperties.getByLabel('PDF 批注横坐标').fill('425');
  526 |   await noteProperties.getByLabel('PDF 批注纵坐标').fill('605');
  527 |   await noteProperties.getByLabel('PDF 批注不透明度百分比').fill('80');
  528 |   await saveProperties(page, noteProperties);
  529 |   await hit(page, id).click(); await expect(page.getByText('Native note with IRT discussion', { exact: true }).first()).toBeVisible();
  530 |   await page.getByLabel('PDF 回复内容', { exact: true }).fill('第一条原生回复'); await page.getByRole('button', { name: '回复', exact: true }).click(); await waitReady(page);
  531 |   await page.getByLabel('PDF 回复内容', { exact: true }).fill('第二条原生回复'); await page.getByRole('button', { name: '回复', exact: true }).click(); await waitReady(page);
  532 |   await page.getByRole('button', { name: '解决讨论', exact: true }).click(); await waitReady(page);
  533 |   await expect(page.getByText(`回复（${originalReplyCount + 2}） · 已解决`, { exact: true })).toBeVisible();
  534 |   const resolved = await exported(page, 'p015-resolved.pdf');
  535 |   const resolvedInfo = await inspect(resolved);
  536 |   expect(resolvedInfo.annotations.some(item => item.replyTo === id && item.state === 'Completed' && item.stateModel === 'Review')).toBe(true);
  537 |   for (const text of ['第一条原生回复', '第二条原生回复']) {
  538 |     const reply = resolvedInfo.annotations.find(item => item.contents === text)!;
  539 |     expect(reply.replyTo).toBe(id); expect(reply.replyType).toBe('R'); expect(reply.author).toBe('原生浏览器审阅者'); expect(reply.created).toMatch(/^D:\d{14}Z$/);
  540 |   }
  541 |   await page.getByRole('button', { name: '重新打开讨论', exact: true }).click(); await waitReady(page);
  542 |   await page.getByRole('button', { name: '删除回复 第二条原生回复', exact: true }).click(); await waitReady(page);
  543 |   await expect(page.getByText('第二条原生回复', { exact: true })).toHaveCount(0);
  544 |   await page.getByRole('button', { name: '撤销', exact: true }).click(); await waitReady(page);
> 545 |   await expect(page.getByText('第二条原生回复', { exact: true })).toBeVisible();
      |                                                            ^ Error: expect(locator).toBeVisible() failed
  546 |   await page.getByRole('button', { name: '删除选中标注', exact: true }).click(); await expect(hit(page, id)).toHaveCount(0); await waitReady(page);
  547 |   const deleted = await exported(page, 'p015-parent-deleted.pdf');
  548 |   expect((await inspect(deleted)).annotations.some(item => item.id === id || item.replyTo === id)).toBe(false);
  549 |   await page.getByRole('button', { name: '撤销', exact: true }).click(); await waitReady(page);
  550 |   await reopenTwice(page, 'p015-discussion', original, pdf => {
  551 |     const records = annots(pdf), parent = records.find(item => item.id === id)!;
  552 |     expect(parent.subtype).toBe('Text');
  553 |     const created = records.find(item => item.id === createdNote)!;
  554 |     expect(created.subtype).toBe('Text'); expect(created.contents).toBe('浏览器新增便签');
  555 |     expect(decoded(created.dict, 'T')).toBe('原生浏览器审阅者');
  556 |     expect(created.rect).toEqual([425, 605, 447, 627]); expect(numbersAsScalar(created.dict, 'CA')).toBe(0.8);
  557 |     for (const text of ['第一条原生回复', '第二条原生回复']) {
  558 |       const reply = records.find(item => item.contents === text)!; expect(reply.dict.get(PDFName.of('IRT'))?.toString()).toBe(parent.ref.toString());
  559 |       expect(decoded(reply.dict, 'T')).toBe('原生浏览器审阅者');
  560 |     }
  561 |   });
  562 | });
  563 | 
  564 | test('legacy four-kind persisted documents migrate through the actual entry once and undo restores the original pair', async ({ page }) => {
  565 |   test.setTimeout(180000);
  566 |   const { bytes, document } = await persistFixture(page, 'legacy');
  567 |   await expect(page.getByRole('button', { name: '保留旧批注编辑能力', exact: true })).toBeEnabled();
  568 |   await page.getByRole('button', { name: '保留旧批注编辑能力', exact: true }).click(); await waitReady(page);
  569 |   await expect(page.getByRole('button', { name: '保留旧批注编辑能力', exact: true })).toHaveCount(0);
  570 |   let current = await activeRecord(page);
  571 |   expect(current.document.marks.filter(mark => mark.nativeId)).toHaveLength(4); expect(current.document.nativeAnnotations?.commands).toEqual([]);
  572 |   await page.getByRole('button', { name: '撤销', exact: true }).click(); await waitReady(page);
  573 |   current = await activeRecord(page); expect(current.sourceHash).toBe(sha(bytes)); expect(current.document.marks).toEqual(document.marks);
  574 |   await page.getByRole('button', { name: '重做', exact: true }).click(); await waitReady(page);
  575 |   let identities: string[] | undefined, creation: string[] | undefined;
  576 |   await reopenTwice(page, 'legacy-migration', bytes, pdf => {
  577 |     const records = annots(pdf).filter(item => item.subtype !== 'Widget');
  578 |     const ids = records.map(item => item.id).sort(), dates = records.map(item => decoded(item.dict, 'CreationDate')).sort();
  579 |     identities ??= ids; creation ??= dates; expect(ids).toEqual(identities); expect(dates).toEqual(creation);
  580 |     expect(records.filter(item => item.subtype === 'FreeText')).toHaveLength(1);
  581 |     expect(records.filter(item => decoded(item.dict, 'RT') === 'R')).toHaveLength(1);
  582 |     expect(records.find(item => item.contents === '旧中文批注继续编辑')?.subtype).toBe('FreeText');
  583 |   });
  584 | });
  585 | 
  586 | test('nonempty persisted native recipe renders current copied AP/text/paint/thumbnail order without accepting or double-transforming the source', async ({ page }) => {
  587 |   test.setTimeout(180000);
  588 |   const { bytes, document } = await persistFixture(page, 'recipe');
  589 |   expect(document.nativeAnnotations?.commands).toHaveLength(3);
  590 |   let record = await activeRecord(page); expect(record.sourceHash).toBe(sha(bytes)); expect(record.revision).toBe(1);
  591 |   const firstText = page.locator('.zuvi-studio-pdf-text-layer');
  592 |   await expect(firstText).toContainText('page 2');
  593 |   await page.getByRole('button', { name: 'PDF 页面缩略图侧栏', exact: true }).click();
  594 |   await expect(page.getByRole('button', { name: /PDF 第 \d+ 页缩略图/ })).toHaveCount(3);
  595 |   await page.getByRole('button', { name: 'PDF 第 2 页缩略图', exact: true }).click();
  596 |   await expect(firstText).toContainText('page 1');
  597 |   await expect(page.locator('.zuvi-studio-pdf-paper')).toHaveCSS('width', '700px');
  598 |   await expect(page.locator('.zuvi-studio-pdf-paper')).toHaveCSS('height', '500px');
  599 |   const id = document.marks.find(mark => mark.nativeId && mark.text === '复制记录有独立中文')?.nativeId;
  600 |   if (!id) throw new Error('Persisted copied native projection is missing');
  601 |   await expect(hit(page, id)).toBeVisible();
  602 |   const bodyPixels = await hit(page, id).evaluate(element => {
  603 |     const paper = element.closest('.zuvi-studio-pdf-paper')!, canvas = paper.querySelector('canvas')!;
  604 |     const box = element.getBoundingClientRect(), parent = paper.getBoundingClientRect();
  605 |     const image = canvas.getContext('2d')!.getImageData(Math.max(0, Math.round((box.x - parent.x) * canvas.width / parent.width)),
  606 |       Math.max(0, Math.round((box.y - parent.y) * canvas.height / parent.height)),
  607 |       Math.max(1, Math.floor(box.width * canvas.width / parent.width)), Math.max(1, Math.floor(box.height * canvas.height / parent.height)));
  608 |     let dark = 0; for (let offset = 0; offset < image.data.length; offset += 4) if (Math.max(image.data[offset], image.data[offset + 1], image.data[offset + 2]) < 230) dark++;
  609 |     return dark;
  610 |   });
  611 |   expect(bodyPixels).toBeGreaterThan(100);
  612 |   await page.screenshot({ path: path.join(audit, 'nonempty-recipe-copy-preview.png'), fullPage: true, animations: 'disabled' });
  613 |   record = await activeRecord(page); expect(record.revision).toBe(1); expect(record.sourceHash).toBe(sha(bytes));
  614 |   await reopenTwice(page, 'nonempty-recipe', bytes, pdf => {
  615 |     expect(pdf.getPageCount()).toBe(3); expect(pdf.getPages().map(page => page.getRotation().angle)).toEqual([0, 90, 0]);
  616 |     expect(annots(pdf).find(item => item.id === id)?.contents).toBe('复制记录有独立中文');
  617 |     expect(pdf.getForm().getTextField('reviewer').getText()).toBe('Recipe current field');
  618 |   });
  619 | });
  620 | 
  621 | test('native read-only/locked commands and cancelling a pending CJK font preparation preserve source and history', async ({ page }) => {
  622 |   test.setTimeout(180000);
  623 |   const original = await open(page, 'native-locked-noap.pdf', false, await lockedAndNoApFixture());
  624 |   const first = await activeRecord(page);
  625 |   await expect.poll(async () => (await hit(page, 'native-ui-noap-note').boundingBox())?.width ?? 0).toBeGreaterThan(10);
  626 |   const icon = page.locator('.zuvi-studio-pdf-annotation-paint-layer [data-studio-annotation-id="native-ui-noap-note"]');
  627 |   await expect(icon).toBeVisible();
  628 |   const hitBox = await hit(page, 'native-ui-noap-note').boundingBox(), iconBox = await icon.boundingBox();
  629 |   expect(hitBox!.x).toBeCloseTo(iconBox!.x, 1); expect(hitBox!.y).toBeCloseTo(iconBox!.y, 1);
  630 |   expect(hitBox!.width).toBeCloseTo(iconBox!.width, 1); expect(hitBox!.height).toBeCloseTo(iconBox!.height, 1);
  631 |   await hit(page, 'native-ui-locked-square').click();
  632 |   await expect(page.getByRole('button', { name: '删除选中标注', exact: true })).toBeDisabled();
  633 |   await hit(page, 'native-ui-locked-square').press('ArrowRight');
  634 |   expect((await activeRecord(page)).sourceHash).toBe(first.sourceHash);
  635 |   const lockedProperties = await properties(page, 'native-ui-locked-square');
  636 |   await expect(lockedProperties.getByLabel('PDF 批注横坐标')).toBeDisabled();
  637 |   await expect(lockedProperties.getByLabel('PDF 批注内容', { exact: true })).toBeDisabled();
  638 |   await lockedProperties.getByRole('button', { name: '取消', exact: true }).click();
  639 |   await page.getByRole('switch', { name: '只读预览', exact: true }).check();
  640 |   await expect(page.getByLabel('PDF 批注署名', { exact: true })).toBeDisabled();
  641 |   await hit(page, 'native-note').click();
  642 |   await expect(page.getByRole('button', { name: '删除选中标注', exact: true })).toBeDisabled();
  643 |   await expect(page.getByLabel('PDF 回复内容', { exact: true })).toBeDisabled();
  644 |   const dialog = await properties(page, 'native-note');
  645 |   await expect(dialog.getByLabel('PDF 批注内容', { exact: true })).toBeDisabled();
```