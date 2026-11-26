# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-pdf-composition.spec.ts >> keeps rejected field conflicts unchanged and verifies the actual merge and extraction dialogs in light, dark and 320px
- Location: e2e/office-studio-pdf-composition.spec.ts:110:1

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: locator.click: Test timeout of 120000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '合并 PDF 文件', exact: true })

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
                - button "打开本地文档 Conflict.pdf" [ref=e356] [cursor=pointer]:
                  - generic [ref=e357]: Conflict.pdf
              - button "历史版本" [ref=e358] [cursor=pointer]
              - switch "只读预览" [ref=e360] [cursor=pointer]
            - region "PDF 文档编辑器" [ref=e364]:
              - generic [ref=e365]:
                - generic [ref=e366]:
                  - generic [ref=e371]: PDF
                  - generic "可编辑 · ⌘ / Ctrl S 保存" [ref=e372]:
                    - status "已保存" [ref=e373]
                - textbox "文档名称" [ref=e378]: Conflict.pdf
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
                        - generic [aria-hidden] [ref=e456]: 插入
                      - group "页面" [ref=e457]:
                        - generic [ref=e458]:
                          - button "旋转当前页" [ref=e459] [cursor=pointer]
                          - button "页面" [ref=e465] [cursor=pointer]
                        - generic [aria-hidden] [ref=e471]: 页面
                      - group "查看" [ref=e472]:
                        - generic [ref=e473]:
                          - button "查找" [ref=e474] [cursor=pointer]
                          - button "PDF 批注与表单侧栏" [pressed] [ref=e480] [cursor=pointer]:
                            - generic [ref=e485]: 侧栏
                        - generic [aria-hidden] [ref=e486]: 查看
                - generic [ref=e487]:
                  - navigation "PDF 侧边导航" [ref=e488]:
                    - button "PDF 文本查找侧栏" [ref=e489] [cursor=pointer]
                    - button "PDF 批注侧栏" [pressed] [ref=e494] [cursor=pointer]
                    - button "PDF 页面缩略图侧栏" [ref=e498] [cursor=pointer]
                    - button "PDF 表单侧栏" [ref=e503] [cursor=pointer]
                  - region "PDF 页面编辑区" [ref=e508]:
                    - generic [ref=e509]:
                      - img "PDF 第 1 页原文" [ref=e510]
                      - img "PDF 页面标注" [ref=e511]
                      - textbox "PDF 页面表单 Shared" [ref=e515]: Current
                    - generic [ref=e516]: 第 1 页 · 100%
                  - complementary "PDF 批注与表单" [ref=e517]:
                    - group "PDF 侧栏内容" [ref=e518]:
                      - button "批注 0" [pressed] [ref=e519] [cursor=pointer]
                      - button "表单 1" [ref=e521] [cursor=pointer]
                      - button "文本查找" [ref=e523] [cursor=pointer]
                      - button "页面缩略图" [ref=e525] [cursor=pointer]
                    - generic [ref=e527]:
                      - strong [ref=e528]: 添加文字
                      - generic [ref=e529]:
                        - text: 文字内容
                        - textbox "PDF 新增文字" [ref=e531]
                      - generic [ref=e532]:
                        - text: 字号
                        - generic [ref=e533]:
                          - spinbutton "PDF 文字字号" [ref=e534]: "16"
                          - generic [ref=e535]:
                            - button "增加" [ref=e536] [cursor=pointer]:
                              - generic [aria-hidden] [ref=e537]: +
                            - button "减少" [ref=e538] [cursor=pointer]:
                              - generic [aria-hidden] [ref=e539]: −
                      - generic [ref=e540]:
                        - generic [ref=e541]: 颜色
                        - group "PDF 标注颜色" [ref=e542]:
                          - button "PDF 标注颜色" [ref=e543] [cursor=pointer]:
                            - generic [ref=e545]: "#253044"
                      - paragraph [ref=e546]: 选择文字或高亮工具后点击页面放置，也可以使用下方按钮。
                      - button "放在当前页中央" [disabled] [ref=e547]
                      - generic "PDF 标注列表" [ref=e549]:
                        - paragraph [ref=e550]: 还没有标注。原文页面会完整保留。
                - group "PDF 状态栏" [ref=e551]:
                  - group "PDF 页面导航" [ref=e552]:
                    - button "PDF 上一页" [disabled] [ref=e553]
                    - generic [ref=e557]:
                      - spinbutton "PDF 跳转页" [ref=e558]: "1"
                      - generic [ref=e559]:
                        - button "增加" [ref=e560] [cursor=pointer]:
                          - generic [aria-hidden] [ref=e561]: +
                        - button "减少" [disabled] [ref=e562]:
                          - generic [aria-hidden] [ref=e563]: −
                    - generic [ref=e564]: / 2
                    - button "PDF 下一页" [ref=e565] [cursor=pointer]
                  - generic "选择工具。PDF 原有正文保持原版式；可编辑新增批注和原文件的可填写表单。" [ref=e569]: 选择工具
                  - group "PDF 视图缩放" [ref=e570]:
                    - button "PDF 缩小视图" [ref=e571] [cursor=pointer]
                    - generic [ref=e576]:
                      - generic [ref=e577]: PDF 缩放
                      - button "PDF 缩放 100%" [ref=e578] [cursor=pointer]:
                        - generic [ref=e579]: 100%
                    - button "PDF 放大视图" [ref=e580] [cursor=pointer]
            - paragraph [ref=e585]: 文件保存在当前浏览器的本地文档空间。需要长期留存时，请导出文件。
          - group [ref=e586]:
            - generic "示例代码" [ref=e587] [cursor=pointer]:
              - generic [aria-hidden] [ref=e588]: </>
              - text: 示例代码
              - generic [aria-hidden] [ref=e589]: 展开 / 收起
        - heading "编辑能力" [level=2] [ref=e590]
        - table [ref=e592]:
          - rowgroup [ref=e593]:
            - row [ref=e594]:
              - columnheader "文档" [ref=e595]
              - columnheader "支持的操作" [ref=e596]
              - columnheader "当前范围" [ref=e597]
          - rowgroup [ref=e598]:
            - row [ref=e599]:
              - cell "Word" [ref=e600]
              - cell "字体与小数字号输入、正文排版、列表、表格、图片、页眉页脚、页码、查找替换、页面设置、撤销重做；导入与导出 DOCX" [ref=e601]
              - cell "支持内嵌图片与单节文档。修订、目录、浮动对象等复杂结构会提示暂不支持。" [ref=e602]
            - row [ref=e603]:
              - cell "Excel" [ref=e604]
              - cell "单元格与矩形选区、字体与小数字号输入、手动与自动行高/列宽、查找替换、边框与垂直对齐、清除格式、公式和跨表引用、格式、复制粘贴、工作表增删、行列插入删除、合并、冻结、排序、筛选、柱状图与折线图；导入与导出 XLSX" [ref=e605]
              - cell "10,000 行、256 列、32 张表、100,000 个已使用单元格。透视、宏、数组公式及复杂图表暂不支持。" [ref=e606]
            - row [ref=e607]:
              - cell "PDF" [ref=e608]
              - cell "分页与缩略图、缩放、旋转、全文查找、文字与高亮、矩形和手写批注、已有表单、撤销重做；导出 PDF" [ref=e609]
              - cell "批注和表单编辑。任意原始文字修改、原文重排及扫描件 OCR 暂不支持。" [ref=e610]
        - heading "组件接入" [level=2] [ref=e611]
        - paragraph [ref=e612]: UI 组件使用 Tiptap / ProseMirror 和公式计算库；文件适配使用 docx、ExcelJS、pdf-lib 与 PDF.js。本页无需文档服务器。宿主可以替换保存与导入导出回调，接入自己的文件系统。
        - paragraph [ref=e613]:
          - text: PDF 的 worker、字体与渲染由
          - code [ref=e614]: pdfRenderer
          - text: 提供。本页的适配代码位于
          - code [ref=e615]: docs/src/pages/collaboration/office-studio/
          - text: 。组件自 v0.4.0 起随
          - code [ref=e616]: "@zuvi/react"
          - text: 和 Registry 发布。
        - region "组件属性表，可横向滚动" [ref=e617]:
          - table [ref=e618]:
            - rowgroup [ref=e619]:
              - row [ref=e620]:
                - columnheader "属性名" [ref=e621]
                - columnheader "类型" [ref=e622]
                - columnheader "默认值" [ref=e623]
                - columnheader "说明" [ref=e624]
            - rowgroup [ref=e625]:
              - row [ref=e626]:
                - cell "value / defaultValue" [ref=e627]
                - cell [ref=e628]:
                  - code [ref=e629]: OfficeStudioDocument
                - cell [ref=e630]:
                  - code [ref=e631]: —
                - cell "受控文档或非受控初始文档；支持 Word、Excel、PDF 三种模型。" [ref=e632]
              - row [ref=e633]:
                - cell "onChange" [ref=e634]
                - cell [ref=e635]:
                  - code [ref=e636]: (document) => void
                - cell [ref=e637]:
                  - code [ref=e638]: —
                - cell "内容或文件名称变化。" [ref=e639]
              - row [ref=e640]:
                - cell "source / pdfRenderer" [ref=e641]
                - cell [ref=e642]:
                  - code [ref=e643]: Blob / StudioPdfRenderer
                - cell [ref=e644]:
                  - code [ref=e645]: —
                - cell "原始文件及 PDF 渲染适配；worker 资源由宿主管理。" [ref=e646]
              - row [ref=e647]:
                - cell "onSave / onExport / onPrint" [ref=e648]
                - cell [ref=e649]:
                  - code [ref=e650]: (document) => void | Promise<void>
                - cell [ref=e651]:
                  - code [ref=e652]: —
                - cell "宿主处理保存、导出或打印；返回后更新状态，失败可重试。" [ref=e653]
              - row [ref=e654]:
                - cell "onImport / onCreate" [ref=e655]
                - cell [ref=e656]:
                  - code [ref=e657]: (file | kind) => void | Promise<void>
                - cell [ref=e658]:
                  - code [ref=e659]: —
                - cell "宿主解析文件或创建模型，并更新受控值。" [ref=e660]
              - row [ref=e661]:
                - cell "readOnly / disabled" [ref=e662]
                - cell [ref=e663]:
                  - code [ref=e664]: boolean
                - cell [ref=e665]:
                  - code [ref=e666]: "false"
                - cell "只读预览或禁用编辑与文件操作。" [ref=e667]
              - row [ref=e668]:
                - cell "saveState" [ref=e669]
                - cell [ref=e670]:
                  - code [ref=e671]: "'saved' | 'saving' | 'unsaved' | 'error'"
                - cell [ref=e672]:
                  - code [ref=e673]: —
                - cell "宿主自动保存状态。" [ref=e674]
              - row [ref=e675]:
                - cell "height" [ref=e676]
                - cell [ref=e677]:
                  - code [ref=e678]: number | string
                - cell [ref=e679]:
                  - code [ref=e680]: "760"
                - cell "编辑器高度；100% 需要父容器设置确定高度。" [ref=e681]
              - row [ref=e682]:
                - cell "fullscreen / onFullscreenChange" [ref=e683]
                - cell [ref=e684]:
                  - code [ref=e685]: boolean / (value) => void
                - cell [ref=e686]:
                  - code [ref=e687]: —
                - cell "全屏布局，切换时编辑内容保持挂载。" [ref=e688]
              - row [ref=e689]:
                - cell "ref" [ref=e690]
                - cell [ref=e691]:
                  - code [ref=e692]: OfficeStudioHandle
                - cell [ref=e693]:
                  - code [ref=e694]: —
                - cell "getDocument()、save()、export()、print()、setFullscreen()。" [ref=e695]
              - row [ref=e696]:
                - cell "classNames" [ref=e697]
                - cell [ref=e698]:
                  - code [ref=e699]: "{ root?; header?; title?; actions?; stage?; status?; error? }"
                - cell [ref=e700]:
                  - code [ref=e701]: —
                - cell "追加语义结构类名，配合 data-part 与 CSS 变量定制。" [ref=e702]
  - text: ✓ ✓
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
  11  |   await expect(page.getByRole('region', { name: 'PDF 页面编辑区', exact: true }).first()).toHaveAttribute('aria-busy', 'false');
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
> 41  |   await page.getByRole('button', { name: '合并 PDF 文件', exact: true }).click();
      |                                                                      ^ Error: locator.click: Test timeout of 120000ms exceeded.
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
  112 |   const first = await basicPdf({ pages: 2, value: 'Current' }), second = await basicPdf({ pages: 2, value: 'Incoming' });
  113 |   const original = await first.bytes(), incoming = await second.bytes(); await page.goto('/#/components/office-studio'); await imported(page, original, 'Conflict.pdf'); const before = await snapshot(page);
  114 |   let dialog = await merge(page, incoming, 'Conflict-incoming.pdf'); await dialog.getByRole('button', { name: /^PDF 同名字段处理/ }).click(); await page.getByRole('option', { name: '连接兼容字段，共享填写值', exact: true }).click(); await dialog.getByRole('button', { name: '应用 PDF 合并', exact: true }).click(); await expect(dialog.getByRole('alert')).toContainText('同名字段'); expect(await snapshot(page)).toEqual(before); await dialog.getByRole('button', { name: '取消', exact: true }).click();
  115 |   dialog = await merge(page, incoming, 'Conflict-incoming.pdf'); await page.screenshot({ path: path.join(audit, 'merge-dialog-light.png'), fullPage: true, animations: 'disabled' });
  116 |   await dialog.getByRole('button', { name: '取消', exact: true }).click(); await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  117 |   dialog = await merge(page, incoming, 'Conflict-incoming.pdf'); await page.screenshot({ path: path.join(audit, 'merge-dialog-dark.png'), fullPage: true, animations: 'disabled' });
  118 |   await page.setViewportSize({ width: 320, height: 720 }); const bounds = await dialog.boundingBox(); expect(bounds!.width).toBeLessThanOrEqual(320); const sizes = await dialog.evaluate((element) => ({ width: element.clientWidth, scroll: element.scrollWidth })); expect(sizes.scroll).toBeLessThanOrEqual(sizes.width + 1);
  119 |   await dialog.getByLabel('组合后的 PDF 名称').fill('Merged.pdf'); await expect(dialog.getByRole('button', { name: '应用 PDF 合并', exact: true })).toBeInViewport(); await page.screenshot({ path: path.join(audit, 'merge-dialog-dark-320.png'), fullPage: true, animations: 'disabled' }); await dialog.getByRole('button', { name: '取消', exact: true }).click();
  120 |   await page.getByRole('button', { name: '提取 PDF 页面', exact: true }).click(); dialog = page.getByRole('dialog', { name: '提取 PDF 页面', exact: true }); await dialog.getByLabel('提取 PDF 页码').fill('1,1'); await dialog.getByRole('button', { name: '应用 PDF 提取', exact: true }).click(); await expect(dialog.getByRole('alert')).toContainText('不能重复'); await page.screenshot({ path: path.join(audit, 'extract-dialog-dark-320.png'), fullPage: true, animations: 'disabled' }); await dialog.getByRole('button', { name: '取消', exact: true }).click();
  121 |   const readonly = page.getByRole('switch', { name: '只读预览', exact: true }); await readonly.click(); await expect(page.getByRole('button', { name: '合并 PDF 文件', exact: true })).toBeDisabled(); await expect(page.getByRole('button', { name: '提取 PDF 页面', exact: true })).toBeDisabled(); expect((await snapshot(page)).sourceHash).toBe(before.sourceHash);
  122 |   await writeFile(path.join(audit, 'conflicts-and-dialog-geometry.json'), JSON.stringify({ before, bounds, sizes }, null, 2) + '\n');
  123 | });
  124 |
```