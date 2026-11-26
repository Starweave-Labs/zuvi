# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-pdf-pages.spec.ts >> moves native page references by dragging a thumbnail after the final page
- Location: e2e/office-studio-pdf-pages.spec.ts:52:1

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 1

  Array [
-   "6 0 R",
    "5 0 R",
+   "6 0 R",
  ]
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
              - button "Word 文档排版 · 图片与页眉页脚" [ref=e334] [cursor=pointer]:
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
              - button "PDF 全文查找 · 批注与手写" [pressed] [ref=e346] [cursor=pointer]:
                - generic [ref=e347]:
                  - generic [aria-hidden] [ref=e348]: P
                  - generic [ref=e349]:
                    - strong [ref=e350]: PDF
                    - generic [ref=e351]: 全文查找 · 批注与手写
            - generic [ref=e352]:
              - generic [ref=e353]: 本地文档
              - generic [ref=e354]:
                - generic [ref=e355]: 打开本地文档
                - button "打开本地文档 Pages.pdf" [ref=e356] [cursor=pointer]:
                  - generic [ref=e357]: Pages.pdf
              - button "历史版本" [ref=e358] [cursor=pointer]
              - switch "只读预览" [ref=e360] [cursor=pointer]
            - region "PDF 文档编辑器" [ref=e364]:
              - generic [ref=e365]:
                - generic [ref=e366]:
                  - generic [ref=e371]: PDF
                  - generic "可编辑 · ⌘ / Ctrl S 保存" [ref=e372]:
                    - status "已保存" [ref=e373]
                - textbox "文档名称" [ref=e378]: Pages.pdf
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
                    - tablist "PDF 功能区选项卡" [ref=e423]:
                      - tab "开始" [selected] [ref=e424] [cursor=pointer]
                      - tab "批注" [ref=e425] [cursor=pointer]
                  - group "PDF 编辑工具栏" [ref=e426]:
                    - group "编辑" [ref=e427]:
                      - generic [ref=e428]:
                        - generic [ref=e429]:
                          - button "撤销" [disabled] [ref=e430]
                          - button "重做" [disabled] [ref=e432]
                        - button "选择" [pressed] [ref=e434] [cursor=pointer]
                      - generic [aria-hidden] [ref=e439]: 编辑
                    - tabpanel "开始" [ref=e440]:
                      - group "插入" [ref=e441]:
                        - generic [ref=e442]:
                          - button "文字" [ref=e443] [cursor=pointer]
                          - button "矩形" [ref=e448] [cursor=pointer]
                          - button "新建表单字段" [ref=e456] [cursor=pointer]
                        - generic [aria-hidden] [ref=e458]: 插入
                      - group "页面" [ref=e459]:
                        - generic [ref=e460]:
                          - button "插入空白页" [ref=e461] [cursor=pointer]
                          - button "删除所选页" [ref=e463] [cursor=pointer]
                          - button "移动所选页" [ref=e465] [cursor=pointer]
                          - button "复制所选页" [ref=e467] [cursor=pointer]
                          - button "旋转所选页" [ref=e469] [cursor=pointer]
                          - button "页面尺寸" [ref=e471] [cursor=pointer]
                          - button "旋转当前页" [ref=e473] [cursor=pointer]
                          - button "页面" [pressed] [ref=e479] [cursor=pointer]
                        - generic [aria-hidden] [ref=e485]: 页面
                      - group "查看" [ref=e486]:
                        - generic [ref=e487]:
                          - button "查找" [ref=e488] [cursor=pointer]
                          - button "PDF 批注与表单侧栏" [pressed] [ref=e494] [cursor=pointer]:
                            - generic [ref=e499]: 侧栏
                        - generic [aria-hidden] [ref=e500]: 查看
                - generic [ref=e501]:
                  - navigation "PDF 侧边导航" [ref=e502]:
                    - button "PDF 文本查找侧栏" [ref=e503] [cursor=pointer]
                    - button "PDF 批注侧栏" [ref=e508] [cursor=pointer]
                    - button "PDF 页面缩略图侧栏" [pressed] [ref=e512] [cursor=pointer]
                    - button "PDF 表单侧栏" [ref=e517] [cursor=pointer]
                  - region "PDF 页面编辑区" [ref=e522]:
                    - generic [ref=e523]:
                      - img "PDF 第 1 页原文" [ref=e524]
                      - img "PDF 页面标注" [ref=e525]
                      - textbox "PDF 页面表单 shared" [ref=e529]: Source
                    - generic [ref=e530]: 第 1 页 · 100%
                  - complementary "PDF 批注与表单" [ref=e531]:
                    - group "PDF 侧栏内容" [ref=e532]:
                      - button "批注 0" [ref=e533] [cursor=pointer]
                      - button "表单 1" [ref=e535] [cursor=pointer]
                      - button "文本查找" [ref=e537] [cursor=pointer]
                      - button "页面缩略图" [pressed] [ref=e539] [cursor=pointer]
                    - generic "PDF 页面缩略导航" [ref=e541]:
                      - generic [ref=e542]:
                        - checkbox "选择 PDF 第 1 页" [checked] [ref=e544] [cursor=pointer]
                        - button "PDF 第 1 页缩略图" [pressed] [ref=e546] [cursor=pointer]:
                          - generic [ref=e547]: 第 1 页
                      - generic [ref=e551]:
                        - checkbox "选择 PDF 第 2 页" [ref=e553] [cursor=pointer]
                        - button "PDF 第 2 页缩略图" [ref=e555] [cursor=pointer]:
                          - generic [ref=e556]: 第 2 页
                - group "PDF 状态栏" [ref=e560]:
                  - group "PDF 页面导航" [ref=e561]:
                    - button "PDF 上一页" [disabled] [ref=e562]
                    - generic [ref=e566]:
                      - spinbutton "PDF 跳转页" [ref=e567]: "1"
                      - generic [ref=e568]:
                        - button "增加" [ref=e569] [cursor=pointer]:
                          - generic [aria-hidden] [ref=e570]: +
                        - button "减少" [disabled] [ref=e571]:
                          - generic [aria-hidden] [ref=e572]: −
                    - generic [ref=e573]: / 2
                    - button "PDF 下一页" [ref=e574] [cursor=pointer]
                  - generic "选择工具。PDF 原有正文保持原版式；可编辑新增批注和原文件的可填写表单。" [ref=e578]: 选择工具
                  - group "PDF 视图缩放" [ref=e579]:
                    - button "PDF 缩小视图" [ref=e580] [cursor=pointer]
                    - generic [ref=e585]:
                      - generic [ref=e586]: PDF 缩放
                      - button "PDF 缩放 100%" [ref=e587] [cursor=pointer]:
                        - generic [ref=e588]: 100%
                    - button "PDF 放大视图" [ref=e589] [cursor=pointer]
            - paragraph [ref=e594]: 文件保存在当前浏览器的本地文档空间。需要长期留存时，请导出文件。
          - group [ref=e595]:
            - generic "示例代码" [ref=e596] [cursor=pointer]:
              - generic [aria-hidden] [ref=e597]: </>
              - text: 示例代码
              - generic [aria-hidden] [ref=e598]: 展开 / 收起
        - heading "编辑能力" [level=2] [ref=e599]
        - table [ref=e601]:
          - rowgroup [ref=e602]:
            - row [ref=e603]:
              - columnheader "文档" [ref=e604]
              - columnheader "支持的操作" [ref=e605]
              - columnheader "当前范围" [ref=e606]
          - rowgroup [ref=e607]:
            - row [ref=e608]:
              - cell "Word" [ref=e609]
              - cell "字体与小数字号输入、正文排版、列表、表格、图片、页眉页脚、页码、查找替换、页面设置、撤销重做；导入与导出 DOCX" [ref=e610]
              - cell "支持内嵌图片与单节文档。修订、目录、浮动对象等复杂结构会提示暂不支持。" [ref=e611]
            - row [ref=e612]:
              - cell "Excel" [ref=e613]
              - cell "单元格与矩形选区、字体与小数字号输入、手动与自动行高/列宽、查找替换、边框与垂直对齐、清除格式、公式和跨表引用、格式、复制粘贴、工作表增删、行列插入删除、合并、冻结、排序、筛选、柱状图与折线图；导入与导出 XLSX" [ref=e614]
              - cell "10,000 行、256 列、32 张表、100,000 个已使用单元格。透视、宏、数组公式及复杂图表暂不支持。" [ref=e615]
            - row [ref=e616]:
              - cell "PDF" [ref=e617]
              - cell "分页与缩略图、缩放、旋转、全文查找、文字与高亮、矩形和手写批注、已有表单、撤销重做；导出 PDF" [ref=e618]
              - cell "批注和表单编辑。任意原始文字修改、原文重排及扫描件 OCR 暂不支持。" [ref=e619]
        - heading "组件接入" [level=2] [ref=e620]
        - paragraph [ref=e621]: UI 组件使用 Tiptap / ProseMirror 和公式计算库；文件适配使用 docx、ExcelJS、pdf-lib 与 PDF.js。本页无需文档服务器。宿主可以替换保存与导入导出回调，接入自己的文件系统。
        - paragraph [ref=e622]:
          - text: PDF 的 worker、字体与渲染由
          - code [ref=e623]: pdfRenderer
          - text: 提供。本页的适配代码位于
          - code [ref=e624]: docs/src/pages/collaboration/office-studio/
          - text: 。组件自 v0.4.0 起随
          - code [ref=e625]: "@zuvi/react"
          - text: 和 Registry 发布。
        - region "组件属性表，可横向滚动" [ref=e626]:
          - table [ref=e627]:
            - rowgroup [ref=e628]:
              - row [ref=e629]:
                - columnheader "属性名" [ref=e630]
                - columnheader "类型" [ref=e631]
                - columnheader "默认值" [ref=e632]
                - columnheader "说明" [ref=e633]
            - rowgroup [ref=e634]:
              - row [ref=e635]:
                - cell "value / defaultValue" [ref=e636]
                - cell [ref=e637]:
                  - code [ref=e638]: OfficeStudioDocument
                - cell [ref=e639]:
                  - code [ref=e640]: —
                - cell "受控文档或非受控初始文档；支持 Word、Excel、PDF 三种模型。" [ref=e641]
              - row [ref=e642]:
                - cell "onChange" [ref=e643]
                - cell [ref=e644]:
                  - code [ref=e645]: (document) => void
                - cell [ref=e646]:
                  - code [ref=e647]: —
                - cell "内容或文件名称变化。" [ref=e648]
              - row [ref=e649]:
                - cell "source / pdfRenderer" [ref=e650]
                - cell [ref=e651]:
                  - code [ref=e652]: Blob / StudioPdfRenderer
                - cell [ref=e653]:
                  - code [ref=e654]: —
                - cell "原始文件及 PDF 渲染适配；worker 资源由宿主管理。" [ref=e655]
              - row [ref=e656]:
                - cell "onSave / onExport / onPrint" [ref=e657]
                - cell [ref=e658]:
                  - code [ref=e659]: (document) => void | Promise<void>
                - cell [ref=e660]:
                  - code [ref=e661]: —
                - cell "宿主处理保存、导出或打印；返回后更新状态，失败可重试。" [ref=e662]
              - row [ref=e663]:
                - cell "onImport / onCreate" [ref=e664]
                - cell [ref=e665]:
                  - code [ref=e666]: (file | kind) => void | Promise<void>
                - cell [ref=e667]:
                  - code [ref=e668]: —
                - cell "宿主解析文件或创建模型，并更新受控值。" [ref=e669]
              - row [ref=e670]:
                - cell "readOnly / disabled" [ref=e671]
                - cell [ref=e672]:
                  - code [ref=e673]: boolean
                - cell [ref=e674]:
                  - code [ref=e675]: "false"
                - cell "只读预览或禁用编辑与文件操作。" [ref=e676]
              - row [ref=e677]:
                - cell "saveState" [ref=e678]
                - cell [ref=e679]:
                  - code [ref=e680]: "'saved' | 'saving' | 'unsaved' | 'error'"
                - cell [ref=e681]:
                  - code [ref=e682]: —
                - cell "宿主自动保存状态。" [ref=e683]
              - row [ref=e684]:
                - cell "height" [ref=e685]
                - cell [ref=e686]:
                  - code [ref=e687]: number | string
                - cell [ref=e688]:
                  - code [ref=e689]: "760"
                - cell "编辑器高度；100% 需要父容器设置确定高度。" [ref=e690]
              - row [ref=e691]:
                - cell "fullscreen / onFullscreenChange" [ref=e692]
                - cell [ref=e693]:
                  - code [ref=e694]: boolean / (value) => void
                - cell [ref=e695]:
                  - code [ref=e696]: —
                - cell "全屏布局，切换时编辑内容保持挂载。" [ref=e697]
              - row [ref=e698]:
                - cell "ref" [ref=e699]
                - cell [ref=e700]:
                  - code [ref=e701]: OfficeStudioHandle
                - cell [ref=e702]:
                  - code [ref=e703]: —
                - cell "getDocument()、save()、export()、print()、setFullscreen()。" [ref=e704]
              - row [ref=e705]:
                - cell "classNames" [ref=e706]
                - cell [ref=e707]:
                  - code [ref=e708]: "{ root?; header?; title?; actions?; stage?; status?; error? }"
                - cell [ref=e709]:
                  - code [ref=e710]: —
                - cell "追加语义结构类名，配合 data-part 与 CSS 变量定制。" [ref=e711]
  - text: ✓ ✓
