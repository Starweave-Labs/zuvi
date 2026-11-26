# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-sheet-text.spec.ts >> advanced text editing, native default font, automatic rows, print and two XLSX reopens use the actual editor
- Location: e2e/office-studio-sheet-text.spec.ts:125:1

# Error details

```
Test timeout of 150000ms exceeded.
```

```
Error: locator.click: Test timeout of 150000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '文字排版', exact: true })

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
                - button "打开本地文档 Text.xlsx" [ref=e356] [cursor=pointer]:
                  - generic [ref=e357]: Text.xlsx
              - button "历史版本" [ref=e358] [cursor=pointer]
              - switch "只读预览" [ref=e360] [cursor=pointer]
            - region "Excel 文档编辑器" [ref=e364]:
              - generic [ref=e365]:
                - generic [ref=e366]:
                  - generic [ref=e371]: Excel
                  - generic "可编辑 · ⌘ / Ctrl S 保存" [ref=e372]:
                    - status "已保存" [ref=e373]
                - textbox "文档名称" [ref=e378]: Text.xlsx
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
                      - tab "开始" [selected] [ref=e424] [cursor=pointer]
                      - tab "插入" [ref=e425] [cursor=pointer]
                      - tab "布局" [ref=e426] [cursor=pointer]
                      - tab "公式" [ref=e427] [cursor=pointer]
                      - tab "数据" [ref=e428] [cursor=pointer]
                      - tab "视图" [ref=e429] [cursor=pointer]
                  - tabpanel "开始" [ref=e430]:
                    - generic [ref=e431]:
                      - generic [ref=e432]:
                        - generic [ref=e433]:
                          - button "撤销表格修改" [disabled] [ref=e434]:
                            - generic [ref=e435]: ↶
                          - button "重做表格修改" [disabled] [ref=e436]:
                            - generic [ref=e437]: ↷
                          - button "清空" [ref=e438] [cursor=pointer]
                          - button "选择性粘贴" [disabled] [ref=e440]
                          - button "清除格式" [ref=e442] [cursor=pointer]
                          - button "格式刷" [ref=e444] [cursor=pointer]
                        - generic [ref=e446]:
                          - button "查找" [ref=e447] [cursor=pointer]
                          - button "替换" [ref=e449] [cursor=pointer]
                        - generic [ref=e451]: 编辑
                      - generic [ref=e452]:
                        - generic [ref=e453]:
                          - generic [ref=e456]:
                            - combobox "表格字体" [ref=e457]: Arial
                            - button "展开选项" [ref=e458] [cursor=pointer]
                          - generic [ref=e463]:
                            - combobox "表格字号" [ref=e464]: "9.5"
                            - button "展开选项" [ref=e465] [cursor=pointer]
                        - generic [ref=e468]:
                          - button "表格加粗" [pressed] [ref=e469] [cursor=pointer]:
                            - strong [ref=e471]: B
                          - button "表格斜体" [pressed] [ref=e472] [cursor=pointer]:
                            - generic [ref=e473]: I
                          - button "表格下划线" [ref=e475] [cursor=pointer]:
                            - generic [ref=e476]: U
                          - generic "表格文字颜色" [ref=e478]:
                            - button "表格文字颜色" [ref=e479] [cursor=pointer]
                          - generic "表格填充颜色" [ref=e481]:
                            - button "表格填充颜色" [ref=e482] [cursor=pointer]
                          - button "底色" [ref=e484] [cursor=pointer]
                        - generic [ref=e486]: 字体
                      - generic [ref=e487]:
                        - generic [ref=e488]:
                          - button "左对齐" [ref=e489] [cursor=pointer]
                          - button "居中对齐" [ref=e492] [cursor=pointer]
                          - button "右对齐" [ref=e495] [cursor=pointer]
                        - generic [ref=e498]: 对齐
                        - generic [ref=e499]:
                          - generic [ref=e500]: 单元格垂直对齐
                          - button "单元格垂直对齐 底端对齐" [ref=e501] [cursor=pointer]:
                            - generic [ref=e502]: 底端对齐
                      - generic [ref=e503]:
                        - generic [ref=e504]:
                          - generic [ref=e505]:
                            - generic [ref=e506]: 边框线型
                            - button "边框线型 细实线" [ref=e507] [cursor=pointer]:
                              - generic [ref=e508]: 细实线
                          - generic "边框颜色" [ref=e509]:
                            - button "边框颜色" [ref=e510] [cursor=pointer]:
                              - generic [ref=e512]: "#000000"
                        - generic [ref=e513]:
                          - button "所有边框" [ref=e514] [cursor=pointer]
                          - button "外侧边框" [ref=e516] [cursor=pointer]
                          - button "无边框" [ref=e518] [cursor=pointer]
                        - generic [ref=e520]: 边框
                      - generic [ref=e521]:
                        - generic [ref=e522]:
                          - generic [ref=e523]: 单元格数字格式
                          - button "单元格数字格式 常规" [ref=e524] [cursor=pointer]:
                            - generic [ref=e525]: 常规
                        - button "自定义数字格式" [ref=e526] [cursor=pointer]
                        - generic [ref=e528]: 数字格式
                      - generic [ref=e529]:
                        - generic [ref=e530]:
                          - button "自动换行" [ref=e531] [cursor=pointer]
                          - button "合并单元格" [ref=e533] [cursor=pointer]
                          - button "拆分单元格" [ref=e535] [cursor=pointer]
                        - generic [ref=e537]: 单元格布局
                      - generic [ref=e538]:
                        - generic [ref=e539]:
                          - button "行高" [ref=e540] [cursor=pointer]
                          - button "自动调整行高" [ref=e542] [cursor=pointer]
                        - button "恢复默认行高" [ref=e545] [cursor=pointer]
                        - generic [ref=e547]: 行大小 · 磅
                      - generic [ref=e548]:
                        - generic [ref=e549]:
                          - button "列宽" [ref=e550] [cursor=pointer]
                          - button "自动调整列宽" [ref=e552] [cursor=pointer]
                        - button "隐藏列" [ref=e554] [cursor=pointer]
                        - button "显示全部列" [disabled] [ref=e556]
                        - button "恢复默认列宽" [ref=e558] [cursor=pointer]
                        - generic [ref=e560]: 列大小 · 字符
                      - generic [ref=e561]:
                        - button "Σ 自动求和" [ref=e562] [cursor=pointer]
                        - button "数组公式" [ref=e564] [cursor=pointer]
                        - generic [ref=e566]: 公式
                        - button "保护所选区域" [ref=e567] [cursor=pointer]
                        - button "取消区域保护" [disabled] [ref=e569]
                      - generic [ref=e571]:
                        - generic [ref=e572]:
                          - button "条件格式" [ref=e573] [cursor=pointer]
                          - button "向下填充" [disabled] [ref=e575]
                          - button "向右填充" [ref=e577] [cursor=pointer]
                          - button "序列填充" [ref=e579] [cursor=pointer]
                        - generic [ref=e581]: 规则与填充
                - generic [ref=e582]:
                  - textbox "单元格地址" [ref=e584]: C1
                  - generic [aria-hidden] [ref=e585]: ƒx
                  - textbox "表格公式栏" [ref=e587]:
                    - /placeholder: 输入内容或公式
                - grid "Text 单元格网格" [active] [ref=e589]:
                  - generic [ref=e590]:
                    - row [ref=e591]:
                      - columnheader "行号" [ref=e592]
                      - columnheader "A A 列宽" [ref=e593]:
                        - text: A
                        - separator "A 列宽" [ref=e594]
                      - columnheader "B B 列宽" [ref=e595]:
                        - text: B
                        - separator "B 列宽" [ref=e596]
                      - columnheader "C C 列宽" [ref=e597]:
                        - text: C
                        - separator "C 列宽" [ref=e598]
                      - columnheader "D D 列宽" [ref=e599]:
                        - text: D
                        - separator "D 列宽" [ref=e600]
                      - columnheader "E E 列宽" [ref=e601]:
                        - text: E
                        - separator "E 列宽" [ref=e602]
                      - columnheader "F F 列宽" [ref=e603]:
                        - text: F
                        - separator "F 列宽" [ref=e604]
                      - columnheader "G G 列宽" [ref=e605]:
                        - text: G
                        - separator "G 列宽" [ref=e606]
                      - columnheader "H H 列宽" [ref=e607]:
                        - text: H
                        - separator "H 列宽" [ref=e608]
                      - columnheader "I I 列宽" [ref=e609]:
                        - text: I
                        - separator "I 列宽" [ref=e610]
                      - columnheader "J J 列宽" [ref=e611]:
                        - text: J
                        - separator "J 列宽" [ref=e612]
                    - row [ref=e613]:
                      - rowheader "1 1 行高" [ref=e614]:
                        - text: "1"
                        - separator "1 行高" [ref=e615]
                      - gridcell "A1" [selected] [ref=e616]:
                        - generic [ref=e617]: CENTER_TITLE
                      - gridcell "B1" [selected] [ref=e618]
                      - gridcell "C1" [selected] [ref=e619]
                      - gridcell "D1" [ref=e620]:
                        - generic [ref=e621]: Native label
                      - gridcell "E1" [ref=e622]
                      - gridcell "F1" [ref=e623]
                      - gridcell "G1" [ref=e624]
                      - gridcell "H1" [ref=e625]
                      - gridcell "I1" [ref=e626]
                      - gridcell "J1" [ref=e627]
                    - row [ref=e628]:
                      - rowheader "2 2 行高" [ref=e629]:
                        - text: "2"
                        - separator "2 行高" [ref=e630]
                      - gridcell "A2" [ref=e631]:
                        - generic [ref=e632]: 自动换行随列宽变化并保留原始文字与工作簿默认字体。
                      - gridcell "B2" [ref=e633]
                      - gridcell "C2" [ref=e634]
                      - gridcell "D2" [ref=e635]
                      - gridcell "E2" [ref=e636]
                      - gridcell "F2" [ref=e637]
                      - gridcell "G2" [ref=e638]
                      - gridcell "H2" [ref=e639]
                      - gridcell "I2" [ref=e640]
                      - gridcell "J2" [ref=e641]
                    - row [ref=e642]:
                      - rowheader "3 3 行高" [ref=e643]:
                        - text: "3"
                        - separator "3 行高" [ref=e644]
                      - gridcell "A3" [ref=e645]:
                        - generic [ref=e646]: ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz
                      - gridcell "B3" [ref=e647]
                      - gridcell "C3" [ref=e648]
                      - gridcell "D3" [ref=e649]
                      - gridcell "E3" [ref=e650]
                      - gridcell "F3" [ref=e651]
                      - gridcell "G3" [ref=e652]
                      - gridcell "H3" [ref=e653]
                      - gridcell "I3" [ref=e654]
                      - gridcell "J3" [ref=e655]
                    - row [ref=e656]:
                      - rowheader "4 4 行高" [ref=e657]:
                        - text: "4"
                        - separator "4 行高" [ref=e658]
                      - gridcell "A4" [ref=e659]:
                        - generic [ref=e660]: ANGLED_TEXT
                      - gridcell "B4" [ref=e661]
                      - gridcell "C4" [ref=e662]
                      - gridcell "D4" [ref=e663]
                      - gridcell "E4" [ref=e664]
                      - gridcell "F4" [ref=e665]
                      - gridcell "G4" [ref=e666]
                      - gridcell "H4" [ref=e667]
                      - gridcell "I4" [ref=e668]
                      - gridcell "J4" [ref=e669]
                    - row [ref=e670]:
                      - rowheader "5 5 行高" [ref=e671]:
                        - text: "5"
                        - separator "5 行高" [ref=e672]
                      - gridcell "A5" [ref=e673]:
                        - generic [ref=e674]: 竖排ABC
                      - gridcell "B5" [ref=e675]
                      - gridcell "C5" [ref=e676]
                      - gridcell "D5" [ref=e677]
                      - gridcell "E5" [ref=e678]
                      - gridcell "F5" [ref=e679]
                      - gridcell "G5" [ref=e680]
                      - gridcell "H5" [ref=e681]
                      - gridcell "I5" [ref=e682]
                      - gridcell "J5" [ref=e683]
                    - row [ref=e684]:
                      - rowheader "6 6 行高" [ref=e685]:
                        - text: "6"
                        - separator "6 行高" [ref=e686]
                      - gridcell "A6" [ref=e687]:
                        - generic [ref=e688]: "42"
                      - gridcell "B6" [ref=e689]:
                        - generic [ref=e690]: "#N/A"
                      - gridcell "C6" [ref=e691]:
                        - generic [ref=e692]: "FALSE"
                      - gridcell "D6" [ref=e693]
                      - gridcell "E6" [ref=e694]
                      - gridcell "F6" [ref=e695]
                      - gridcell "G6" [ref=e696]
                      - gridcell "H6" [ref=e697]
                      - gridcell "I6" [ref=e698]
                      - gridcell "J6" [ref=e699]
                    - row [ref=e700]:
                      - rowheader "7 7 行高" [ref=e701]:
                        - text: "7"
                        - separator "7 行高" [ref=e702]
                      - gridcell "A7" [ref=e703]:
                        - generic [ref=e704]: "**"
                      - gridcell "B7" [ref=e705]
                      - gridcell "C7" [ref=e706]
                      - gridcell "D7" [ref=e707]
                      - gridcell "E7" [ref=e708]
                      - gridcell "F7" [ref=e709]
                      - gridcell "G7" [ref=e710]
                      - gridcell "H7" [ref=e711]
                      - gridcell "I7" [ref=e712]
                      - gridcell "J7" [ref=e713]
                    - row [ref=e714]:
                      - rowheader "8 8 行高" [ref=e715]:
                        - text: "8"
                        - separator "8 行高" [ref=e716]
                      - gridcell "A8" [ref=e717]:
                        - generic [ref=e718]: Line one Line two Line three
                      - gridcell "B8" [ref=e719]:
                        - generic [ref=e720]: 分散对齐
                      - gridcell "C8" [ref=e721]
                      - gridcell "D8" [ref=e722]
                      - gridcell "E8" [ref=e723]
                      - gridcell "F8" [ref=e724]
                      - gridcell "G8" [ref=e725]
                      - gridcell "H8" [ref=e726]
                      - gridcell "I8" [ref=e727]
                      - gridcell "J8" [ref=e728]
                    - row [ref=e729]:
                      - rowheader "9 9 行高" [ref=e730]:
                        - text: "9"
                        - separator "9 行高" [ref=e731]
                      - gridcell "A9" [ref=e732]:
                        - generic [ref=e733]: "3"
                      - gridcell "B9" [ref=e734]:
                        - generic [ref=e735]: Cross sheet formula with a long text value
                      - gridcell "C9" [ref=e736]
                      - gridcell "D9" [ref=e737]
                      - gridcell "E9" [ref=e738]
                      - gridcell "F9" [ref=e739]
                      - gridcell "G9" [ref=e740]
                      - gridcell "H9" [ref=e741]
                      - gridcell "I9" [ref=e742]
                      - gridcell "J9" [ref=e743]
                    - row [ref=e744]:
                      - rowheader "10 10 行高" [ref=e745]:
                        - text: "10"
                        - separator "10 行高" [ref=e746]
                      - gridcell "A10" [ref=e747]:
                        - generic [ref=e748]: "1"
                      - gridcell "B10" [ref=e749]:
                        - generic [ref=e750]: "2"
                      - gridcell "C10" [ref=e751]
                      - gridcell "D10" [ref=e752]
                      - gridcell "E10" [ref=e753]
                      - gridcell "F10" [ref=e754]
                      - gridcell "G10" [ref=e755]
                      - gridcell "H10" [ref=e756]
                      - gridcell "I10" [ref=e757]
                      - gridcell "J10" [ref=e758]
                    - row [ref=e759]:
                      - rowheader "11 11 行高" [ref=e760]:
                        - text: "11"
                        - separator "11 行高" [ref=e761]
                      - gridcell "A11" [ref=e762]:
                        - generic [ref=e763]: "3"
                      - gridcell "B11" [ref=e764]:
                        - generic [ref=e765]: "4"
                      - gridcell "C11" [ref=e766]
                      - gridcell "D11" [ref=e767]
                      - gridcell "E11" [ref=e768]
                      - gridcell "F11" [ref=e769]
                      - gridcell "G11" [ref=e770]
                      - gridcell "H11" [ref=e771]
                      - gridcell "I11" [ref=e772]
                      - gridcell "J11" [ref=e773]
                    - row [ref=e774]:
                      - rowheader "12 12 行高" [ref=e775]:
                        - text: "12"
                        - separator "12 行高" [ref=e776]
                      - gridcell "A12" [ref=e777]
                      - gridcell "B12" [ref=e778]
                      - gridcell "C12" [ref=e779]
                      - gridcell "D12" [ref=e780]
                      - gridcell "E12" [ref=e781]
                      - gridcell "F12" [ref=e782]
                      - gridcell "G12" [ref=e783]
                      - gridcell "H12" [ref=e784]
                      - gridcell "I12" [ref=e785]
                      - gridcell "J12" [ref=e786]
                    - row [ref=e787]:
                      - rowheader "13 13 行高" [ref=e788]:
                        - text: "13"
                        - separator "13 行高" [ref=e789]
                      - gridcell "A13" [ref=e790]
                      - gridcell "B13" [ref=e791]
                      - gridcell "C13" [ref=e792]
                      - gridcell "D13" [ref=e793]
                      - gridcell "E13" [ref=e794]
                      - gridcell "F13" [ref=e795]
                      - gridcell "G13" [ref=e796]
                      - gridcell "H13" [ref=e797]
                      - gridcell "I13" [ref=e798]
                      - gridcell "J13" [ref=e799]
                    - row [ref=e800]:
                      - rowheader "14 14 行高" [ref=e801]:
                        - text: "14"
                        - separator "14 行高" [ref=e802]
                      - gridcell "A14" [ref=e803]
                      - gridcell "B14" [ref=e804]
                      - gridcell "C14" [ref=e805]
                      - gridcell "D14" [ref=e806]
                      - gridcell "E14" [ref=e807]
                      - gridcell "F14" [ref=e808]
                      - gridcell "G14" [ref=e809]
                      - gridcell "H14" [ref=e810]
                      - gridcell "I14" [ref=e811]
                      - gridcell "J14" [ref=e812]
                    - row [ref=e813]:
                      - rowheader "15 15 行高" [ref=e814]:
                        - text: "15"
                        - separator "15 行高" [ref=e815]
                      - gridcell "A15" [ref=e816]
                      - gridcell "B15" [ref=e817]
                      - gridcell "C15" [ref=e818]
                      - gridcell "D15" [ref=e819]
                      - gridcell "E15" [ref=e820]
                      - gridcell "F15" [ref=e821]
                      - gridcell "G15" [ref=e822]
                      - gridcell "H15" [ref=e823]
                      - gridcell "I15" [ref=e824]
                      - gridcell "J15" [ref=e825]
                    - row [ref=e826]:
                      - rowheader "16 16 行高" [ref=e827]:
                        - text: "16"
                        - separator "16 行高" [ref=e828]
                      - gridcell "A16" [ref=e829]
                      - gridcell "B16" [ref=e830]
                      - gridcell "C16" [ref=e831]
                      - gridcell "D16" [ref=e832]
                      - gridcell "E16" [ref=e833]
                      - gridcell "F16" [ref=e834]
                      - gridcell "G16" [ref=e835]
                      - gridcell "H16" [ref=e836]
                      - gridcell "I16" [ref=e837]
                      - gridcell "J16" [ref=e838]
                  - button "填充柄" [ref=e839]
                - generic [ref=e840]:
                  - tablist "工作表" [ref=e842]:
                    - tab "Text" [selected] [ref=e843] [cursor=pointer]
                    - tab "Other" [ref=e844] [cursor=pointer]
                  - button "新增工作表" [ref=e845] [cursor=pointer]
                  - button "删除工作表" [ref=e848] [cursor=pointer]
                  - status "双击或直接输入编辑，Shift + 方向键选择区域。" [ref=e853]
                  - generic "选中 3 格" [ref=e854]
            - paragraph [ref=e855]: 文件保存在当前浏览器的本地文档空间。需要长期留存时，请导出文件。
          - group [ref=e856]:
            - generic "示例代码" [ref=e857] [cursor=pointer]:
              - generic [aria-hidden] [ref=e858]: </>
              - text: 示例代码
              - generic [aria-hidden] [ref=e859]: 展开 / 收起
        - heading "编辑能力" [level=2] [ref=e860]
        - table [ref=e862]:
          - rowgroup [ref=e863]:
            - row [ref=e864]:
              - columnheader "文档" [ref=e865]
              - columnheader "支持的操作" [ref=e866]
              - columnheader "当前范围" [ref=e867]
          - rowgroup [ref=e868]:
            - row [ref=e869]:
              - cell "Word" [ref=e870]
              - cell "字体与小数字号输入、正文排版、列表、表格、图片、页眉页脚、页码、查找替换、页面设置、撤销重做；导入与导出 DOCX" [ref=e871]
              - cell "支持内嵌图片与单节文档。修订、目录、浮动对象等复杂结构会提示暂不支持。" [ref=e872]
            - row [ref=e873]:
              - cell "Excel" [ref=e874]
              - cell "单元格与矩形选区、字体与小数字号输入、手动与自动行高/列宽、查找替换、边框与垂直对齐、清除格式、公式和跨表引用、格式、复制粘贴、工作表增删、行列插入删除、合并、冻结、排序、筛选、柱状图与折线图；导入与导出 XLSX" [ref=e875]
              - cell "10,000 行、256 列、32 张表、100,000 个已使用单元格。透视、宏、数组公式及复杂图表暂不支持。" [ref=e876]
            - row [ref=e877]:
              - cell "PDF" [ref=e878]
              - cell "分页与缩略图、缩放、旋转、全文查找、文字与高亮、矩形和手写批注、已有表单、撤销重做；导出 PDF" [ref=e879]
              - cell "批注和表单编辑。任意原始文字修改、原文重排及扫描件 OCR 暂不支持。" [ref=e880]
        - heading "组件接入" [level=2] [ref=e881]
        - paragraph [ref=e882]: UI 组件使用 Tiptap / ProseMirror 和公式计算库；文件适配使用 docx、ExcelJS、pdf-lib 与 PDF.js。本页无需文档服务器。宿主可以替换保存与导入导出回调，接入自己的文件系统。
        - paragraph [ref=e883]:
          - text: PDF 的 worker、字体与渲染由
          - code [ref=e884]: pdfRenderer
          - text: 提供。本页的适配代码位于
          - code [ref=e885]: docs/src/pages/collaboration/office-studio/
          - text: 。组件自 v0.4.0 起随
          - code [ref=e886]: "@zuvi/react"
          - text: 和 Registry 发布。
        - region "组件属性表，可横向滚动" [ref=e887]:
          - table [ref=e888]:
            - rowgroup [ref=e889]:
              - row [ref=e890]:
                - columnheader "属性名" [ref=e891]
                - columnheader "类型" [ref=e892]
                - columnheader "默认值" [ref=e893]
                - columnheader "说明" [ref=e894]
            - rowgroup [ref=e895]:
              - row [ref=e896]:
                - cell "value / defaultValue" [ref=e897]
                - cell [ref=e898]:
                  - code [ref=e899]: OfficeStudioDocument
                - cell [ref=e900]:
                  - code [ref=e901]: —
                - cell "受控文档或非受控初始文档；支持 Word、Excel、PDF 三种模型。" [ref=e902]
              - row [ref=e903]:
                - cell "onChange" [ref=e904]
                - cell [ref=e905]:
                  - code [ref=e906]: (document) => void
                - cell [ref=e907]:
                  - code [ref=e908]: —
                - cell "内容或文件名称变化。" [ref=e909]
              - row [ref=e910]:
                - cell "source / pdfRenderer" [ref=e911]
                - cell [ref=e912]:
                  - code [ref=e913]: Blob / StudioPdfRenderer
                - cell [ref=e914]:
                  - code [ref=e915]: —
                - cell "原始文件及 PDF 渲染适配；worker 资源由宿主管理。" [ref=e916]
              - row [ref=e917]:
                - cell "onSave / onExport / onPrint" [ref=e918]
                - cell [ref=e919]:
                  - code [ref=e920]: (document) => void | Promise<void>
                - cell [ref=e921]:
                  - code [ref=e922]: —
                - cell "宿主处理保存、导出或打印；返回后更新状态，失败可重试。" [ref=e923]
              - row [ref=e924]:
                - cell "onImport / onCreate" [ref=e925]
                - cell [ref=e926]:
                  - code [ref=e927]: (file | kind) => void | Promise<void>
                - cell [ref=e928]:
                  - code [ref=e929]: —
                - cell "宿主解析文件或创建模型，并更新受控值。" [ref=e930]
              - row [ref=e931]:
                - cell "readOnly / disabled" [ref=e932]
                - cell [ref=e933]:
                  - code [ref=e934]: boolean
                - cell [ref=e935]:
                  - code [ref=e936]: "false"
                - cell "只读预览或禁用编辑与文件操作。" [ref=e937]
              - row [ref=e938]:
                - cell "saveState" [ref=e939]
                - cell [ref=e940]:
                  - code [ref=e941]: "'saved' | 'saving' | 'unsaved' | 'error'"
                - cell [ref=e942]:
                  - code [ref=e943]: —
                - cell "宿主自动保存状态。" [ref=e944]
              - row [ref=e945]:
                - cell "height" [ref=e946]
                - cell [ref=e947]:
                  - code [ref=e948]: number | string
                - cell [ref=e949]:
                  - code [ref=e950]: "760"
                - cell "编辑器高度；100% 需要父容器设置确定高度。" [ref=e951]
              - row [ref=e952]:
                - cell "fullscreen / onFullscreenChange" [ref=e953]
                - cell [ref=e954]:
                  - code [ref=e955]: boolean / (value) => void
                - cell [ref=e956]:
                  - code [ref=e957]: —
                - cell "全屏布局，切换时编辑内容保持挂载。" [ref=e958]
              - row [ref=e959]:
                - cell "ref" [ref=e960]
                - cell [ref=e961]:
                  - code [ref=e962]: OfficeStudioHandle
                - cell [ref=e963]:
                  - code [ref=e964]: —
                - cell "getDocument()、save()、export()、print()、setFullscreen()。" [ref=e965]
              - row [ref=e966]:
                - cell "classNames" [ref=e967]
                - cell [ref=e968]:
                  - code [ref=e969]: "{ root?; header?; title?; actions?; stage?; status?; error? }"
                - cell [ref=e970]:
                  - code [ref=e971]: —
                - cell "追加语义结构类名，配合 data-part 与 CSS 变量定制。" [ref=e972]
  - text: ✓ ✓ ✓ ✓
```

