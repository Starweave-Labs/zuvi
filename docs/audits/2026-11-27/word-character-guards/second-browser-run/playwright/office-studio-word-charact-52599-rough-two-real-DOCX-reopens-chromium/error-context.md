# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-word-character-guards.spec.ts >> guards character operations during IME, steps a shared empty header and saves all five Unicode case modes through two real DOCX reopens
- Location: e2e/office-studio-word-character-guards.spec.ts:32:1

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "w:position w:val=\"-3\""
Received string:    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><w:document mc:Ignorable=\"w14 w15 wp14\" xmlns:wpc=\"http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas\" xmlns:mc=\"http://schemas.openxmlformats.org/markup-compatibility/2006\" xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" xmlns:m=\"http://schemas.openxmlformats.org/officeDocument/2006/math\" xmlns:v=\"urn:schemas-microsoft-com:vml\" xmlns:wp14=\"http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing\" xmlns:wp=\"http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing\" xmlns:w10=\"urn:schemas-microsoft-com:office:word\" xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\" xmlns:w14=\"http://schemas.microsoft.com/office/word/2010/wordml\" xmlns:w15=\"http://schemas.microsoft.com/office/word/2012/wordml\" xmlns:wpg=\"http://schemas.microsoft.com/office/word/2010/wordprocessingGroup\" xmlns:wpi=\"http://schemas.microsoft.com/office/word/2010/wordprocessingInk\" xmlns:wne=\"http://schemas.microsoft.com/office/word/2006/wordml\" xmlns:wps=\"http://schemas.microsoft.com/office/word/2010/wordprocessingShape\" xmlns:cx=\"http://schemas.microsoft.com/office/drawing/2014/chartex\" xmlns:cx1=\"http://schemas.microsoft.com/office/drawing/2015/9/8/chartex\" xmlns:cx2=\"http://schemas.microsoft.com/office/drawing/2015/10/21/chartex\" xmlns:cx3=\"http://schemas.microsoft.com/office/drawing/2016/5/9/chartex\" xmlns:cx4=\"http://schemas.microsoft.com/office/drawing/2016/5/10/chartex\" xmlns:cx5=\"http://schemas.microsoft.com/office/drawing/2016/5/11/chartex\" xmlns:cx6=\"http://schemas.microsoft.com/office/drawing/2016/5/12/chartex\" xmlns:cx7=\"http://schemas.microsoft.com/office/drawing/2016/5/13/chartex\" xmlns:cx8=\"http://schemas.microsoft.com/office/drawing/2016/5/14/chartex\" xmlns:aink=\"http://schemas.microsoft.com/office/drawing/2016/ink\" xmlns:am3d=\"http://schemas.microsoft.com/office/drawing/2017/model3d\" xmlns:w16cex=\"http://schemas.microsoft.com/office/word/2018/wordml/cex\" xmlns:w16cid=\"http://schemas.microsoft.com/office/word/2016/wordml/cid\" xmlns:w16=\"http://schemas.microsoft.com/office/word/2018/wordml\" xmlns:w16sdtdh=\"http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash\" xmlns:w16se=\"http://schemas.microsoft.com/office/word/2015/wordml/symex\"><w:body><w:p><w:pPr><w:pStyle w:val=\"ZuviStyle_imported-4\"/><w:spacing/></w:pPr><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/></w:rPr><w:t xml:space=\"preserve\">Word character guard sample</w:t></w:r></w:p><w:p><w:pPr><w:spacing w:after=\"200\" w:line=\"276\" w:lineRule=\"auto\"/><w:ind w:left=\"360\"/><w:jc w:val=\"right\"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:b/><w:bCs/><w:color w:val=\"0055aa\"/><w:sz w:val=\"36\"/><w:szCs w:val=\"36\"/></w:rPr><w:t xml:space=\"preserve\">SOURCE</w:t></w:r></w:p><w:p><w:pPr><w:spacing w:after=\"200\" w:line=\"276\" w:lineRule=\"auto\"/><w:ind w:left=\"360\"/><w:jc w:val=\"right\"/><w:pBdr><w:top w:val=\"nil\"/><w:bottom w:val=\"nil\"/><w:left w:val=\"nil\"/><w:right w:val=\"nil\"/><w:between w:val=\"nil\"/><w:bar w:val=\"nil\"/></w:pBdr><w:shd w:val=\"nil\"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:b/><w:bCs/><w:color w:val=\"0055aa\"/><w:spacing w:val=\"6\"/><w:position w:val=\"-1.5pt\"/><w:sz w:val=\"36\"/><w:szCs w:val=\"36\"/></w:rPr><w:t xml:space=\"preserve\">target</w:t></w:r></w:p><w:p><w:pPr><w:spacing w:after=\"200\" w:line=\"276\" w:lineRule=\"auto\"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:b/><w:bCs/><w:color w:val=\"000000\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">lower ο</w:t></w:r><w:hyperlink w:history=\"1\" r:id=\"rIdjy4fldacza68nueogzpbb\"><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:i/><w:iCs/><w:color w:val=\"000000\"/><w:sz w:val=\"32\"/><w:szCs w:val=\"32\"/></w:rPr><w:t xml:space=\"preserve\">ς</w:t></w:r></w:hyperlink></w:p><w:p><w:pPr><w:spacing w:after=\"200\" w:line=\"276\" w:lineRule=\"auto\"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:b/><w:bCs/><w:color w:val=\"000000\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Title Ο</w:t></w:r><w:hyperlink w:history=\"1\" r:id=\"rIdgcqdrrmwihqsanxsgzfzt\"><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:i/><w:iCs/><w:color w:val=\"000000\"/><w:sz w:val=\"32\"/><w:szCs w:val=\"32\"/></w:rPr><w:t xml:space=\"preserve\">ς</w:t></w:r></w:hyperlink></w:p><w:p><w:pPr><w:spacing w:after=\"200\" w:line=\"276\" w:lineRule=\"auto\"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:b/><w:bCs/><w:color w:val=\"000000\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Sentence. Ο</w:t></w:r><w:hyperlink w:history=\"1\" r:id=\"rIdpcqenc_vc9-2ar63kpc-b\"><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:i/><w:iCs/><w:color w:val=\"000000\"/><w:sz w:val=\"32\"/><w:szCs w:val=\"32\"/></w:rPr><w:t xml:space=\"preserve\">ς</w:t></w:r></w:hyperlink></w:p><w:p><w:pPr><w:spacing w:after=\"200\" w:line=\"276\" w:lineRule=\"auto\"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:b/><w:bCs/><w:color w:val=\"000000\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">toggle ο</w:t></w:r><w:hyperlink w:history=\"1\" r:id=\"rIdvd20iubxdfdsqgb5ba-jj\"><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:i/><w:iCs/><w:color w:val=\"000000\"/><w:sz w:val=\"32\"/><w:szCs w:val=\"32\"/></w:rPr><w:t xml:space=\"preserve\">ς</w:t></w:r></w:hyperlink></w:p><w:p><w:pPr><w:spacing w:after=\"200\" w:line=\"276\" w:lineRule=\"auto\"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:b/><w:bCs/><w:color w:val=\"000000\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">UPPER Ο</w:t></w:r><w:hyperlink w:history=\"1\" r:id=\"rIdshtu7p9u-8mak3s1hl-lj\"><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:i/><w:iCs/><w:color w:val=\"000000\"/><w:sz w:val=\"32\"/><w:szCs w:val=\"32\"/></w:rPr><w:t xml:space=\"preserve\">Σ</w:t></w:r></w:hyperlink></w:p><w:p><w:pPr><w:spacing w:after=\"200\" w:line=\"276\" w:lineRule=\"auto\"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:b/><w:bCs/><w:color w:val=\"000000\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">length i̇σος ß</w:t></w:r></w:p><w:sectPr><w:headerReference w:type=\"default\" r:id=\"rId6\"/><w:pgSz w:w=\"11906\" w:h=\"16838\" w:orient=\"portrait\"/><w:pgMar w:top=\"1134\" w:right=\"1134\" w:bottom=\"1134\" w:left=\"1134\" w:header=\"720\" w:footer=\"720\" w:gutter=\"0\"/><w:pgNumType/><w:docGrid w:linePitch=\"360\"/></w:sectPr></w:body></w:document>"
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
              - button "Word 文档排版 · 图片与页眉页脚" [pressed] [ref=e334] [cursor=pointer]:
                - generic [ref=e335]:
                  - generic [aria-hidden] [ref=e336]: W
                  - generic [ref=e337]:
                    - strong [ref=e338]: Word
                    - generic [ref=e339]: 文档排版 · 图片与页眉页脚
              - button "Excel 行列编辑 · 公式与图表" [ref=e340] [cursor=pointer]:
                - generic [ref=e341]:
                  - generic [aria-hidden] [ref=e342]: E
                  - generic [ref=e343]:
                    - strong [ref=e344]: Excel
                    - generic [ref=e345]: 行列编辑 · 公式与图表
              - button "PDF 全文查找 · 批注与手写" [ref=e346] [cursor=pointer]:
                - generic [ref=e347]:
                  - generic [aria-hidden] [ref=e348]: P
                  - generic [ref=e349]:
                    - strong [ref=e350]: PDF
                    - generic [ref=e351]: 全文查找 · 批注与手写
            - generic [ref=e352]:
              - generic [ref=e353]: 本地文档
              - generic [ref=e354]:
                - generic [ref=e355]: 打开本地文档
                - button "打开本地文档 Character guards.docx" [ref=e356] [cursor=pointer]:
                  - generic [ref=e357]: Character guards.docx
              - button "历史版本" [ref=e358] [cursor=pointer]
              - switch "只读预览" [ref=e360] [cursor=pointer]
            - region "Word 文档编辑器" [ref=e364]:
              - generic [ref=e365]:
                - generic [ref=e366]:
                  - generic [ref=e371]: Word
                  - generic "可编辑 · ⌘ / Ctrl S 保存" [ref=e372]:
                    - status "有未保存修改" [ref=e373]
                - textbox "文档名称" [ref=e378]: Character guards.docx
                - generic [ref=e379]:
                  - button "新建" [ref=e381] [cursor=pointer]
                  - button "导入" [ref=e384] [cursor=pointer]
                  - button "导出文件" [ref=e389] [cursor=pointer]
                  - button "打印" [ref=e395] [cursor=pointer]
                  - button "保存" [ref=e402] [cursor=pointer]
                  - button "全屏编辑" [ref=e409] [cursor=pointer]
              - generic [ref=e417]:
                - generic [ref=e418]:
                  - generic [ref=e419]:
                    - button "文件" [ref=e422] [cursor=pointer]
                    - tablist "Word 工具" [ref=e423]:
                      - tab "开始" [selected] [ref=e424] [cursor=pointer]
                      - tab "插入" [ref=e425] [cursor=pointer]
                      - tab "布局" [ref=e426] [cursor=pointer]
                      - tab "引用" [ref=e427] [cursor=pointer]
                      - tab "审阅" [ref=e428] [cursor=pointer]
                      - tab "视图" [ref=e429] [cursor=pointer]
                  - tabpanel "开始" [ref=e430]:
                    - group "剪贴板" [ref=e431]:
                      - generic [ref=e432]:
                        - button "粘贴" [ref=e433] [cursor=pointer]
                        - generic [ref=e439]:
                          - button "剪切" [ref=e440] [cursor=pointer]
                          - button "复制" [ref=e449] [cursor=pointer]
                    - button "格式刷" [ref=e456] [cursor=pointer]
                    - group "历史" [ref=e461]:
                      - generic [ref=e462]:
                        - button "撤销" [ref=e463] [cursor=pointer]
                        - button "重做" [disabled] [ref=e469]
                    - group "字体" [ref=e476]:
                      - generic [ref=e477]:
                        - generic [ref=e478]:
                          - generic [ref=e481]:
                            - combobox "字体" [ref=e482]: Arial
                            - button "展开选项" [ref=e483] [cursor=pointer]
                          - generic [ref=e488]:
                            - combobox "字号" [ref=e489]: "12"
                            - button "展开选项" [ref=e490] [cursor=pointer]
                          - button "增大字号" [ref=e493] [cursor=pointer]
                          - button "减小字号" [ref=e496] [cursor=pointer]
                        - button "字符间距与位置" [ref=e499] [cursor=pointer]
                        - generic [ref=e501]:
                          - button "粗体" [pressed] [ref=e502] [cursor=pointer]
                          - button "斜体" [ref=e507] [cursor=pointer]
                          - button "下划线" [ref=e511] [cursor=pointer]:
                            - generic [ref=e512]: U
                          - button "删除线" [ref=e514] [cursor=pointer]:
                            - generic [ref=e515]: S
                          - button "上标" [ref=e517] [cursor=pointer]:
                            - generic [ref=e518]:
                              - text: x
                              - superscript [ref=e519]: "2"
                          - button "下标" [ref=e520] [cursor=pointer]:
                            - generic [ref=e521]:
                              - text: x
                              - subscript [ref=e522]: "2"
                          - generic "文字颜色" [ref=e523]:
                            - button "文字颜色" [ref=e524] [cursor=pointer]: A
                          - button "清除格式" [ref=e526] [cursor=pointer]:
                            - generic [aria-hidden] [ref=e528]: A
                          - button "文字高亮" [ref=e530] [cursor=pointer]
                          - button "变更大小写" [ref=e535] [cursor=pointer]
                    - group "段落" [ref=e539]:
                      - generic [ref=e540]:
                        - generic [ref=e541]:
                          - button "项目符号" [ref=e542] [cursor=pointer]:
                            - generic [aria-hidden] [ref=e544]: • ≡
                          - button "编号列表" [ref=e545] [cursor=pointer]:
                            - generic [aria-hidden] [ref=e547]: 1. ≡
                          - button "列表下沉缩进" [disabled] [ref=e548]:
                            - generic [aria-hidden] [ref=e550]: 1.1 →
                          - button "列表上提缩进" [disabled] [ref=e551]:
                            - generic [aria-hidden] [ref=e553]: ← 1.1
                          - button "减少缩进" [disabled] [ref=e554]:
                            - generic [ref=e555]: ← ≡
                          - button "增加缩进" [ref=e556] [cursor=pointer]:
                            - generic [ref=e557]: ≡ →
                          - button "继续编号" [disabled] [ref=e558]
                          - textbox "编号起始值" [disabled] [ref=e561]: "1"
                          - button "重新开始编号" [disabled] [ref=e562]
                          - generic [ref=e564]:
                            - generic [ref=e565]: 编号格式
                            - button "编号格式 1, 2, 3" [disabled] [ref=e566]:
                              - generic [ref=e567]: 1, 2, 3
                          - button "多级编号定义" [ref=e568] [cursor=pointer]
                          - button "段落边框与底纹" [ref=e570] [cursor=pointer]
                          - generic [ref=e572]:
                            - generic [ref=e573]: 段落行距
                            - button "段落行距 1.15 倍行距" [ref=e574] [cursor=pointer]:
                              - generic [ref=e575]: 1.15 倍行距
                          - button "段落设置" [ref=e576] [cursor=pointer]
                          - button "制表位" [ref=e578] [cursor=pointer]
                          - button "插入制表符" [ref=e580] [cursor=pointer]
                        - generic [ref=e582]:
                          - button "左对齐" [pressed] [ref=e583] [cursor=pointer]
                          - button "居中" [ref=e586] [cursor=pointer]
                          - button "右对齐" [ref=e589] [cursor=pointer]
                          - button "两端对齐" [ref=e592] [cursor=pointer]
                          - button "显示非打印字符" [ref=e595] [cursor=pointer]:
                            - generic [aria-hidden] [ref=e597]: ¶
                    - group "样式" [ref=e599]:
                      - generic [ref=e600]:
                        - generic [ref=e601]:
                          - button "正文样式" [pressed] [ref=e602] [cursor=pointer]:
                            - generic [ref=e603]:
                              - generic [aria-hidden] [ref=e604]: AaBbCc
                              - generic [ref=e605]: 正文
                          - button "无间距样式" [ref=e606] [cursor=pointer]:
                            - generic [ref=e607]:
                              - generic [aria-hidden] [ref=e608]: AaBbCc
                              - generic [ref=e609]: 无间距
                          - button "标题 1样式" [ref=e610] [cursor=pointer]:
                            - generic [ref=e611]:
                              - generic [aria-hidden] [ref=e612]: AaBbCc
                              - generic [ref=e613]: 标题 1
                        - generic [ref=e614]:
                          - generic [ref=e615]: 段落样式
                          - button "段落样式 正文" [ref=e616] [cursor=pointer]:
                            - generic [ref=e617]: 正文
                        - generic [ref=e618]:
                          - button "新建段落样式" [ref=e619] [cursor=pointer]:
                            - generic [ref=e620]: 新建样式
                          - button "修改段落样式" [disabled] [ref=e621]:
                            - generic [ref=e622]: 修改样式
                    - group "编辑" [ref=e624]:
                      - generic [ref=e625]:
                        - button "查找与替换" [ref=e626] [cursor=pointer]:
                          - generic [ref=e631]: 查找
                        - button "文档大纲" [ref=e632] [cursor=pointer]:
                          - generic [ref=e636]: 大纲
                - generic [ref=e638]:
                  - toolbar "Word 文档工具" [ref=e639]:
                    - button "打开查找与替换" [ref=e640] [cursor=pointer]
                    - button "打开文档大纲" [ref=e645] [cursor=pointer]
                    - button "打开字数统计" [ref=e649] [cursor=pointer]
                  - generic [ref=e654]:
                    - generic "段落缩进标尺" [ref=e655]:
                      - generic [aria-hidden] [ref=e657]: "0"
                      - generic [aria-hidden] [ref=e658]: "1"
                      - generic [aria-hidden] [ref=e659]: "2"
                      - generic [aria-hidden] [ref=e660]: "3"
                      - generic [aria-hidden] [ref=e661]: "4"
                      - generic [aria-hidden] [ref=e662]: "5"
                      - generic [aria-hidden] [ref=e663]: "6"
                      - generic [aria-hidden] [ref=e664]: "7"
                      - generic [aria-hidden] [ref=e665]: "8"
                      - generic [aria-hidden] [ref=e666]: "9"
                      - generic [aria-hidden] [ref=e667]: "10"
                      - generic [aria-hidden] [ref=e668]: "11"
                      - generic [aria-hidden] [ref=e669]: "12"
                      - generic [aria-hidden] [ref=e670]: "13"
                      - generic [aria-hidden] [ref=e671]: "14"
                      - generic [aria-hidden] [ref=e672]: "15"
                      - generic [aria-hidden] [ref=e673]: "16"
                      - generic [aria-hidden] [ref=e674]: "17"
                      - slider "首行缩进标尺" [ref=e675] [cursor=pointer]
                      - slider "悬挂缩进标尺" [ref=e677] [cursor=pointer]
                      - slider "左缩进标尺" [ref=e679] [cursor=pointer]
                      - slider "右缩进标尺" [ref=e681] [cursor=pointer]
                    - generic [ref=e683]:
                      - generic [aria-hidden]:
                        - generic [aria-hidden]: "0"
                        - generic [aria-hidden]: "1"
                        - generic [aria-hidden]: "2"
                        - generic [aria-hidden]: "3"
                        - generic [aria-hidden]: "4"
                        - generic [aria-hidden]: "5"
                        - generic [aria-hidden]: "6"
                        - generic [aria-hidden]: "7"
                        - generic [aria-hidden]: "8"
                        - generic [aria-hidden]: "9"
                        - generic [aria-hidden]: "10"
                        - generic [aria-hidden]: "11"
                        - generic [aria-hidden]: "12"
                        - generic [aria-hidden]: "13"
                        - generic [aria-hidden]: "14"
                        - generic [aria-hidden]: "15"
                        - generic [aria-hidden]: "16"
                        - generic [aria-hidden]: "17"
                        - generic [aria-hidden]: "18"
                        - generic [aria-hidden]: "19"
                        - generic [aria-hidden]: "20"
                        - generic [aria-hidden]: "21"
                        - generic [aria-hidden]: "22"
                        - generic [aria-hidden]: "23"
                        - generic [aria-hidden]: "24"
                        - generic [aria-hidden]: "25"
                      - article "文档纸张" [ref=e684]:
                        - region "页眉区域" [ref=e685]:
                          - textbox "Word 页眉" [ref=e687]:
                            - paragraph [ref=e688]: H
                        - textbox "Word 文档正文" [ref=e690]:
                          - paragraph [ref=e691]: Word character guard sample
                          - paragraph [ref=e692]:
                            - strong [ref=e694]: SOURCE
                          - paragraph [ref=e695]:
                            - strong [ref=e697]: target
                          - paragraph [ref=e698]:
                            - strong [ref=e700]: lower ο
                            - link [ref=e701]:
                              - /url: https://example.com/lower
                              - emphasis [ref=e703]: ς
                          - paragraph [ref=e704]:
                            - strong [ref=e706]: Title Ο
                            - link [ref=e707]:
                              - /url: https://example.com/title
                              - emphasis [ref=e709]: ς
                          - paragraph [ref=e710]:
                            - strong [ref=e712]: Sentence. Ο
                            - link [ref=e713]:
                              - /url: https://example.com/sentence
                              - emphasis [ref=e715]: ς
                          - paragraph [ref=e716]:
                            - strong [ref=e718]: toggle ο
                            - link [ref=e719]:
                              - /url: https://example.com/toggle
                              - emphasis [ref=e721]: ς
                          - paragraph [ref=e722]:
                            - strong [ref=e724]: UPPER Ο
                            - link [ref=e725]:
                              - /url: https://example.com/upper
                              - emphasis [ref=e727]: Σ
                          - paragraph [ref=e728]:
                            - strong [ref=e730]: length i̇σος ß
                        - region "页脚区域" [ref=e731]
                - generic [ref=e732]:
                  - generic [ref=e733]: 88 字 · A4 · 纵向
                  - status [ref=e734]: 已应用字符间距与位置，可撤销恢复。
                  - generic [ref=e735]:
                    - generic [ref=e736]: 缩放
                    - generic [ref=e737]:
                      - generic [ref=e738]: Word 缩放
                      - button "Word 缩放 适应宽度" [ref=e739] [cursor=pointer]:
                        - generic [ref=e740]: 适应宽度
            - paragraph [ref=e741]: 文件保存在当前浏览器的本地文档空间。需要长期留存时，请导出文件。
          - group [ref=e742]:
            - generic "示例代码" [ref=e743] [cursor=pointer]:
              - generic [aria-hidden] [ref=e744]: </>
              - text: 示例代码
              - generic [aria-hidden] [ref=e745]: 展开 / 收起
        - heading "编辑能力" [level=2] [ref=e746]
        - table [ref=e748]:
          - rowgroup [ref=e749]:
            - row [ref=e750]:
              - columnheader "文档" [ref=e751]
              - columnheader "支持的操作" [ref=e752]
              - columnheader "当前范围" [ref=e753]
          - rowgroup [ref=e754]:
            - row [ref=e755]:
              - cell "Word" [ref=e756]
              - cell "字体与小数字号输入、正文排版、列表、表格、图片、页眉页脚、页码、查找替换、页面设置、撤销重做；导入与导出 DOCX" [ref=e757]
              - cell "支持内嵌图片与单节文档。修订、目录、浮动对象等复杂结构会提示暂不支持。" [ref=e758]
            - row [ref=e759]:
              - cell "Excel" [ref=e760]
              - cell "单元格与矩形选区、字体与小数字号输入、手动与自动行高/列宽、查找替换、边框与垂直对齐、清除格式、公式和跨表引用、格式、复制粘贴、工作表增删、行列插入删除、合并、冻结、排序、筛选、柱状图与折线图；导入与导出 XLSX" [ref=e761]
              - cell "10,000 行、256 列、32 张表、100,000 个已使用单元格。透视、宏、数组公式及复杂图表暂不支持。" [ref=e762]
            - row [ref=e763]:
              - cell "PDF" [ref=e764]
              - cell "分页与缩略图、缩放、旋转、全文查找、文字与高亮、矩形和手写批注、已有表单、撤销重做；导出 PDF" [ref=e765]
              - cell "批注和表单编辑。任意原始文字修改、原文重排及扫描件 OCR 暂不支持。" [ref=e766]
        - heading "组件接入" [level=2] [ref=e767]
        - paragraph [ref=e768]: UI 组件使用 Tiptap / ProseMirror 和公式计算库；文件适配使用 docx、ExcelJS、pdf-lib 与 PDF.js。本页无需文档服务器。宿主可以替换保存与导入导出回调，接入自己的文件系统。
        - paragraph [ref=e769]:
          - text: PDF 的 worker、字体与渲染由
          - code [ref=e770]: pdfRenderer
          - text: 提供。本页的适配代码位于
          - code [ref=e771]: docs/src/pages/collaboration/office-studio/
          - text: 。组件自 v0.4.0 起随
          - code [ref=e772]: "@zuvi/react"
          - text: 和 Registry 发布。
        - region "组件属性表，可横向滚动" [ref=e773]:
          - table [ref=e774]:
            - rowgroup [ref=e775]:
              - row [ref=e776]:
                - columnheader "属性名" [ref=e777]
                - columnheader "类型" [ref=e778]
                - columnheader "默认值" [ref=e779]
                - columnheader "说明" [ref=e780]
            - rowgroup [ref=e781]:
              - row [ref=e782]:
                - cell "value / defaultValue" [ref=e783]
                - cell [ref=e784]:
                  - code [ref=e785]: OfficeStudioDocument
                - cell [ref=e786]:
                  - code [ref=e787]: —
                - cell "受控文档或非受控初始文档；支持 Word、Excel、PDF 三种模型。" [ref=e788]
              - row [ref=e789]:
                - cell "onChange" [ref=e790]
                - cell [ref=e791]:
                  - code [ref=e792]: (document) => void
                - cell [ref=e793]:
                  - code [ref=e794]: —
                - cell "内容或文件名称变化。" [ref=e795]
              - row [ref=e796]:
                - cell "source / pdfRenderer" [ref=e797]
                - cell [ref=e798]:
                  - code [ref=e799]: Blob / StudioPdfRenderer
                - cell [ref=e800]:
                  - code [ref=e801]: —
                - cell "原始文件及 PDF 渲染适配；worker 资源由宿主管理。" [ref=e802]
              - row [ref=e803]:
                - cell "onSave / onExport / onPrint" [ref=e804]
                - cell [ref=e805]:
                  - code [ref=e806]: (document) => void | Promise<void>
                - cell [ref=e807]:
                  - code [ref=e808]: —
                - cell "宿主处理保存、导出或打印；返回后更新状态，失败可重试。" [ref=e809]
              - row [ref=e810]:
                - cell "onImport / onCreate" [ref=e811]
                - cell [ref=e812]:
                  - code [ref=e813]: (file | kind) => void | Promise<void>
                - cell [ref=e814]:
                  - code [ref=e815]: —
                - cell "宿主解析文件或创建模型，并更新受控值。" [ref=e816]
              - row [ref=e817]:
                - cell "readOnly / disabled" [ref=e818]
                - cell [ref=e819]:
                  - code [ref=e820]: boolean
                - cell [ref=e821]:
                  - code [ref=e822]: "false"
                - cell "只读预览或禁用编辑与文件操作。" [ref=e823]
              - row [ref=e824]:
                - cell "saveState" [ref=e825]
                - cell [ref=e826]:
                  - code [ref=e827]: "'saved' | 'saving' | 'unsaved' | 'error'"
                - cell [ref=e828]:
                  - code [ref=e829]: —
                - cell "宿主自动保存状态。" [ref=e830]
              - row [ref=e831]:
                - cell "height" [ref=e832]
                - cell [ref=e833]:
                  - code [ref=e834]: number | string
                - cell [ref=e835]:
                  - code [ref=e836]: "760"
                - cell "编辑器高度；100% 需要父容器设置确定高度。" [ref=e837]
              - row [ref=e838]:
                - cell "fullscreen / onFullscreenChange" [ref=e839]
                - cell [ref=e840]:
                  - code [ref=e841]: boolean / (value) => void
                - cell [ref=e842]:
                  - code [ref=e843]: —
                - cell "全屏布局，切换时编辑内容保持挂载。" [ref=e844]
              - row [ref=e845]:
                - cell "ref" [ref=e846]
                - cell [ref=e847]:
                  - code [ref=e848]: OfficeStudioHandle
                - cell [ref=e849]:
                  - code [ref=e850]: —
                - cell "getDocument()、save()、export()、print()、setFullscreen()。" [ref=e851]
              - row [ref=e852]:
                - cell "classNames" [ref=e853]
                - cell [ref=e854]:
                  - code [ref=e855]: "{ root?; header?; title?; actions?; stage?; status?; error? }"
                - cell [ref=e856]:
                  - code [ref=e857]: —
                - cell "追加语义结构类名，配合 data-part 与 CSS 变量定制。" [ref=e858]
  - text: ✓ ✓ ✓ ✓ ✓
