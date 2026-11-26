# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-sheet-text.spec.ts >> text formatting holds invalid drafts, cancels cleanly and rejects protected batches before adding history
- Location: e2e/office-studio-sheet-text.spec.ts:412:1

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: locator.click: Test timeout of 90000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '保护所选区域', exact: true })

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
                - button "打开本地文档 Text-guards.xlsx" [ref=e356] [cursor=pointer]:
                  - generic [ref=e357]: Text-guards.xlsx
              - button "历史版本" [ref=e358] [cursor=pointer]
              - switch "只读预览" [ref=e360] [cursor=pointer]
            - region "Excel 文档编辑器" [ref=e364]:
              - generic [ref=e365]:
                - generic [ref=e366]:
                  - generic [ref=e371]: Excel
                  - generic "可编辑 · ⌘ / Ctrl S 保存" [ref=e372]:
                    - status "已保存" [ref=e373]
                - textbox "文档名称" [ref=e378]: Text-guards.xlsx
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
                      - tab "数据" [active] [selected] [ref=e428] [cursor=pointer]
                      - tab "视图" [ref=e429] [cursor=pointer]
                  - tabpanel "数据" [ref=e430]:
                    - generic [ref=e431]:
                      - generic [ref=e432]:
                        - button "数据验证" [ref=e433] [cursor=pointer]
                        - generic "0 条规则" [ref=e435]: 数据工具
                      - generic [ref=e436]:
                        - generic [ref=e437]:
                          - button "升序排序" [ref=e438] [cursor=pointer]
                          - button "降序排序" [ref=e440] [cursor=pointer]
                          - button "多关键字排序" [ref=e442] [cursor=pointer]
                        - generic [ref=e444]: 排序当前选区：单击按键按活动列升降序，多关键字排序可配置逐级键
                      - generic [ref=e445]:
                        - generic [ref=e446]:
                          - textbox "筛选区域" [ref=e448]:
                            - /placeholder: 例如 A3:D6
                          - generic [ref=e449]:
                            - generic [ref=e450]: 筛选列
                            - button "筛选列 A" [ref=e451] [cursor=pointer]:
                              - generic [ref=e452]: A
                          - generic [ref=e453]:
                            - generic [ref=e454]: 筛选条件
                            - button "筛选条件 包含" [ref=e455] [cursor=pointer]:
                              - generic [ref=e456]: 包含
                          - textbox "筛选值" [ref=e458]:
                            - /placeholder: 留空清除此列条件
                          - button "应用筛选" [ref=e459] [cursor=pointer]
                          - button "清除筛选" [disabled] [ref=e461]
                        - generic "首行作为标题；当前隐藏 0 行" [ref=e463]: 排序和筛选
                - generic [ref=e464]:
                  - textbox "单元格地址" [ref=e466]: B1
                  - generic [aria-hidden] [ref=e467]: ƒx
                  - textbox "表格公式栏" [ref=e469]:
                    - /placeholder: 输入内容或公式
                - grid "Text 单元格网格" [ref=e471]:
                  - generic [ref=e472]:
                    - row [ref=e473]:
                      - columnheader "行号" [ref=e474]
                      - columnheader "A A 列宽" [ref=e475]:
                        - text: A
                        - separator "A 列宽" [ref=e476]
                      - columnheader "B B 列宽" [ref=e477]:
                        - text: B
                        - separator "B 列宽" [ref=e478]
                      - columnheader "C C 列宽" [ref=e479]:
                        - text: C
                        - separator "C 列宽" [ref=e480]
                      - columnheader "D D 列宽" [ref=e481]:
                        - text: D
                        - separator "D 列宽" [ref=e482]
                      - columnheader "E E 列宽" [ref=e483]:
                        - text: E
                        - separator "E 列宽" [ref=e484]
                      - columnheader "F F 列宽" [ref=e485]:
                        - text: F
                        - separator "F 列宽" [ref=e486]
                      - columnheader "G G 列宽" [ref=e487]:
                        - text: G
                        - separator "G 列宽" [ref=e488]
                      - columnheader "H H 列宽" [ref=e489]:
                        - text: H
                        - separator "H 列宽" [ref=e490]
                      - columnheader "I I 列宽" [ref=e491]:
                        - text: I
                        - separator "I 列宽" [ref=e492]
                      - columnheader "J J 列宽" [ref=e493]:
                        - text: J
                        - separator "J 列宽" [ref=e494]
                    - row [ref=e495]:
                      - rowheader "1 1 行高" [ref=e496]:
                        - text: "1"
                        - separator "1 行高" [ref=e497]
                      - gridcell "A1" [ref=e498]:
                        - generic: CENTER_TITLE
                      - gridcell "B1" [selected] [ref=e499]
                      - gridcell "C1" [ref=e500]
                      - gridcell "D1" [ref=e501]:
                        - generic: Native label
                      - gridcell "E1" [ref=e502]
                      - gridcell "F1" [ref=e503]
                      - gridcell "G1" [ref=e504]
                      - gridcell "H1" [ref=e505]
                      - gridcell "I1" [ref=e506]
                      - gridcell "J1" [ref=e507]
                    - row [ref=e508]:
                      - rowheader "2 2 行高" [ref=e509]:
                        - text: "2"
                        - separator "2 行高" [ref=e510]
                      - gridcell "A2" [ref=e511]:
                        - generic: 自动换行随列宽变化并保留原始文字与工作簿默认字体。
                      - gridcell "B2" [ref=e512]
                      - gridcell "C2" [ref=e513]
                      - gridcell "D2" [ref=e514]
                      - gridcell "E2" [ref=e515]
                      - gridcell "F2" [ref=e516]
                      - gridcell "G2" [ref=e517]
                      - gridcell "H2" [ref=e518]
                      - gridcell "I2" [ref=e519]
                      - gridcell "J2" [ref=e520]
                    - row [ref=e521]:
                      - rowheader "3 3 行高" [ref=e522]:
                        - text: "3"
                        - separator "3 行高" [ref=e523]
                      - gridcell "A3" [ref=e524]:
                        - generic: ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz
                      - gridcell "B3" [ref=e525]
                      - gridcell "C3" [ref=e526]
                      - gridcell "D3" [ref=e527]
                      - gridcell "E3" [ref=e528]
                      - gridcell "F3" [ref=e529]
                      - gridcell "G3" [ref=e530]
                      - gridcell "H3" [ref=e531]
                      - gridcell "I3" [ref=e532]
                      - gridcell "J3" [ref=e533]
                    - row [ref=e534]:
                      - rowheader "4 4 行高" [ref=e535]:
                        - text: "4"
                        - separator "4 行高" [ref=e536]
                      - gridcell "A4" [ref=e537]:
                        - generic: ANGLED_TEXT
                      - gridcell "B4" [ref=e538]
                      - gridcell "C4" [ref=e539]:
                        - generic: Indented
                      - gridcell "D4" [ref=e540]
                      - gridcell "E4" [ref=e541]
                      - gridcell "F4" [ref=e542]
                      - gridcell "G4" [ref=e543]
                      - gridcell "H4" [ref=e544]
                      - gridcell "I4" [ref=e545]
                      - gridcell "J4" [ref=e546]
                    - row [ref=e547]:
                      - rowheader "5 5 行高" [ref=e548]:
                        - text: "5"
                        - separator "5 行高" [ref=e549]
                      - gridcell "A5" [ref=e550]:
                        - generic: 竖排ABC
                      - gridcell "B5" [ref=e551]
                      - gridcell "C5" [ref=e552]
                      - gridcell "D5" [ref=e553]
                      - gridcell "E5" [ref=e554]
                      - gridcell "F5" [ref=e555]
                      - gridcell "G5" [ref=e556]
                      - gridcell "H5" [ref=e557]
                      - gridcell "I5" [ref=e558]
                      - gridcell "J5" [ref=e559]
                    - row [ref=e560]:
                      - rowheader "6 6 行高" [ref=e561]:
                        - text: "6"
                        - separator "6 行高" [ref=e562]
                      - gridcell "A6" [ref=e563]:
                        - generic: "42"
                      - gridcell "B6" [ref=e564]:
                        - generic: "#N/A"
                      - gridcell "C6" [ref=e565]:
                        - generic: "FALSE"
                      - gridcell "D6" [ref=e566]:
                        - generic: "#N/A"
                      - gridcell "E6" [ref=e567]
                      - gridcell "F6" [ref=e568]
                      - gridcell "G6" [ref=e569]
                      - gridcell "H6" [ref=e570]
                      - gridcell "I6" [ref=e571]
                      - gridcell "J6" [ref=e572]
                    - row [ref=e573]:
                      - rowheader "7 7 行高" [ref=e574]:
                        - text: "7"
                        - separator "7 行高" [ref=e575]
                      - gridcell "A7" [ref=e576]:
                        - generic: "**"
                      - gridcell "B7" [ref=e577]
                      - gridcell "C7" [ref=e578]
                      - gridcell "D7" [ref=e579]
                      - gridcell "E7" [ref=e580]
                      - gridcell "F7" [ref=e581]
                      - gridcell "G7" [ref=e582]
                      - gridcell "H7" [ref=e583]
                      - gridcell "I7" [ref=e584]
                      - gridcell "J7" [ref=e585]
                    - row [ref=e586]:
                      - rowheader "8 8 行高" [ref=e587]:
                        - text: "8"
                        - separator "8 行高" [ref=e588]
                      - gridcell "A8" [ref=e589]:
                        - generic:
                          - generic:
                            - generic: Line one
                            - generic: Line two
                            - generic: Line three
                      - gridcell "B8" [ref=e590]:
                        - generic: 分散对齐
                      - gridcell "C8" [ref=e591]
                      - gridcell "D8" [ref=e592]
                      - gridcell "E8" [ref=e593]
                      - gridcell "F8" [ref=e594]
                      - gridcell "G8" [ref=e595]
                      - gridcell "H8" [ref=e596]
                      - gridcell "I8" [ref=e597]
                      - gridcell "J8" [ref=e598]
                    - row [ref=e599]:
                      - rowheader "9 9 行高" [ref=e600]:
                        - text: "9"
                        - separator "9 行高" [ref=e601]
                      - gridcell "A9" [ref=e602]:
                        - generic: "3"
                      - gridcell "B9" [ref=e603]:
                        - generic:
                          - generic:
                            - generic: Cross sheet
                            - generic: formula with a
                            - generic: long text value
                      - gridcell "C9" [ref=e604]
                      - gridcell "D9" [ref=e605]
                      - gridcell "E9" [ref=e606]
                      - gridcell "F9" [ref=e607]
                      - gridcell "G9" [ref=e608]
                      - gridcell "H9" [ref=e609]
                      - gridcell "I9" [ref=e610]
                      - gridcell "J9" [ref=e611]
                    - row [ref=e612]:
                      - rowheader "10 10 行高" [ref=e613]:
                        - text: "10"
                        - separator "10 行高" [ref=e614]
                      - gridcell "A10" [ref=e615]:
                        - generic: "1"
                      - gridcell "B10" [ref=e616]:
                        - generic: "2"
                      - gridcell "C10" [ref=e617]
                      - gridcell "D10" [ref=e618]
                      - gridcell "E10" [ref=e619]
                      - gridcell "F10" [ref=e620]
                      - gridcell "G10" [ref=e621]
                      - gridcell "H10" [ref=e622]
                      - gridcell "I10" [ref=e623]
                      - gridcell "J10" [ref=e624]
                    - row [ref=e625]:
                      - rowheader "11 11 行高" [ref=e626]:
                        - text: "11"
                        - separator "11 行高" [ref=e627]
                      - gridcell "A11" [ref=e628]:
                        - generic: "3"
                      - gridcell "B11" [ref=e629]:
                        - generic: "4"
                      - gridcell "C11" [ref=e630]
                      - gridcell "D11" [ref=e631]
                      - gridcell "E11" [ref=e632]
                      - gridcell "F11" [ref=e633]
                      - gridcell "G11" [ref=e634]
                      - gridcell "H11" [ref=e635]
                      - gridcell "I11" [ref=e636]
                      - gridcell "J11" [ref=e637]
                    - row [ref=e638]:
                      - rowheader "12 12 行高" [ref=e639]:
                        - text: "12"
                        - separator "12 行高" [ref=e640]
                      - gridcell "A12" [ref=e641]
                      - gridcell "B12" [ref=e642]
                      - gridcell "C12" [ref=e643]
                      - gridcell "D12" [ref=e644]
                      - gridcell "E12" [ref=e645]
                      - gridcell "F12" [ref=e646]
                      - gridcell "G12" [ref=e647]
                      - gridcell "H12" [ref=e648]
                      - gridcell "I12" [ref=e649]
                      - gridcell "J12" [ref=e650]
                    - row [ref=e651]:
                      - rowheader "13 13 行高" [ref=e652]:
                        - text: "13"
                        - separator "13 行高" [ref=e653]
                      - gridcell "A13" [ref=e654]
                      - gridcell "B13" [ref=e655]
                      - gridcell "C13" [ref=e656]
                      - gridcell "D13" [ref=e657]
                      - gridcell "E13" [ref=e658]
                      - gridcell "F13" [ref=e659]
                      - gridcell "G13" [ref=e660]
                      - gridcell "H13" [ref=e661]
                      - gridcell "I13" [ref=e662]
                      - gridcell "J13" [ref=e663]
                    - row [ref=e664]:
                      - rowheader "14 14 行高" [ref=e665]:
                        - text: "14"
                        - separator "14 行高" [ref=e666]
                      - gridcell "A14" [ref=e667]
                      - gridcell "B14" [ref=e668]
                      - gridcell "C14" [ref=e669]
                      - gridcell "D14" [ref=e670]
                      - gridcell "E14" [ref=e671]
                      - gridcell "F14" [ref=e672]
                      - gridcell "G14" [ref=e673]
                      - gridcell "H14" [ref=e674]
                      - gridcell "I14" [ref=e675]
                      - gridcell "J14" [ref=e676]
                  - button "填充柄" [ref=e677]
                - generic [ref=e678]:
                  - tablist "工作表" [ref=e680]:
                    - tab "Text" [selected] [ref=e681] [cursor=pointer]
                    - tab "Other" [ref=e682] [cursor=pointer]
                  - button "新增工作表" [ref=e683] [cursor=pointer]
                  - button "删除工作表" [ref=e686] [cursor=pointer]
                  - status "单元格内容最多支持 32,767 个字符，请缩短内容。" [ref=e691]
                  - generic "B1" [ref=e692]
            - paragraph [ref=e693]: 文件保存在当前浏览器的本地文档空间。需要长期留存时，请导出文件。
          - group [ref=e694]:
            - generic "示例代码" [ref=e695] [cursor=pointer]:
              - generic [aria-hidden] [ref=e696]: </>
              - text: 示例代码
              - generic [aria-hidden] [ref=e697]: 展开 / 收起
        - heading "编辑能力" [level=2] [ref=e698]
        - table [ref=e700]:
          - rowgroup [ref=e701]:
            - row [ref=e702]:
              - columnheader "文档" [ref=e703]
              - columnheader "支持的操作" [ref=e704]
              - columnheader "当前范围" [ref=e705]
          - rowgroup [ref=e706]:
            - row [ref=e707]:
              - cell "Word" [ref=e708]
              - cell "字体与小数字号输入、正文排版、列表、表格、图片、页眉页脚、页码、查找替换、页面设置、撤销重做；导入与导出 DOCX" [ref=e709]
              - cell "支持内嵌图片与单节文档。修订、目录、浮动对象等复杂结构会提示暂不支持。" [ref=e710]
            - row [ref=e711]:
              - cell "Excel" [ref=e712]
              - cell "单元格与矩形选区、字体与小数字号输入、手动与自动行高/列宽、查找替换、边框与垂直对齐、清除格式、公式和跨表引用、格式、复制粘贴、工作表增删、行列插入删除、合并、冻结、排序、筛选、柱状图与折线图；导入与导出 XLSX" [ref=e713]
              - cell "10,000 行、256 列、32 张表、100,000 个已使用单元格。透视、宏、数组公式及复杂图表暂不支持。" [ref=e714]
            - row [ref=e715]:
              - cell "PDF" [ref=e716]
              - cell "分页与缩略图、缩放、旋转、全文查找、文字与高亮、矩形和手写批注、已有表单、撤销重做；导出 PDF" [ref=e717]
              - cell "批注和表单编辑。任意原始文字修改、原文重排及扫描件 OCR 暂不支持。" [ref=e718]
        - heading "组件接入" [level=2] [ref=e719]
        - paragraph [ref=e720]: UI 组件使用 Tiptap / ProseMirror 和公式计算库；文件适配使用 docx、ExcelJS、pdf-lib 与 PDF.js。本页无需文档服务器。宿主可以替换保存与导入导出回调，接入自己的文件系统。
        - paragraph [ref=e721]:
          - text: PDF 的 worker、字体与渲染由
          - code [ref=e722]: pdfRenderer
          - text: 提供。本页的适配代码位于
          - code [ref=e723]: docs/src/pages/collaboration/office-studio/
          - text: 。组件自 v0.4.0 起随
          - code [ref=e724]: "@zuvi/react"
          - text: 和 Registry 发布。
        - region "组件属性表，可横向滚动" [ref=e725]:
          - table [ref=e726]:
            - rowgroup [ref=e727]:
              - row [ref=e728]:
                - columnheader "属性名" [ref=e729]
                - columnheader "类型" [ref=e730]
                - columnheader "默认值" [ref=e731]
                - columnheader "说明" [ref=e732]
            - rowgroup [ref=e733]:
              - row [ref=e734]:
                - cell "value / defaultValue" [ref=e735]
                - cell [ref=e736]:
                  - code [ref=e737]: OfficeStudioDocument
                - cell [ref=e738]:
                  - code [ref=e739]: —
                - cell "受控文档或非受控初始文档；支持 Word、Excel、PDF 三种模型。" [ref=e740]
              - row [ref=e741]:
                - cell "onChange" [ref=e742]
                - cell [ref=e743]:
                  - code [ref=e744]: (document) => void
                - cell [ref=e745]:
                  - code [ref=e746]: —
                - cell "内容或文件名称变化。" [ref=e747]
              - row [ref=e748]:
                - cell "source / pdfRenderer" [ref=e749]
                - cell [ref=e750]:
                  - code [ref=e751]: Blob / StudioPdfRenderer
                - cell [ref=e752]:
                  - code [ref=e753]: —
                - cell "原始文件及 PDF 渲染适配；worker 资源由宿主管理。" [ref=e754]
              - row [ref=e755]:
                - cell "onSave / onExport / onPrint" [ref=e756]
                - cell [ref=e757]:
                  - code [ref=e758]: (document) => void | Promise<void>
                - cell [ref=e759]:
                  - code [ref=e760]: —
                - cell "宿主处理保存、导出或打印；返回后更新状态，失败可重试。" [ref=e761]
              - row [ref=e762]:
                - cell "onImport / onCreate" [ref=e763]
                - cell [ref=e764]:
                  - code [ref=e765]: (file | kind) => void | Promise<void>
                - cell [ref=e766]:
                  - code [ref=e767]: —
                - cell "宿主解析文件或创建模型，并更新受控值。" [ref=e768]
              - row [ref=e769]:
                - cell "readOnly / disabled" [ref=e770]
                - cell [ref=e771]:
                  - code [ref=e772]: boolean
                - cell [ref=e773]:
                  - code [ref=e774]: "false"
                - cell "只读预览或禁用编辑与文件操作。" [ref=e775]
              - row [ref=e776]:
                - cell "saveState" [ref=e777]
                - cell [ref=e778]:
                  - code [ref=e779]: "'saved' | 'saving' | 'unsaved' | 'error'"
                - cell [ref=e780]:
                  - code [ref=e781]: —
                - cell "宿主自动保存状态。" [ref=e782]
              - row [ref=e783]:
                - cell "height" [ref=e784]
                - cell [ref=e785]:
                  - code [ref=e786]: number | string
                - cell [ref=e787]:
                  - code [ref=e788]: "760"
                - cell "编辑器高度；100% 需要父容器设置确定高度。" [ref=e789]
              - row [ref=e790]:
                - cell "fullscreen / onFullscreenChange" [ref=e791]
                - cell [ref=e792]:
                  - code [ref=e793]: boolean / (value) => void
                - cell [ref=e794]:
                  - code [ref=e795]: —
                - cell "全屏布局，切换时编辑内容保持挂载。" [ref=e796]
              - row [ref=e797]:
                - cell "ref" [ref=e798]
                - cell [ref=e799]:
                  - code [ref=e800]: OfficeStudioHandle
                - cell [ref=e801]:
                  - code [ref=e802]: —
                - cell "getDocument()、save()、export()、print()、setFullscreen()。" [ref=e803]
              - row [ref=e804]:
                - cell "classNames" [ref=e805]
                - cell [ref=e806]:
                  - code [ref=e807]: "{ root?; header?; title?; actions?; stage?; status?; error? }"
                - cell [ref=e808]:
                  - code [ref=e809]: —
                - cell "追加语义结构类名，配合 data-part 与 CSS 变量定制。" [ref=e810]
  - text: ✓ ✓ ✓
