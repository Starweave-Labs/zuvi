# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-sheet-duplicates.spec.ts >> duplicate records keep typed blanks, first rows, styles, links and outside data through history and two native reopens
- Location: e2e/office-studio-sheet-duplicates.spec.ts:90:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: ""
Received: {"formula": "\"\""}
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
                - button "打开本地文档 Duplicates.xlsx" [ref=e356] [cursor=pointer]:
                  - generic [ref=e357]: Duplicates.xlsx
              - button "历史版本" [ref=e358] [cursor=pointer]
              - switch "只读预览" [ref=e360] [cursor=pointer]
            - region "Excel 文档编辑器" [ref=e364]:
              - generic [ref=e365]:
                - generic [ref=e366]:
                  - generic [ref=e371]: Excel
                  - generic "可编辑 · ⌘ / Ctrl S 保存" [ref=e372]:
                    - status "有未保存修改" [ref=e373]
                - textbox "文档名称" [ref=e378]: Duplicates.xlsx
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
                            - combobox "表格字体" [ref=e457]: Calibri
                            - button "展开选项" [ref=e458] [cursor=pointer]
                          - generic [ref=e463]:
                            - combobox "表格字号" [ref=e464]: "11"
                            - button "展开选项" [ref=e465] [cursor=pointer]
                        - generic [ref=e468]:
                          - button "表格加粗" [ref=e469] [cursor=pointer]:
                            - strong [ref=e471]: B
                          - button "表格斜体" [ref=e472] [cursor=pointer]:
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
                        - generic [ref=e549]:
                          - button "隐藏行" [ref=e550] [cursor=pointer]
                          - button "显示选区行" [disabled] [ref=e552]
                          - button "显示全部行" [disabled] [ref=e554]
                        - generic [ref=e556]: 行大小 · 磅
                      - generic [ref=e557]:
                        - generic [ref=e558]:
                          - button "列宽" [ref=e559] [cursor=pointer]
                          - button "自动调整列宽" [ref=e561] [cursor=pointer]
                        - button "隐藏列" [ref=e563] [cursor=pointer]
                        - button "显示选区列" [disabled] [ref=e565]
                        - button "显示全部列" [disabled] [ref=e567]
                        - button "恢复默认列宽" [ref=e569] [cursor=pointer]
                        - generic [ref=e571]: 列大小 · 字符
                      - generic [ref=e572]:
                        - button "Σ 自动求和" [ref=e573] [cursor=pointer]
                        - button "数组公式" [ref=e575] [cursor=pointer]
                        - generic [ref=e577]: 公式
                        - button "保护所选区域" [ref=e578] [cursor=pointer]
                        - button "取消区域保护" [disabled] [ref=e580]
                      - generic [ref=e582]:
                        - generic [ref=e583]:
                          - button "条件格式" [ref=e584] [cursor=pointer]
                          - button "向下填充" [ref=e586] [cursor=pointer]
                          - button "向右填充" [ref=e588] [cursor=pointer]
                          - button "序列填充" [ref=e590] [cursor=pointer]
                        - generic [ref=e592]: 规则与填充
                - generic [ref=e593]:
                  - textbox "单元格地址" [ref=e595]: C10
                  - generic [aria-hidden] [ref=e596]: ƒx
                  - textbox "表格公式栏" [ref=e598]:
                    - /placeholder: 输入内容或公式
                - grid "Records 单元格网格" [ref=e600]:
                  - generic [ref=e601]:
                    - row [ref=e602]:
                      - columnheader "行号" [ref=e603]
                      - columnheader "A A 列宽" [ref=e604]:
                        - generic [ref=e605]: A
                        - separator "A 列宽" [ref=e606]
                      - columnheader "B B 列宽" [ref=e607]:
                        - generic [ref=e608]: B
                        - separator "B 列宽" [ref=e609]
                      - columnheader "C C 列宽" [ref=e610]:
                        - generic [ref=e611]: C
                        - separator "C 列宽" [ref=e612]
                      - columnheader "D D 列宽" [ref=e613]:
                        - generic [ref=e614]: D
                        - separator "D 列宽" [ref=e615]
                      - columnheader "E E 列宽" [ref=e616]:
                        - generic [ref=e617]: E
                        - separator "E 列宽" [ref=e618]
                      - columnheader "F F 列宽" [ref=e619]:
                        - generic [ref=e620]: F
                        - separator "F 列宽" [ref=e621]
                      - columnheader "G G 列宽" [ref=e622]:
                        - generic [ref=e623]: G
                        - separator "G 列宽" [ref=e624]
                      - columnheader "H H 列宽" [ref=e625]:
                        - generic [ref=e626]: H
                        - separator "H 列宽" [ref=e627]
                      - columnheader "I I 列宽" [ref=e628]:
                        - generic [ref=e629]: I
                        - separator "I 列宽" [ref=e630]
                    - row [ref=e631]:
                      - rowheader "1 1 行高" [ref=e632]:
                        - generic [ref=e633]: "1"
                        - separator "1 行高" [ref=e634]
                      - gridcell "A1" [selected] [ref=e635]:
                        - generic: Key
                      - gridcell "B1" [selected] [ref=e636]:
                        - generic: Label
                      - gridcell "C1" [selected] [ref=e637]:
                        - generic: Amount
                      - gridcell "D1" [ref=e638]:
                        - generic: Outside
                      - gridcell "E1" [ref=e639]
                      - gridcell "F1" [ref=e640]
                      - gridcell "G1" [ref=e641]
                      - gridcell "H1" [ref=e642]
                      - gridcell "I1" [ref=e643]
                    - row [ref=e644]:
                      - rowheader "2 2 行高" [ref=e645]:
                        - generic [ref=e646]: "2"
                        - separator "2 行高" [ref=e647]
                      - gridcell "A2" [selected] [ref=e648]:
                        - generic: "1"
                      - gridcell "B2" [selected] [ref=e649]:
                        - generic: First
                      - gridcell "C2" [selected] [ref=e650]:
                        - generic: "10"
                      - gridcell "D2" [ref=e651]:
                        - generic: Keep 2
                      - gridcell "E2" [ref=e652]
                      - gridcell "F2" [ref=e653]
                      - gridcell "G2" [ref=e654]
                      - gridcell "H2" [ref=e655]
                      - gridcell "I2" [ref=e656]
                    - row [ref=e657]:
                      - rowheader "3 3 行高" [ref=e658]:
                        - generic [ref=e659]: "3"
                        - separator "3 行高" [ref=e660]
                      - gridcell "A3" [selected] [ref=e661]:
                        - generic: "1"
                      - gridcell "B3" [selected] [ref=e662]:
                        - generic: Text
                      - gridcell "C3" [selected] [ref=e663]:
                        - generic: "30"
                      - gridcell "D3" [ref=e664]:
                        - generic: Keep 3
                      - gridcell "E3" [ref=e665]
                      - gridcell "F3" [ref=e666]
                      - gridcell "G3" [ref=e667]
                      - gridcell "H3" [ref=e668]
                      - gridcell "I3" [ref=e669]
                    - row [ref=e670]:
                      - rowheader "4 4 行高" [ref=e671]:
                        - generic [ref=e672]: "4"
                        - separator "4 行高" [ref=e673]
                      - gridcell "A4" [selected] [ref=e674]:
                        - generic: "TRUE"
                      - gridcell "B4" [selected] [ref=e675]:
                        - generic: Boolean
                      - gridcell "C4" [selected] [ref=e676]:
                        - generic: "40"
                      - gridcell "D4" [ref=e677]:
                        - generic: Keep 4
                      - gridcell "E4" [ref=e678]
                      - gridcell "F4" [ref=e679]
                      - gridcell "G4" [ref=e680]
                      - gridcell "H4" [ref=e681]
                      - gridcell "I4" [ref=e682]
                    - row [ref=e683]:
                      - rowheader "5 5 行高" [ref=e684]:
                        - generic [ref=e685]: "5"
                        - separator "5 行高" [ref=e686]
                      - gridcell "A5" [selected] [ref=e687]
                      - gridcell "B5" [selected] [ref=e688]:
                        - generic: Blank
                      - gridcell "C5" [selected] [ref=e689]:
                        - generic: "50"
                      - gridcell "D5" [ref=e690]:
                        - generic: Keep 5
                      - gridcell "E5" [ref=e691]
                      - gridcell "F5" [ref=e692]
                      - gridcell "G5" [ref=e693]
                      - gridcell "H5" [ref=e694]
                      - gridcell "I5" [ref=e695]
                    - row [ref=e696]:
                      - rowheader "6 6 行高" [ref=e697]:
                        - generic [ref=e698]: "6"
                        - separator "6 行高" [ref=e699]
                      - gridcell "A6" [selected] [ref=e700]
                      - gridcell "B6" [selected] [ref=e701]:
                        - generic: Empty formula duplicate
                      - gridcell "C6" [selected] [ref=e702]:
                        - generic: "80"
                      - gridcell "D6" [ref=e703]:
                        - generic: Keep 6
                      - gridcell "E6" [ref=e704]
                      - gridcell "F6" [ref=e705]
                      - gridcell "G6" [ref=e706]
                      - gridcell "H6" [ref=e707]
                      - gridcell "I6" [ref=e708]
                    - row [ref=e709]:
                      - rowheader "7 7 行高" [ref=e710]:
                        - generic [ref=e711]: "7"
                        - separator "7 行高" [ref=e712]
                      - gridcell "A7" [selected] [ref=e713]:
                        - generic: "2"
                      - gridcell "B7" [selected] [ref=e714]:
                        - generic: Last
                      - gridcell "C7" [selected] [ref=e715]:
                        - generic: "20"
                      - gridcell "D7" [ref=e716]:
                        - generic: Keep 7
                      - gridcell "E7" [ref=e717]
                      - gridcell "F7" [ref=e718]
                      - gridcell "G7" [ref=e719]
                      - gridcell "H7" [ref=e720]
                      - gridcell "I7" [ref=e721]
                    - row [ref=e722]:
                      - rowheader "8 8 行高" [ref=e723]:
                        - generic [ref=e724]: "8"
                        - separator "8 行高" [ref=e725]
                      - gridcell "A8" [selected] [ref=e726]
                      - gridcell "B8" [selected] [ref=e727]
                      - gridcell "C8" [selected] [ref=e728]
                      - gridcell "D8" [ref=e729]:
                        - generic: Keep 8
                      - gridcell "E8" [ref=e730]
                      - gridcell "F8" [ref=e731]
                      - gridcell "G8" [ref=e732]
                      - gridcell "H8" [ref=e733]
                      - gridcell "I8" [ref=e734]
                    - row [ref=e735]:
                      - rowheader "9 9 行高" [ref=e736]:
                        - generic [ref=e737]: "9"
                        - separator "9 行高" [ref=e738]
                      - gridcell "A9" [selected] [ref=e739]
                      - gridcell "B9" [selected] [ref=e740]
                      - gridcell "C9" [selected] [ref=e741]
                      - gridcell "D9" [ref=e742]:
                        - generic: Keep 9
                      - gridcell "E9" [ref=e743]
                      - gridcell "F9" [ref=e744]
                      - gridcell "G9" [ref=e745]
                      - gridcell "H9" [ref=e746]
                      - gridcell "I9" [ref=e747]
                    - row [ref=e748]:
                      - rowheader "10 10 行高" [ref=e749]:
                        - generic [ref=e750]: "10"
                        - separator "10 行高" [ref=e751]
                      - gridcell "A10" [selected] [ref=e752]
                      - gridcell "B10" [selected] [ref=e753]
                      - gridcell "C10" [selected] [ref=e754]
                      - gridcell "D10" [ref=e755]:
                        - generic: Keep 10
                      - gridcell "E10" [ref=e756]
                      - gridcell "F10" [ref=e757]
                      - gridcell "G10" [ref=e758]
                      - gridcell "H10" [ref=e759]
                      - gridcell "I10" [ref=e760]
                    - row [ref=e761]:
                      - rowheader "11 11 行高" [ref=e762]:
                        - generic [ref=e763]: "11"
                        - separator "11 行高" [ref=e764]
                      - gridcell "A11" [ref=e765]
                      - gridcell "B11" [ref=e766]
                      - gridcell "C11" [ref=e767]
                      - gridcell "D11" [ref=e768]
                      - gridcell "E11" [ref=e769]
                      - gridcell "F11" [ref=e770]
                      - gridcell "G11" [ref=e771]
                      - gridcell "H11" [ref=e772]
                      - gridcell "I11" [ref=e773]
                    - row [ref=e774]:
                      - rowheader "12 12 行高" [ref=e775]:
                        - generic [ref=e776]: "12"
                        - separator "12 行高" [ref=e777]
                      - gridcell "A12" [ref=e778]
                      - gridcell "B12" [ref=e779]
                      - gridcell "C12" [ref=e780]
                      - gridcell "D12" [ref=e781]
                      - gridcell "E12" [ref=e782]
                      - gridcell "F12" [ref=e783]
                      - gridcell "G12" [ref=e784]
                      - gridcell "H12" [ref=e785]
                      - gridcell "I12" [ref=e786]
                    - row [ref=e787]:
                      - rowheader "13 13 行高" [ref=e788]:
                        - generic [ref=e789]: "13"
                        - separator "13 行高" [ref=e790]
                      - gridcell "A13" [ref=e791]
                      - gridcell "B13" [ref=e792]
                      - gridcell "C13" [ref=e793]
                      - gridcell "D13" [ref=e794]
                      - gridcell "E13" [ref=e795]
                      - gridcell "F13" [ref=e796]
                      - gridcell "G13" [ref=e797]
                      - gridcell "H13" [ref=e798]
                      - gridcell "I13" [ref=e799]
                    - row [ref=e800]:
                      - rowheader "14 14 行高" [ref=e801]:
                        - generic [ref=e802]: "14"
                        - separator "14 行高" [ref=e803]
                      - gridcell "A14" [ref=e804]
                      - gridcell "B14" [ref=e805]
                      - gridcell "C14" [ref=e806]
                      - gridcell "D14" [ref=e807]
                      - gridcell "E14" [ref=e808]
                      - gridcell "F14" [ref=e809]
                      - gridcell "G14" [ref=e810]
                      - gridcell "H14" [ref=e811]
                      - gridcell "I14" [ref=e812]
                    - row [ref=e813]:
                      - rowheader "15 15 行高" [ref=e814]:
                        - generic [ref=e815]: "15"
                        - separator "15 行高" [ref=e816]
                      - gridcell "A15" [ref=e817]
                      - gridcell "B15" [ref=e818]
                      - gridcell "C15" [ref=e819]
                      - gridcell "D15" [ref=e820]
                      - gridcell "E15" [ref=e821]
                      - gridcell "F15" [ref=e822]
                      - gridcell "G15" [ref=e823]
                      - gridcell "H15" [ref=e824]
                      - gridcell "I15" [ref=e825]
                    - row [ref=e826]:
                      - rowheader "16 16 行高" [ref=e827]:
                        - generic [ref=e828]: "16"
                        - separator "16 行高" [ref=e829]
                      - gridcell "A16" [ref=e830]
                      - gridcell "B16" [ref=e831]
                      - gridcell "C16" [ref=e832]
                      - gridcell "D16" [ref=e833]
                      - gridcell "E16" [ref=e834]
                      - gridcell "F16" [ref=e835]
                      - gridcell "G16" [ref=e836]
                      - gridcell "H16" [ref=e837]
                      - gridcell "I16" [ref=e838]
                    - row [ref=e839]:
                      - rowheader "17 17 行高" [ref=e840]:
                        - generic [ref=e841]: "17"
                        - separator "17 行高" [ref=e842]
                      - gridcell "A17" [ref=e843]
                      - gridcell "B17" [ref=e844]
                      - gridcell "C17" [ref=e845]
                      - gridcell "D17" [ref=e846]
                      - gridcell "E17" [ref=e847]
                      - gridcell "F17" [ref=e848]
                      - gridcell "G17" [ref=e849]
                      - gridcell "H17" [ref=e850]
                      - gridcell "I17" [ref=e851]
                    - row [ref=e852]:
                      - rowheader "18 18 行高" [ref=e853]:
                        - generic [ref=e854]: "18"
                        - separator "18 行高" [ref=e855]
                      - gridcell "A18" [ref=e856]
                      - gridcell "B18" [ref=e857]
                      - gridcell "C18" [ref=e858]
                      - gridcell "D18" [ref=e859]
                      - gridcell "E18" [ref=e860]
                      - gridcell "F18" [ref=e861]
                      - gridcell "G18" [ref=e862]
                      - gridcell "H18" [ref=e863]
                      - gridcell "I18" [ref=e864]
                    - row [ref=e865]:
                      - rowheader "19 19 行高" [ref=e866]:
                        - generic [ref=e867]: "19"
                        - separator "19 行高" [ref=e868]
                      - gridcell "A19" [ref=e869]
                      - gridcell "B19" [ref=e870]
                      - gridcell "C19" [ref=e871]
                      - gridcell "D19" [ref=e872]
                      - gridcell "E19" [ref=e873]
                      - gridcell "F19" [ref=e874]
                      - gridcell "G19" [ref=e875]
                      - gridcell "H19" [ref=e876]
                      - gridcell "I19" [ref=e877]
                    - row [ref=e878]:
                      - rowheader "20 20 行高" [ref=e879]:
                        - generic [ref=e880]: "20"
                        - separator "20 行高" [ref=e881]
                      - gridcell "A20" [ref=e882]
                      - gridcell "B20" [ref=e883]
                      - gridcell "C20" [ref=e884]
                      - gridcell "D20" [ref=e885]
                      - gridcell "E20" [ref=e886]
                      - gridcell "F20" [ref=e887]
                      - gridcell "G20" [ref=e888]
                      - gridcell "H20" [ref=e889]
                      - gridcell "I20" [ref=e890]
                    - row [ref=e891]:
                      - rowheader "21 21 行高" [ref=e892]:
                        - generic [ref=e893]: "21"
                        - separator "21 行高" [ref=e894]
                      - gridcell "A21" [ref=e895]
                      - gridcell "B21" [ref=e896]
                      - gridcell "C21" [ref=e897]
                      - gridcell "D21" [ref=e898]
                      - gridcell "E21" [ref=e899]
                      - gridcell "F21" [ref=e900]
                      - gridcell "G21" [ref=e901]
                      - gridcell "H21" [ref=e902]
                      - gridcell "I21" [ref=e903]
                    - row [ref=e904]:
                      - rowheader "22 22 行高" [ref=e905]:
                        - generic [ref=e906]: "22"
                        - separator "22 行高" [ref=e907]
                      - gridcell "A22" [ref=e908]
                      - gridcell "B22" [ref=e909]
                      - gridcell "C22" [ref=e910]
                      - gridcell "D22" [ref=e911]
                      - gridcell "E22" [ref=e912]
                      - gridcell "F22" [ref=e913]
                      - gridcell "G22" [ref=e914]
                      - gridcell "H22" [ref=e915]
                      - gridcell "I22" [ref=e916]
                    - row [ref=e917]:
                      - rowheader "23 23 行高" [ref=e918]:
                        - generic [ref=e919]: "23"
                        - separator "23 行高" [ref=e920]
                      - gridcell "A23" [ref=e921]
                      - gridcell "B23" [ref=e922]
                      - gridcell "C23" [ref=e923]
                      - gridcell "D23" [ref=e924]
                      - gridcell "E23" [ref=e925]
                      - gridcell "F23" [ref=e926]
                      - gridcell "G23" [ref=e927]
                      - gridcell "H23" [ref=e928]
                      - gridcell "I23" [ref=e929]
                    - row [ref=e930]:
                      - rowheader "24 24 行高" [ref=e931]:
                        - generic [ref=e932]: "24"
                        - separator "24 行高" [ref=e933]
                      - gridcell "A24" [ref=e934]
                      - gridcell "B24" [ref=e935]
                      - gridcell "C24" [ref=e936]
                      - gridcell "D24" [ref=e937]
                      - gridcell "E24" [ref=e938]
                      - gridcell "F24" [ref=e939]
                      - gridcell "G24" [ref=e940]
                      - gridcell "H24" [ref=e941]
                      - gridcell "I24" [ref=e942]
                    - row [ref=e943]:
                      - rowheader "25 25 行高" [ref=e944]:
                        - generic [ref=e945]: "25"
                        - separator "25 行高" [ref=e946]
                      - gridcell "A25" [ref=e947]
                      - gridcell "B25" [ref=e948]
                      - gridcell "C25" [ref=e949]
                      - gridcell "D25" [ref=e950]
                      - gridcell "E25" [ref=e951]
                      - gridcell "F25" [ref=e952]
                      - gridcell "G25" [ref=e953]
                      - gridcell "H25" [ref=e954]
                      - gridcell "I25" [ref=e955]
                  - button "填充柄" [ref=e956]
                - generic [ref=e957]:
                  - tablist "工作表" [ref=e959]:
                    - tab "Records" [selected] [ref=e960] [cursor=pointer]
                    - tab "Other" [ref=e961] [cursor=pointer]
                  - button "新增工作表" [ref=e962] [cursor=pointer]
                  - button "删除工作表" [ref=e965] [cursor=pointer]
                  - status "已重做。" [ref=e970]
                  - generic "选中 30 格 · 求和 233 · 平均 29.125" [ref=e971]
            - paragraph [ref=e972]: 文件保存在当前浏览器的本地文档空间。需要长期留存时，请导出文件。
          - group [ref=e973]:
            - generic "示例代码" [ref=e974] [cursor=pointer]:
              - generic [aria-hidden] [ref=e975]: </>
              - text: 示例代码
              - generic [aria-hidden] [ref=e976]: 展开 / 收起
        - heading "编辑能力" [level=2] [ref=e977]
        - table [ref=e979]:
          - rowgroup [ref=e980]:
            - row [ref=e981]:
              - columnheader "文档" [ref=e982]
              - columnheader "支持的操作" [ref=e983]
              - columnheader "当前范围" [ref=e984]
          - rowgroup [ref=e985]:
            - row [ref=e986]:
              - cell "Word" [ref=e987]
              - cell "字体与小数字号输入、正文排版、列表、表格、图片、页眉页脚、页码、查找替换、页面设置、撤销重做；导入与导出 DOCX" [ref=e988]
              - cell "支持内嵌图片与单节文档。修订、目录、浮动对象等复杂结构会提示暂不支持。" [ref=e989]
            - row [ref=e990]:
              - cell "Excel" [ref=e991]
              - cell "单元格与矩形选区、字体与小数字号输入、手动与自动行高/列宽、查找替换、边框与垂直对齐、清除格式、公式和跨表引用、格式、复制粘贴、工作表增删、行列插入删除、合并、冻结、排序、筛选、柱状图与折线图；导入与导出 XLSX" [ref=e992]
              - cell "10,000 行、256 列、32 张表、100,000 个已使用单元格。透视、宏、数组公式及复杂图表暂不支持。" [ref=e993]
            - row [ref=e994]:
              - cell "PDF" [ref=e995]
              - cell "分页与缩略图、缩放、旋转、全文查找、文字与高亮、矩形和手写批注、已有表单、撤销重做；导出 PDF" [ref=e996]
              - cell "批注和表单编辑。任意原始文字修改、原文重排及扫描件 OCR 暂不支持。" [ref=e997]
        - heading "组件接入" [level=2] [ref=e998]
        - paragraph [ref=e999]: UI 组件使用 Tiptap / ProseMirror 和公式计算库；文件适配使用 docx、ExcelJS、pdf-lib 与 PDF.js。本页无需文档服务器。宿主可以替换保存与导入导出回调，接入自己的文件系统。
        - paragraph [ref=e1000]:
          - text: PDF 的 worker、字体与渲染由
          - code [ref=e1001]: pdfRenderer
          - text: 提供。本页的适配代码位于
          - code [ref=e1002]: docs/src/pages/collaboration/office-studio/
          - text: 。组件自 v0.4.0 起随
          - code [ref=e1003]: "@zuvi/react"
          - text: 和 Registry 发布。
        - region "组件属性表，可横向滚动" [ref=e1004]:
          - table [ref=e1005]:
            - rowgroup [ref=e1006]:
              - row [ref=e1007]:
                - columnheader "属性名" [ref=e1008]
                - columnheader "类型" [ref=e1009]
                - columnheader "默认值" [ref=e1010]
                - columnheader "说明" [ref=e1011]
            - rowgroup [ref=e1012]:
              - row [ref=e1013]:
                - cell "value / defaultValue" [ref=e1014]
                - cell [ref=e1015]:
                  - code [ref=e1016]: OfficeStudioDocument
                - cell [ref=e1017]:
                  - code [ref=e1018]: —
                - cell "受控文档或非受控初始文档；支持 Word、Excel、PDF 三种模型。" [ref=e1019]
              - row [ref=e1020]:
                - cell "onChange" [ref=e1021]
                - cell [ref=e1022]:
                  - code [ref=e1023]: (document) => void
                - cell [ref=e1024]:
                  - code [ref=e1025]: —
                - cell "内容或文件名称变化。" [ref=e1026]
              - row [ref=e1027]:
                - cell "source / pdfRenderer" [ref=e1028]
                - cell [ref=e1029]:
                  - code [ref=e1030]: Blob / StudioPdfRenderer
                - cell [ref=e1031]:
                  - code [ref=e1032]: —
                - cell "原始文件及 PDF 渲染适配；worker 资源由宿主管理。" [ref=e1033]
              - row [ref=e1034]:
                - cell "onSave / onExport / onPrint" [ref=e1035]
                - cell [ref=e1036]:
                  - code [ref=e1037]: (document) => void | Promise<void>
                - cell [ref=e1038]:
                  - code [ref=e1039]: —
                - cell "宿主处理保存、导出或打印；返回后更新状态，失败可重试。" [ref=e1040]
              - row [ref=e1041]:
                - cell "onImport / onCreate" [ref=e1042]
                - cell [ref=e1043]:
                  - code [ref=e1044]: (file | kind) => void | Promise<void>
                - cell [ref=e1045]:
                  - code [ref=e1046]: —
                - cell "宿主解析文件或创建模型，并更新受控值。" [ref=e1047]
              - row [ref=e1048]:
                - cell "readOnly / disabled" [ref=e1049]
                - cell [ref=e1050]:
                  - code [ref=e1051]: boolean
                - cell [ref=e1052]:
                  - code [ref=e1053]: "false"
                - cell "只读预览或禁用编辑与文件操作。" [ref=e1054]
              - row [ref=e1055]:
                - cell "saveState" [ref=e1056]
                - cell [ref=e1057]:
                  - code [ref=e1058]: "'saved' | 'saving' | 'unsaved' | 'error'"
                - cell [ref=e1059]:
                  - code [ref=e1060]: —
                - cell "宿主自动保存状态。" [ref=e1061]
              - row [ref=e1062]:
                - cell "height" [ref=e1063]
                - cell [ref=e1064]:
                  - code [ref=e1065]: number | string
                - cell [ref=e1066]:
                  - code [ref=e1067]: "760"
                - cell "编辑器高度；100% 需要父容器设置确定高度。" [ref=e1068]
              - row [ref=e1069]:
                - cell "fullscreen / onFullscreenChange" [ref=e1070]
                - cell [ref=e1071]:
                  - code [ref=e1072]: boolean / (value) => void
                - cell [ref=e1073]:
                  - code [ref=e1074]: —
                - cell "全屏布局，切换时编辑内容保持挂载。" [ref=e1075]
              - row [ref=e1076]:
                - cell "ref" [ref=e1077]
                - cell [ref=e1078]:
                  - code [ref=e1079]: OfficeStudioHandle
                - cell [ref=e1080]:
                  - code [ref=e1081]: —
                - cell "getDocument()、save()、export()、print()、setFullscreen()。" [ref=e1082]
              - row [ref=e1083]:
                - cell "classNames" [ref=e1084]
                - cell [ref=e1085]:
                  - code [ref=e1086]: "{ root?; header?; title?; actions?; stage?; status?; error? }"
                - cell [ref=e1087]:
                  - code [ref=e1088]: —
                - cell "追加语义结构类名，配合 data-part 与 CSS 变量定制。" [ref=e1089]
  - text: ✓ ✓ ✓ ✓
