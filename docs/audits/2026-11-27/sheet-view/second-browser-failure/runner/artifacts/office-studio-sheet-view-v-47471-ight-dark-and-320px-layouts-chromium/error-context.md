# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-sheet-view.spec.ts >> view geometry, hidden merge masters and print stay consistent in light, dark and 320px layouts
- Location: e2e/office-studio-sheet-view.spec.ts:406:1

# Error details

```
Error: expect(received).toBeCloseTo(expected, precision)

Expected: 298.5
Received: 298.65625

Expected precision:    1
Expected difference: < 0.05
Received difference:   0.15625
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
                    - status "有未保存修改" [ref=e373]
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
                          - checkbox "显示网格线" [checked] [ref=e448]
                          - generic [ref=e450]: 显示网格线
                        - generic [ref=e451] [cursor=pointer]:
                          - checkbox "显示行列标题" [checked] [ref=e452]
                          - generic [ref=e454]: 显示行列标题
                        - generic [ref=e455]: 显示
                      - generic [ref=e456]:
                        - generic [ref=e457]:
                          - button "冻结首行" [ref=e458] [cursor=pointer]
                          - button "冻结首列" [ref=e460] [cursor=pointer]
                          - button "取消冻结" [ref=e462] [cursor=pointer]
                        - generic [ref=e464]: 冻结窗格
                - generic [ref=e465]:
                  - textbox "单元格地址" [ref=e467]: A1
                  - generic [aria-hidden] [ref=e468]: ƒx
                  - textbox "表格公式栏" [ref=e470]:
                    - /placeholder: 输入内容或公式
                    - text: HIDDEN_MASTER
                - grid "HiddenMaster 单元格网格" [active] [ref=e472]:
                  - generic [ref=e473]:
                    - row [ref=e474]:
                      - columnheader "行号" [ref=e475]
                      - columnheader "B B 列宽" [ref=e476]:
                        - generic [ref=e477]: B
                        - separator "B 列宽" [ref=e478]
                      - columnheader "C C 列宽" [ref=e479]:
                        - generic [ref=e480]: C
                        - separator "C 列宽" [ref=e481]
                      - columnheader "D D 列宽" [ref=e482]:
                        - generic [ref=e483]: D
                        - separator "D 列宽" [ref=e484]
                    - row [ref=e485]:
                      - rowheader "2 2 行高" [ref=e486]:
                        - generic [ref=e487]: "2"
                        - separator "2 行高" [ref=e488]
                      - gridcell "D2" [ref=e489]:
                        - generic: VISIBLE_TAIL
                    - row [ref=e490]:
                      - rowheader "3 3 行高" [ref=e491]:
                        - generic [ref=e492]: "3"
                        - separator "3 行高" [ref=e493]
                      - gridcell "B3" [ref=e494]
                      - gridcell "C3" [ref=e495]
                      - gridcell "D3" [ref=e496]:
                        - generic: CONTROL_ROW
                    - row [ref=e497]:
                      - rowheader "4 4 行高" [ref=e498]:
                        - generic [ref=e499]: "4"
                        - separator "4 行高" [ref=e500]
                      - gridcell "B4" [ref=e501]
                      - gridcell "C4" [ref=e502]
                      - gridcell "D4" [ref=e503]
                    - row [ref=e504]:
                      - rowheader "5 5 行高" [ref=e505]:
                        - generic [ref=e506]: "5"
                        - separator "5 行高" [ref=e507]
                      - gridcell "B5" [ref=e508]
                      - gridcell "C5" [ref=e509]
                      - gridcell "D5" [ref=e510]
                    - row [ref=e511]:
                      - rowheader "6 6 行高" [ref=e512]:
                        - generic [ref=e513]: "6"
                        - separator "6 行高" [ref=e514]
                      - gridcell "B6" [ref=e515]
                      - gridcell "C6" [ref=e516]
                      - gridcell "D6" [ref=e517]
                    - row [ref=e518]:
                      - rowheader "7 7 行高" [ref=e519]:
                        - generic [ref=e520]: "7"
                        - separator "7 行高" [ref=e521]
                      - gridcell "B7" [ref=e522]
                      - gridcell "C7" [ref=e523]
                      - gridcell "D7" [ref=e524]
                    - row [ref=e525]:
                      - rowheader "8 8 行高" [ref=e526]:
                        - generic [ref=e527]: "8"
                        - separator "8 行高" [ref=e528]
                      - gridcell "B8" [ref=e529]
                      - gridcell "C8" [ref=e530]
                      - gridcell "D8" [ref=e531]
                    - row [ref=e532]:
                      - rowheader "9 9 行高" [ref=e533]:
                        - generic [ref=e534]: "9"
                        - separator "9 行高" [ref=e535]
                      - gridcell "B9" [ref=e536]
                      - gridcell "C9" [ref=e537]
                      - gridcell "D9" [ref=e538]
                    - row "A1":
                      - gridcell "A1" [ref=e539]:
                        - generic:
                          - generic:
                            - generic: HIDDEN_MAS
                            - generic: TER
                  - button "填充柄" [ref=e540]
                - generic [ref=e541]:
                  - tablist "工作表" [ref=e543]:
                    - tab "Main" [ref=e544] [cursor=pointer]
                    - tab "HiddenMaster" [selected] [ref=e545] [cursor=pointer]
                    - tab "SmallNative" [ref=e546] [cursor=pointer]
                  - button "新增工作表" [ref=e547] [cursor=pointer]
                  - button "删除工作表" [ref=e550] [cursor=pointer]
                  - status "工作表视图已更新；可撤销。" [ref=e555]
                  - generic "A1" [ref=e556]
            - paragraph [ref=e557]: 文件保存在当前浏览器的本地文档空间。需要长期留存时，请导出文件。
          - group [ref=e558]:
            - generic "示例代码" [ref=e559] [cursor=pointer]:
              - generic [aria-hidden] [ref=e560]: </>
              - text: 示例代码
              - generic [aria-hidden] [ref=e561]: 展开 / 收起
        - heading "编辑能力" [level=2] [ref=e562]
        - table [ref=e564]:
          - rowgroup [ref=e565]:
            - row [ref=e566]:
              - columnheader "文档" [ref=e567]
              - columnheader "支持的操作" [ref=e568]
              - columnheader "当前范围" [ref=e569]
          - rowgroup [ref=e570]:
            - row [ref=e571]:
              - cell "Word" [ref=e572]
              - cell "字体与小数字号输入、正文排版、列表、表格、图片、页眉页脚、页码、查找替换、页面设置、撤销重做；导入与导出 DOCX" [ref=e573]
              - cell "支持内嵌图片与单节文档。修订、目录、浮动对象等复杂结构会提示暂不支持。" [ref=e574]
            - row [ref=e575]:
              - cell "Excel" [ref=e576]
              - cell "单元格与矩形选区、字体与小数字号输入、手动与自动行高/列宽、查找替换、边框与垂直对齐、清除格式、公式和跨表引用、格式、复制粘贴、工作表增删、行列插入删除、合并、冻结、排序、筛选、柱状图与折线图；导入与导出 XLSX" [ref=e577]
              - cell "10,000 行、256 列、32 张表、100,000 个已使用单元格。透视、宏、数组公式及复杂图表暂不支持。" [ref=e578]
            - row [ref=e579]:
              - cell "PDF" [ref=e580]
              - cell "分页与缩略图、缩放、旋转、全文查找、文字与高亮、矩形和手写批注、已有表单、撤销重做；导出 PDF" [ref=e581]
              - cell "批注和表单编辑。任意原始文字修改、原文重排及扫描件 OCR 暂不支持。" [ref=e582]
        - heading "组件接入" [level=2] [ref=e583]
        - paragraph [ref=e584]: UI 组件使用 Tiptap / ProseMirror 和公式计算库；文件适配使用 docx、ExcelJS、pdf-lib 与 PDF.js。本页无需文档服务器。宿主可以替换保存与导入导出回调，接入自己的文件系统。
        - paragraph [ref=e585]:
          - text: PDF 的 worker、字体与渲染由
          - code [ref=e586]: pdfRenderer
          - text: 提供。本页的适配代码位于
          - code [ref=e587]: docs/src/pages/collaboration/office-studio/
          - text: 。组件自 v0.4.0 起随
          - code [ref=e588]: "@zuvi/react"
          - text: 和 Registry 发布。
        - region "组件属性表，可横向滚动" [ref=e589]:
          - table [ref=e590]:
            - rowgroup [ref=e591]:
              - row [ref=e592]:
                - columnheader "属性名" [ref=e593]
                - columnheader "类型" [ref=e594]
                - columnheader "默认值" [ref=e595]
                - columnheader "说明" [ref=e596]
            - rowgroup [ref=e597]:
              - row [ref=e598]:
                - cell "value / defaultValue" [ref=e599]
                - cell [ref=e600]:
                  - code [ref=e601]: OfficeStudioDocument
                - cell [ref=e602]:
                  - code [ref=e603]: —
                - cell "受控文档或非受控初始文档；支持 Word、Excel、PDF 三种模型。" [ref=e604]
              - row [ref=e605]:
                - cell "onChange" [ref=e606]
                - cell [ref=e607]:
                  - code [ref=e608]: (document) => void
                - cell [ref=e609]:
                  - code [ref=e610]: —
                - cell "内容或文件名称变化。" [ref=e611]
              - row [ref=e612]:
                - cell "source / pdfRenderer" [ref=e613]
                - cell [ref=e614]:
                  - code [ref=e615]: Blob / StudioPdfRenderer
                - cell [ref=e616]:
                  - code [ref=e617]: —
                - cell "原始文件及 PDF 渲染适配；worker 资源由宿主管理。" [ref=e618]
              - row [ref=e619]:
                - cell "onSave / onExport / onPrint" [ref=e620]
                - cell [ref=e621]:
                  - code [ref=e622]: (document) => void | Promise<void>
                - cell [ref=e623]:
                  - code [ref=e624]: —
                - cell "宿主处理保存、导出或打印；返回后更新状态，失败可重试。" [ref=e625]
              - row [ref=e626]:
                - cell "onImport / onCreate" [ref=e627]
                - cell [ref=e628]:
                  - code [ref=e629]: (file | kind) => void | Promise<void>
                - cell [ref=e630]:
                  - code [ref=e631]: —
                - cell "宿主解析文件或创建模型，并更新受控值。" [ref=e632]
              - row [ref=e633]:
                - cell "readOnly / disabled" [ref=e634]
                - cell [ref=e635]:
                  - code [ref=e636]: boolean
                - cell [ref=e637]:
                  - code [ref=e638]: "false"
                - cell "只读预览或禁用编辑与文件操作。" [ref=e639]
              - row [ref=e640]:
                - cell "saveState" [ref=e641]
                - cell [ref=e642]:
                  - code [ref=e643]: "'saved' | 'saving' | 'unsaved' | 'error'"
                - cell [ref=e644]:
                  - code [ref=e645]: —
                - cell "宿主自动保存状态。" [ref=e646]
              - row [ref=e647]:
                - cell "height" [ref=e648]
                - cell [ref=e649]:
                  - code [ref=e650]: number | string
                - cell [ref=e651]:
                  - code [ref=e652]: "760"
                - cell "编辑器高度；100% 需要父容器设置确定高度。" [ref=e653]
              - row [ref=e654]:
                - cell "fullscreen / onFullscreenChange" [ref=e655]
                - cell [ref=e656]:
                  - code [ref=e657]: boolean / (value) => void
                - cell [ref=e658]:
                  - code [ref=e659]: —
                - cell "全屏布局，切换时编辑内容保持挂载。" [ref=e660]
              - row [ref=e661]:
                - cell "ref" [ref=e662]
                - cell [ref=e663]:
                  - code [ref=e664]: OfficeStudioHandle
                - cell [ref=e665]:
                  - code [ref=e666]: —
                - cell "getDocument()、save()、export()、print()、setFullscreen()。" [ref=e667]
              - row [ref=e668]:
                - cell "classNames" [ref=e669]
                - cell [ref=e670]:
                  - code [ref=e671]: "{ root?; header?; title?; actions?; stage?; status?; error? }"
                - cell [ref=e672]:
                  - code [ref=e673]: —
                - cell "追加语义结构类名，配合 data-part 与 CSS 变量定制。" [ref=e674]
  - text: ✓ ✓
```