```

# Test source

```ts
  337 |     const actual = await geometry(
  338 |       printTable
  339 |         .locator('tr')
  340 |         .nth(row - 1)
  341 |         .locator('td')
  342 |         .nth(column)
  343 |     );
  344 |     printedGeometry[address] = actual;
  345 |     expect(actual.width).toBeCloseTo(measured[address].width, 1);
  346 |     expect(actual.height).toBeCloseTo(measured[address].height, 1);
  347 |     expect(actual.textWidth).toBeCloseTo(measured[address].textWidth, 1);
  348 |     expect(actual.lines).toHaveLength(measured[address].lines.length);
  349 |     for (let index = 0; index < actual.lines.length; index++) {
  350 |       expect(actual.lines[index].x).toBeCloseTo(measured[address].lines[index].x, 1);
  351 |       expect(actual.lines[index].y).toBeCloseTo(measured[address].lines[index].y, 1);
  352 |     }
  353 |   }
  354 |   await preview.screenshot({
  355 |     path: path.join(audit, 'text-print.png'),
  356 |     fullPage: true,
  357 |     animations: 'disabled',
  358 |   });
  359 |   await preview.pdf({
  360 |     path: path.join(audit, 'text-print.pdf'),
  361 |     preferCSSPageSize: true,
  362 |     printBackground: true,
  363 |   });
  364 |   await preview.close();
  365 |   await range(page, 'A1');
  366 |   await page.screenshot({
  367 |     path: path.join(audit, 'text-results-light.png'),
  368 |     fullPage: true,
  369 |     animations: 'disabled',
  370 |   });
  371 |   for (const small of [false, true]) {
  372 |     if (small) await page.setViewportSize({ width: 320, height: 720 });
  373 |     for (const theme of ['light', 'dark']) {
  374 |       if (theme === 'dark')
  375 |         await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  376 |       dialog = await open(page, 'A4');
  377 |       const bounds = await dialog.boundingBox();
  378 |       expect(bounds!.x).toBeGreaterThanOrEqual(0);
  379 |       expect(bounds!.width).toBeLessThanOrEqual(small ? 320 : 1280);
  380 |       await expect(dialog.getByRole('button', { name: '应用排版', exact: true })).toBeVisible();
  381 |       await page.screenshot({
  382 |         path: path.join(audit, `text-dialog-${theme}${small ? '-320' : ''}.png`),
  383 |         fullPage: true,
  384 |         animations: 'disabled',
  385 |       });
  386 |       await dialog.getByRole('button', { name: '取消', exact: true }).click();
  387 |       await expect(dialog).toBeHidden();
  388 |       if (theme === 'dark')
  389 |         await page.getByRole('button', { name: '切换浅色', exact: true }).click();
  390 |     }
  391 |   }
  392 |   await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  393 |   await expect(page.getByRole('button', { name: '文字排版', exact: true })).toBeDisabled();
  394 |   await expect(page.getByRole('button', { name: '自动换行', exact: true })).toBeDisabled();
  395 |   await writeFile(
  396 |     path.join(audit, 'browser-roundtrip-evidence.json'),
  397 |     JSON.stringify(
  398 |       {
  399 |         source: { file: 'text-source.xlsx', sha256: hash(source) },
  400 |         rounds,
  401 |         grid: measured,
  402 |         print: printedGeometry,
  403 |         viewport: { width: 320, height: 720 },
  404 |         readOnly: true,
  405 |       },
  406 |       null,
  407 |       2
  408 |     ) + '\n'
  409 |   );
  410 | });
  411 |
  412 | test('text formatting holds invalid drafts, cancels cleanly and rejects protected batches before adding history', async ({
  413 |   page,
  414 | }) => {
  415 |   test.setTimeout(90000);
  416 |   await mkdir(audit, { recursive: true });
  417 |   const { source } = await fixture();
  418 |   await page.goto('/#/components/office-studio');
  419 |   await importFile(page, source, 'Text-guards.xlsx');
  420 |   const formula = page.getByLabel('表格公式栏', { exact: true });
  421 |   await formula.fill('x'.repeat(32768));
  422 |   await page.getByRole('button', { name: '文字排版', exact: true }).click();
  423 |   await expect(page.getByRole('dialog', { name: '单元格文字排版', exact: true })).toHaveCount(0);
  424 |   await expect(page.locator('.zuvi-studio-sheet')).toHaveAttribute('data-studio-input-error');
  425 |   await formula.press('Escape');
  426 |   let dialog = await open(page, 'A1');
  427 |   await dialog.getByLabel('文字缩进', { exact: true }).fill('251');
  428 |   await expect(dialog.getByRole('alert')).toHaveText('缩进须为 0 至 250 之间的整数。');
  429 |   await expect(dialog.getByRole('button', { name: '应用排版', exact: true })).toBeDisabled();
  430 |   await expect(page.locator('.zuvi-studio-sheet')).toHaveAttribute('data-studio-input-error');
  431 |   await dialog.getByRole('button', { name: '取消', exact: true }).click();
  432 |   await expect(dialog).toBeHidden();
  433 |   await expect(page.locator('.zuvi-studio-sheet')).not.toHaveAttribute('data-studio-input-error');
  434 |   await expect(page.getByRole('button', { name: '撤销表格修改', exact: true })).toBeDisabled();
  435 |   await range(page, 'B1');
  436 |   await page.getByRole('tab', { name: '数据', exact: true }).click();
> 437 |   await page.getByRole('button', { name: '保护所选区域', exact: true }).click();
      |                                                                   ^ Error: locator.click: Test timeout of 90000ms exceeded.
  438 |   await page.getByRole('tab', { name: '开始', exact: true }).click();
  439 |   dialog = await open(page, 'A1:C1');
  440 |   await choose(page, dialog, '文字水平对齐', '跨选区居中');
  441 |   await dialog.getByRole('button', { name: '应用排版', exact: true }).click();
  442 |   await expect(dialog.getByRole('alert')).toHaveText('选区包含受保护区域，整次格式应用已取消。');
  443 |   await page.screenshot({
  444 |     path: path.join(audit, 'text-protected-rejection.png'),
  445 |     fullPage: true,
  446 |     animations: 'disabled',
  447 |   });
  448 |   await dialog.getByRole('button', { name: '取消', exact: true }).click();
  449 |   await expect(dialog).toBeHidden();
  450 |   const protectedBytes = await exportFile(page);
  451 |   await writeFile(path.join(audit, 'text-protected-after-rejection.xlsx'), protectedBytes);
  452 |   const saved = new ExcelJS.Workbook();
  453 |   await saved.xlsx.load(protectedBytes);
  454 |   expect(saved.getWorksheet('Text')!.getCell('A1').alignment.horizontal).not.toBe(
  455 |     'centerContinuous'
  456 |   );
  457 |   await page.getByRole('button', { name: '撤销表格修改', exact: true }).click();
  458 |   await expect(page.getByRole('button', { name: '撤销表格修改', exact: true })).toBeDisabled();
  459 |   await page.getByRole('tab', { name: '数据', exact: true }).click();
  460 |   await expect(page.getByRole('button', { name: '取消区域保护', exact: true })).toBeDisabled();
  461 |   await page.getByRole('tab', { name: '开始', exact: true }).click();
  462 |   await page.getByRole('button', { name: '重做表格修改', exact: true }).click();
  463 |   await page.getByRole('tab', { name: '数据', exact: true }).click();
  464 |   await expect(page.getByRole('button', { name: '取消区域保护', exact: true })).toBeEnabled();
  465 |   await writeFile(
  466 |     path.join(audit, 'browser-guard-evidence.json'),
  467 |     JSON.stringify(
  468 |       {
  469 |         sourceHash: hash(source),
  470 |         outputHash: hash(protectedBytes),
  471 |         invalidDraftRejected: true,
  472 |         cancelClearedGuard: true,
  473 |         protectedBatchRejected: true,
  474 |         undoStepsForProtection: 1,
  475 |         redoRestoredProtection: true,
  476 |       },
  477 |       null,
  478 |       2
  479 |     ) + '\n'
  480 |   );
  481 | });
  482 |
```