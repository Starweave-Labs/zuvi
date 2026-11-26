# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-sheet-text.spec.ts >> text formatting holds invalid drafts, cancels cleanly and rejects protected batches before adding history
- Location: e2e/office-studio-sheet-text.spec.ts:418:1

# Error details

```
TypeError: Cannot read properties of undefined (reading 'horizontal')
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
                          - button "撤销表格修改" [ref=e434] [cursor=pointer]:
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
                        - button "文字排版" [ref=e503] [cursor=pointer]
                      - generic [ref=e505]:
                        - generic [ref=e506]:
                          - generic [ref=e507]:
                            - generic [ref=e508]: 边框线型
                            - button "边框线型 细实线" [ref=e509] [cursor=pointer]:
                              - generic [ref=e510]: 细实线
                          - generic "边框颜色" [ref=e511]:
                            - button "边框颜色" [ref=e512] [cursor=pointer]:
                              - generic [ref=e514]: "#000000"
                        - generic [ref=e515]:
                          - button "所有边框" [ref=e516] [cursor=pointer]
                          - button "外侧边框" [ref=e518] [cursor=pointer]
                          - button "无边框" [ref=e520] [cursor=pointer]
                        - generic [ref=e522]: 边框
                      - generic [ref=e523]:
                        - generic [ref=e524]:
                          - generic [ref=e525]: 单元格数字格式
                          - button "单元格数字格式 常规" [ref=e526] [cursor=pointer]:
                            - generic [ref=e527]: 常规
                        - button "自定义数字格式" [ref=e528] [cursor=pointer]
                        - generic [ref=e530]: 数字格式
                      - generic [ref=e531]:
                        - generic [ref=e532]:
                          - button "自动换行" [ref=e533] [cursor=pointer]
                          - button "合并单元格" [ref=e535] [cursor=pointer]
                          - button "拆分单元格" [ref=e537] [cursor=pointer]
                        - generic [ref=e539]: 单元格布局
                      - generic [ref=e540]:
                        - generic [ref=e541]:
                          - button "行高" [ref=e542] [cursor=pointer]
                          - button "自动调整行高" [ref=e544] [cursor=pointer]
                        - button "恢复默认行高" [ref=e547] [cursor=pointer]
                        - generic [ref=e549]: 行大小 · 磅
                      - generic [ref=e550]:
                        - generic [ref=e551]:
                          - button "列宽" [ref=e552] [cursor=pointer]
                          - button "自动调整列宽" [ref=e554] [cursor=pointer]
                        - button "隐藏列" [ref=e556] [cursor=pointer]
                        - button "显示全部列" [disabled] [ref=e558]
                        - button "恢复默认列宽" [ref=e560] [cursor=pointer]
                        - generic [ref=e562]: 列大小 · 字符
                      - generic [ref=e563]:
                        - button "Σ 自动求和" [ref=e564] [cursor=pointer]
                        - button "数组公式" [ref=e566] [cursor=pointer]
                        - generic [ref=e568]: 公式
                        - button "保护所选区域" [ref=e569] [cursor=pointer]
                        - button "取消区域保护" [ref=e571] [cursor=pointer]
                      - generic [ref=e573]:
                        - generic [ref=e574]:
                          - button "条件格式" [ref=e575] [cursor=pointer]
                          - button "向下填充" [disabled] [ref=e577]
                          - button "向右填充" [ref=e579] [cursor=pointer]
                          - button "序列填充" [ref=e581] [cursor=pointer]
                        - generic [ref=e583]: 规则与填充
                - generic [ref=e584]:
                  - textbox "单元格地址" [ref=e586]: C1
                  - generic [aria-hidden] [ref=e587]: ƒx
                  - textbox "表格公式栏" [ref=e589]:
                    - /placeholder: 输入内容或公式
                - grid "Text 单元格网格" [ref=e591]:
                  - generic [ref=e592]:
                    - row [ref=e593]:
                      - columnheader "行号" [ref=e594]
                      - columnheader "A A 列宽" [ref=e595]:
                        - text: A
                        - separator "A 列宽" [ref=e596]
                      - columnheader "B B 列宽" [ref=e597]:
                        - text: B
                        - separator "B 列宽" [ref=e598]
                      - columnheader "C C 列宽" [ref=e599]:
                        - text: C
                        - separator "C 列宽" [ref=e600]
                      - columnheader "D D 列宽" [ref=e601]:
                        - text: D
                        - separator "D 列宽" [ref=e602]
                      - columnheader "E E 列宽" [ref=e603]:
                        - text: E
                        - separator "E 列宽" [ref=e604]
                      - columnheader "F F 列宽" [ref=e605]:
                        - text: F
                        - separator "F 列宽" [ref=e606]
                      - columnheader "G G 列宽" [ref=e607]:
                        - text: G
                        - separator "G 列宽" [ref=e608]
                      - columnheader "H H 列宽" [ref=e609]:
                        - text: H
                        - separator "H 列宽" [ref=e610]
                      - columnheader "I I 列宽" [ref=e611]:
                        - text: I
                        - separator "I 列宽" [ref=e612]
                      - columnheader "J J 列宽" [ref=e613]:
                        - text: J
                        - separator "J 列宽" [ref=e614]
                    - row [ref=e615]:
                      - rowheader "1 1 行高" [ref=e616]:
                        - text: "1"
                        - separator "1 行高" [ref=e617]
                      - gridcell "A1" [selected] [ref=e618]:
                        - generic: CENTER_TITLE
                      - gridcell "B1" [selected] [ref=e619]
                      - gridcell "C1" [selected] [ref=e620]
                      - gridcell "D1" [ref=e621]:
                        - generic: Native label
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
                        - generic: 自动换行随列宽变化并保留原始文字与工作簿默认字体。
                      - gridcell "B2" [ref=e632]
                      - gridcell "C2" [ref=e633]
                      - gridcell "D2" [ref=e634]
                      - gridcell "E2" [ref=e635]
                      - gridcell "F2" [ref=e636]
                      - gridcell "G2" [ref=e637]
                      - gridcell "H2" [ref=e638]
                      - gridcell "I2" [ref=e639]
                      - gridcell "J2" [ref=e640]
                    - row [ref=e641]:
                      - rowheader "3 3 行高" [ref=e642]:
                        - text: "3"
                        - separator "3 行高" [ref=e643]
                      - gridcell "A3" [ref=e644]:
                        - generic: ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz
                      - gridcell "B3" [ref=e645]
                      - gridcell "C3" [ref=e646]
                      - gridcell "D3" [ref=e647]
                      - gridcell "E3" [ref=e648]
                      - gridcell "F3" [ref=e649]
                      - gridcell "G3" [ref=e650]
                      - gridcell "H3" [ref=e651]
                      - gridcell "I3" [ref=e652]
                      - gridcell "J3" [ref=e653]
                    - row [ref=e654]:
                      - rowheader "4 4 行高" [ref=e655]:
                        - text: "4"
                        - separator "4 行高" [ref=e656]
                      - gridcell "A4" [ref=e657]:
                        - generic: ANGLED_TEXT
                      - gridcell "B4" [ref=e658]
                      - gridcell "C4" [ref=e659]:
                        - generic: Indented
                      - gridcell "D4" [ref=e660]
                      - gridcell "E4" [ref=e661]
                      - gridcell "F4" [ref=e662]
                      - gridcell "G4" [ref=e663]
                      - gridcell "H4" [ref=e664]
                      - gridcell "I4" [ref=e665]
                      - gridcell "J4" [ref=e666]
                    - row [ref=e667]:
                      - rowheader "5 5 行高" [ref=e668]:
                        - text: "5"
                        - separator "5 行高" [ref=e669]
                      - gridcell "A5" [ref=e670]:
                        - generic: 竖排ABC
                      - gridcell "B5" [ref=e671]
                      - gridcell "C5" [ref=e672]
                      - gridcell "D5" [ref=e673]
                      - gridcell "E5" [ref=e674]
                      - gridcell "F5" [ref=e675]
                      - gridcell "G5" [ref=e676]
                      - gridcell "H5" [ref=e677]
                      - gridcell "I5" [ref=e678]
                      - gridcell "J5" [ref=e679]
                    - row [ref=e680]:
                      - rowheader "6 6 行高" [ref=e681]:
                        - text: "6"
                        - separator "6 行高" [ref=e682]
                      - gridcell "A6" [ref=e683]:
                        - generic: "42"
                      - gridcell "B6" [ref=e684]:
                        - generic: "#N/A"
                      - gridcell "C6" [ref=e685]:
                        - generic: "FALSE"
                      - gridcell "D6" [ref=e686]:
                        - generic: "#N/A"
                      - gridcell "E6" [ref=e687]
                      - gridcell "F6" [ref=e688]
                      - gridcell "G6" [ref=e689]
                      - gridcell "H6" [ref=e690]
                      - gridcell "I6" [ref=e691]
                      - gridcell "J6" [ref=e692]
                    - row [ref=e693]:
                      - rowheader "7 7 行高" [ref=e694]:
                        - text: "7"
                        - separator "7 行高" [ref=e695]
                      - gridcell "A7" [ref=e696]:
                        - generic: "**"
                      - gridcell "B7" [ref=e697]
                      - gridcell "C7" [ref=e698]
                      - gridcell "D7" [ref=e699]
                      - gridcell "E7" [ref=e700]
                      - gridcell "F7" [ref=e701]
                      - gridcell "G7" [ref=e702]
                      - gridcell "H7" [ref=e703]
                      - gridcell "I7" [ref=e704]
                      - gridcell "J7" [ref=e705]
                    - row [ref=e706]:
                      - rowheader "8 8 行高" [ref=e707]:
                        - text: "8"
                        - separator "8 行高" [ref=e708]
                      - gridcell "A8" [ref=e709]:
                        - generic:
                          - generic:
                            - generic: Line one
                            - generic: Line two
                            - generic: Line three
                      - gridcell "B8" [ref=e710]:
                        - generic: 分散对齐
                      - gridcell "C8" [ref=e711]
                      - gridcell "D8" [ref=e712]
                      - gridcell "E8" [ref=e713]
                      - gridcell "F8" [ref=e714]
                      - gridcell "G8" [ref=e715]
                      - gridcell "H8" [ref=e716]
                      - gridcell "I8" [ref=e717]
                      - gridcell "J8" [ref=e718]
                    - row [ref=e719]:
                      - rowheader "9 9 行高" [ref=e720]:
                        - text: "9"
                        - separator "9 行高" [ref=e721]
                      - gridcell "A9" [ref=e722]:
                        - generic: "3"
                      - gridcell "B9" [ref=e723]:
                        - generic:
                          - generic:
                            - generic: Cross sheet
                            - generic: formula with a
                            - generic: long text value
                      - gridcell "C9" [ref=e724]
                      - gridcell "D9" [ref=e725]
                      - gridcell "E9" [ref=e726]
                      - gridcell "F9" [ref=e727]
                      - gridcell "G9" [ref=e728]
                      - gridcell "H9" [ref=e729]
                      - gridcell "I9" [ref=e730]
                      - gridcell "J9" [ref=e731]
                    - row [ref=e732]:
                      - rowheader "10 10 行高" [ref=e733]:
                        - text: "10"
                        - separator "10 行高" [ref=e734]
                      - gridcell "A10" [ref=e735]:
                        - generic: "1"
                      - gridcell "B10" [ref=e736]:
                        - generic: "2"
                      - gridcell "C10" [ref=e737]
                      - gridcell "D10" [ref=e738]
                      - gridcell "E10" [ref=e739]
                      - gridcell "F10" [ref=e740]
                      - gridcell "G10" [ref=e741]
                      - gridcell "H10" [ref=e742]
                      - gridcell "I10" [ref=e743]
                      - gridcell "J10" [ref=e744]
                    - row [ref=e745]:
                      - rowheader "11 11 行高" [ref=e746]:
                        - text: "11"
                        - separator "11 行高" [ref=e747]
                      - gridcell "A11" [ref=e748]:
                        - generic: "3"
                      - gridcell "B11" [ref=e749]:
                        - generic: "4"
                      - gridcell "C11" [ref=e750]
                      - gridcell "D11" [ref=e751]
                      - gridcell "E11" [ref=e752]
                      - gridcell "F11" [ref=e753]
                      - gridcell "G11" [ref=e754]
                      - gridcell "H11" [ref=e755]
                      - gridcell "I11" [ref=e756]
                      - gridcell "J11" [ref=e757]
                    - row [ref=e758]:
                      - rowheader "12 12 行高" [ref=e759]:
                        - text: "12"
                        - separator "12 行高" [ref=e760]
                      - gridcell "A12" [ref=e761]
                      - gridcell "B12" [ref=e762]
                      - gridcell "C12" [ref=e763]
                      - gridcell "D12" [ref=e764]
                      - gridcell "E12" [ref=e765]
                      - gridcell "F12" [ref=e766]
                      - gridcell "G12" [ref=e767]
                      - gridcell "H12" [ref=e768]
                      - gridcell "I12" [ref=e769]
                      - gridcell "J12" [ref=e770]
                    - row [ref=e771]:
                      - rowheader "13 13 行高" [ref=e772]:
                        - text: "13"
                        - separator "13 行高" [ref=e773]
                      - gridcell "A13" [ref=e774]
                      - gridcell "B13" [ref=e775]
                      - gridcell "C13" [ref=e776]
                      - gridcell "D13" [ref=e777]
                      - gridcell "E13" [ref=e778]
                      - gridcell "F13" [ref=e779]
                      - gridcell "G13" [ref=e780]
                      - gridcell "H13" [ref=e781]
                      - gridcell "I13" [ref=e782]
                      - gridcell "J13" [ref=e783]
                  - button "填充柄" [ref=e784]
                - generic [ref=e785]:
                  - tablist "工作表" [ref=e787]:
                    - tab "Text" [selected] [ref=e788] [cursor=pointer]
                    - tab "Other" [ref=e789] [cursor=pointer]
                  - button "新增工作表" [ref=e790] [cursor=pointer]
                  - button "删除工作表" [ref=e793] [cursor=pointer]
                  - status "所选区域已保护，可撤销。" [ref=e798]
                  - generic "选中 3 格" [ref=e799]
            - paragraph [ref=e800]: 文件保存在当前浏览器的本地文档空间。需要长期留存时，请导出文件。
          - group [ref=e801]:
            - generic "示例代码" [ref=e802] [cursor=pointer]:
              - generic [aria-hidden] [ref=e803]: </>
              - text: 示例代码
              - generic [aria-hidden] [ref=e804]: 展开 / 收起
        - heading "编辑能力" [level=2] [ref=e805]
        - table [ref=e807]:
          - rowgroup [ref=e808]:
            - row [ref=e809]:
              - columnheader "文档" [ref=e810]
              - columnheader "支持的操作" [ref=e811]
              - columnheader "当前范围" [ref=e812]
          - rowgroup [ref=e813]:
            - row [ref=e814]:
              - cell "Word" [ref=e815]
              - cell "字体与小数字号输入、正文排版、列表、表格、图片、页眉页脚、页码、查找替换、页面设置、撤销重做；导入与导出 DOCX" [ref=e816]
              - cell "支持内嵌图片与单节文档。修订、目录、浮动对象等复杂结构会提示暂不支持。" [ref=e817]
            - row [ref=e818]:
              - cell "Excel" [ref=e819]
              - cell "单元格与矩形选区、字体与小数字号输入、手动与自动行高/列宽、查找替换、边框与垂直对齐、清除格式、公式和跨表引用、格式、复制粘贴、工作表增删、行列插入删除、合并、冻结、排序、筛选、柱状图与折线图；导入与导出 XLSX" [ref=e820]
              - cell "10,000 行、256 列、32 张表、100,000 个已使用单元格。透视、宏、数组公式及复杂图表暂不支持。" [ref=e821]
            - row [ref=e822]:
              - cell "PDF" [ref=e823]
              - cell "分页与缩略图、缩放、旋转、全文查找、文字与高亮、矩形和手写批注、已有表单、撤销重做；导出 PDF" [ref=e824]
              - cell "批注和表单编辑。任意原始文字修改、原文重排及扫描件 OCR 暂不支持。" [ref=e825]
        - heading "组件接入" [level=2] [ref=e826]
        - paragraph [ref=e827]: UI 组件使用 Tiptap / ProseMirror 和公式计算库；文件适配使用 docx、ExcelJS、pdf-lib 与 PDF.js。本页无需文档服务器。宿主可以替换保存与导入导出回调，接入自己的文件系统。
        - paragraph [ref=e828]:
          - text: PDF 的 worker、字体与渲染由
          - code [ref=e829]: pdfRenderer
          - text: 提供。本页的适配代码位于
          - code [ref=e830]: docs/src/pages/collaboration/office-studio/
          - text: 。组件自 v0.4.0 起随
          - code [ref=e831]: "@zuvi/react"
          - text: 和 Registry 发布。
        - region "组件属性表，可横向滚动" [ref=e832]:
          - table [ref=e833]:
            - rowgroup [ref=e834]:
              - row [ref=e835]:
                - columnheader "属性名" [ref=e836]
                - columnheader "类型" [ref=e837]
                - columnheader "默认值" [ref=e838]
                - columnheader "说明" [ref=e839]
            - rowgroup [ref=e840]:
              - row [ref=e841]:
                - cell "value / defaultValue" [ref=e842]
                - cell [ref=e843]:
                  - code [ref=e844]: OfficeStudioDocument
                - cell [ref=e845]:
                  - code [ref=e846]: —
                - cell "受控文档或非受控初始文档；支持 Word、Excel、PDF 三种模型。" [ref=e847]
              - row [ref=e848]:
                - cell "onChange" [ref=e849]
                - cell [ref=e850]:
                  - code [ref=e851]: (document) => void
                - cell [ref=e852]:
                  - code [ref=e853]: —
                - cell "内容或文件名称变化。" [ref=e854]
              - row [ref=e855]:
                - cell "source / pdfRenderer" [ref=e856]
                - cell [ref=e857]:
                  - code [ref=e858]: Blob / StudioPdfRenderer
                - cell [ref=e859]:
                  - code [ref=e860]: —
                - cell "原始文件及 PDF 渲染适配；worker 资源由宿主管理。" [ref=e861]
              - row [ref=e862]:
                - cell "onSave / onExport / onPrint" [ref=e863]
                - cell [ref=e864]:
                  - code [ref=e865]: (document) => void | Promise<void>
                - cell [ref=e866]:
                  - code [ref=e867]: —
                - cell "宿主处理保存、导出或打印；返回后更新状态，失败可重试。" [ref=e868]
              - row [ref=e869]:
                - cell "onImport / onCreate" [ref=e870]
                - cell [ref=e871]:
                  - code [ref=e872]: (file | kind) => void | Promise<void>
                - cell [ref=e873]:
                  - code [ref=e874]: —
                - cell "宿主解析文件或创建模型，并更新受控值。" [ref=e875]
              - row [ref=e876]:
                - cell "readOnly / disabled" [ref=e877]
                - cell [ref=e878]:
                  - code [ref=e879]: boolean
                - cell [ref=e880]:
                  - code [ref=e881]: "false"
                - cell "只读预览或禁用编辑与文件操作。" [ref=e882]
              - row [ref=e883]:
                - cell "saveState" [ref=e884]
                - cell [ref=e885]:
                  - code [ref=e886]: "'saved' | 'saving' | 'unsaved' | 'error'"
                - cell [ref=e887]:
                  - code [ref=e888]: —
                - cell "宿主自动保存状态。" [ref=e889]
              - row [ref=e890]:
                - cell "height" [ref=e891]
                - cell [ref=e892]:
                  - code [ref=e893]: number | string
                - cell [ref=e894]:
                  - code [ref=e895]: "760"
                - cell "编辑器高度；100% 需要父容器设置确定高度。" [ref=e896]
              - row [ref=e897]:
                - cell "fullscreen / onFullscreenChange" [ref=e898]
                - cell [ref=e899]:
                  - code [ref=e900]: boolean / (value) => void
                - cell [ref=e901]:
                  - code [ref=e902]: —
                - cell "全屏布局，切换时编辑内容保持挂载。" [ref=e903]
              - row [ref=e904]:
                - cell "ref" [ref=e905]
                - cell [ref=e906]:
                  - code [ref=e907]: OfficeStudioHandle
                - cell [ref=e908]:
                  - code [ref=e909]: —
                - cell "getDocument()、save()、export()、print()、setFullscreen()。" [ref=e910]
              - row [ref=e911]:
                - cell "classNames" [ref=e912]
                - cell [ref=e913]:
                  - code [ref=e914]: "{ root?; header?; title?; actions?; stage?; status?; error? }"
                - cell [ref=e915]:
                  - code [ref=e916]: —
                - cell "追加语义结构类名，配合 data-part 与 CSS 变量定制。" [ref=e917]
  - text: ✓ ✓ ✓ ✓
```

