# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-sheet-view.spec.ts >> view zoom and visibility use correct grid, fill, resize and native coordinates over two XLSX reopens
- Location: e2e/office-studio-sheet-view.spec.ts:178:1

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByRole('columnheader')
Expected: 0
Received: 7
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" getByRole('columnheader') with timeout 5000ms
  - waiting for getByRole('columnheader')
    14 × locator resolved to 7 elements
       - unexpected value "7"

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
                - button "打开本地文档 View.xlsx" [ref=e356] [cursor=pointer]:
                  - generic [ref=e357]: View.xlsx
              - button "历史版本" [ref=e358] [cursor=pointer]
              - switch "只读预览" [ref=e360] [cursor=pointer]
            - region "Excel 文档编辑器" [ref=e364]:
              - generic [ref=e365]:
                - generic [ref=e366]:
                  - generic [ref=e371]: Excel
                  - generic "可编辑 · ⌘ / Ctrl S 保存" [ref=e372]:
                    - status "已保存" [ref=e373]
                - textbox "文档名称" [ref=e378]: View.xlsx
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
                          - checkbox "显示行列标题" [active] [ref=e452]
                          - generic [ref=e454]: 显示行列标题
                        - generic [ref=e455]: 显示
                      - generic [ref=e456]:
                        - generic [ref=e457]:
                          - button "冻结首行" [ref=e458] [cursor=pointer]
                          - button "冻结首列" [ref=e460] [cursor=pointer]
                          - button "取消冻结" [ref=e462] [cursor=pointer]
                        - generic [ref=e464]: 冻结窗格
                - generic [ref=e465]:
                  - textbox "单元格地址" [ref=e467]: C7
                  - generic [aria-hidden] [ref=e468]: ƒx
                  - textbox "表格公式栏" [ref=e470]:
                    - /placeholder: 输入内容或公式
                    - text: "13"
                - grid "Main 单元格网格" [ref=e472]:
                  - generic [ref=e473]:
                    - row [ref=e474]:
                      - gridcell "A1" [ref=e475]:
                        - generic: "1"
                      - gridcell "C1" [ref=e476]
                      - gridcell "D1" [ref=e477]
                    - row [ref=e478]:
                      - gridcell "A3" [ref=e479]
                      - gridcell "C3" [ref=e480]
                      - gridcell "D3" [ref=e481]
                    - row [ref=e482]:
                      - gridcell "A4" [ref=e483]
                      - gridcell "C4" [selected] [ref=e484]:
                        - generic: "10"
                      - gridcell "D4" [ref=e485]
                    - row [ref=e486]:
                      - gridcell "A5" [ref=e487]
                      - gridcell "C5" [selected] [ref=e488]:
                        - generic: "11"
                      - gridcell "D5" [ref=e489]
                    - row [ref=e490]:
                      - gridcell "A6" [ref=e491]
                      - gridcell "C6" [selected] [ref=e492]:
                        - generic: "12"
                      - gridcell "D6" [ref=e493]
                    - row [ref=e494]:
                      - gridcell "A7" [ref=e495]
                      - gridcell "C7" [selected] [ref=e496]:
                        - generic: "13"
                      - gridcell "D7" [ref=e497]
                    - row [ref=e498]:
                      - gridcell "A8" [ref=e499]
                      - gridcell "C8" [ref=e500]
                      - gridcell "D8" [ref=e501]
                    - row [ref=e502]:
                      - gridcell "A9" [ref=e503]
                      - gridcell "C9" [ref=e504]:
                        - generic: VISIBLE_MERGE
                    - row [ref=e505]:
                      - gridcell "A10" [ref=e506]
                      - gridcell "C10" [ref=e507]
                      - gridcell "D10" [ref=e508]
                    - row [ref=e509]:
                      - gridcell "A11" [ref=e510]
                      - gridcell "C11" [ref=e511]
                      - gridcell "D11" [ref=e512]
                    - row [ref=e513]:
                      - gridcell "A12" [ref=e514]:
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
                      - gridcell "C12" [ref=e515]
                      - gridcell "D12" [ref=e516]
                  - button "填充柄" [ref=e517]
                - generic [ref=e518]:
                  - tablist "工作表" [ref=e520]:
                    - tab "Main" [selected] [ref=e521] [cursor=pointer]
                    - tab "HiddenMaster" [ref=e522] [cursor=pointer]
                    - tab "SmallNative" [ref=e523] [cursor=pointer]
                  - button "新增工作表" [ref=e524] [cursor=pointer]
                  - button "删除工作表" [ref=e527] [cursor=pointer]
                  - status "工作表视图已更新；可撤销。" [ref=e532]
                  - generic "选中 4 格 · 求和 46 · 平均 11.5" [ref=e533]
            - paragraph [ref=e534]: 文件保存在当前浏览器的本地文档空间。需要长期留存时，请导出文件。
          - group [ref=e535]:
            - generic "示例代码" [ref=e536] [cursor=pointer]:
              - generic [aria-hidden] [ref=e537]: </>
              - text: 示例代码
              - generic [aria-hidden] [ref=e538]: 展开 / 收起
        - heading "编辑能力" [level=2] [ref=e539]
        - table [ref=e541]:
          - rowgroup [ref=e542]:
            - row [ref=e543]:
              - columnheader "文档" [ref=e544]
              - columnheader "支持的操作" [ref=e545]
              - columnheader "当前范围" [ref=e546]
          - rowgroup [ref=e547]:
            - row [ref=e548]:
              - cell "Word" [ref=e549]
              - cell "字体与小数字号输入、正文排版、列表、表格、图片、页眉页脚、页码、查找替换、页面设置、撤销重做；导入与导出 DOCX" [ref=e550]
              - cell "支持内嵌图片与单节文档。修订、目录、浮动对象等复杂结构会提示暂不支持。" [ref=e551]
            - row [ref=e552]:
              - cell "Excel" [ref=e553]
              - cell "单元格与矩形选区、字体与小数字号输入、手动与自动行高/列宽、查找替换、边框与垂直对齐、清除格式、公式和跨表引用、格式、复制粘贴、工作表增删、行列插入删除、合并、冻结、排序、筛选、柱状图与折线图；导入与导出 XLSX" [ref=e554]
              - cell "10,000 行、256 列、32 张表、100,000 个已使用单元格。透视、宏、数组公式及复杂图表暂不支持。" [ref=e555]
            - row [ref=e556]:
              - cell "PDF" [ref=e557]
              - cell "分页与缩略图、缩放、旋转、全文查找、文字与高亮、矩形和手写批注、已有表单、撤销重做；导出 PDF" [ref=e558]
              - cell "批注和表单编辑。任意原始文字修改、原文重排及扫描件 OCR 暂不支持。" [ref=e559]
        - heading "组件接入" [level=2] [ref=e560]
        - paragraph [ref=e561]: UI 组件使用 Tiptap / ProseMirror 和公式计算库；文件适配使用 docx、ExcelJS、pdf-lib 与 PDF.js。本页无需文档服务器。宿主可以替换保存与导入导出回调，接入自己的文件系统。
        - paragraph [ref=e562]:
          - text: PDF 的 worker、字体与渲染由
          - code [ref=e563]: pdfRenderer
          - text: 提供。本页的适配代码位于
          - code [ref=e564]: docs/src/pages/collaboration/office-studio/
          - text: 。组件自 v0.4.0 起随
          - code [ref=e565]: "@zuvi/react"
          - text: 和 Registry 发布。
        - region "组件属性表，可横向滚动" [ref=e566]:
          - table [ref=e567]:
            - rowgroup [ref=e568]:
              - row [ref=e569]:
                - columnheader "属性名" [ref=e570]
                - columnheader "类型" [ref=e571]
                - columnheader "默认值" [ref=e572]
                - columnheader "说明" [ref=e573]
            - rowgroup [ref=e574]:
              - row [ref=e575]:
                - cell "value / defaultValue" [ref=e576]
                - cell [ref=e577]:
                  - code [ref=e578]: OfficeStudioDocument
                - cell [ref=e579]:
                  - code [ref=e580]: —
                - cell "受控文档或非受控初始文档；支持 Word、Excel、PDF 三种模型。" [ref=e581]
              - row [ref=e582]:
                - cell "onChange" [ref=e583]
                - cell [ref=e584]:
                  - code [ref=e585]: (document) => void
                - cell [ref=e586]:
                  - code [ref=e587]: —
                - cell "内容或文件名称变化。" [ref=e588]
              - row [ref=e589]:
                - cell "source / pdfRenderer" [ref=e590]
                - cell [ref=e591]:
                  - code [ref=e592]: Blob / StudioPdfRenderer
                - cell [ref=e593]:
                  - code [ref=e594]: —
                - cell "原始文件及 PDF 渲染适配；worker 资源由宿主管理。" [ref=e595]
              - row [ref=e596]:
                - cell "onSave / onExport / onPrint" [ref=e597]
                - cell [ref=e598]:
                  - code [ref=e599]: (document) => void | Promise<void>
                - cell [ref=e600]:
                  - code [ref=e601]: —
                - cell "宿主处理保存、导出或打印；返回后更新状态，失败可重试。" [ref=e602]
              - row [ref=e603]:
                - cell "onImport / onCreate" [ref=e604]
                - cell [ref=e605]:
                  - code [ref=e606]: (file | kind) => void | Promise<void>
                - cell [ref=e607]:
                  - code [ref=e608]: —
                - cell "宿主解析文件或创建模型，并更新受控值。" [ref=e609]
              - row [ref=e610]:
                - cell "readOnly / disabled" [ref=e611]
                - cell [ref=e612]:
                  - code [ref=e613]: boolean
                - cell [ref=e614]:
                  - code [ref=e615]: "false"
                - cell "只读预览或禁用编辑与文件操作。" [ref=e616]
              - row [ref=e617]:
                - cell "saveState" [ref=e618]
                - cell [ref=e619]:
                  - code [ref=e620]: "'saved' | 'saving' | 'unsaved' | 'error'"
                - cell [ref=e621]:
                  - code [ref=e622]: —
                - cell "宿主自动保存状态。" [ref=e623]
              - row [ref=e624]:
                - cell "height" [ref=e625]
                - cell [ref=e626]:
                  - code [ref=e627]: number | string
                - cell [ref=e628]:
                  - code [ref=e629]: "760"
                - cell "编辑器高度；100% 需要父容器设置确定高度。" [ref=e630]
              - row [ref=e631]:
                - cell "fullscreen / onFullscreenChange" [ref=e632]
                - cell [ref=e633]:
                  - code [ref=e634]: boolean / (value) => void
                - cell [ref=e635]:
                  - code [ref=e636]: —
                - cell "全屏布局，切换时编辑内容保持挂载。" [ref=e637]
              - row [ref=e638]:
                - cell "ref" [ref=e639]
                - cell [ref=e640]:
                  - code [ref=e641]: OfficeStudioHandle
                - cell [ref=e642]:
                  - code [ref=e643]: —
                - cell "getDocument()、save()、export()、print()、setFullscreen()。" [ref=e644]
              - row [ref=e645]:
                - cell "classNames" [ref=e646]
                - cell [ref=e647]:
                  - code [ref=e648]: "{ root?; header?; title?; actions?; stage?; status?; error? }"
                - cell [ref=e649]:
                  - code [ref=e650]: —
                - cell "追加语义结构类名，配合 data-part 与 CSS 变量定制。" [ref=e651]
  - text: ✓ ✓
