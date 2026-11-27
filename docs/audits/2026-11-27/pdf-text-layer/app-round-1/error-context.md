# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-pdf-text-layer.spec.ts >> selects and copies original PDF text in OfficeStudio, searches real pages and preserves source bytes in readonly mode
- Location: e2e/office-studio-pdf-text-layer.spec.ts:241:1

# Error details

```
Test timeout of 180000ms exceeded.
```

```
Error: locator.focus: Test timeout of 180000ms exceeded.
Call log:
  - waiting for getByRole('document', { name: 'PDF 第 2 页原文选择复制', exact: true })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - link "Z ZUVI v1.1.0" [ref=e6] [cursor=pointer]:
        - /url: "#/"
        - generic [ref=e7]: Z
        - generic [ref=e8]: ZUVI
        - generic [ref=e9]: v1.1.0
      - generic [ref=e10]: 开发文档 / OfficeStudio 独立文档工作台
    - generic [ref=e11]:
      - button "打开文档命令面板" [ref=e12] [cursor=pointer]:
        - generic [ref=e16]: 搜索页面或命令
        - generic [ref=e17]: ⌘ / Ctrl K
      - button "切换暗色" [ref=e18] [cursor=pointer]
      - link "GitHub" [ref=e19] [cursor=pointer]:
        - /url: https://github.com/Starweave-Labs/zuvi
    - status
  - generic [ref=e20]:
    - generic [ref=e21]:
      - generic [ref=e22]: 文档
      - generic [ref=e23]: 组件、规范与实践
    - search "搜索文档导航" [ref=e24]:
      - searchbox "按名称过滤导航项" [ref=e25]
    - navigation "文档导航" [ref=e26]:
      - generic [ref=e27]:
        - group "开始" [ref=e28]:
          - list [ref=e30]:
            - listitem [ref=e31]:
              - link "概览" [ref=e32] [cursor=pointer]:
                - /url: "#/"
            - listitem [ref=e34]:
              - link "设计令牌" [ref=e35] [cursor=pointer]:
                - /url: "#/tokens"
            - listitem [ref=e37]:
              - link "主题调参" [ref=e38] [cursor=pointer]:
                - /url: "#/theme"
            - listitem [ref=e40]:
              - link "国际化与翻译" [ref=e41] [cursor=pointer]:
                - /url: "#/i18n"
            - listitem [ref=e43]:
              - link "设计资源" [ref=e44] [cursor=pointer]:
                - /url: "#/design"
            - listitem [ref=e46]:
              - link "图标库" [ref=e47] [cursor=pointer]:
                - /url: "#/icons"
            - listitem [ref=e49]:
              - link "页面搭建器" [ref=e50] [cursor=pointer]:
                - /url: "#/builder"
            - listitem [ref=e52]:
              - link "业务区块" [ref=e53] [cursor=pointer]:
                - /url: "#/blocks"
            - listitem [ref=e55]:
              - link "内容协作实验室" [ref=e56] [cursor=pointer]:
                - /url: "#/collaboration"
            - listitem [ref=e58]:
              - link "组件创意工坊" [ref=e59] [cursor=pointer]:
                - /url: "#/lab"
        - group "基础组件" [ref=e61]:
          - list [ref=e63]:
            - listitem [ref=e64]:
              - link "Button 按钮" [ref=e65] [cursor=pointer]:
                - /url: "#/components/button"
            - listitem [ref=e67]:
              - link "Typography 排版" [ref=e68] [cursor=pointer]:
                - /url: "#/components/typography"
        - group "布局" [ref=e70]:
          - list [ref=e72]:
            - listitem [ref=e73]:
              - link "Splitter 可调分栏" [ref=e74] [cursor=pointer]:
                - /url: "#/components/splitter"
            - listitem [ref=e76]:
              - link "Divider 分割线" [ref=e77] [cursor=pointer]:
                - /url: "#/components/divider"
            - listitem [ref=e79]:
              - link "Layout 布局" [ref=e80] [cursor=pointer]:
                - /url: "#/components/layout"
        - group "导航" [ref=e82]:
          - list [ref=e84]:
            - listitem [ref=e85]:
              - link "CommandPalette 命令面板" [ref=e86] [cursor=pointer]:
                - /url: "#/components/command-palette"
            - listitem [ref=e88]:
              - link "SideNav 侧边导航" [ref=e89] [cursor=pointer]:
                - /url: "#/components/side-nav"
            - listitem [ref=e91]:
              - link "Tabs 标签页" [ref=e92] [cursor=pointer]:
                - /url: "#/components/tabs"
            - listitem [ref=e94]:
              - link "DropdownMenu 下拉菜单" [ref=e95] [cursor=pointer]:
                - /url: "#/components/dropdown-menu"
            - listitem [ref=e97]:
              - link "Pagination 分页" [ref=e98] [cursor=pointer]:
                - /url: "#/components/pagination"
            - listitem [ref=e100]:
              - link "Breadcrumb 面包屑" [ref=e101] [cursor=pointer]:
                - /url: "#/components/breadcrumb"
            - listitem [ref=e103]:
              - link "Affix 固钉" [ref=e104] [cursor=pointer]:
                - /url: "#/components/affix"
            - listitem [ref=e106]:
              - link "BackTop 返回顶部" [ref=e107] [cursor=pointer]:
                - /url: "#/components/back-top"
            - listitem [ref=e109]:
              - link "FloatButton 悬浮按钮" [ref=e110] [cursor=pointer]:
                - /url: "#/components/float-button"
            - listitem [ref=e112]:
              - link "Steps 步骤条" [ref=e113] [cursor=pointer]:
                - /url: "#/components/steps"
            - listitem [ref=e115]:
              - link "Anchor 锚点" [ref=e116] [cursor=pointer]:
                - /url: "#/components/anchor"
        - group "数据录入" [ref=e118]:
          - list [ref=e120]:
            - listitem [ref=e121]:
              - link "Input 输入框" [ref=e122] [cursor=pointer]:
                - /url: "#/components/input"
            - listitem [ref=e124]:
              - link "Checkbox 复选框" [ref=e125] [cursor=pointer]:
                - /url: "#/components/checkbox"
            - listitem [ref=e127]:
              - link "Radio 单选框" [ref=e128] [cursor=pointer]:
                - /url: "#/components/radio"
            - listitem [ref=e130]:
              - link "Switch 开关" [ref=e131] [cursor=pointer]:
                - /url: "#/components/switch"
            - listitem [ref=e133]:
              - link "Select 选择器" [ref=e134] [cursor=pointer]:
                - /url: "#/components/select"
            - listitem [ref=e136]:
              - link "Combobox 自动完成" [ref=e137] [cursor=pointer]:
                - /url: "#/components/combobox"
            - listitem [ref=e139]:
              - link "OfficeEditor 文档编辑器" [ref=e140] [cursor=pointer]:
                - /url: "#/components/office-editor"
            - listitem [ref=e142]:
              - link "OfficeStudio 独立文档工作台" [ref=e143] [cursor=pointer]:
                - /url: "#/components/office-studio"
            - listitem [ref=e145]:
              - link "Form 表单" [ref=e146] [cursor=pointer]:
                - /url: "#/components/form"
            - listitem [ref=e148]:
              - link "Slider 滑块" [ref=e149] [cursor=pointer]:
                - /url: "#/components/slider"
            - listitem [ref=e151]:
              - link "Rate 评分" [ref=e152] [cursor=pointer]:
                - /url: "#/components/rate"
            - listitem [ref=e154]:
              - link "InputNumber 数字输入" [ref=e155] [cursor=pointer]:
                - /url: "#/components/input-number"
            - listitem [ref=e157]:
              - link "ColorPicker 取色器" [ref=e158] [cursor=pointer]:
                - /url: "#/components/color-picker"
            - listitem [ref=e160]:
              - link "DatePicker 日期选择" [ref=e161] [cursor=pointer]:
                - /url: "#/components/date-picker"
            - listitem [ref=e163]:
              - link "TreeSelect 树选择" [ref=e164] [cursor=pointer]:
                - /url: "#/components/tree-select"
            - listitem [ref=e166]:
              - link "Transfer 穿梭框" [ref=e167] [cursor=pointer]:
                - /url: "#/components/transfer"
            - listitem [ref=e169]:
              - link "Cascader 级联选择" [ref=e170] [cursor=pointer]:
                - /url: "#/components/cascader"
            - listitem [ref=e172]:
              - link "TimePicker 时间选择" [ref=e173] [cursor=pointer]:
                - /url: "#/components/time-picker"
            - listitem [ref=e175]:
              - link "Mentions 提及" [ref=e176] [cursor=pointer]:
                - /url: "#/components/mentions"
            - listitem [ref=e178]:
              - link "Segmented 分段控制器" [ref=e179] [cursor=pointer]:
                - /url: "#/components/segmented"
            - listitem [ref=e181]:
              - link "Upload 上传" [ref=e182] [cursor=pointer]:
                - /url: "#/components/upload"
            - listitem [ref=e184]:
              - link "DateRangePicker 日期范围" [ref=e185] [cursor=pointer]:
                - /url: "#/components/date-range-picker"
        - group "数据展示" [ref=e187]:
          - list [ref=e189]:
            - listitem [ref=e190]:
              - link "Table 表格" [ref=e191] [cursor=pointer]:
                - /url: "#/components/table"
            - listitem [ref=e193]:
              - link "Chart 数据图表" [ref=e194] [cursor=pointer]:
                - /url: "#/components/chart"
            - listitem [ref=e196]:
              - link "Globe 3D 地球" [ref=e197] [cursor=pointer]:
                - /url: "#/components/globe"
            - listitem [ref=e199]:
              - link "Badge 徽标" [ref=e200] [cursor=pointer]:
                - /url: "#/components/badge"
            - listitem [ref=e202]:
              - link "Tag 标签" [ref=e203] [cursor=pointer]:
                - /url: "#/components/tag"
            - listitem [ref=e205]:
              - link "Avatar 头像" [ref=e206] [cursor=pointer]:
                - /url: "#/components/avatar"
            - listitem [ref=e208]:
              - link "Card 卡片" [ref=e209] [cursor=pointer]:
                - /url: "#/components/card"
            - listitem [ref=e211]:
              - link "Empty 空状态" [ref=e212] [cursor=pointer]:
                - /url: "#/components/empty"
            - listitem [ref=e214]:
              - link "Calendar 日历" [ref=e215] [cursor=pointer]:
                - /url: "#/components/calendar"
            - listitem [ref=e217]:
              - link "Descriptions 描述列表" [ref=e218] [cursor=pointer]:
                - /url: "#/components/descriptions"
            - listitem [ref=e220]:
              - link "Statistic 统计数值" [ref=e221] [cursor=pointer]:
                - /url: "#/components/statistic"
            - listitem [ref=e223]:
              - link "Timeline 时间轴" [ref=e224] [cursor=pointer]:
                - /url: "#/components/timeline"
            - listitem [ref=e226]:
              - link "VirtualTable 虚拟滚动表格" [ref=e227] [cursor=pointer]:
                - /url: "#/components/virtual-table"
            - listitem [ref=e229]:
              - link "DataGrid 数据网格" [ref=e230] [cursor=pointer]:
                - /url: "#/components/data-grid"
            - listitem [ref=e232]:
              - link "Tree 树形控件" [ref=e233] [cursor=pointer]:
                - /url: "#/components/tree"
            - listitem [ref=e235]:
              - link "Collapse 折叠面板" [ref=e236] [cursor=pointer]:
                - /url: "#/components/collapse"
            - listitem [ref=e238]:
              - link "List 列表" [ref=e239] [cursor=pointer]:
                - /url: "#/components/list"
            - listitem [ref=e241]:
              - link "Image 图片" [ref=e242] [cursor=pointer]:
                - /url: "#/components/image"
            - listitem [ref=e244]:
              - link "QRCode 二维码" [ref=e245] [cursor=pointer]:
                - /url: "#/components/qrcode"
            - listitem [ref=e247]:
              - link "Watermark 水印" [ref=e248] [cursor=pointer]:
                - /url: "#/components/watermark"
        - group "数据可视化" [ref=e250]:
          - list [ref=e252]:
            - listitem [ref=e253]:
              - link "图表画廊" [ref=e254] [cursor=pointer]:
                - /url: "#/charts"
            - listitem [ref=e256]:
              - link "交互与联动" [ref=e257] [cursor=pointer]:
                - /url: "#/charts/interactions"
            - listitem [ref=e259]:
              - link "可视化实验室" [ref=e260] [cursor=pointer]:
                - /url: "#/charts/playground"
        - group "反馈" [ref=e262]:
          - list [ref=e264]:
            - listitem [ref=e265]:
              - link "Modal 对话框" [ref=e266] [cursor=pointer]:
                - /url: "#/components/modal"
            - listitem [ref=e268]:
              - link "Message 全局提示" [ref=e269] [cursor=pointer]:
                - /url: "#/components/message"
            - listitem [ref=e271]:
              - link "Tooltip 文字提示" [ref=e272] [cursor=pointer]:
                - /url: "#/components/tooltip"
            - listitem [ref=e274]:
              - link "Popover 气泡卡片" [ref=e275] [cursor=pointer]:
                - /url: "#/components/popover"
            - listitem [ref=e277]:
              - link "Alert 警告提示" [ref=e278] [cursor=pointer]:
                - /url: "#/components/alert"
            - listitem [ref=e280]:
              - link "Skeleton 骨架屏" [ref=e281] [cursor=pointer]:
                - /url: "#/components/skeleton"
            - listitem [ref=e283]:
              - link "Drawer 抽屉" [ref=e284] [cursor=pointer]:
                - /url: "#/components/drawer"
            - listitem [ref=e286]:
              - link "Spin 加载中" [ref=e287] [cursor=pointer]:
                - /url: "#/components/spin"
            - listitem [ref=e289]:
              - link "Progress 进度条" [ref=e290] [cursor=pointer]:
                - /url: "#/components/progress"
            - listitem [ref=e292]:
              - link "Notification 通知提醒框" [ref=e293] [cursor=pointer]:
                - /url: "#/components/notification"
            - listitem [ref=e295]:
              - link "Popconfirm 气泡确认" [ref=e296] [cursor=pointer]:
                - /url: "#/components/popconfirm"
            - listitem [ref=e298]:
              - link "Tour 漫游引导" [ref=e299] [cursor=pointer]:
                - /url: "#/components/tour"
            - listitem [ref=e301]:
              - link "Result 结果" [ref=e302] [cursor=pointer]:
                - /url: "#/components/result"
        - group "全局配置" [ref=e304]:
          - list [ref=e306]:
            - listitem [ref=e307]:
              - link "ConfigProvider 全局配置" [ref=e308] [cursor=pointer]:
                - /url: "#/components/config"
            - listitem [ref=e310]:
              - link "App 容器" [ref=e311] [cursor=pointer]:
                - /url: "#/components/app"
    - generic [ref=e313]: React 19 · CSS 变量驱动
  - main [ref=e314]:
    - generic [ref=e315]:
      - heading "OfficeStudio 独立文档工作台" [level=1] [ref=e316]
      - paragraph [ref=e317]: 使用 ZUVI 的工具栏、菜单和表单，在页面内直接编辑文档。Word、Excel、PDF 共用文件操作与保存状态，编辑内容保存在当前浏览器，也可以导出为实际文件。
      - generic [ref=e318]:
        - generic [ref=e319]: ZUVI 界面
        - generic [ref=e321]: 页面内编辑
        - generic [ref=e323]: 本地恢复
        - generic [ref=e325]: DOCX / XLSX / PDF
      - region "从预览，到完成一份文档" [ref=e327]:
        - generic [ref=e328]:
          - heading "从预览，到完成一份文档" [level=3] [ref=e329]
          - paragraph [ref=e330]: 选择一种文档开始。修改会自动保存到当前浏览器；导出后可在 Word、Excel 或 PDF 阅读器中继续使用。
        - generic [ref=e332]:
          - group "选择示例文档" [ref=e333]:
            - button "Word 文档排版 · 图片与页眉页脚" [disabled] [ref=e334]:
              - generic [ref=e335]:
                - generic [aria-hidden] [ref=e336]: W
                - generic [ref=e337]:
                  - strong [ref=e338]: Word
                  - generic [ref=e339]: 文档排版 · 图片与页眉页脚
            - button "Excel 行列编辑 · 公式与图表" [disabled] [ref=e340]:
              - generic [ref=e341]:
                - generic [aria-hidden] [ref=e342]: E
                - generic [ref=e343]:
                  - strong [ref=e344]: Excel
                  - generic [ref=e345]: 行列编辑 · 公式与图表
            - button "PDF 全文查找 · 批注与手写" [disabled] [ref=e346]:
              - generic [ref=e347]:
                - generic [aria-hidden] [ref=e348]: P
                - generic [ref=e349]:
                  - strong [ref=e350]: PDF
                  - generic [ref=e351]: 全文查找 · 批注与手写
          - generic [ref=e352]:
            - generic [ref=e353]: 本地文档
            - generic [ref=e354]:
              - generic [ref=e355]: 打开本地文档
              - button "打开本地文档 保存的文档会出现在这里" [disabled] [ref=e356]:
                - generic [ref=e357]: 保存的文档会出现在这里
            - button "历史版本" [disabled] [ref=e358]
            - switch "只读预览" [checked] [disabled] [ref=e360]
          - status [ref=e364]: 正在准备本地文档…
          - paragraph [ref=e365]: 文件保存在当前浏览器的本地文档空间。需要长期留存时，请导出文件。
        - group [ref=e366]:
          - generic "示例代码" [ref=e367] [cursor=pointer]:
            - generic [aria-hidden] [ref=e368]: </>
            - text: 示例代码
            - generic [aria-hidden] [ref=e369]: 展开 / 收起
      - heading "编辑能力" [level=2] [ref=e370]
      - table [ref=e372]:
        - rowgroup [ref=e373]:
          - row [ref=e374]:
            - columnheader "文档" [ref=e375]
            - columnheader "支持的操作" [ref=e376]
            - columnheader "当前范围" [ref=e377]
        - rowgroup [ref=e378]:
          - row [ref=e379]:
            - cell "Word" [ref=e380]
            - cell "字体与小数字号输入、正文排版、列表、表格、图片、页眉页脚、页码、查找替换、页面设置、撤销重做；导入与导出 DOCX" [ref=e381]
            - cell "支持内嵌图片与单节文档。修订、目录、浮动对象等复杂结构会提示暂不支持。" [ref=e382]
          - row [ref=e383]:
            - cell "Excel" [ref=e384]
            - cell "单元格与矩形选区、字体与小数字号输入、手动与自动行高/列宽、查找替换、边框与垂直对齐、清除格式、公式和跨表引用、格式、复制粘贴、工作表增删、行列插入删除、合并、冻结、排序、筛选、柱状图与折线图；导入与导出 XLSX" [ref=e385]
            - cell "10,000 行、256 列、32 张表、100,000 个已使用单元格。透视、宏、数组公式及复杂图表暂不支持。" [ref=e386]
          - row [ref=e387]:
            - cell "PDF" [ref=e388]
            - cell "分页与缩略图、缩放、旋转、全文查找、文字与高亮、矩形和手写批注、已有表单、撤销重做；导出 PDF" [ref=e389]
            - cell "批注和表单编辑。任意原始文字修改、原文重排及扫描件 OCR 暂不支持。" [ref=e390]
      - heading "组件接入" [level=2] [ref=e391]
      - paragraph [ref=e392]: UI 组件使用 Tiptap / ProseMirror 和公式计算库；文件适配使用 docx、ExcelJS、pdf-lib 与 PDF.js。本页无需文档服务器。宿主可以替换保存与导入导出回调，接入自己的文件系统。
      - paragraph [ref=e393]:
        - text: PDF 的 worker、字体与渲染由
        - code [ref=e394]: pdfRenderer
        - text: 提供。本页的适配代码位于
        - code [ref=e395]: docs/src/pages/collaboration/office-studio/
        - text: 。组件自 v0.4.0 起随
        - code [ref=e396]: "@zuvi/react"
        - text: 和 Registry 发布。
      - region "组件属性表，可横向滚动" [ref=e397]:
        - table [ref=e398]:
          - rowgroup [ref=e399]:
            - row [ref=e400]:
              - columnheader "属性名" [ref=e401]
              - columnheader "类型" [ref=e402]
              - columnheader "默认值" [ref=e403]
              - columnheader "说明" [ref=e404]
          - rowgroup [ref=e405]:
            - row [ref=e406]:
              - cell "value / defaultValue" [ref=e407]
              - cell [ref=e408]:
                - code [ref=e409]: OfficeStudioDocument
              - cell [ref=e410]:
                - code [ref=e411]: —
              - cell "受控文档或非受控初始文档；支持 Word、Excel、PDF 三种模型。" [ref=e412]
            - row [ref=e413]:
              - cell "onChange" [ref=e414]
              - cell [ref=e415]:
                - code [ref=e416]: (document) => void
              - cell [ref=e417]:
                - code [ref=e418]: —
              - cell "内容或文件名称变化。" [ref=e419]
            - row [ref=e420]:
              - cell "source / pdfRenderer" [ref=e421]
              - cell [ref=e422]:
                - code [ref=e423]: Blob / StudioPdfRenderer
              - cell [ref=e424]:
                - code [ref=e425]: —
              - cell "原始文件及 PDF 渲染适配；worker 资源由宿主管理。" [ref=e426]
            - row [ref=e427]:
              - cell "onSave / onExport / onPrint" [ref=e428]
              - cell [ref=e429]:
                - code [ref=e430]: (document) => void | Promise<void>
              - cell [ref=e431]:
                - code [ref=e432]: —
              - cell "宿主处理保存、导出或打印；返回后更新状态，失败可重试。" [ref=e433]
            - row [ref=e434]:
              - cell "onImport / onCreate" [ref=e435]
              - cell [ref=e436]:
                - code [ref=e437]: (file | kind) => void | Promise<void>
              - cell [ref=e438]:
                - code [ref=e439]: —
              - cell "宿主解析文件或创建模型，并更新受控值。" [ref=e440]
            - row [ref=e441]:
              - cell "readOnly / disabled" [ref=e442]
              - cell [ref=e443]:
                - code [ref=e444]: boolean
              - cell [ref=e445]:
                - code [ref=e446]: "false"
              - cell "只读预览或禁用编辑与文件操作。" [ref=e447]
            - row [ref=e448]:
              - cell "saveState" [ref=e449]
              - cell [ref=e450]:
                - code [ref=e451]: "'saved' | 'saving' | 'unsaved' | 'error'"
              - cell [ref=e452]:
                - code [ref=e453]: —
              - cell "宿主自动保存状态。" [ref=e454]
            - row [ref=e455]:
              - cell "height" [ref=e456]
              - cell [ref=e457]:
                - code [ref=e458]: number | string
              - cell [ref=e459]:
                - code [ref=e460]: "760"
              - cell "编辑器高度；100% 需要父容器设置确定高度。" [ref=e461]
            - row [ref=e462]:
              - cell "fullscreen / onFullscreenChange" [ref=e463]
              - cell [ref=e464]:
                - code [ref=e465]: boolean / (value) => void
              - cell [ref=e466]:
                - code [ref=e467]: —
              - cell "全屏布局，切换时编辑内容保持挂载。" [ref=e468]
            - row [ref=e469]:
              - cell "ref" [ref=e470]
              - cell [ref=e471]:
                - code [ref=e472]: OfficeStudioHandle
              - cell [ref=e473]:
                - code [ref=e474]: —
              - cell "getDocument()、save()、export()、print()、setFullscreen()。" [ref=e475]
            - row [ref=e476]:
              - cell "classNames" [ref=e477]
              - cell [ref=e478]:
                - code [ref=e479]: "{ root?; header?; title?; actions?; stage?; status?; error? }"
              - cell [ref=e480]:
                - code [ref=e481]: —
              - cell "追加语义结构类名，配合 data-part 与 CSS 变量定制。" [ref=e482]
```