# Test source

```ts
  358 |     }
  359 |   }
  360 |   await preview.screenshot({
  361 |     path: path.join(audit, 'text-print.png'),
  362 |     fullPage: true,
  363 |     animations: 'disabled',
  364 |   });
  365 |   await preview.pdf({
  366 |     path: path.join(audit, 'text-print.pdf'),
  367 |     preferCSSPageSize: true,
  368 |     printBackground: true,
  369 |   });
  370 |   await preview.close();
  371 |   await range(page, 'A1');
  372 |   await page.screenshot({
  373 |     path: path.join(audit, 'text-results-light.png'),
  374 |     fullPage: true,
  375 |     animations: 'disabled',
  376 |   });
  377 |   for (const small of [false, true]) {
  378 |     if (small) await page.setViewportSize({ width: 320, height: 720 });
  379 |     for (const theme of ['light', 'dark']) {
  380 |       if (theme === 'dark')
  381 |         await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  382 |       dialog = await open(page, 'A4');
  383 |       const bounds = await dialog.boundingBox();
  384 |       expect(bounds!.x).toBeGreaterThanOrEqual(0);
  385 |       expect(bounds!.width).toBeLessThanOrEqual(small ? 320 : 1280);
  386 |       await expect(dialog.getByRole('button', { name: '应用排版', exact: true })).toBeVisible();
  387 |       await page.screenshot({
  388 |         path: path.join(audit, `text-dialog-${theme}${small ? '-320' : ''}.png`),
  389 |         fullPage: true,
  390 |         animations: 'disabled',
  391 |       });
  392 |       await dialog.getByRole('button', { name: '取消', exact: true }).click();
  393 |       await expect(dialog).toBeHidden();
  394 |       if (theme === 'dark')
  395 |         await page.getByRole('button', { name: '切换浅色', exact: true }).click();
  396 |     }
  397 |   }
  398 |   await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  399 |   await expect(page.getByRole('button', { name: '文字排版', exact: true })).toBeDisabled();
  400 |   await expect(page.getByRole('button', { name: '自动换行', exact: true })).toBeDisabled();
  401 |   await writeFile(
  402 |     path.join(audit, 'browser-roundtrip-evidence.json'),
  403 |     JSON.stringify(
  404 |       {
  405 |         source: { file: 'text-source.xlsx', sha256: hash(source) },
  406 |         rounds,
  407 |         grid: measured,
  408 |         print: printedGeometry,
  409 |         viewport: { width: 320, height: 720 },
  410 |         readOnly: true,
  411 |       },
  412 |       null,
  413 |       2
  414 |     ) + '\n'
  415 |   );
  416 | });
  417 |
  418 | test('text formatting holds invalid drafts, cancels cleanly and rejects protected batches before adding history', async ({
  419 |   page,
  420 | }) => {
  421 |   test.setTimeout(90000);
  422 |   await mkdir(audit, { recursive: true });
  423 |   const { source } = await fixture();
  424 |   await page.goto('/#/components/office-studio');
  425 |   await importFile(page, source, 'Text-guards.xlsx');
  426 |   const formula = page.getByLabel('表格公式栏', { exact: true });
  427 |   await formula.fill('x'.repeat(32768));
  428 |   await page.getByRole('button', { name: '文字排版', exact: true }).click();
  429 |   await expect(page.getByRole('dialog', { name: '单元格文字排版', exact: true })).toHaveCount(0);
  430 |   await expect(page.locator('.zuvi-studio-sheet')).toHaveAttribute('data-studio-input-error');
  431 |   await formula.press('Escape');
  432 |   let dialog = await open(page, 'A1');
  433 |   await dialog.getByLabel('文字缩进', { exact: true }).fill('251');
  434 |   await expect(dialog.getByRole('alert')).toHaveText('缩进须为 0 至 250 之间的整数。');
  435 |   await expect(dialog.getByRole('button', { name: '应用排版', exact: true })).toBeDisabled();
  436 |   await expect(page.locator('.zuvi-studio-sheet')).toHaveAttribute('data-studio-input-error');
  437 |   await dialog.getByRole('button', { name: '取消', exact: true }).click();
  438 |   await expect(dialog).toBeHidden();
  439 |   await expect(page.locator('.zuvi-studio-sheet')).not.toHaveAttribute('data-studio-input-error');
  440 |   await expect(page.getByRole('button', { name: '撤销表格修改', exact: true })).toBeDisabled();
  441 |   await range(page, 'B1');
  442 |   await page.getByRole('button', { name: '保护所选区域', exact: true }).click();
  443 |   dialog = await open(page, 'A1:C1');
  444 |   await choose(page, dialog, '文字水平对齐', '跨选区居中');
  445 |   await dialog.getByRole('button', { name: '应用排版', exact: true }).click();
  446 |   await expect(dialog.getByRole('alert')).toHaveText('选区包含受保护区域，整次格式应用已取消。');
  447 |   await page.screenshot({
  448 |     path: path.join(audit, 'text-protected-rejection.png'),
  449 |     fullPage: true,
  450 |     animations: 'disabled',
  451 |   });
  452 |   await dialog.getByRole('button', { name: '取消', exact: true }).click();
  453 |   await expect(dialog).toBeHidden();
  454 |   const protectedBytes = await exportFile(page);
  455 |   await writeFile(path.join(audit, 'text-protected-after-rejection.xlsx'), protectedBytes);
  456 |   const saved = new ExcelJS.Workbook();
  457 |   await saved.xlsx.load(protectedBytes);
> 458 |   expect(saved.getWorksheet('Text')!.getCell('A1').alignment.horizontal).not.toBe(
      |                                                             ^ TypeError: Cannot read properties of undefined (reading 'horizontal')
  459 |     'centerContinuous'
  460 |   );
  461 |   await page.getByRole('button', { name: '撤销表格修改', exact: true }).click();
  462 |   await expect(page.getByRole('button', { name: '撤销表格修改', exact: true })).toBeDisabled();
  463 |   await expect(page.getByRole('button', { name: '取消区域保护', exact: true })).toBeDisabled();
  464 |   await page.getByRole('button', { name: '重做表格修改', exact: true }).click();
  465 |   await expect(page.getByRole('button', { name: '取消区域保护', exact: true })).toBeEnabled();
  466 |   await writeFile(
  467 |     path.join(audit, 'browser-guard-evidence.json'),
  468 |     JSON.stringify(
  469 |       {
  470 |         sourceHash: hash(source),
  471 |         outputHash: hash(protectedBytes),
  472 |         invalidDraftRejected: true,
  473 |         cancelClearedGuard: true,
  474 |         protectedBatchRejected: true,
  475 |         undoStepsForProtection: 1,
  476 |         redoRestoredProtection: true,
  477 |       },
  478 |       null,
  479 |       2
  480 |     ) + '\n'
  481 |   );
  482 | });
  483 |
```