# Test source

```ts
  383 |   await page.screenshot({
  384 |     path: path.join(audit, 'view-preview-guards.png'),
  385 |     fullPage: true,
  386 |     animations: 'disabled',
  387 |   });
  388 |   await writeFile(
  389 |     path.join(audit, 'browser-preview-evidence.json'),
  390 |     JSON.stringify(
  391 |       {
  392 |         source: hash(source),
  393 |         cancel: hash(afterCancel),
  394 |         readOnly: hash(previewBytes),
  395 |         protected: hash(protectedBytes),
  396 |         nativeZoom: 10,
  397 |         localPreviewZoom: 75,
  398 |         protectedViewZoom: 25,
  399 |       },
  400 |       null,
  401 |       2
  402 |     ) + '\n'
  403 |   );
  404 | });
  405 | 
  406 | test('view geometry, hidden merge masters and print stay consistent in light, dark and 320px layouts', async ({
  407 |   page,
  408 |   context,
  409 | }) => {
  410 |   test.setTimeout(150000);
  411 |   await mkdir(audit, { recursive: true });
  412 |   await installPrintCapture(page);
  413 |   const source = await fixture();
  414 |   await writeFile(path.join(audit, 'view-visual-source.xlsx'), source);
  415 |   await page.goto('/#/components/office-studio');
  416 |   await importFile(page, source, 'Visual.xlsx');
  417 |   await page.getByRole('tab', { name: '视图', exact: true }).click();
  418 |   const cell = (address: string) => page.getByRole('gridcell', { name: address, exact: true });
  419 |   await page.evaluate(() => document.fonts.ready);
  420 |   await range(page, 'A12');
  421 |   const base = await geometry(cell('A12'));
  422 |   const print100 = await capturePrint(page);
  423 |   await writeFile(path.join(audit, 'view-print-100.html'), print100);
  424 |   await zoom(page, 400);
  425 |   await range(page, 'A12');
  426 |   const enlarged = await geometry(cell('A12'));
  427 |   expect(enlarged.width).toBeCloseTo(base.width * 4, 1);
  428 |   expect(enlarged.height).toBeCloseTo(base.height * 4, 1);
  429 |   expect(enlarged.lines).toHaveLength(base.lines.length);
  430 |   for (let index = 0; index < base.lines.length; index++) {
  431 |     expect(enlarged.lines[index].x).toBeCloseTo(base.lines[index].x * 4, 1);
  432 |     expect(enlarged.lines[index].y).toBeCloseTo(base.lines[index].y * 4, 1);
  433 |   }
  434 |   await page.getByRole('checkbox', { name: '显示网格线', exact: true }).uncheck();
  435 |   await page.getByRole('checkbox', { name: '显示行列标题', exact: true }).uncheck();
  436 |   const print400 = await capturePrint(page);
  437 |   await writeFile(path.join(audit, 'view-print-400.html'), print400);
  438 |   expect(print400).toBe(print100);
  439 |   const preview = await context.newPage();
  440 |   await preview.setContent(print400);
  441 |   await preview.evaluate(() => document.fonts.ready);
  442 |   // Logical row 12 is physical row 11 because source row 2 is hidden.
  443 |   // Visual word gaps need no separate text-node spaces between wrapped spans.
  444 |   const printedCell = preview
  445 |     .locator('.studio-print-sheet')
  446 |     .first()
  447 |     .locator('tr')
  448 |     .nth(10)
  449 |     .locator('td')
  450 |     .first();
  451 |   expect(await printedCell.evaluate((element) => element.textContent!.replace(/\s/g, ''))).toBe(
  452 |     wrapped.replace(/\s/g, '')
  453 |   );
  454 |   const printed = await geometry(printedCell);
  455 |   expect(printed.width).toBeCloseTo(base.width, 1);
  456 |   expect(printed.height).toBeCloseTo(base.height, 1);
  457 |   expect(printed.lines).toHaveLength(base.lines.length);
  458 |   await preview.screenshot({
  459 |     path: path.join(audit, 'view-print.png'),
  460 |     fullPage: true,
  461 |     animations: 'disabled',
  462 |   });
  463 |   await preview.pdf({
  464 |     path: path.join(audit, 'view-print.pdf'),
  465 |     preferCSSPageSize: true,
  466 |     printBackground: true,
  467 |   });
  468 |   await preview.close();
  469 |   await page.getByRole('tab', { name: 'HiddenMaster', exact: true }).click();
  470 |   await zoom(page, 25);
  471 |   await range(page, 'A1');
  472 |   const hidden25 = await geometry(cell('A1'));
  473 |   expect(hidden25.width).toBeCloseTo(base.width / 2, 1);
  474 |   expect(hidden25.height).toBeGreaterThan(9.2);
  475 |   await expect(cell('A1')).toHaveText('HIDDEN_MASTER');
  476 |   await expect(cell('D3')).toHaveText('CONTROL_ROW');
  477 |   await expect(cell('A3')).toHaveCount(0);
  478 |   await expect(cell('D1')).toHaveCount(0);
  479 |   await zoom(page, 400);
  480 |   await range(page, 'A1');
  481 |   const hidden400 = await geometry(cell('A1'));
  482 |   expect(hidden400.width).toBeCloseTo(hidden25.width * 16, 1);
> 483 |   expect(hidden400.height).toBeCloseTo(hidden25.height * 16, 1);
      |                            ^ Error: expect(received).toBeCloseTo(expected, precision)
  484 |   await page.getByRole('tab', { name: 'Main', exact: true }).click();
  485 |   await zoom(page, 25);
  486 |   await range(page, 'A1');
  487 |   await page.getByRole('grid').evaluate((element) => {
  488 |     element.scrollLeft = 0;
  489 |     element.scrollTop = 0;
  490 |   });
  491 |   const screenshots = [];
  492 |   for (const width of [1280, 320]) {
  493 |     await page.setViewportSize({ width, height: width === 320 ? 720 : 1000 });
  494 |     for (const theme of ['light', 'dark']) {
  495 |       if (theme === 'dark')
  496 |         await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  497 |       const file = `view-${theme}-${width}.png`;
  498 |       await page
  499 |         .getByRole('textbox', { name: '工作表缩放百分比', exact: true })
  500 |         .scrollIntoViewIfNeeded();
  501 |       await page.screenshot({
  502 |         path: path.join(audit, file),
  503 |         fullPage: true,
  504 |         animations: 'disabled',
  505 |       });
  506 |       const dimensions = await page.locator('.zuvi-studio-sheet').evaluate((element) => ({
  507 |         width: element.getBoundingClientRect().width,
  508 |         documentWidth: document.documentElement.scrollWidth,
  509 |         viewport: innerWidth,
  510 |       }));
  511 |       expect(dimensions.documentWidth).toBeLessThanOrEqual(width);
  512 |       expect(dimensions.width).toBeLessThanOrEqual(width);
  513 |       screenshots.push({ file, width, theme, dimensions });
  514 |       if (theme === 'dark')
  515 |         await page.getByRole('button', { name: '切换浅色', exact: true }).click();
  516 |     }
  517 |   }
  518 |   await range(page, 'C4');
  519 |   await cell('C4').dblclick();
  520 |   const editor = page.getByRole('textbox', { name: '编辑 C4', exact: true });
  521 |   await expect(editor).toBeFocused();
  522 |   const editorBox = await editor.boundingBox();
  523 |   expect(editorBox!.height).toBeGreaterThanOrEqual(23);
  524 |   expect(editorBox!.width).toBeGreaterThanOrEqual(100);
  525 |   await editor.fill('25');
  526 |   await editor.press('Escape');
  527 |   await expect(cell('C4')).toHaveText('10');
  528 |   await writeFile(
  529 |     path.join(audit, 'browser-visual-print-evidence.json'),
  530 |     JSON.stringify(
  531 |       {
  532 |         source: hash(source),
  533 |         base,
  534 |         enlarged,
  535 |         printed,
  536 |         print100: hash(print100),
  537 |         print400: hash(print400),
  538 |         hidden25,
  539 |         hidden400,
  540 |         screenshots,
  541 |         editor: editorBox,
  542 |       },
  543 |       null,
  544 |       2
  545 |     ) + '\n'
  546 |   );
  547 | });
  548 | 
```