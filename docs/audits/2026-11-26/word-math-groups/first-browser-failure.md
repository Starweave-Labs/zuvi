# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-word-math-groups.spec.ts >> edits independent native equation group members and reopens the complete group twice
- Location: e2e/office-studio-word-math-groups.spec.ts:6:1

# Error details

```
TypeError: Cannot read properties of null (reading 'timeout')
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
                - button "打开本地文档 原生数学公式.docx" [ref=e356] [cursor=pointer]:
                  - generic [ref=e357]: 原生数学公式.docx
              - button "历史版本" [ref=e358] [cursor=pointer]
              - switch "只读预览" [ref=e360] [cursor=pointer]
            - region "Word 文档编辑器" [ref=e364]:
              - generic [ref=e365]:
                - generic [ref=e366]:
                  - generic [ref=e371]: Word
                  - generic "可编辑 · ⌘ / Ctrl S 保存" [ref=e372]:
                    - status "已保存" [ref=e373]
                - textbox "文档名称" [ref=e378]: 原生数学公式.docx
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
                      - tab "开始" [ref=e424] [cursor=pointer]
                      - tab "插入" [selected] [ref=e425] [cursor=pointer]
                      - tab "布局" [ref=e426] [cursor=pointer]
                      - tab "引用" [ref=e427] [cursor=pointer]
                      - tab "审阅" [ref=e428] [cursor=pointer]
                      - tab "视图" [ref=e429] [cursor=pointer]
                  - tabpanel "插入" [ref=e430]:
                    - group "页面" [ref=e431]:
                      - button "分页符" [ref=e433] [cursor=pointer]
                    - group "表格" [ref=e440]:
                      - generic [ref=e441]:
                        - generic [ref=e442]:
                          - generic [ref=e443]: 表格行数
                          - button "表格行数 3 行" [ref=e444] [cursor=pointer]:
                            - generic [ref=e445]: 3 行
                        - generic [ref=e446]:
                          - generic [ref=e447]: 表格列数
                          - button "表格列数 3 列" [ref=e448] [cursor=pointer]:
                            - generic [ref=e449]: 3 列
                        - generic [ref=e450] [cursor=pointer]:
                          - checkbox "标题行" [checked] [ref=e451]
                          - generic [ref=e453]: 标题行
                        - button "插入表格" [ref=e454] [cursor=pointer]
                    - group "图片" [ref=e457]:
                      - button "插入图片" [ref=e459] [cursor=pointer]
                    - group "链接" [ref=e466]:
                      - button "链接" [ref=e468] [cursor=pointer]
                    - group "页眉页脚" [ref=e475]:
                      - generic [ref=e476]:
                        - button "编辑页眉" [ref=e477] [cursor=pointer]
                        - button "编辑页脚" [ref=e479] [cursor=pointer]
                        - generic [ref=e481] [cursor=pointer]:
                          - checkbox "显示页码" [ref=e482]
                          - generic [ref=e484]: 显示页码
                        - button "插入页码" [ref=e485] [cursor=pointer]
                        - button "插入总页数" [ref=e487] [cursor=pointer]
                    - group "文本" [ref=e490]:
                      - button "分隔线" [ref=e492] [cursor=pointer]
                    - group "表格工具" [ref=e495]:
                      - generic [ref=e496]:
                        - button "表格公式" [disabled] [ref=e497]
                        - button "数学公式" [ref=e499] [cursor=pointer]
                        - button "刷新公式" [ref=e501] [cursor=pointer]
                        - button "文本转表格" [ref=e503] [cursor=pointer]
                        - button "表格行属性" [disabled] [ref=e505]
                        - button "平均分布表格列" [disabled] [ref=e507]
                        - button "平均分布行" [disabled] [ref=e509]
                        - button "增加行" [disabled] [ref=e511]
                        - button "增加列" [disabled] [ref=e513]
                        - button "删除行" [disabled] [ref=e515]
                        - button "删除列" [disabled] [ref=e517]
                        - button "合并单元格" [disabled] [ref=e519]
                        - button "拆分单元格" [disabled] [ref=e521]
                        - button "切换标题行" [disabled] [ref=e523]
                        - button "删除表格" [disabled] [ref=e525]
                - generic [ref=e528]:
                  - toolbar "Word 文档工具" [ref=e529]:
                    - button "打开查找与替换" [ref=e530] [cursor=pointer]
                    - button "打开文档大纲" [ref=e535] [cursor=pointer]
                    - button "打开字数统计" [ref=e539] [cursor=pointer]
                  - generic [ref=e544]:
                    - generic "段落缩进标尺" [ref=e545]:
                      - generic [aria-hidden] [ref=e547]: "0"
                      - generic [aria-hidden] [ref=e548]: "1"
                      - generic [aria-hidden] [ref=e549]: "2"
                      - generic [aria-hidden] [ref=e550]: "3"
                      - generic [aria-hidden] [ref=e551]: "4"
                      - generic [aria-hidden] [ref=e552]: "5"
                      - generic [aria-hidden] [ref=e553]: "6"
                      - generic [aria-hidden] [ref=e554]: "7"
                      - generic [aria-hidden] [ref=e555]: "8"
                      - generic [aria-hidden] [ref=e556]: "9"
                      - generic [aria-hidden] [ref=e557]: "10"
                      - generic [aria-hidden] [ref=e558]: "11"
                      - generic [aria-hidden] [ref=e559]: "12"
                      - generic [aria-hidden] [ref=e560]: "13"
                      - generic [aria-hidden] [ref=e561]: "14"
                      - generic [aria-hidden] [ref=e562]: "15"
                      - generic [aria-hidden] [ref=e563]: "16"
                      - generic [aria-hidden] [ref=e564]: "17"
                      - slider "首行缩进标尺" [ref=e565] [cursor=pointer]
                      - slider "悬挂缩进标尺" [ref=e567] [cursor=pointer]
                      - slider "左缩进标尺" [ref=e569] [cursor=pointer]
                      - slider "右缩进标尺" [ref=e571] [cursor=pointer]
                    - generic [ref=e573]:
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
                      - article "文档纸张" [ref=e574]:
                        - region "页眉区域" [ref=e575]
                        - textbox "Word 文档正文" [active] [ref=e577]:
                          - paragraph [ref=e578]:
                            - math "(x_(i)^(2))/(2) ; y" [ref=e579]:
                              - math [ref=e580]:
                                - generic [ref=e581]:
                                  - generic [ref=e582]:
                                    - generic [ref=e583]:
                                      - generic [ref=e584]: x
                                      - generic [ref=e585]: i
                                      - generic [ref=e586]: "2"
                                    - generic [ref=e587]: "2"
                                  - generic [ref=e588]: "y"
                        - region "页脚区域" [ref=e589]
                - generic [ref=e590]:
                  - generic [ref=e591]: 17 字 · A4 · 纵向
                  - generic [ref=e592]:
                    - generic [ref=e593]: 缩放
                    - generic [ref=e594]:
                      - generic [ref=e595]: Word 缩放
                      - button "Word 缩放 适应宽度" [ref=e596] [cursor=pointer]:
                        - generic [ref=e597]: 适应宽度
            - paragraph [ref=e598]: 文件保存在当前浏览器的本地文档空间。需要长期留存时，请导出文件。
          - group [ref=e599]:
            - generic "示例代码" [ref=e600] [cursor=pointer]:
              - generic [aria-hidden] [ref=e601]: </>
              - text: 示例代码
              - generic [aria-hidden] [ref=e602]: 展开 / 收起
        - heading "编辑能力" [level=2] [ref=e603]
        - table [ref=e605]:
          - rowgroup [ref=e606]:
            - row [ref=e607]:
              - columnheader "文档" [ref=e608]
              - columnheader "支持的操作" [ref=e609]
              - columnheader "当前范围" [ref=e610]
          - rowgroup [ref=e611]:
            - row [ref=e612]:
              - cell "Word" [ref=e613]
              - cell "字体与小数字号输入、正文排版、列表、表格、图片、页眉页脚、页码、查找替换、页面设置、撤销重做；导入与导出 DOCX" [ref=e614]
              - cell "支持内嵌图片与单节文档。修订、目录、浮动对象等复杂结构会提示暂不支持。" [ref=e615]
            - row [ref=e616]:
              - cell "Excel" [ref=e617]
              - cell "单元格与矩形选区、字体与小数字号输入、手动与自动行高/列宽、查找替换、边框与垂直对齐、清除格式、公式和跨表引用、格式、复制粘贴、工作表增删、行列插入删除、合并、冻结、排序、筛选、柱状图与折线图；导入与导出 XLSX" [ref=e618]
              - cell "10,000 行、256 列、32 张表、100,000 个已使用单元格。透视、宏、数组公式及复杂图表暂不支持。" [ref=e619]
            - row [ref=e620]:
              - cell "PDF" [ref=e621]
              - cell "分页与缩略图、缩放、旋转、全文查找、文字与高亮、矩形和手写批注、已有表单、撤销重做；导出 PDF" [ref=e622]
              - cell "批注和表单编辑。任意原始文字修改、原文重排及扫描件 OCR 暂不支持。" [ref=e623]
        - heading "组件接入" [level=2] [ref=e624]
        - paragraph [ref=e625]: UI 组件使用 Tiptap / ProseMirror 和公式计算库；文件适配使用 docx、ExcelJS、pdf-lib 与 PDF.js。本页无需文档服务器。宿主可以替换保存与导入导出回调，接入自己的文件系统。
        - paragraph [ref=e626]:
          - text: PDF 的 worker、字体与渲染由
          - code [ref=e627]: pdfRenderer
          - text: 提供。本页的适配代码位于
          - code [ref=e628]: docs/src/pages/collaboration/office-studio/
          - text: 。组件自 v0.4.0 起随
          - code [ref=e629]: "@zuvi/react"
          - text: 和 Registry 发布。
        - region "组件属性表，可横向滚动" [ref=e630]:
          - table [ref=e631]:
            - rowgroup [ref=e632]:
              - row [ref=e633]:
                - columnheader "属性名" [ref=e634]
                - columnheader "类型" [ref=e635]
                - columnheader "默认值" [ref=e636]
                - columnheader "说明" [ref=e637]
            - rowgroup [ref=e638]:
              - row [ref=e639]:
                - cell "value / defaultValue" [ref=e640]
                - cell [ref=e641]:
                  - code [ref=e642]: OfficeStudioDocument
                - cell [ref=e643]:
                  - code [ref=e644]: —
                - cell "受控文档或非受控初始文档；支持 Word、Excel、PDF 三种模型。" [ref=e645]
              - row [ref=e646]:
                - cell "onChange" [ref=e647]
                - cell [ref=e648]:
                  - code [ref=e649]: (document) => void
                - cell [ref=e650]:
                  - code [ref=e651]: —
                - cell "内容或文件名称变化。" [ref=e652]
              - row [ref=e653]:
                - cell "source / pdfRenderer" [ref=e654]
                - cell [ref=e655]:
                  - code [ref=e656]: Blob / StudioPdfRenderer
                - cell [ref=e657]:
                  - code [ref=e658]: —
                - cell "原始文件及 PDF 渲染适配；worker 资源由宿主管理。" [ref=e659]
              - row [ref=e660]:
                - cell "onSave / onExport / onPrint" [ref=e661]
                - cell [ref=e662]:
                  - code [ref=e663]: (document) => void | Promise<void>
                - cell [ref=e664]:
                  - code [ref=e665]: —
                - cell "宿主处理保存、导出或打印；返回后更新状态，失败可重试。" [ref=e666]
              - row [ref=e667]:
                - cell "onImport / onCreate" [ref=e668]
                - cell [ref=e669]:
                  - code [ref=e670]: (file | kind) => void | Promise<void>
                - cell [ref=e671]:
                  - code [ref=e672]: —
                - cell "宿主解析文件或创建模型，并更新受控值。" [ref=e673]
              - row [ref=e674]:
                - cell "readOnly / disabled" [ref=e675]
                - cell [ref=e676]:
                  - code [ref=e677]: boolean
                - cell [ref=e678]:
                  - code [ref=e679]: "false"
                - cell "只读预览或禁用编辑与文件操作。" [ref=e680]
              - row [ref=e681]:
                - cell "saveState" [ref=e682]
                - cell [ref=e683]:
                  - code [ref=e684]: "'saved' | 'saving' | 'unsaved' | 'error'"
                - cell [ref=e685]:
                  - code [ref=e686]: —
                - cell "宿主自动保存状态。" [ref=e687]
              - row [ref=e688]:
                - cell "height" [ref=e689]
                - cell [ref=e690]:
                  - code [ref=e691]: number | string
                - cell [ref=e692]:
                  - code [ref=e693]: "760"
                - cell "编辑器高度；100% 需要父容器设置确定高度。" [ref=e694]
              - row [ref=e695]:
                - cell "fullscreen / onFullscreenChange" [ref=e696]
                - cell [ref=e697]:
                  - code [ref=e698]: boolean / (value) => void
                - cell [ref=e699]:
                  - code [ref=e700]: —
                - cell "全屏布局，切换时编辑内容保持挂载。" [ref=e701]
              - row [ref=e702]:
                - cell "ref" [ref=e703]
                - cell [ref=e704]:
                  - code [ref=e705]: OfficeStudioHandle
                - cell [ref=e706]:
                  - code [ref=e707]: —
                - cell "getDocument()、save()、export()、print()、setFullscreen()。" [ref=e708]
              - row [ref=e709]:
                - cell "classNames" [ref=e710]
                - cell [ref=e711]:
                  - code [ref=e712]: "{ root?; header?; title?; actions?; stage?; status?; error? }"
                - cell [ref=e713]:
                  - code [ref=e714]: —
                - cell "追加语义结构类名，配合 data-part 与 CSS 变量定制。" [ref=e715]
  - text: ✓ ✓ ✓ ✓
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | import { readFile, writeFile } from 'node:fs/promises';
  3  | import path from 'node:path';
  4  | import JSZip from '../docs/node_modules/jszip/lib/index.js';
  5  |
  6  | test('edits independent native equation group members and reopens the complete group twice', async ({ page }) => {
  7  |   const audit = path.resolve('docs/audits/2026-11-26/word-math-groups');
  8  |   const zip = await JSZip.loadAsync(await readFile('docs/audits/2026-11-26/word-image-crop/crop-source.docx'));
  9  |   const original = await zip.file('word/document.xml')!.async('string');
  10 |   const equation = '<w:p><m:oMathPara xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><m:oMathParaPr><m:jc m:val="right"/></m:oMathParaPr><m:oMath><m:f><m:num><m:sSubSup><m:e><m:r><m:rPr><m:sty m:val="bi"/></m:rPr><m:t>x</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSubSup></m:num><m:den><m:r><m:t>2</m:t></m:r></m:den></m:f></m:oMath><m:oMath><m:r><m:t>y</m:t></m:r></m:oMath></m:oMathPara></w:p>';
  11 |   expect(original).toMatch(/<w:body>/);
  12 |   zip.file('word/document.xml', original.replace(/<w:body>[\s\S]*<\/w:body>/, `<w:body>${equation}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:bottom="1134" w:left="1134" w:right="1134"/></w:sectPr></w:body>`));
  13 |   const source = await zip.generateAsync({ type: 'nodebuffer' });
  14 |   await writeFile(path.join(audit, 'math-source.docx'), source);
  15 |   await page.goto('/#/components/office-studio');
  16 |   const importFile = (buffer: Buffer, name: string) => page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer });
  17 |   await importFile(source, '原生数学公式.docx');
  18 |   const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  19 |   const math = body.locator('span[data-word-math]');
  20 |   await expect(math.locator('mfrac')).toHaveCount(1);
  21 |   await expect(math.locator('msubsup')).toHaveCount(1);
  22 |   await math.click();
  23 |   await page.getByRole('tab', { name: '插入', exact: true }).click();
  24 |   await page.getByRole('button', { name: '数学公式', exact: true }).click();
  25 |   const before = await math.getAttribute('data-word-math-groups');
  26 |   await page.getByRole('textbox', { name: '公式 段落内容 分子 基数文字', exact: true }).fill('cancelled');
  27 |   await page.getByRole('button', { name: '取消', exact: true }).click();
> 28 |   await expect(math).toHaveAttribute('data-word-math', before!);
     |                      ^ TypeError: Cannot read properties of null (reading 'timeout')
  29 |   await page.getByRole('button', { name: '数学公式', exact: true }).click();
  30 |   await page.getByRole('textbox', { name: '公式 段落内容 分子 基数文字', exact: true }).fill('a+1');
  31 |   const composing = page.getByRole('textbox', { name: '公式 段落内容 分子 基数文字', exact: true });
  32 |   await composing.dispatchEvent('compositionstart', { data: '甲' });
  33 |   await composing.fill('变量甲');
  34 |   await expect(page.getByRole('button', { name: '保存数学公式', exact: true })).toBeDisabled();
  35 |   await expect(math).toHaveAttribute('data-word-math', before!);
  36 |   await composing.dispatchEvent('compositionend', { data: '甲' });
  37 |   await composing.fill('a+1');
  38 |   await expect(page.getByRole('button', { name: '保存数学公式', exact: true })).toBeEnabled();
  39 |
  40 |   await page.getByRole('textbox', { name: '公式 段落内容 分子 基数字号', exact: true }).fill('14.5pt');
  41 |   await page.getByRole('textbox', { name: '公式 段落内容 分子 基数文字颜色', exact: true }).fill('#aa2244');
  42 |   await page.getByRole('button', { name: '公式 段落内容 分母改为矩阵', exact: true }).click();
  43 |   await page.getByRole('textbox', { name: '公式 段落内容 分母 第1行第2列文字', exact: true }).fill('5');
  44 |   await page.getByRole('button', { name: '段落公式对齐center', exact: true }).click();
  45 |   await page.getByRole('textbox', { name: '公式 组内第2公式文字', exact: true }).fill('y+1');
  46 |   await page.getByRole('button', { name: '增加组内公式', exact: true }).click();
  47 |   await page.getByRole('textbox', { name: '公式 组内第3公式文字', exact: true }).fill('z');
  48 |   await page.getByRole('button', { name: '删除组内第3公式', exact: true }).click();
  49 |
  50 |   await page.screenshot({ path: path.join(audit, 'math-dialog-light.png'), fullPage: true });
  51 |   await page.getByRole('button', { name: '保存数学公式', exact: true }).click();
  52 |   await expect(math.locator('mtable mtd')).toHaveCount(4);
  53 |   await expect(math.locator('msubsup mtext').first()).toHaveText('a+1');
  54 |   const edited = await math.getAttribute('data-word-math-groups');
  55 |   await page.getByRole('tab', { name: '开始', exact: true }).click();
  56 |   await page.getByRole('button', { name: '撤销', exact: true }).click();
  57 |   await expect(math).toHaveAttribute('data-word-math', before!);
  58 |   await page.getByRole('button', { name: '重做', exact: true }).click();
  59 |   await expect(math).toHaveAttribute('data-word-math', edited!);
  60 |   for (let round = 1; round <= 2; round++) {
  61 |     const pending = page.waitForEvent('download');
  62 |     await page.getByRole('button', { name: '导出文件', exact: true }).click();
  63 |     const bytes = await readFile((await (await pending).path())!);
  64 |     await writeFile(path.join(audit, `math-round-${round}.docx`), bytes);
  65 |     const saved = await JSZip.loadAsync(bytes);
  66 |     const native = await saved.file('word/document.xml')!.async('string');
  67 |     expect(native).toContain('<m:oMathPara'); expect(native).toContain('<m:sSubSup'); expect(native).toContain('<m:m>');
  68 |     expect((native.match(/<m:oMath\s/g) || [])).toHaveLength(2);
  69 |     expect(native).toContain('<m:sty m:val="bi"'); expect(native).toContain('<w:sz w:val="29"');
  70 |     await importFile(bytes, `数学重开${round}.docx`);
  71 |     await expect(math).toHaveAttribute('data-word-math', edited!);
  72 |   }
  73 |   await page.screenshot({ path: path.join(audit, 'math-light.png'), fullPage: true });
  74 |   await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  75 |   await page.screenshot({ path: path.join(audit, 'math-dark.png'), fullPage: true });
  76 |   await math.click();
  77 |   await page.getByRole('tab', { name: '插入', exact: true }).click();
  78 |   await page.getByRole('button', { name: '数学公式', exact: true }).click();
  79 |   await page.screenshot({ path: path.join(audit, 'math-dialog-dark.png'), fullPage: true });
  80 |   await page.setViewportSize({ width: 320, height: 720 });
  81 |   await expect(page.getByRole('textbox', { name: '公式 段落内容 分子 基数文字', exact: true })).toBeVisible();
  82 |   await page.screenshot({ path: path.join(audit, 'math-dialog-320-overview.png'), fullPage: true });
  83 |   const size = page.getByRole('textbox', { name: '公式 段落内容 分子 基数字号', exact: true });
  84 |   await size.scrollIntoViewIfNeeded();
  85 |   await size.fill('0.1pt');
  86 |   await expect(page.getByRole('button', { name: '保存数学公式', exact: true })).toBeDisabled();
  87 |   await size.fill('14.5pt');
  88 |   await expect(page.getByRole('button', { name: '保存数学公式', exact: true })).toBeEnabled();
  89 |   const bounds = await size.boundingBox();
  90 |   expect(bounds!.x).toBeGreaterThanOrEqual(0); expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
  91 |   await page.screenshot({ path: path.join(audit, 'math-dialog-320.png'), fullPage: true });
  92 |   await page.getByRole('button', { name: '取消', exact: true }).click();
  93 |   await page.screenshot({ path: path.join(audit, 'math-320.png'), fullPage: true });
  94 |   await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  95 |   await expect(page.getByRole('button', { name: '数学公式', exact: true })).toBeDisabled();
  96 |   await expect(math).toHaveAttribute('data-word-math', edited!);
  97 | });
  98 |
```