```

# Test source

```ts
  1   | import { expect, test, type Page, type Locator } from '@playwright/test';
  2   | import { readFile, writeFile } from 'node:fs/promises';
  3   | import { createHash } from 'node:crypto';
  4   | import path from 'node:path';
  5   | import JSZip from '../docs/node_modules/jszip/lib/index.js';
  6   | import type { StudioRichNode } from '../packages/ui/src/components/OfficeStudio/studio-types';
  7   | 
  8   | const audit = path.resolve('docs/audits/2026-11-27/word-character-guards');
  9   | async function snapshot(node: Locator) {
  10  |   return node.evaluate(element => (element as HTMLElement & { editor: { getJSON(): StudioRichNode } }).editor.getJSON());
  11  | }
  12  | async function select(node: Locator) {
  13  |   await node.evaluate(element => {
  14  |     (element.closest('[contenteditable="true"]') as HTMLElement).focus();
  15  |     const range = document.createRange(); range.selectNodeContents(element);
  16  |     const selection = window.getSelection()!; selection.removeAllRanges(); selection.addRange(range);
  17  |     document.dispatchEvent(new Event('selectionchange'));
  18  |   });
  19  | }
  20  | async function compose(node: Locator, start: boolean) {
  21  |   await node.evaluate((element, begin) => element.dispatchEvent(new CompositionEvent(begin ? 'compositionstart' : 'compositionend', { bubbles: true })), start);
  22  | }
  23  | async function imported(page: Page, bytes: Buffer, name: string) {
  24  |   await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: bytes });
  25  |   await expect(page.getByRole('textbox', { name: 'Word 文档正文', exact: true })).toContainText('Word character guard sample');
  26  | }
  27  | async function exported(page: Page, name: string) {
  28  |   const pending = page.waitForEvent('download'); await page.getByRole('button', { name: '导出文件', exact: true }).click();
  29  |   const bytes = await readFile((await (await pending).path())!); await writeFile(path.join(audit, name), bytes); return bytes;
  30  | }
  31  | 
  32  | test('guards character operations during IME, steps a shared empty header and saves all five Unicode case modes through two real DOCX reopens', async ({ page }) => {
  33  |   test.setTimeout(180000);
  34  |   const sourceBytes = await readFile(path.join(audit, 'source.docx')), errors: string[] = [];
  35  |   page.on('pageerror', error => errors.push(error.message));
  36  |   await page.goto('/#/components/office-studio'); await imported(page, sourceBytes, 'Character guards.docx');
  37  |   const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  38  |   const source = body.locator('p').filter({ hasText: /^SOURCE$/ }), target = body.locator('p').filter({ hasText: /^target$/ });
  39  |   await select(source); const original = await snapshot(body);
  40  |   await compose(body, true); await page.getByRole('button', { name: '清除格式', exact: true }).click();
  41  |   expect(await snapshot(body)).toEqual(original); await compose(body, false);
  42  |   await page.getByRole('button', { name: '清除格式', exact: true }).click(); await expect(source.locator('strong')).toHaveCount(0);
  43  |   await page.getByRole('button', { name: '撤销', exact: true }).click(); expect(await snapshot(body)).toEqual(original);
  44  |   await page.getByRole('button', { name: '格式刷', exact: true }).click(); await compose(body, true); await select(target);
  45  |   expect(await snapshot(body)).toEqual(original); await compose(body, false);
  46  |   await select(source); await select(target); await expect(target.locator('strong')).toHaveText('target');
  47  |   await expect(target).toHaveCSS('text-align', 'right');
  48  |   await page.getByRole('button', { name: '字符间距与位置', exact: true }).click();
  49  |   const dialog = page.getByRole('dialog', { name: '字符间距与位置', exact: true });
  50  |   await dialog.getByRole('button', { name: /^字符间距 / }).click(); await page.getByRole('option', { name: '加宽', exact: true }).click();
  51  |   const amount = dialog.getByLabel('字符间距量（pt）', { exact: true });
  52  |   const beforeMetrics = await snapshot(body); await compose(amount, true); await amount.fill('0.3');
  53  |   await expect(dialog.getByRole('button', { name: '应用字符格式', exact: true })).toBeDisabled(); expect(await snapshot(body)).toEqual(beforeMetrics);
  54  |   await compose(amount, false); await dialog.getByRole('button', { name: '字符位置 标准', exact: true }).click(); await page.getByRole('option', { name: '降低', exact: true }).click();
  55  |   await dialog.getByLabel('字符位置量（pt）', { exact: true }).fill('1.5'); await dialog.getByRole('button', { name: '应用字符格式', exact: true }).click();
  56  |   await expect(target.locator('span')).toHaveAttribute('data-word-letterspacing', '0.3pt');
  57  |   await expect(target.locator('span')).toHaveAttribute('data-word-baselineshift', '-1.5pt');
  58  |   await page.getByLabel('页眉区域', { exact: true }).dblclick();
  59  |   const header = page.getByRole('textbox', { name: 'Word 页眉', exact: true }); await expect(header).toHaveAttribute('contenteditable', 'true');
  60  |   await header.click(); await page.getByRole('tab', { name: '开始', exact: true }).click();
  61  |   await expect(page.getByRole('combobox', { name: '字号', exact: true })).toHaveValue('14');
  62  |   await page.getByRole('button', { name: '增大字号', exact: true }).click();
  63  |   await expect(page.getByRole('combobox', { name: '字号', exact: true })).toHaveValue('16');
  64  |   await header.pressSequentially('H'); await expect(header.locator('span')).toHaveCSS('font-size', '21.3333px');
  65  |   await body.dblclick(); await expect(body).toHaveAttribute('contenteditable', 'true');
  66  |   await page.getByRole('tab', { name: '开始', exact: true }).click();
  67  |   const modes = [
  68  |     { prefix: /^lower /i, mode: '全部小写', text: 'lower ος' },
  69  |     { prefix: /^title /i, mode: '每个单词首字母大写', text: 'Title Ος' },
  70  |     { prefix: /^sentence\./i, mode: '句首字母大写', text: 'Sentence. Ος' },
  71  |     { prefix: /^toggle /i, mode: '切换大小写', text: 'toggle ος' },
  72  |     { prefix: /^upper /i, mode: '全部大写', text: 'UPPER ΟΣ' },
  73  |   ];
  74  |   for (const item of modes) {
  75  |     const paragraph = body.locator('p').filter({ hasText: item.prefix }); await select(paragraph);
  76  |     await page.getByRole('button', { name: '变更大小写', exact: true }).click(); await page.getByRole('menuitem', { name: item.mode, exact: true }).click();
  77  |     await expect(paragraph).toHaveText(item.text); await expect(paragraph.locator('a')).toHaveCount(1);
  78  |   }
  79  |   const length = body.locator('p').filter({ hasText: /^length /i }); await select(length);
  80  |   await page.getByRole('button', { name: '变更大小写', exact: true }).click(); await page.getByRole('menuitem', { name: '全部小写', exact: true }).click();
  81  |   await expect(length).toHaveText('length i\u0307σος ß');
  82  |   const expected = await snapshot(body), rounds = [];
  83  |   for (let round = 1; round <= 2; round++) {
  84  |     const bytes = await exported(page, `roundtrip-${round}.docx`), zip = await JSZip.loadAsync(bytes);
  85  |     const xml = await zip.file('word/document.xml')!.async('string');
  86  |     const texts = await page.evaluate(source => Array.from(new DOMParser().parseFromString(source, 'application/xml').getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 't')).map(node => node.textContent).join(''), xml);
  87  |     for (const item of modes) expect(texts).toContain(item.text); expect(texts).toContain('length i\u0307σος ß');
> 88  |     expect(xml).toContain('w:spacing w:val="6"'); expect(xml).toContain('w:position w:val="-3"');
      |                                                               ^ Error: expect(received).toContain(expected) // indexOf
  89  |     const relationships = await zip.file('word/_rels/document.xml.rels')!.async('string');
  90  |     for (const label of ['lower', 'title', 'sentence', 'toggle', 'upper']) expect(relationships).toContain(`https://example.com/${label}`);
  91  |     await imported(page, bytes, `Reopened-${round}.docx`); await expect(body).toContainText('length i\u0307σος ß');
  92  |     await expect(page.getByRole('textbox', { name: 'Word 页眉', exact: true })).toContainText('H');
  93  |     await expect(target.locator('span')).toHaveAttribute('data-word-letterspacing', '0.3pt');
  94  |     rounds.push({ round, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), texts });
  95  |   }
  96  |   await page.screenshot({ path: path.join(audit, 'results-light.png'), fullPage: true, animations: 'disabled' });
  97  |   await page.getByRole('button', { name: '切换暗色', exact: true }).click(); await page.screenshot({ path: path.join(audit, 'results-dark.png'), fullPage: true, animations: 'disabled' });
  98  |   await page.setViewportSize({ width: 320, height: 720 });
  99  |   await select(target); await page.getByRole('button', { name: '字符间距与位置', exact: true }).click();
  100 |   await expect(page.getByRole('dialog').getByRole('button', { name: '应用字符格式', exact: true })).toBeInViewport();
  101 |   await page.screenshot({ path: path.join(audit, 'metrics-dark-320.png'), fullPage: true, animations: 'disabled' });
  102 |   await page.getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click();
  103 |   await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  104 |   for (const name of ['增大字号', '减小字号', '变更大小写', '格式刷', '清除格式', '字符间距与位置']) await expect(page.getByRole('button', { name, exact: true })).toBeDisabled();
  105 |   expect(errors).toEqual([]); await writeFile(path.join(audit, 'browser-roundtrips.json'), JSON.stringify({ expected, rounds, errors }, null, 2) + '\n');
  106 | });
  107 | 
```