# Test source

```ts
  1   | import { expect, test, type Locator, type Page } from '@playwright/test';
  2   | import { mkdir, readFile, writeFile } from 'node:fs/promises';
  3   | import { createHash } from 'node:crypto';
  4   | import path from 'node:path';
  5   | import ExcelJS from '../docs/node_modules/exceljs/excel.js';
  6   | import JSZip from '../docs/node_modules/jszip/lib/index.js';
  7   |
  8   | const audit = path.resolve('docs/audits/2026-11-27/sheet-text-layout');
  9   | const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  10  | const hash = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');
  11  | const wrapped = '自动换行随列宽变化并保留原始文字与工作簿默认字体。';
  12  |
  13  | async function fixture() {
  14  |   const workbook = new ExcelJS.Workbook();
  15  |   const sheet = workbook.addWorksheet('Text', { properties: { defaultRowHeight: 18.75 } });
  16  |   for (const name of ['A', 'B', 'C', 'D']) sheet.getColumn(name).width = 16;
  17  |   sheet.getCell('A1').value = 'CENTER_TITLE';
  18  |   sheet.getCell('B1').alignment = { horizontal: 'general' };
  19  |   sheet.getCell('C1').alignment = { horizontal: 'general' };
  20  |   sheet.getCell('A2').value = wrapped;
  21  |   sheet.getCell('A3').value = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';
  22  |   sheet.getCell('A3').font = { name: 'Arial', size: 22 };
  23  |   sheet.getCell('A4').value = 'ANGLED_TEXT';
  24  |   sheet.getCell('A4').alignment = { horizontal: 'right', indent: 2, textRotation: 45 };
  25  |   sheet.getCell('A5').value = '竖排ABC';
  26  |   sheet.getRow(5).height = 90;
  27  |   sheet.getCell('A6').value = 42;
  28  |   sheet.getCell('A6').numFmt = '@';
  29  |   sheet.getCell('B6').value = { error: '#N/A' };
  30  |   sheet.getCell('C6').value = false;
  31  |   sheet.getCell('A7').value = '**';
  32  |   sheet.getCell('A8').value = 'Line one\nLine two\nLine three';
  33  |   sheet.getCell('A8').alignment = { wrapText: true };
  34  |   sheet.getCell('B8').value = '分散对齐';
  35  |   sheet.getRow(8).height = 72;
  36  |   sheet.getCell('A9').value = 3;
  37  |   sheet.getCell('B9').value = {
  38  |     formula: "'Other'!A1",
  39  |     result: 'Cross sheet formula with a long text value',
  40  |   };
  41  |   sheet.getCell('B9').alignment = { wrapText: true };
  42  |   sheet.getCell('A10').value = {
  43  |     formula: 'SEQUENCE(2,2)',
  44  |     shareType: 'array',
  45  |     ref: 'A10:B11',
  46  |     result: 1,
  47  |   };
  48  |   sheet.getCell('B10').value = 2;
  49  |   sheet.getCell('A11').value = 3;
  50  |   sheet.getCell('B11').value = 4;
  51  |   sheet.getCell('B11').font = { name: 'Arial', size: 30 };
  52  |   sheet.getCell('D1').value = {
  53  |     text: 'Native label',
  54  |     hyperlink: 'https://example.com/native-text',
  55  |   };
  56  |   workbook.addWorksheet('Other').getCell('A1').value = 'Cross sheet formula with a long text value';
  57  |   const zip = await JSZip.loadAsync(Buffer.from(await workbook.xlsx.writeBuffer()));
  58  |   const raw = await zip.file('xl/styles.xml')!.async('string');
  59  |   const font0 = '<font><b/><i/><sz val="9.5"/><name val="Arial"/></font>';
  60  |   zip.file('xl/styles.xml', raw.replace(/(<fonts\b[^>]*>)<font>[\s\S]*?<\/font>/, '$1' + font0));
  61  |   const source = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  62  |   return { source, font0 };
  63  | }
  64  |
  65  | async function importFile(page: Page, bytes: Buffer, name: string) {
  66  |   await page
  67  |     .getByLabel('导入文档文件', { exact: true })
  68  |     .setInputFiles({ name, mimeType, buffer: bytes });
  69  |   await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
  70  | }
  71  | async function range(page: Page, value: string) {
  72  |   const input = page.getByLabel('单元格地址', { exact: true });
  73  |   await input.fill(value);
  74  |   await input.press('Enter');
  75  | }
  76  | async function open(page: Page, address: string) {
  77  |   await range(page, address);
> 78  |   await page.getByRole('button', { name: '文字排版', exact: true }).click();
      |                                                                 ^ Error: locator.click: Test timeout of 150000ms exceeded.
  79  |   return page.getByRole('dialog', { name: '单元格文字排版', exact: true });
  80  | }
  81  | async function choose(page: Page, dialog: Locator, label: string, option: string) {
  82  |   const trigger = dialog.getByRole('button', { name: new RegExp('^' + label) });
  83  |   await trigger.click();
  84  |   const id = await trigger.getAttribute('aria-controls');
  85  |   await page.locator(`[id="${id}"]`).getByRole('option', { name: option, exact: true }).click();
  86  | }
  87  | async function apply(dialog: Locator) {
  88  |   await dialog.getByRole('button', { name: '应用排版', exact: true }).click();
  89  |   await expect(dialog).toBeHidden();
  90  | }
  91  | async function exportFile(page: Page) {
  92  |   const pending = page.waitForEvent('download');
  93  |   await page.getByRole('button', { name: '导出文件', exact: true }).click();
  94  |   return readFile((await (await pending).path())!);
  95  | }
  96  | async function geometry(locator: Locator) {
  97  |   return locator.evaluate((element) => {
  98  |     const box = element.getBoundingClientRect();
  99  |     const text = element.querySelector<HTMLElement>(
  100 |       '.zuvi-studio-sheet-text,.studio-print-text-clip'
  101 |     )!;
  102 |     return {
  103 |       width: box.width,
  104 |       height: box.height,
  105 |       textWidth: text.getBoundingClientRect().width,
  106 |       lines: Array.from(
  107 |         element.querySelectorAll<HTMLElement>(
  108 |           '.zuvi-studio-sheet-text-transform>span,.studio-print-text-transform>span'
  109 |         ),
  110 |         (line) => {
  111 |           const bounds = line.getBoundingClientRect();
  112 |           return {
  113 |             text: line.textContent,
  114 |             x: bounds.left - box.left,
  115 |             y: bounds.top - box.top,
  116 |             width: bounds.width,
  117 |             height: bounds.height,
  118 |           };
  119 |         }
  120 |       ),
  121 |     };
  122 |   });
  123 | }
  124 |
  125 | test('advanced text editing, native default font, automatic rows, print and two XLSX reopens use the actual editor', async ({
  126 |   page,
  127 |   context,
  128 | }) => {
  129 |   test.setTimeout(150000);
  130 |   await mkdir(audit, { recursive: true });
  131 |   const { source, font0 } = await fixture();
  132 |   await writeFile(path.join(audit, 'text-source.xlsx'), source);
  133 |   await page.addInitScript(() => {
  134 |     window.print = () => {
  135 |       window.parent.postMessage(
  136 |         { type: 'sheet-text-print', html: document.documentElement.outerHTML },
  137 |         '*'
  138 |       );
  139 |       window.dispatchEvent(new Event('afterprint'));
  140 |     };
  141 |   });
  142 |   await page.goto('/#/components/office-studio');
  143 |   await importFile(page, source, 'Text.xlsx');
  144 |   const cell = (address: string) => page.getByRole('gridcell', { name: address, exact: true });
  145 |   await expect(page.getByRole('combobox', { name: '表格字体', exact: true })).toHaveValue('Arial');
  146 |   await expect(page.getByRole('combobox', { name: '表格字号', exact: true })).toHaveValue('9.5');
  147 |   await expect(page.getByRole('button', { name: '表格加粗', exact: true })).toHaveAttribute(
  148 |     'aria-pressed',
  149 |     'true'
  150 |   );
  151 |   await expect(cell('A1')).toHaveText('CENTER_TITLE');
  152 |   const nativeWidth = await cell('A1').evaluate((element) => element.getBoundingClientRect().width);
  153 |   let dialog = await open(page, 'A1:C1');
  154 |   await choose(page, dialog, '文字水平对齐', '跨选区居中');
  155 |   await apply(dialog);
  156 |   await expect(cell('A1')).toHaveAttribute('data-center-continuous-span', '1:3');
  157 |   await expect(cell('A1').locator('.zuvi-studio-sheet-text')).toHaveCSS(
  158 |     'width',
  159 |     `${nativeWidth * 3}px`
  160 |   );
  161 |   await expect(cell('B1')).not.toHaveAttribute('aria-colspan');
  162 |   await page.getByRole('button', { name: '撤销表格修改', exact: true }).click();
  163 |   await expect(cell('A1')).not.toHaveAttribute('data-center-continuous-span');
  164 |   await page.getByRole('button', { name: '重做表格修改', exact: true }).click();
  165 |   await expect(cell('A1')).toHaveAttribute('data-center-continuous-span', '1:3');
  166 |
  167 |   const beforeWrap = await cell('A2').evaluate((element) => element.getBoundingClientRect().height);
  168 |   dialog = await open(page, 'A2');
  169 |   await dialog.getByRole('checkbox', { name: '自动换行', exact: true }).check();
  170 |   await dialog.getByRole('checkbox', { name: '缩小字体填充', exact: true }).check();
  171 |   await apply(dialog);
  172 |   const wrappedHeight = await cell('A2').evaluate(
  173 |     (element) => element.getBoundingClientRect().height
  174 |   );
  175 |   expect(wrappedHeight).toBeGreaterThan(beforeWrap);
  176 |   await expect(cell('A2').locator('[data-shrink-applied]')).toHaveCount(0);
  177 |   await page.getByRole('button', { name: '撤销表格修改', exact: true }).click();
  178 |   await expect(cell('A2')).toHaveCSS('height', `${beforeWrap}px`);
```