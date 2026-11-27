# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-sheet-view.spec.ts >> view geometry, hidden merge masters and print stay consistent in light, dark and 320px layouts
- Location: e2e/office-studio-sheet-view.spec.ts:402:1

# Error details

```
Test timeout of 150000ms exceeded.
```

```
Error: locator.evaluate: Test timeout of 150000ms exceeded.
Call log:
  - waiting for locator('.studio-print-sheet').first().locator('td').filter({ hasText: 'Zoom keeps wrapped text and the document row height.' }).first()

```

# Page snapshot

```yaml
- generic [ref=e1]:
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
              - button "Excel 行列编辑 · 公式与图表" [pressed] [ref=e340] [cursor=pointer]:
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
                - button "打开本地文档 Visual.xlsx" [ref=e356] [cursor=pointer]:
                  - generic [ref=e357]: Visual.xlsx
              - button "历史版本" [ref=e358] [cursor=pointer]
              - switch "只读预览" [ref=e360] [cursor=pointer]
            - region "Excel 文档编辑器" [ref=e364]:
              - generic [ref=e365]:
                - generic [ref=e366]:
                  - generic [ref=e371]: Excel
                  - generic "可编辑 · ⌘ / Ctrl S 保存" [ref=e372]:
                    - status "已保存" [ref=e373]
                - textbox "文档名称" [ref=e378]: Visual.xlsx
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
                    - tablist "表格工具栏" [ref=e423]:
                      - tab "开始" [ref=e424] [cursor=pointer]
                      - tab "插入" [ref=e425] [cursor=pointer]
                      - tab "布局" [ref=e426] [cursor=pointer]
                      - tab "公式" [ref=e427] [cursor=pointer]
                      - tab "数据" [ref=e428] [cursor=pointer]
                      - tab "视图" [selected] [ref=e429] [cursor=pointer]
                  - tabpanel "视图" [ref=e430]:
                    - generic [ref=e431]:
                      - generic [ref=e432]:
                        - generic [ref=e433]:
                          - button "缩小工作表" [ref=e434] [cursor=pointer]:
                            - generic [ref=e435]: −
                          - textbox "工作表缩放百分比" [ref=e437]: "400"
                          - generic [aria-hidden] [ref=e438]: "%"
                          - button "放大工作表" [disabled] [ref=e439]:
                            - generic [ref=e440]: ＋
                        - generic [ref=e441]:
                          - generic [ref=e442]: 工作表缩放预设
                          - button "工作表缩放预设 400%" [ref=e443] [cursor=pointer]:
                            - generic [ref=e444]: 400%
                        - generic [ref=e445]: 缩放
                      - generic [ref=e446]:
                        - generic [ref=e447] [cursor=pointer]:
                          - checkbox "显示网格线" [ref=e448]
                          - generic [ref=e450]: 显示网格线
                        - generic [ref=e451] [cursor=pointer]:
                          - checkbox "显示行列标题" [ref=e452]
                          - generic [ref=e454]: 显示行列标题
                        - generic [ref=e455]: 显示
                      - generic [ref=e456]:
                        - generic [ref=e457]:
                          - button "冻结首行" [ref=e458] [cursor=pointer]
                          - button "冻结首列" [ref=e460] [cursor=pointer]
                          - button "取消冻结" [ref=e462] [cursor=pointer]
                        - generic [ref=e464]: 冻结窗格
                - generic [ref=e465]:
                  - textbox "单元格地址" [ref=e467]: A12
                  - generic [aria-hidden] [ref=e468]: ƒx
                  - textbox "表格公式栏" [ref=e470]:
                    - /placeholder: 输入内容或公式
                    - text: Zoom keeps wrapped text and the document row height.
                - grid "Main 单元格网格" [ref=e472]:
                  - generic [ref=e473]:
                    - row [ref=e474]:
                      - gridcell "A1" [ref=e475]:
                        - generic: "1"
                      - gridcell "C1" [ref=e476]
                      - gridcell "D1" [ref=e477]
                    - row [ref=e478]:
                      - gridcell "A9" [ref=e479]
                      - gridcell "C9" [ref=e480]:
                        - generic: VISIBLE_MERGE
                    - row [ref=e481]:
                      - gridcell "A10" [ref=e482]
                      - gridcell "C10" [ref=e483]
                      - gridcell "D10" [ref=e484]
                    - row [ref=e485]:
                      - gridcell "A11" [ref=e486]
                      - gridcell "C11" [ref=e487]
                      - gridcell "D11" [ref=e488]
                    - row [ref=e489]:
                      - gridcell "A12" [selected] [ref=e490]:
                        - generic:
                          - generic:
                            - generic: Zoom
                            - generic: keeps
                            - generic: wrappe
                            - generic: d text
                            - generic: and
                            - generic: the
                            - generic: docum
                            - generic: ent
                            - generic: row
                            - generic: height.
                      - gridcell "C12" [ref=e491]
                      - gridcell "D12" [ref=e492]
                    - row [ref=e493]:
                      - gridcell "A13" [ref=e494]
                      - gridcell "C13" [ref=e495]:
                        - generic: CENTER_HEADING
                      - gridcell "D13" [ref=e496]
                    - row [ref=e497]:
                      - gridcell "A14" [ref=e498]
                      - gridcell "C14" [ref=e499]
                      - gridcell "D14" [ref=e500]
                    - row [ref=e501]:
                      - gridcell "A15" [ref=e502]
                      - gridcell "C15" [ref=e503]
                      - gridcell "D15" [ref=e504]
                  - button "填充柄" [ref=e505]
                - generic [ref=e506]:
                  - tablist "工作表" [ref=e508]:
                    - tab "Main" [selected] [ref=e509] [cursor=pointer]
                    - tab "HiddenMaster" [ref=e510] [cursor=pointer]
                    - tab "SmallNative" [ref=e511] [cursor=pointer]
                  - button "新增工作表" [ref=e512] [cursor=pointer]
                  - button "删除工作表" [ref=e515] [cursor=pointer]
                  - status "工作表视图已更新；可撤销。" [ref=e520]
                  - generic "A12" [ref=e521]
            - paragraph [ref=e522]: 文件保存在当前浏览器的本地文档空间。需要长期留存时，请导出文件。
          - group [ref=e523]:
            - generic "示例代码" [ref=e524] [cursor=pointer]:
              - generic [aria-hidden] [ref=e525]: </>
              - text: 示例代码
              - generic [aria-hidden] [ref=e526]: 展开 / 收起
        - heading "编辑能力" [level=2] [ref=e527]
        - table [ref=e529]:
          - rowgroup [ref=e530]:
            - row [ref=e531]:
              - columnheader "文档" [ref=e532]
              - columnheader "支持的操作" [ref=e533]
              - columnheader "当前范围" [ref=e534]
          - rowgroup [ref=e535]:
            - row [ref=e536]:
              - cell "Word" [ref=e537]
              - cell "字体与小数字号输入、正文排版、列表、表格、图片、页眉页脚、页码、查找替换、页面设置、撤销重做；导入与导出 DOCX" [ref=e538]
              - cell "支持内嵌图片与单节文档。修订、目录、浮动对象等复杂结构会提示暂不支持。" [ref=e539]
            - row [ref=e540]:
              - cell "Excel" [ref=e541]
              - cell "单元格与矩形选区、字体与小数字号输入、手动与自动行高/列宽、查找替换、边框与垂直对齐、清除格式、公式和跨表引用、格式、复制粘贴、工作表增删、行列插入删除、合并、冻结、排序、筛选、柱状图与折线图；导入与导出 XLSX" [ref=e542]
              - cell "10,000 行、256 列、32 张表、100,000 个已使用单元格。透视、宏、数组公式及复杂图表暂不支持。" [ref=e543]
            - row [ref=e544]:
              - cell "PDF" [ref=e545]
              - cell "分页与缩略图、缩放、旋转、全文查找、文字与高亮、矩形和手写批注、已有表单、撤销重做；导出 PDF" [ref=e546]
              - cell "批注和表单编辑。任意原始文字修改、原文重排及扫描件 OCR 暂不支持。" [ref=e547]
        - heading "组件接入" [level=2] [ref=e548]
        - paragraph [ref=e549]: UI 组件使用 Tiptap / ProseMirror 和公式计算库；文件适配使用 docx、ExcelJS、pdf-lib 与 PDF.js。本页无需文档服务器。宿主可以替换保存与导入导出回调，接入自己的文件系统。
        - paragraph [ref=e550]:
          - text: PDF 的 worker、字体与渲染由
          - code [ref=e551]: pdfRenderer
          - text: 提供。本页的适配代码位于
          - code [ref=e552]: docs/src/pages/collaboration/office-studio/
          - text: 。组件自 v0.4.0 起随
          - code [ref=e553]: "@zuvi/react"
          - text: 和 Registry 发布。
        - region "组件属性表，可横向滚动" [ref=e554]:
          - table [ref=e555]:
            - rowgroup [ref=e556]:
              - row [ref=e557]:
                - columnheader "属性名" [ref=e558]
                - columnheader "类型" [ref=e559]
                - columnheader "默认值" [ref=e560]
                - columnheader "说明" [ref=e561]
            - rowgroup [ref=e562]:
              - row [ref=e563]:
                - cell "value / defaultValue" [ref=e564]
                - cell [ref=e565]:
                  - code [ref=e566]: OfficeStudioDocument
                - cell [ref=e567]:
                  - code [ref=e568]: —
                - cell "受控文档或非受控初始文档；支持 Word、Excel、PDF 三种模型。" [ref=e569]
              - row [ref=e570]:
                - cell "onChange" [ref=e571]
                - cell [ref=e572]:
                  - code [ref=e573]: (document) => void
                - cell [ref=e574]:
                  - code [ref=e575]: —
                - cell "内容或文件名称变化。" [ref=e576]
              - row [ref=e577]:
                - cell "source / pdfRenderer" [ref=e578]
                - cell [ref=e579]:
                  - code [ref=e580]: Blob / StudioPdfRenderer
                - cell [ref=e581]:
                  - code [ref=e582]: —
                - cell "原始文件及 PDF 渲染适配；worker 资源由宿主管理。" [ref=e583]
              - row [ref=e584]:
                - cell "onSave / onExport / onPrint" [ref=e585]
                - cell [ref=e586]:
                  - code [ref=e587]: (document) => void | Promise<void>
                - cell [ref=e588]:
                  - code [ref=e589]: —
                - cell "宿主处理保存、导出或打印；返回后更新状态，失败可重试。" [ref=e590]
              - row [ref=e591]:
                - cell "onImport / onCreate" [ref=e592]
                - cell [ref=e593]:
                  - code [ref=e594]: (file | kind) => void | Promise<void>
                - cell [ref=e595]:
                  - code [ref=e596]: —
                - cell "宿主解析文件或创建模型，并更新受控值。" [ref=e597]
              - row [ref=e598]:
                - cell "readOnly / disabled" [ref=e599]
                - cell [ref=e600]:
                  - code [ref=e601]: boolean
                - cell [ref=e602]:
                  - code [ref=e603]: "false"
                - cell "只读预览或禁用编辑与文件操作。" [ref=e604]
              - row [ref=e605]:
                - cell "saveState" [ref=e606]
                - cell [ref=e607]:
                  - code [ref=e608]: "'saved' | 'saving' | 'unsaved' | 'error'"
                - cell [ref=e609]:
                  - code [ref=e610]: —
                - cell "宿主自动保存状态。" [ref=e611]
              - row [ref=e612]:
                - cell "height" [ref=e613]
                - cell [ref=e614]:
                  - code [ref=e615]: number | string
                - cell [ref=e616]:
                  - code [ref=e617]: "760"
                - cell "编辑器高度；100% 需要父容器设置确定高度。" [ref=e618]
              - row [ref=e619]:
                - cell "fullscreen / onFullscreenChange" [ref=e620]
                - cell [ref=e621]:
                  - code [ref=e622]: boolean / (value) => void
                - cell [ref=e623]:
                  - code [ref=e624]: —
                - cell "全屏布局，切换时编辑内容保持挂载。" [ref=e625]
              - row [ref=e626]:
                - cell "ref" [ref=e627]
                - cell [ref=e628]:
                  - code [ref=e629]: OfficeStudioHandle
                - cell [ref=e630]:
                  - code [ref=e631]: —
                - cell "getDocument()、save()、export()、print()、setFullscreen()。" [ref=e632]
              - row [ref=e633]:
                - cell "classNames" [ref=e634]
                - cell [ref=e635]:
                  - code [ref=e636]: "{ root?; header?; title?; actions?; stage?; status?; error? }"
                - cell [ref=e637]:
                  - code [ref=e638]: —
                - cell "追加语义结构类名，配合 data-part 与 CSS 变量定制。" [ref=e639]
  - text: ✓ ✓
```