```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test';
  2   | import { mkdir, readFile, writeFile } from 'node:fs/promises';
  3   | import path from 'node:path';
  4   | import ExcelJS from '../docs/node_modules/exceljs/excel.js';
  5   | import JSZip from '../docs/node_modules/jszip/lib/index.js';
  6   | 
  7   | const audit = path.resolve('.release/office-continuation/duplicates/browser');
  8   | const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  9   | async function sourceFile() {
  10  |   const book = new ExcelJS.Workbook();
  11  |   const sheet = book.addWorksheet('Records');
  12  |   sheet.addRow(['Key', 'Label', 'Amount', 'Outside']);
  13  |   sheet.addRow([1, 'First', 10, 'Keep 2']);
  14  |   sheet.addRow([1, 'Duplicate', 20, 'Keep 3']);
  15  |   sheet.addRow(['1', 'Text', 30, 'Keep 4']);
  16  |   sheet.addRow([true, 'Boolean', 40, 'Keep 5']);
  17  |   sheet.addRow([null, 'Blank', 50, 'Keep 6']);
  18  |   sheet.addRow([null, 'Blank duplicate', 60, 'Keep 7']);
  19  |   sheet.addRow(['', 'Empty text', 70, 'Keep 8']);
  20  |   sheet.addRow([{ formula: '""', result: '' }, 'Empty formula duplicate', 80, 'Keep 9']);
  21  |   sheet.addRow([2, 'Last', { formula: 'A10*10', result: 20 }, 'Keep 10']);
  22  |   sheet.getCell('B10').value = { text: 'Last', hyperlink: 'https://example.com/record/2' };
  23  |   sheet.getCell('B3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };
  24  |   sheet.getCell('B3').font = { bold: true };
  25  |   sheet.getCell('B4').font = { italic: true, color: { argb: 'FF112233' } };
  26  |   sheet.getColumn('B').width = 24;
  27  |   sheet.getRow(4).height = 32;
  28  |   book.addWorksheet('Other').getCell('A1').value = 'Other untouched';
  29  |   const zip = await JSZip.loadAsync(Buffer.from(await book.xlsx.writeBuffer()));
  30  |   const part = 'xl/worksheets/sheet1.xml';
  31  |   let xml = await zip.file(part)!.async('string');
  32  |   xml = xml.replace(
  33  |     /<c\b[^>]*\br="A8"[^>]*(?:\/>|>[\s\S]*?<\/c>)/,
  34  |     '<c r="A8" t="inlineStr"><is><t></t></is></c>'
  35  |   );
  36  |   if (!xml.includes('r="A8"'))
  37  |     xml = xml.replace(
  38  |       /(<row\b[^>]*\br="8"[^>]*>)/,
  39  |       '$1<c r="A8" t="inlineStr"><is><t></t></is></c>'
  40  |     );
  41  |   zip.file(part, xml);
  42  |   return zip.generateAsync({ type: 'nodebuffer' });
  43  | }
  44  | async function load(page: Page, bytes: Buffer, name: string) {
  45  |   await page
  46  |     .getByLabel('导入文档文件', { exact: true })
  47  |     .setInputFiles({ name, mimeType, buffer: bytes });
  48  |   await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
  49  |   await expect(page.getByRole('grid')).toBeVisible();
  50  | }
  51  | async function select(page: Page, text: string) {
  52  |   const field = page.getByLabel('单元格地址', { exact: true });
  53  |   await field.fill(text);
  54  |   await field.press('Enter');
  55  | }
  56  | async function open(page: Page) {
  57  |   await page.getByRole('tab', { name: '数据', exact: true }).click();
  58  |   await page.getByRole('button', { name: '删除重复项', exact: true }).click();
  59  |   return page.getByRole('dialog', { name: '删除重复项', exact: true });
  60  | }
  61  | async function exportFile(page: Page, name: string) {
  62  |   const pending = page.waitForEvent('download');
  63  |   await page.getByRole('button', { name: '导出文件', exact: true }).click();
  64  |   const bytes = await readFile((await (await pending).path())!);
  65  |   await writeFile(path.join(audit, name), bytes);
  66  |   return bytes;
  67  | }
  68  | async function native(bytes: Buffer) {
  69  |   const book = new ExcelJS.Workbook();
  70  |   await book.xlsx.load(bytes);
  71  |   const sheet = book.getWorksheet('Records')!;
  72  |   expect(sheet.getCell('A2').value).toBe(1);
  73  |   expect(sheet.getCell('A3').value).toBe('1');
  74  |   expect(sheet.getCell('A4').value).toBe(true);
  75  |   expect(sheet.getCell('A5').value).toBeNull();
> 76  |   expect(sheet.getCell('A6').value).toBe('');
      |                                     ^ Error: expect(received).toBe(expected) // Object.is equality
  77  |   expect(sheet.getCell('A7').value).toBe(2);
  78  |   expect(sheet.getCell('C7').value).toEqual({ formula: 'A7*10', result: 20 });
  79  |   expect(sheet.getCell('B3').font.italic).toBe(true);
  80  |   expect(Boolean(sheet.getCell('B3').font.bold)).toBe(false);
  81  |   expect(sheet.getCell('B3').fill?.pattern).not.toBe('solid');
  82  |   expect(sheet.getCell('B7').hyperlink).toBe('https://example.com/record/2');
  83  |   for (const row of [8, 9, 10])
  84  |     for (const col of ['A', 'B', 'C']) expect(sheet.getCell(col + row).value).toBeNull();
  85  |   for (let row = 2; row <= 10; row++) expect(sheet.getCell('D' + row).value).toBe('Keep ' + row);
  86  |   expect(sheet.getRow(4).height).toBe(32);
  87  |   expect(sheet.getColumn('B').width).toBe(24);
  88  |   expect(book.getWorksheet('Other')!.getCell('A1').value).toBe('Other untouched');
  89  | }
  90  | test('duplicate records keep typed blanks, first rows, styles, links and outside data through history and two native reopens', async ({
  91  |   page,
  92  | }) => {
  93  |   test.setTimeout(90000);
  94  |   await mkdir(audit, { recursive: true });
  95  |   const source = await sourceFile();
  96  |   await writeFile(path.join(audit, 'source.xlsx'), source);
  97  |   await page.goto('/#/components/office-studio');
  98  |   await load(page, source, 'Duplicates.xlsx');
  99  |   await select(page, 'A1:C10');
  100 |   let dialog = await open(page);
  101 |   await dialog.getByRole('checkbox', { name: 'B 列 · Label', exact: true }).uncheck();
  102 |   await dialog.getByRole('checkbox', { name: 'C 列 · Amount', exact: true }).uncheck();
  103 |   await dialog.getByRole('button', { name: '删除重复记录', exact: true }).click();
  104 |   await expect(page.getByText(/已删除 3 条重复记录，保留 6 条记录/)).toBeVisible();
  105 |   await expect(page.getByRole('gridcell', { name: 'B3', exact: true })).toContainText('Text');
  106 |   await page.getByRole('tab', { name: '开始', exact: true }).click();
  107 |   await page.getByRole('button', { name: '撤销表格修改', exact: true }).click();
  108 |   await expect(page.getByRole('gridcell', { name: 'B3', exact: true })).toContainText('Duplicate');
  109 |   await page.getByRole('button', { name: '重做表格修改', exact: true }).click();
  110 |   for (let pass = 1; pass <= 2; pass++) {
  111 |     const bytes = await exportFile(page, 'roundtrip-' + pass + '.xlsx');
  112 |     await native(bytes);
  113 |     await load(page, bytes, 'Reopened-' + pass + '.xlsx');
  114 |   }
  115 |   await select(page, 'A1:C7');
  116 |   dialog = await open(page);
  117 |   await dialog.getByRole('button', { name: '取消全选列', exact: true }).click();
  118 |   await expect(dialog.getByRole('button', { name: '删除重复记录', exact: true })).toBeDisabled();
  119 |   await dialog.getByRole('button', { name: '取消', exact: true }).click();
  120 |   for (const width of [1280, 320]) {
  121 |     await page.setViewportSize({ width, height: 800 });
  122 |     for (const theme of ['light', 'dark']) {
  123 |       if (theme === 'dark')
  124 |         await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  125 |       dialog = await open(page);
  126 |       await expect(dialog.getByRole('button', { name: '删除重复记录', exact: true })).toBeVisible();
  127 |       const rect = await dialog.boundingBox();
  128 |       expect(rect!.x).toBeGreaterThanOrEqual(0);
  129 |       expect(rect!.width).toBeLessThanOrEqual(width);
  130 |       await page.screenshot({
  131 |         path: path.join(audit, 'dialog-' + theme + '-' + width + '.png'),
  132 |         fullPage: true,
  133 |         animations: 'disabled',
  134 |       });
  135 |       await dialog.getByRole('button', { name: '取消', exact: true }).click();
  136 |       if (theme === 'dark')
  137 |         await page.getByRole('button', { name: '切换浅色', exact: true }).click();
  138 |     }
  139 |   }
  140 |   await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  141 |   await expect(page.getByRole('button', { name: '删除重复项', exact: true })).toBeDisabled();
  142 | });
  143 | 
```