```

# Test source

```ts
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
  209 |     .toBeCloseTo(initial.width * 4, 1);
  210 |   const c4 = await cell('C4').boundingBox(),
  211 |     c7 = await cell('C7').boundingBox();
  212 |   const handle = await page.getByRole('button', { name: '填充柄', exact: true }).boundingBox();
  213 |   expect(handle!.x + 4).toBeCloseTo(c4!.x + c4!.width, 1);
  214 |   expect(handle!.y + 4).toBeCloseTo(c4!.y + c4!.height, 1);
  215 |   await page.mouse.move(handle!.x + 4, handle!.y + 4);
  216 |   await page.mouse.down();
  217 |   await page.mouse.move(c7!.x + c7!.width / 2, c7!.y + c7!.height / 2, { steps: 8 });
  218 |   await expect(page.locator('.zuvi-studio-sheet-fill-preview')).toHaveCount(1);
  219 |   await page.screenshot({
  220 |     path: path.join(audit, 'view-fill-400.png'),
  221 |     fullPage: true,
  222 |     animations: 'disabled',
  223 |   });
  224 |   await page.mouse.up();
  225 |   for (const [address, value] of [
  226 |     ['C5', '11'],
  227 |     ['C6', '12'],
  228 |     ['C7', '13'],
  229 |   ])
  230 |     await expect(cell(address)).toHaveText(value);
  231 |   await page.getByRole('grid').press('Control+z');
  232 |   await expect(cell('C7')).toHaveText('');
  233 |   await page.getByRole('grid').press('Control+Shift+z');
  234 |   await expect(cell('C7')).toHaveText('13');
  235 |   const resize = page.getByRole('separator', { name: 'A 列宽', exact: true });
  236 |   const resizeBox = await resize.boundingBox();
  237 |   await page.mouse.move(resizeBox!.x + resizeBox!.width / 2, resizeBox!.y + resizeBox!.height / 2);
  238 |   await page.mouse.down();
  239 |   await page.mouse.move(
  240 |     resizeBox!.x + resizeBox!.width / 2 + 40,
  241 |     resizeBox!.y + resizeBox!.height / 2,
  242 |     { steps: 4 }
  243 |   );
  244 |   await page.mouse.up();
  245 |   expect((await geometry(cell('A1'))).width).toBeCloseTo(initial.width * 4 + 40, 1);
  246 |   await page.getByRole('grid').press('Control+z');
  247 |   expect((await geometry(cell('A1'))).width).toBeCloseTo(initial.width * 4, 1);
  248 |   await page.getByRole('checkbox', { name: '显示网格线', exact: true }).uncheck();
  249 |   await expect(cell('A1')).toHaveCSS('border-right-color', 'rgb(18, 52, 86)');
  250 |   await expect(cell('C4')).toHaveCSS('border-right-color', 'rgba(0, 0, 0, 0)');
  251 |   await page.getByRole('checkbox', { name: '显示行列标题', exact: true }).uncheck();
  252 |   await expect(page.getByRole('rowheader')).toHaveCount(0);