# Test source

```ts
  8   | const audit = path.resolve('docs/audits/2026-11-27/sheet-view');
  9   | const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  10  | const hash = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');
  11  | const wrapped = 'Zoom keeps wrapped text and the document row height.';
  12  | const secondaryView =
  13  |   '<sheetView workbookViewId="1" zoomScale="300" zoomScaleNormal="120" showGridLines="1" showRowColHeaders="false" showZeros="0" topLeftCell="K15"><pane state="split" xSplit="120" ySplit="240" topLeftCell="K15" activePane="bottomRight"/><selection pane="bottomRight" activeCell="K15" sqref="K15:L16"/></sheetView>';
  14  | const primaryView =
  15  |   '<sheetView workbookViewId="0" zoomScale="100" zoomScaleNormal="175" showGridLines="true" showRowColHeaders="1" showZeros="false" showOutlineSymbols="0" topLeftCell="D9"><pane state="frozen" xSplit="1" ySplit="1" topLeftCell="F8" activePane="bottomRight"/><selection pane="topLeft" activeCell="A1" sqref="A1"/><selection pane="bottomRight" activeCell="G9" sqref="G9:H10"/></sheetView>';
  16  | async function fixture() {
  17  |   const workbook = new ExcelJS.Workbook();
  18  |   workbook.views = [
  19  |     { x: 0, y: 0, width: 1200, height: 800, activeTab: 0 },
  20  |     { x: 50, y: 50, width: 800, height: 600, activeTab: 1 },
  21  |   ];
  22  |   const main = workbook.addWorksheet('Main');
  23  |   main.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];
  24  |   for (const column of ['A', 'B', 'C', 'D', 'E', 'F']) main.getColumn(column).width = 16;
  25  |   main.getColumn('B').hidden = true;
  26  |   main.getCell('A2').value = 'Hidden row';
  27  |   main.getRow(2).hidden = true;
  28  |   main.getCell('A1').value = 1;
  29  |   main.getCell('A1').border = { right: { style: 'double', color: { argb: 'FF123456' } } };
  30  |   main.getCell('C4').value = 10;
  31  |   main.mergeCells('C9:E9');
  32  |   main.getCell('C9').value = 'VISIBLE_MERGE';
  33  |   main.getCell('C9').font = { name: 'Arial', size: 24 };
  34  |   main.getCell('A12').value = wrapped;
  35  |   main.getCell('A12').font = { name: 'Arial', size: 24 };
  36  |   main.getCell('A12').alignment = { wrapText: true };
  37  |   main.getCell('C13').value = 'CENTER_HEADING';
  38  |   main.getCell('C13').font = { name: 'Arial', size: 24 };
  39  |   for (const column of ['C', 'D', 'E'])
  40  |     main.getCell(`${column}13`).alignment = {
  41  |       horizontal: 'centerContinuous',
  42  |       shrinkToFit: column === 'C',
  43  |     };
  44  |   main.getCell('F14').value = { formula: 'C4*2', result: 20 };
  45  |   main.pageSetup = {
  46  |     orientation: 'landscape',
  47  |     scale: 83,
  48  |     showGridLines: true,
  49  |     showRowColHeaders: true,
  50  |     printArea: 'A1:F14',
  51  |   };
  52  |   const hidden = workbook.addWorksheet('HiddenMaster');
  53  |   for (const column of ['A', 'B', 'C', 'D']) hidden.getColumn(column).width = 16;
  54  |   hidden.getColumn('A').hidden = true;
  55  |   hidden.mergeCells('A1:C2');
  56  |   hidden.getCell('A1').value = {
  57  |     text: 'HIDDEN_MASTER',
  58  |     hyperlink: 'https://example.com/sheet-view-master',
  59  |   };
  60  |   hidden.getCell('A1').font = { name: 'Arial', size: 24 };
  61  |   hidden.getCell('A1').alignment = { wrapText: true };
  62  |   hidden.getRow(1).hidden = true;
  63  |   hidden.getCell('D2').value = 'VISIBLE_TAIL';
  64  |   hidden.getCell('D3').value = 'CONTROL_ROW';
  65  |   hidden.views = [{ state: 'frozen', xSplit: 3, ySplit: 3 }];
  66  |   const small = workbook.addWorksheet('SmallNative');
  67  |   small.getCell('A1').value = 'NATIVE_SMALL';
  68  |   small.views = [
  69  |     { state: 'normal', zoomScale: 10, showGridLines: false, showRowColHeaders: false },
  70  |   ];
  71  |   const zip = await JSZip.loadAsync(Buffer.from(await workbook.xlsx.writeBuffer()));
  72  |   const raw = await zip.file('xl/worksheets/sheet1.xml')!.async('string');
  73  |   zip.file(
  74  |     'xl/worksheets/sheet1.xml',
  75  |     raw.replace(
  76  |       /<sheetViews\b[^>]*>[\s\S]*?<\/sheetViews>/,
  77  |       `<sheetViews>${secondaryView}${primaryView}</sheetViews>`
  78  |     )
  79  |   );
  80  |   return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  81  | }
  82  | async function importFile(page: Page, bytes: Buffer, name: string) {
  83  |   await page
  84  |     .getByLabel('导入文档文件', { exact: true })
  85  |     .setInputFiles({ name, mimeType, buffer: bytes });
  86  |   await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
  87  | }
  88  | async function range(page: Page, value: string) {
  89  |   const input = page.getByLabel('单元格地址', { exact: true });
  90  |   await input.fill(value);
  91  |   await input.press('Enter');
  92  | }
  93  | async function zoom(page: Page, value: number) {
  94  |   const input = page.getByRole('textbox', { name: '工作表缩放百分比', exact: true });
  95  |   await input.fill(String(value));
  96  |   await input.press('Enter');
  97  |   await expect(page.locator('.zuvi-studio-sheet')).toHaveAttribute(
  98  |     'data-sheet-zoom',
  99  |     String(value)
  100 |   );
  101 | }
  102 | async function exportFile(page: Page) {
  103 |   const pending = page.waitForEvent('download');
  104 |   await page.getByRole('button', { name: '导出文件', exact: true }).click();
  105 |   return readFile((await (await pending).path())!);
  106 | }
  107 | async function geometry(locator: Locator) {
> 108 |   return locator.evaluate((element) => {
      |                  ^ Error: locator.evaluate: Test timeout of 150000ms exceeded.
  109 |     const box = element.getBoundingClientRect();
  110 |     const text = element.querySelector<HTMLElement>(
  111 |       '.zuvi-studio-sheet-text,.studio-print-text-clip'
  112 |     )!;
  113 |     return {
  114 |       width: box.width,
  115 |       height: box.height,
  116 |       left: box.left,
  117 |       top: box.top,
  118 |       textWidth: text.getBoundingClientRect().width,
  119 |       lines: Array.from(
  120 |         element.querySelectorAll<HTMLElement>(
  121 |           '.zuvi-studio-sheet-text-transform>span,.studio-print-text-transform>span'
  122 |         ),
  123 |         (line) => {
  124 |           const bounds = line.getBoundingClientRect();
  125 |           return {
  126 |             text: line.textContent,
  127 |             x: bounds.left - box.left,
  128 |             y: bounds.top - box.top,
  129 |             width: bounds.width,
  130 |             height: bounds.height,
  131 |           };
  132 |         }
  133 |       ),
  134 |     };
  135 |   });
  136 | }
  137 | async function nativeView(bytes: Buffer) {
  138 |   const zip = await JSZip.loadAsync(bytes);
  139 |   const xml = await zip.file('xl/worksheets/sheet1.xml')!.async('string');
  140 |   const views = xml.match(/<sheetView\b[\s\S]*?<\/sheetView>|<sheetView\b[^>]*\/>/g)!;
  141 |   const native = new ExcelJS.Workbook();
  142 |   await native.xlsx.load(bytes);
  143 |   return { xml, views, workbook: native };
  144 | }
  145 | function attributes(tag: string) {
  146 |   return Object.fromEntries(
  147 |     Array.from(tag.matchAll(/\s([A-Za-z][\w:]*)="([^"]*)"/g), (match) => [match[1], match[2]])
  148 |   );
  149 | }
  150 | async function installPrintCapture(page: Page) {
  151 |   await page.addInitScript(() => {
  152 |     window.print = () => {
  153 |       window.parent.postMessage(
  154 |         { type: 'sheet-view-print', html: document.documentElement.outerHTML },
  155 |         '*'
  156 |       );
  157 |       window.dispatchEvent(new Event('afterprint'));
  158 |     };
  159 |     window.addEventListener('message', (event) => {
  160 |       if (event.data?.type === 'sheet-view-print')
  161 |         (window as Window & { sheetViewPrint?: string }).sheetViewPrint = event.data.html;
  162 |     });
  163 |   });
  164 | }
  165 | async function capturePrint(page: Page) {
  166 |   await page.evaluate(() => {
  167 |     (window as Window & { sheetViewPrint?: string }).sheetViewPrint = undefined;
  168 |   });
  169 |   await page.getByRole('button', { name: '打印', exact: true }).click();
  170 |   await expect
  171 |     .poll(() =>
  172 |       page.evaluate(() => (window as Window & { sheetViewPrint?: string }).sheetViewPrint)
  173 |     )
  174 |     .toBeTruthy();
  175 |   return page.evaluate(() => (window as Window & { sheetViewPrint?: string }).sheetViewPrint!);
  176 | }
  177 | 
  178 | test('view zoom and visibility use correct grid, fill, resize and native coordinates over two XLSX reopens', async ({
  179 |   page,
  180 | }) => {
  181 |   test.setTimeout(150000);
  182 |   await page.setViewportSize({ width: 1440, height: 1100 });
  183 |   await mkdir(audit, { recursive: true });
  184 |   const source = await fixture();
  185 |   await writeFile(path.join(audit, 'view-source.xlsx'), source);
  186 |   await page.goto('/#/components/office-studio');
  187 |   await importFile(page, source, 'View.xlsx');
  188 |   await page.getByRole('tab', { name: '视图', exact: true }).click();
  189 |   const root = page.locator('.zuvi-studio-sheet');
  190 |   const cell = (address: string) => page.getByRole('gridcell', { name: address, exact: true });
  191 |   const initial = await geometry(cell('A1'));
  192 |   await zoom(page, 25);
  193 |   expect((await geometry(cell('A1'))).width).toBeCloseTo(initial.width / 4, 1);
  194 |   await expect(page.getByRole('button', { name: '缩小工作表', exact: true })).toBeDisabled();
  195 |   await cell('C4').click();
  196 |   await page.getByRole('grid').press('Shift+ArrowDown');
  197 |   await expect(page.getByLabel('单元格地址', { exact: true })).toHaveValue('C5');
  198 |   await range(page, 'C4');
  199 |   await zoom(page, 400);
  200 |   expect((await geometry(cell('A1'))).width).toBeCloseTo(initial.width * 4, 1);
  201 |   await expect(page.getByRole('button', { name: '放大工作表', exact: true })).toBeDisabled();
  202 |   const grid = page.getByRole('grid');
  203 |   await grid.evaluate((element) => {
  204 |     element.scrollLeft = 117;
  205 |     element.scrollTop = 96;
  206 |   });
  207 |   await expect
  208 |     .poll(() => cell('A1').evaluate((element) => element.getBoundingClientRect().width))
```