```

# Test source

```ts
  1  | import { expect, test, type Page } from '@playwright/test';
  2  | import { mkdir, readFile, writeFile } from 'node:fs/promises';
  3  | import path from 'node:path';
  4  | import { PDFDocument, StandardFonts, degrees } from '../docs/node_modules/pdf-lib/cjs/index.js';
  5  | const audit = path.resolve('docs/audits/2026-11-26/pdf-pages');
  6  | async function open(page: Page) {
  7  |   await mkdir(audit, { recursive: true });
  8  |   const pdf = await PDFDocument.create(), font = await pdf.embedFont(StandardFonts.Helvetica);
  9  |   const first = pdf.addPage([400, 500]), second = pdf.addPage([300, 400]); first.setRotation(degrees(90));
  10 |   first.drawText('Original first page', { x: 40, y: 440, size: 18, font }); second.drawText('Original second page', { x: 40, y: 340, size: 16, font });
  11 |   const field = pdf.getForm().createTextField('shared'); field.setText('Source'); field.addToPage(first, { x: 40, y: 380, width: 120, height: 24, font }); field.addToPage(second, { x: 40, y: 280, width: 120, height: 24, font });
  12 |   const bytes = Buffer.from(await pdf.save({ updateFieldAppearances: false })); await writeFile(path.join(audit, 'pages-source.pdf'), bytes);
  13 |   await page.goto('/#/components/office-studio'); await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name: 'Pages.pdf', mimeType: 'application/pdf', buffer: bytes });
  14 |   await expect(page.getByLabel('PDF 页面表单 shared', { exact: true })).toHaveValue('Source'); return pdf;
  15 | }
  16 | async function exported(page: Page, name: string) {
  17 |   const pending = page.waitForEvent('download'); await page.getByRole('button', { name: '导出文件', exact: true }).click();
  18 |   const bytes = await readFile((await (await pending).path())!); await writeFile(path.join(audit, name), bytes); return bytes;
  19 | }
  20 | test('edits native PDF page dimensions, copies and removes pages, and preserves fields through history and two reopens', async ({ page }) => {
  21 |   test.setTimeout(90000); await open(page);
  22 |   await page.getByRole('button', { name: '插入空白页', exact: true }).click();
  23 |   let dialog = page.getByRole('dialog', { name: '插入 PDF 空白页', exact: true });
  24 |   await dialog.getByLabel('PDF 页面宽度').fill('320'); await dialog.getByLabel('PDF 页面高度').fill('480'); await dialog.getByLabel('PDF 页面插入位置').fill('2'); await dialog.getByRole('button', { name: '应用 PDF 页面操作' }).click();
  25 |   await page.getByRole('button', { name: '页面缩略图', exact: true }).click(); await expect(page.getByRole('button', { name: /PDF 第 \d+ 页缩略图/ })).toHaveCount(3);
  26 |   await page.getByRole('button', { name: 'PDF 第 2 页缩略图', exact: true }).click();
  27 |   const paper = page.locator('.zuvi-studio-pdf-paper'); await expect(paper).toBeVisible(); await expect(paper).toHaveCSS('width', '320px'); await expect(paper).toHaveCSS('height', '480px');
  28 |   const blank = await paper.locator('canvas').evaluate(element => { const canvas = element as HTMLCanvasElement; return Array.from(canvas.getContext('2d')!.getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data); }); expect(blank).toEqual([255, 255, 255, 255]);
  29 |   await page.getByRole('button', { name: '撤销', exact: true }).click(); await expect(page.getByRole('button', { name: /PDF 第 \d+ 页缩略图/ })).toHaveCount(2);
  30 |   await page.getByRole('button', { name: '重做', exact: true }).click(); await expect(page.getByRole('button', { name: /PDF 第 \d+ 页缩略图/ })).toHaveCount(3);
  31 |   await page.getByLabel('选择 PDF 第 2 页').uncheck(); await page.getByLabel('选择 PDF 第 1 页').check(); await page.getByLabel('选择 PDF 第 3 页').check(); await page.getByRole('button', { name: '旋转所选页', exact: true }).click();
  32 |   await page.getByLabel('选择 PDF 第 1 页').uncheck(); await page.getByLabel('选择 PDF 第 3 页').uncheck(); await page.getByLabel('选择 PDF 第 2 页').check();
  33 |   await page.getByRole('button', { name: '页面尺寸', exact: true }).click(); dialog = page.getByRole('dialog', { name: '修改 PDF 页面尺寸', exact: true }); await dialog.getByRole('button', { name: '交换宽高' }).click(); await dialog.getByRole('button', { name: '应用 PDF 页面操作' }).click();
  34 |   await expect(paper).toHaveCSS('width', '480px'); await expect(paper).toHaveCSS('height', '320px');
  35 |   await page.getByLabel('选择 PDF 第 2 页').uncheck(); await page.getByLabel('选择 PDF 第 1 页').check(); await page.getByRole('button', { name: '复制所选页', exact: true }).click();
  36 |   dialog = page.getByRole('dialog', { name: '复制所选 PDF 页面', exact: true }); await dialog.getByLabel('PDF 页面插入位置').fill('4'); await dialog.getByRole('button', { name: '应用 PDF 页面操作' }).click();
  37 |   await expect(page.getByRole('button', { name: /PDF 第 \d+ 页缩略图/ })).toHaveCount(4);
  38 |   await page.getByLabel('选择 PDF 第 4 页').check(); await page.getByRole('button', { name: '删除所选页', exact: true }).click(); await expect(page.getByRole('button', { name: /PDF 第 \d+ 页缩略图/ })).toHaveCount(2);
  39 |   await page.getByRole('button', { name: '撤销', exact: true }).click(); await expect(page.getByRole('button', { name: /PDF 第 \d+ 页缩略图/ })).toHaveCount(4);
  40 |   await page.getByRole('button', { name: '重做', exact: true }).click(); await expect(page.getByRole('button', { name: /PDF 第 \d+ 页缩略图/ })).toHaveCount(2);
  41 |   for (let round = 1; round <= 2; round++) {
  42 |     const bytes = await exported(page, `pages-round-${round}.pdf`), pdf = await PDFDocument.load(bytes);
  43 |     expect(pdf.getPageCount()).toBe(2); expect(pdf.getPages()[0].getWidth()).toBe(480); expect(pdf.getPages()[0].getHeight()).toBe(320); expect(pdf.getPages()[1].getRotation().angle).toBe(90);
  44 |     expect(pdf.getForm().getTextField('shared').acroField.getWidgets()).toHaveLength(1); expect(pdf.getForm().getTextField('shared').getText()).toBe('Source');
  45 |     await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name: `Pages-round-${round}.pdf`, mimeType: 'application/pdf', buffer: bytes }); await expect(paper).toBeVisible(); await expect(paper).toHaveCSS('width', '480px');
  46 |   }
  47 |   await page.getByRole('switch', { name: '只读预览', exact: true }).check(); await expect(page.getByRole('button', { name: '插入空白页', exact: true })).toBeDisabled(); await expect(page.getByRole('button', { name: '页面尺寸', exact: true })).toBeDisabled(); await page.getByRole('switch', { name: '只读预览', exact: true }).uncheck();
  48 |   await page.screenshot({ path: path.join(audit, 'pages-light.png'), fullPage: true }); await page.getByRole('button', { name: '切换暗色', exact: true }).click(); await page.screenshot({ path: path.join(audit, 'pages-dark.png'), fullPage: true });
  49 |   await page.getByRole('button', { name: '页面尺寸', exact: true }).click(); await page.setViewportSize({ width: 320, height: 720 }); dialog = page.getByRole('dialog', { name: '修改 PDF 页面尺寸', exact: true }); expect((await dialog.boundingBox())!.width).toBeLessThanOrEqual(320);
  50 |   const geometry = await dialog.evaluate(element => ({ width: element.clientWidth, scroll: element.scrollWidth })); expect(geometry.scroll).toBeLessThanOrEqual(geometry.width + 1); await page.screenshot({ path: path.join(audit, 'pages-dialog-dark-320.png'), fullPage: true }); await dialog.getByRole('button', { name: '取消' }).click();
  51 | });
  52 | test('moves native page references by dragging a thumbnail after the final page', async ({ page }) => {
  53 |   const source = await open(page); await page.getByRole('button', { name: '页面缩略图', exact: true }).click();
  54 |   const rows = page.locator('.zuvi-studio-pdf-page-item'); await expect(rows.last().locator('canvas')).toBeVisible(); const target = await rows.last().boundingBox(); await rows.first().dragTo(rows.last(), { targetPosition: { x: 20, y: target!.height - 8 } });
  55 |   const bytes = await exported(page, 'pages-dragged.pdf'), pdf = await PDFDocument.load(bytes);
> 56 |   expect(pdf.getPages().map(entry => entry.ref.toString())).toEqual([source.getPages()[1].ref.toString(), source.getPages()[0].ref.toString()]); expect(pdf.getForm().getTextField('shared').acroField.getWidgets()).toHaveLength(2);
     |                                                             ^ Error: expect(received).toEqual(expected) // deep equality
  57 | });
  58 |
```