> 253 |   await expect(page.getByRole('columnheader')).toHaveCount(0);
      |                                                ^ Error: expect(locator).toHaveCount(expected) failed
  254 |   await expect(grid).toHaveAttribute('aria-rowcount', '200');
  255 |   await expect(cell('C4')).toHaveAttribute('aria-colindex', '3');
  256 |   await range(page, 'C9');
  257 |   await expect(cell('C9')).toHaveText('VISIBLE_MERGE');
  258 |   const merged = await geometry(cell('C9'));
  259 |   expect(merged.width).toBeCloseTo(initial.width * 12, 1);
  260 |   const rounds = [];
  261 |   for (let round = 1; round <= 2; round++) {
  262 |     const bytes = await exportFile(page);
  263 |     const file = `view-roundtrip-${round}.xlsx`;
  264 |     await writeFile(path.join(audit, file), bytes);
  265 |     const result = await nativeView(bytes);
  266 |     expect(result.views).toHaveLength(2);
  267 |     expect(result.views[0]).toBe(secondaryView);
  268 |     expect(attributes(result.views[1].match(/^<sheetView\b[^>]*>/)![0])).toEqual({
  269 |       ...attributes(primaryView.match(/^<sheetView\b[^>]*>/)![0]),
  270 |       zoomScale: '400',
  271 |       showGridLines: '0',
  272 |       showRowColHeaders: '0',
  273 |     });
  274 |     expect(result.views[1].slice(result.views[1].indexOf('>') + 1)).toBe(
  275 |       primaryView.slice(primaryView.indexOf('>') + 1)
  276 |     );
  277 |     const native = result.workbook.getWorksheet('Main')!;
  278 |     expect(native.getCell('C5').value).toBe(11);
  279 |     expect(native.getCell('C7').value).toBe(13);
  280 |     expect(native.getCell('F14').value).toMatchObject({ formula: 'C4*2', result: 20 });
  281 |     expect(native.model.merges).toContain('C9:E9');
  282 |     expect(native.getColumn('B').hidden).toBe(true);
  283 |     expect(native.getRow(2).hidden).toBe(true);
  284 |     expect(native.getColumn('A').width).toBe(16);
  285 |     expect(native.pageSetup.scale).toBe(83);
  286 |     expect(native.pageSetup.showGridLines).toBe(true);
  287 |     expect(native.pageSetup.showRowColHeaders).toBe(true);
  288 |     expect(result.workbook.views[0].activeTab).toBe(0);
  289 |     expect(result.workbook.views[1].activeTab).toBe(1);
  290 |     expect(result.workbook.worksheets[result.workbook.views[1].activeTab!].name).toBe(
  291 |       'HiddenMaster'
  292 |     );
  293 |     rounds.push({
  294 |       file,
  295 |       sha256: hash(bytes),
  296 |       primary: result.views[1],
  297 |       secondary: result.views[0],
  298 |     });
  299 |     await importFile(page, bytes, `View-reopened-${round}.xlsx`);
  300 |     await expect(root).toHaveAttribute('data-sheet-zoom', '400');
  301 |     await expect(root).toHaveAttribute('data-headers', 'false');
  302 |     await range(page, 'C7');
  303 |     await expect(cell('C7')).toHaveText('13');
  304 |   }
  305 |   await page.screenshot({
  306 |     path: path.join(audit, 'view-reopened-400.png'),
  307 |     fullPage: true,
  308 |     animations: 'disabled',
  309 |   });
  310 |   await writeFile(
  311 |     path.join(audit, 'browser-roundtrip-evidence.json'),
  312 |     JSON.stringify(
  313 |       { source: { file: 'view-source.xlsx', sha256: hash(source) }, initial, merged, rounds },
  314 |       null,
  315 |       2
  316 |     ) + '\n'
  317 |   );
  318 | });
  319 | 
  320 | test('native small zoom, invalid draft cancellation and read-only preview preserve the saved XLSX view', async ({
  321 |   page,
  322 | }) => {
  323 |   test.setTimeout(90000);
  324 |   await mkdir(audit, { recursive: true });
  325 |   const source = await fixture();
  326 |   await writeFile(path.join(audit, 'view-preview-source.xlsx'), source);
  327 |   await page.goto('/#/components/office-studio');
  328 |   await importFile(page, source, 'Preview.xlsx');
  329 |   await page.getByRole('tab', { name: 'SmallNative', exact: true }).click();
  330 |   await page.getByRole('tab', { name: '视图', exact: true }).click();
  331 |   const root = page.locator('.zuvi-studio-sheet');
  332 |   const input = page.getByRole('textbox', { name: '工作表缩放百分比', exact: true });
  333 |   await expect(root).toHaveAttribute('data-sheet-zoom', '10');
  334 |   await expect(input).toHaveValue('10');
  335 |   await expect(page.getByRole('button', { name: '缩小工作表', exact: true })).toBeDisabled();
  336 |   await input.fill('250');
  337 |   await input.press('Escape');
  338 |   await expect(input).toHaveValue('10');
  339 |   const afterCancel = await exportFile(page);
  340 |   await writeFile(path.join(audit, 'view-after-cancel.xlsx'), afterCancel);
  341 |   const cancelled = new ExcelJS.Workbook();
  342 |   await cancelled.xlsx.load(afterCancel);
  343 |   expect(cancelled.getWorksheet('SmallNative')!.views[0].zoomScale).toBe(10);
  344 |   await input.fill('401');
  345 |   await page.getByRole('button', { name: '导出文件', exact: true }).click();
  346 |   await expect(root).toHaveAttribute('data-studio-input-error');
  347 |   await expect(page.locator('.zuvi-office-studio')).toContainText('25 至 400');
  348 |   await input.press('Escape');
  349 |   await expect(root).not.toHaveAttribute('data-studio-input-error');
  350 |   await page.getByRole('button', { name: '放大工作表', exact: true }).click();
  351 |   await expect(root).toHaveAttribute('data-sheet-zoom', '25');
  352 |   await page.getByRole('grid').press('Control+z');
  353 |   await expect(root).toHaveAttribute('data-sheet-zoom', '10');
```