# Test source

```ts
  166 | });
  167 | 
  168 | async function appFixture() {
  169 |   const data = await fixture(), pdf = await PDFDocument.load(data.bytes), font = await pdf.embedFont(StandardFonts.Helvetica);
  170 |   const second = pdf.addPage([320, 420]); second.setRotation(degrees(90));
  171 |   second.drawText('Searchable second source page', { x: 30, y: 360, size: 16, font });
  172 |   return new Uint8Array(await pdf.save({ updateFieldAppearances: false }));
  173 | }
  174 | async function appReady(page: Page) {
  175 |   await expect(page.getByRole('region', { name: 'PDF 页面编辑区', exact: true }).first()).toHaveAttribute('aria-busy', 'false');
  176 |   await expect(page.locator('.zuvi-studio-pdf-paper .zuvi-studio-pdf-text-layer')).toHaveAttribute('data-ready', 'true');
  177 |   await expect(page.locator('.zuvi-studio-pdf-paper .zuvi-studio-pdf-annotation-paint-layer')).toHaveAttribute('data-ready', 'true');
  178 | }
  179 | async function appImport(page: Page, bytes: Uint8Array, name: string) {
  180 |   await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name, mimeType: 'application/pdf', buffer: Buffer.from(bytes) });
  181 |   await appReady(page);
  182 | }
  183 | async function appSave(page: Page) {
  184 |   await page.getByRole('button', { name: '保存', exact: true }).click();
  185 |   await expect(page.locator('.zuvi-office-studio [data-save-state]').first()).toHaveAttribute('data-save-state', 'saved');
  186 | }
  187 | async function appSnapshot(page: Page) {
  188 |   return page.evaluate(async () => {
  189 |     const database = await new Promise<IDBDatabase>((resolve, reject) => {
  190 |       const request = indexedDB.open('zuvi-office-studio', 2); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  191 |     });
  192 |     const id = await new Promise<string>((resolve, reject) => {
  193 |       const request = database.transaction('preferences').objectStore('preferences').get('active'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  194 |     });
  195 |     const file = await new Promise<{ revision: number; source: Blob; document: { kind: string; name: string; marks: { id: string; nativeId?: string; type: string }[] } }>((resolve, reject) => {
  196 |       const request = database.transaction('files').objectStore('files').get(id); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  197 |     });
  198 |     database.close();
  199 |     const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', await file.source.arrayBuffer()))].map(value => value.toString(16).padStart(2, '0')).join('');
  200 |     return { revision: file.revision, sourceHash: hash, document: file.document };
  201 |   });
  202 | }
  203 | async function appExport(page: Page, name: string) {
  204 |   const pending = page.waitForEvent('download'); await page.getByRole('button', { name: '导出文件', exact: true }).click();
  205 |   const bytes = await readFile((await (await pending).path())!); await writeFile(path.join(audit, name), bytes); return bytes;
  206 | }
  207 | async function selectSource(page: Page, needle: string, start: number, end: number, pointer = false) {
  208 |   const layer = page.locator('.zuvi-studio-pdf-paper .zuvi-studio-pdf-text-layer');
  209 |   if (pointer) {
  210 |     const positions = await layer.evaluate((element, { needle, start, end }) => {
  211 |       const span = [...element.querySelectorAll('span')].find(value => value.textContent === needle);
  212 |       if (!span?.firstChild) throw new Error('Original PDF text is missing');
  213 |       const first = document.createRange(), last = document.createRange();
  214 |       first.setStart(span.firstChild, start); first.setEnd(span.firstChild, start + 1);
  215 |       last.setStart(span.firstChild, end - 1); last.setEnd(span.firstChild, end);
  216 |       const a = first.getBoundingClientRect(), b = last.getBoundingClientRect();
  217 |       return { from: { x: a.left + a.width * 0.1, y: a.top + a.height / 2 }, to: { x: b.right - b.width * 0.1, y: b.top + b.height / 2 } };
  218 |     }, { needle, start, end });
  219 |     await page.mouse.move(positions.from.x, positions.from.y); await page.mouse.down();
  220 |     await page.mouse.move(positions.to.x, positions.to.y, { steps: 8 }); await page.mouse.up();
  221 |   } else {
  222 |     await layer.evaluate((element, { needle, start, end }) => {
  223 |       const span = [...element.querySelectorAll('span')].find(value => value.textContent === needle);
  224 |       if (!span?.firstChild) throw new Error('Original PDF text is missing');
  225 |       const range = document.createRange(); range.setStart(span.firstChild, start); range.setEnd(span.firstChild, end);
  226 |       const selected = document.getSelection(); selected?.removeAllRanges(); selected?.addRange(range);
  227 |     }, { needle, start, end });
  228 |   }
  229 |   await expect.poll(() => page.evaluate(() => document.getSelection()?.toString())).toBe(needle.slice(start, end));
  230 | }
  231 | function pageStreams(pdf: PDFDocument) {
  232 |   return pdf.getPages().map(page => {
  233 |     const contents = page.node.Contents(), values = contents && 'asArray' in contents ? contents.asArray() : contents ? [contents] : [];
  234 |     return values.map(value => {
  235 |       const stream = pdf.context.lookup(value); if (!(stream instanceof PDFRawStream)) throw new Error('Page content is not a real PDF stream');
  236 |       return createHash('sha256').update(stream.contents).digest('hex');
  237 |     });
  238 |   });
  239 | }
  240 | 
  241 | test('selects and copies original PDF text in OfficeStudio, searches real pages and preserves source bytes in readonly mode', async ({ page, context }) => {
  242 |   test.setTimeout(180000); await mkdir(audit, { recursive: true });
  243 |   await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  244 |   const bytes = await appFixture(), hash = createHash('sha256').update(bytes).digest('hex');
  245 |   await writeFile(path.join(audit, 'app-source.pdf'), bytes);
  246 |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  247 |   await page.goto('/#/components/office-studio'); await appImport(page, bytes, 'Selectable-source.pdf'); await appSave(page);
  248 |   const initial = await appSnapshot(page); expect(initial.sourceHash).toBe(hash);
  249 |   await selectSource(page, 'SELECTABLE ORIGINAL', 3, 10, true);
  250 |   await page.keyboard.press(process.platform === 'darwin' ? 'Meta+c' : 'Control+c');
  251 |   await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('ECTABLE');
  252 |   const textLayer = page.getByRole('document', { name: 'PDF 第 1 页原文选择复制', exact: true });
  253 |   await textLayer.focus(); await page.keyboard.press('Control+a');
  254 |   await page.keyboard.press(process.platform === 'darwin' ? 'Meta+c' : 'Control+c');
  255 |   const copy = await page.evaluate(() => navigator.clipboard.readText());
  256 |   expect(copy).toContain('SELECTABLE ORIGINAL'); expect(copy).toContain('Angled source text'); expect(copy).toContain('Second source line');
  257 |   await page.getByRole('button', { name: 'PDF 文本查找侧栏', exact: true }).click();
  258 |   await page.getByRole('textbox', { name: 'PDF 查找文字', exact: true }).fill('source');
  259 |   await page.getByRole('button', { name: '查找全部', exact: true }).click();
  260 |   const results = page.getByLabel('PDF 查找结果', { exact: true }).getByRole('button');
  261 |   await expect(results).toHaveCount(3); await results.last().click(); await appReady(page);
  262 |   await expect(page.getByRole('spinbutton', { name: 'PDF 跳转页', exact: true })).toHaveValue('2');
  263 |   expect(await page.evaluate(() => document.getSelection()?.isCollapsed)).toBe(true);
  264 |   await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  265 |   const secondLayer = page.getByRole('document', { name: 'PDF 第 2 页原文选择复制', exact: true });
> 266 |   await secondLayer.focus(); await page.keyboard.press('Control+a');
      |                     ^ Error: locator.focus: Test timeout of 180000ms exceeded.
  267 |   await page.keyboard.press(process.platform === 'darwin' ? 'Meta+c' : 'Control+c');
  268 |   await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('Searchable second source page');
  269 |   await expect(page.getByRole('button', { name: '新建表单字段', exact: true })).toBeDisabled();
  270 |   expect((await appSnapshot(page)).sourceHash).toBe(hash);
  271 |   await page.screenshot({ path: path.join(audit, 'app-readonly-text-light.png'), fullPage: true, animations: 'disabled' });
  272 |   await page.locator('html').evaluate(element => element.setAttribute('data-theme', 'dark'));
  273 |   await page.screenshot({ path: path.join(audit, 'app-readonly-text-dark.png'), fullPage: true, animations: 'disabled' });
  274 |   await page.setViewportSize({ width: 320, height: 780 });
  275 |   await secondLayer.focus(); await page.keyboard.press('Control+a');
  276 |   await page.keyboard.press(process.platform === 'darwin' ? 'Meta+c' : 'Control+c');
  277 |   await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('Searchable second source page');
  278 |   await page.screenshot({ path: path.join(audit, 'app-readonly-text-dark-320.png'), fullPage: true, animations: 'disabled' });
  279 |   const final = await appSnapshot(page); expect(final.sourceHash).toBe(hash); expect(final.revision).toBe(initial.revision);
  280 |   expect(errors).toEqual([]); await writeFile(path.join(audit, 'app-selection-results.json'), JSON.stringify({ hash, initial, final, copy, errors }, null, 2) + '\n');
  281 | });
  282 | 
  283 | test('uses real selected PDF glyph QuadPoints for four native text markups and survives history and two reopens', async ({ page }) => {
  284 |   test.setTimeout(180000); await mkdir(audit, { recursive: true });
  285 |   const bytes = await appFixture(), original = await PDFDocument.load(bytes), originalStreams = pageStreams(original);
  286 |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  287 |   await page.goto('/#/components/office-studio'); await appImport(page, bytes, 'Text-markup-source.pdf'); await appSave(page);
  288 |   await page.getByRole('tab', { name: '批注', exact: true }).click();
  289 |   const sourceCount = await page.locator('.zuvi-studio-pdf-native-hit').count(), operations: unknown[] = [];
  290 |   for (const [index, [label, subtype, needle, start, end]] of [
  291 |     ['高亮', 'Highlight', 'SELECTABLE ORIGINAL', 3, 10],
  292 |     ['下划线', 'Underline', 'Second source line', 0, 6],
  293 |     ['删除线', 'StrikeOut', 'Angled source text', 0, 6],
  294 |     ['波浪线', 'Squiggly', 'SELECTABLE ORIGINAL', 11, 19],
  295 |   ].entries()) {
  296 |     await page.getByRole('button', { name: '选择', exact: true }).click(); await appReady(page);
  297 |     await selectSource(page, String(needle), Number(start), Number(end));
  298 |     await page.getByRole('button', { name: /^PDF 新增批注类型/ }).click();
  299 |     await page.getByRole('option', { name: String(label), exact: true }).click();
  300 |     const apply = page.getByRole('button', { name: '应用到所选文字', exact: true });
  301 |     await expect(apply).toBeEnabled();
  302 |     const before = await appSnapshot(page); await apply.click(); await appReady(page); await appSave(page);
  303 |     await expect(page.locator('.zuvi-studio-pdf-native-hit')).toHaveCount(sourceCount + index + 1);
  304 |     const after = await appSnapshot(page); expect(after.sourceHash).not.toBe(before.sourceHash);
  305 |     const output = await appExport(page, `app-created-${String(subtype).toLowerCase()}.pdf`), native = await PDFDocument.load(output);
  306 |     const annotations = native.getPages()[0].node.Annots()!.asArray().map(ref => native.context.lookup(ref)).filter((value): value is PDFDict => value instanceof PDFDict);
  307 |     const marks = annotations.filter(dict => dict.lookup(PDFName.of('Subtype')) === PDFName.of(String(subtype)));
  308 |     const latest = marks.at(-1)!;
  309 |     const quads = latest.lookup(PDFName.of('QuadPoints')); expect(quads && 'asArray' in quads).toBe(true);
  310 |     expect(String(quads)).not.toBe('[]'); expect(latest.lookup(PDFName.of('AP'))).toBeDefined();
  311 |     expect(pageStreams(native)).toEqual(originalStreams);
  312 |     operations.push({ label, subtype, before: before.sourceHash, after: after.sourceHash, quads: String(quads) });
  313 |     if (index === 3) {
  314 |       await page.getByRole('button', { name: '撤销', exact: true }).click(); await appReady(page); await appSave(page);
  315 |       await expect(page.locator('.zuvi-studio-pdf-native-hit')).toHaveCount(sourceCount + 3); expect((await appSnapshot(page)).sourceHash).toBe(before.sourceHash);
  316 |       await page.getByRole('button', { name: '重做', exact: true }).click(); await appReady(page); await appSave(page);
  317 |       await expect(page.locator('.zuvi-studio-pdf-native-hit')).toHaveCount(sourceCount + 4); expect((await appSnapshot(page)).sourceHash).toBe(after.sourceHash);
  318 |     }
  319 |   }
  320 |   const rounds: unknown[] = [];
  321 |   for (let round = 1; round <= 2; round++) {
  322 |     const output = await appExport(page, `app-text-markups-round-${round}.pdf`), native = await PDFDocument.load(output);
  323 |     expect(pageStreams(native)).toEqual(originalStreams); expect(native.getForm().getTextField('source-field').getText()).toBe('Field value');
  324 |     const subtypes = native.getPages()[0].node.Annots()!.asArray().map(ref => native.context.lookup(ref)).filter((value): value is PDFDict => value instanceof PDFDict).map(value => String(value.lookup(PDFName.of('Subtype'))));
  325 |     expect(subtypes.filter(value => value === '/Highlight')).toHaveLength(2); for (const value of ['/Underline', '/StrikeOut', '/Squiggly']) expect(subtypes.filter(subtype => subtype === value)).toHaveLength(1);
  326 |     await appImport(page, output, `Text-markups-reopened-${round}.pdf`); await expect(page.locator('.zuvi-studio-pdf-native-hit')).toHaveCount(sourceCount + 4);
  327 |     await selectSource(page, 'SELECTABLE ORIGINAL', 3, 10); rounds.push({ round, hash: createHash('sha256').update(output).digest('hex'), subtypes });
  328 |   }
  329 |   await page.screenshot({ path: path.join(audit, 'app-text-markups-reopened.png'), fullPage: true, animations: 'disabled' });
  330 |   expect(errors).toEqual([]); await writeFile(path.join(audit, 'app-markups-results.json'), JSON.stringify({ operations, rounds, originalStreams, errors }, null, 2) + '\n');
  331 | });
  332 | 
```