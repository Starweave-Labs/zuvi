# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-word-paragraph-acceptance.spec.ts >> original paragraph requirements retain four alignments, indent and line units, tab stops and every border edge over real DOCX reopens
- Location: e2e/office-studio-word-paragraph-acceptance.spec.ts:71:1

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: locator.click: Test timeout of 90000ms exceeded.
Call log:
  - waiting for getByRole('option', { name: '倍数', exact: true })

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
                - button "打开本地文档 Paragraph acceptance.docx" [ref=e356] [cursor=pointer]:
                  - generic [ref=e357]: Paragraph acceptance.docx
              - button "历史版本" [ref=e358] [cursor=pointer]
              - switch "只读预览" [ref=e360] [cursor=pointer]
            - region "Word 文档编辑器" [ref=e364]:
              - generic [ref=e365]:
                - generic [ref=e366]:
                  - generic [ref=e371]: Word
                  - generic "可编辑 · ⌘ / Ctrl S 保存" [ref=e372]:
                    - status "已保存" [ref=e373]
                - textbox "文档名称" [ref=e378]: Paragraph acceptance.docx
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
                      - tab "开始" [selected] [ref=e424] [cursor=pointer]
                      - tab "插入" [ref=e425] [cursor=pointer]
                      - tab "布局" [ref=e426] [cursor=pointer]
                      - tab "引用" [ref=e427] [cursor=pointer]
                      - tab "审阅" [ref=e428] [cursor=pointer]
                      - tab "视图" [ref=e429] [cursor=pointer]
                  - tabpanel "开始" [ref=e430]:
                    - group "剪贴板" [ref=e431]:
                      - generic [ref=e432]:
                        - button "粘贴" [ref=e433] [cursor=pointer]
                        - generic [ref=e439]:
                          - button "剪切" [ref=e440] [cursor=pointer]
                          - button "复制" [ref=e449] [cursor=pointer]
                    - button "格式刷" [ref=e456] [cursor=pointer]
                    - group "历史" [ref=e461]:
                      - generic [ref=e462]:
                        - button "撤销" [ref=e463] [cursor=pointer]
                        - button "重做" [disabled] [ref=e469]
                    - group "字体" [ref=e476]:
                      - generic [ref=e477]:
                        - generic [ref=e478]:
                          - generic [ref=e481]:
                            - combobox "字体" [ref=e482]: 思源黑体
                            - button "展开选项" [ref=e483] [cursor=pointer]
                          - generic [ref=e488]:
                            - combobox "字号" [ref=e489]: "12"
                            - button "展开选项" [ref=e490] [cursor=pointer]
                          - button "增大字号" [ref=e493] [cursor=pointer]
                          - button "减小字号" [ref=e496] [cursor=pointer]
                        - button "字符间距与位置" [ref=e499] [cursor=pointer]
                        - generic [ref=e501]:
                          - button "粗体" [pressed] [ref=e502] [cursor=pointer]
                          - button "斜体" [ref=e507] [cursor=pointer]
                          - button "下划线" [ref=e511] [cursor=pointer]:
                            - generic [ref=e512]: U
                          - button "删除线" [ref=e514] [cursor=pointer]:
                            - generic [ref=e515]: S
                          - button "上标" [ref=e517] [cursor=pointer]:
                            - generic [ref=e518]:
                              - text: x
                              - superscript [ref=e519]: "2"
                          - button "下标" [ref=e520] [cursor=pointer]:
                            - generic [ref=e521]:
                              - text: x
                              - subscript [ref=e522]: "2"
                          - generic "文字颜色" [ref=e523]:
                            - button "文字颜色" [ref=e524] [cursor=pointer]: A
                          - button "清除格式" [ref=e526] [cursor=pointer]:
                            - generic [aria-hidden] [ref=e528]: A
                          - button "文字高亮" [ref=e530] [cursor=pointer]
                          - button "变更大小写" [ref=e535] [cursor=pointer]
                    - group "段落" [ref=e539]:
                      - generic [ref=e540]:
                        - generic [ref=e541]:
                          - button "项目符号" [ref=e542] [cursor=pointer]:
                            - generic [aria-hidden] [ref=e544]: • ≡
                          - button "编号列表" [ref=e545] [cursor=pointer]:
                            - generic [aria-hidden] [ref=e547]: 1. ≡
                          - button "列表下沉缩进" [disabled] [ref=e548]:
                            - generic [aria-hidden] [ref=e550]: 1.1 →
                          - button "列表上提缩进" [disabled] [ref=e551]:
                            - generic [aria-hidden] [ref=e553]: ← 1.1
                          - button "减少缩进" [disabled] [ref=e554]:
                            - generic [ref=e555]: ← ≡
                          - button "增加缩进" [ref=e556] [cursor=pointer]:
                            - generic [ref=e557]: ≡ →
                          - button "继续编号" [disabled] [ref=e558]
                          - textbox "编号起始值" [disabled] [ref=e561]: "1"
                          - button "重新开始编号" [disabled] [ref=e562]
                          - generic [ref=e564]:
                            - generic [ref=e565]: 编号格式
                            - button "编号格式 1, 2, 3" [disabled] [ref=e566]:
                              - generic [ref=e567]: 1, 2, 3
                          - button "多级编号定义" [ref=e568] [cursor=pointer]
                          - button "段落边框与底纹" [ref=e570] [cursor=pointer]
                          - generic [ref=e572]:
                            - generic [ref=e573]: 段落行距
                            - button "段落行距 1.75 倍行距" [ref=e574] [cursor=pointer]:
                              - generic [ref=e575]: 1.75 倍行距
                          - button "段落设置" [ref=e576] [cursor=pointer]
                          - button "制表位" [ref=e578] [cursor=pointer]
                          - button "插入制表符" [ref=e580] [cursor=pointer]
                        - generic [ref=e582]:
                          - button "左对齐" [pressed] [ref=e583] [cursor=pointer]
                          - button "居中" [ref=e586] [cursor=pointer]
                          - button "右对齐" [ref=e589] [cursor=pointer]
                          - button "两端对齐" [ref=e592] [cursor=pointer]
                          - button "显示非打印字符" [ref=e595] [cursor=pointer]:
                            - generic [aria-hidden] [ref=e597]: ¶
                    - group "样式" [ref=e599]:
                      - generic [ref=e600]:
                        - generic [ref=e601]:
                          - button "正文样式" [pressed] [ref=e602] [cursor=pointer]:
                            - generic [ref=e603]:
                              - generic [aria-hidden] [ref=e604]: AaBbCc
                              - generic [ref=e605]: 正文
                          - button "无间距样式" [ref=e606] [cursor=pointer]:
                            - generic [ref=e607]:
                              - generic [aria-hidden] [ref=e608]: AaBbCc
                              - generic [ref=e609]: 无间距
                          - button "标题 1样式" [ref=e610] [cursor=pointer]:
                            - generic [ref=e611]:
                              - generic [aria-hidden] [ref=e612]: AaBbCc
                              - generic [ref=e613]: 标题 1
                        - generic [ref=e614]:
                          - generic [ref=e615]: 段落样式
                          - button "段落样式 正文" [ref=e616] [cursor=pointer]:
                            - generic [ref=e617]: 正文
                        - generic [ref=e618]:
                          - button "新建段落样式" [ref=e619] [cursor=pointer]:
                            - generic [ref=e620]: 新建样式
                          - button "修改段落样式" [disabled] [ref=e621]:
                            - generic [ref=e622]: 修改样式
                    - group "编辑" [ref=e624]:
                      - generic [ref=e625]:
                        - button "查找与替换" [ref=e626] [cursor=pointer]:
                          - generic [ref=e631]: 查找
                        - button "文档大纲" [ref=e632] [cursor=pointer]:
                          - generic [ref=e636]: 大纲
                - generic [ref=e638]:
                  - toolbar "Word 文档工具" [ref=e639]:
                    - button "打开查找与替换" [ref=e640] [cursor=pointer]
                    - button "打开文档大纲" [ref=e645] [cursor=pointer]
                    - button "打开字数统计" [ref=e649] [cursor=pointer]
                  - generic [ref=e654]:
                    - generic "段落缩进标尺" [ref=e655]:
                      - generic [aria-hidden] [ref=e657]: "0"
                      - generic [aria-hidden] [ref=e658]: "1"
                      - generic [aria-hidden] [ref=e659]: "2"
                      - generic [aria-hidden] [ref=e660]: "3"
                      - generic [aria-hidden] [ref=e661]: "4"
                      - generic [aria-hidden] [ref=e662]: "5"
                      - generic [aria-hidden] [ref=e663]: "6"
                      - generic [aria-hidden] [ref=e664]: "7"
                      - generic [aria-hidden] [ref=e665]: "8"
                      - generic [aria-hidden] [ref=e666]: "9"
                      - generic [aria-hidden] [ref=e667]: "10"
                      - generic [aria-hidden] [ref=e668]: "11"
                      - generic [aria-hidden] [ref=e669]: "12"
                      - generic [aria-hidden] [ref=e670]: "13"
                      - generic [aria-hidden] [ref=e671]: "14"
                      - generic [aria-hidden] [ref=e672]: "15"
                      - slider "首行缩进标尺" [ref=e673] [cursor=pointer]
                      - slider "悬挂缩进标尺" [ref=e675] [cursor=pointer]
                      - slider "左缩进标尺" [ref=e677] [cursor=pointer]
                      - slider "右缩进标尺" [ref=e679] [cursor=pointer]
                    - generic [ref=e681]:
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
                      - article "文档纸张" [ref=e682]:
                        - region "页眉区域" [ref=e683]
                        - textbox "Word 文档正文" [ref=e685]:
                          - paragraph [ref=e686]:
                            - strong [ref=e687]: Alignment left
                          - paragraph [ref=e688]:
                            - strong [ref=e689]: Alignment center
                          - paragraph [ref=e690]:
                            - strong [ref=e691]: Alignment right
                          - paragraph [ref=e692]:
                            - strong [ref=e693]: Alignment justify
                          - paragraph [ref=e694]:
                            - strong [ref=e695]: First indent
                          - paragraph [ref=e696]:
                            - strong [ref=e697]: Hanging indent
                          - paragraph [ref=e698]:
                            - strong [ref=e699]: Single spacing
                          - paragraph [ref=e700]:
                            - strong [ref=e701]: Multiple spacing
                          - paragraph [ref=e702]:
                            - strong [ref=e703]: Fixed spacing
                          - paragraph [ref=e704]:
                            - strong [ref=e705]: Minimum spacing
                          - paragraph [ref=e706]:
                            - strong [ref=e707]: Tabs
                            - text: ABC12.34
                          - paragraph [ref=e712]:
                            - strong [ref=e713]: Surface
                          - paragraph [ref=e714]:
                            - strong [ref=e715]: Cleared surface
                        - region "页脚区域" [ref=e716]
                - generic [ref=e717]:
                  - generic [ref=e718]: 169 字 · A4 · 纵向
                  - status [ref=e719]: 已应用段落设置，可撤销恢复。
                  - generic [ref=e720]:
                    - generic [ref=e721]: 缩放
                    - generic [ref=e722]:
                      - generic [ref=e723]: Word 缩放
                      - button "Word 缩放 适应宽度" [ref=e724] [cursor=pointer]:
                        - generic [ref=e725]: 适应宽度
            - paragraph [ref=e726]: 文件保存在当前浏览器的本地文档空间。需要长期留存时，请导出文件。
          - group [ref=e727]:
            - generic "示例代码" [ref=e728] [cursor=pointer]:
              - generic [aria-hidden] [ref=e729]: </>
              - text: 示例代码
              - generic [aria-hidden] [ref=e730]: 展开 / 收起
        - heading "编辑能力" [level=2] [ref=e731]
        - table [ref=e733]:
          - rowgroup [ref=e734]:
            - row [ref=e735]:
              - columnheader "文档" [ref=e736]
              - columnheader "支持的操作" [ref=e737]
              - columnheader "当前范围" [ref=e738]
          - rowgroup [ref=e739]:
            - row [ref=e740]:
              - cell "Word" [ref=e741]
              - cell "字体与小数字号输入、正文排版、列表、表格、图片、页眉页脚、页码、查找替换、页面设置、撤销重做；导入与导出 DOCX" [ref=e742]
              - cell "支持内嵌图片与单节文档。修订、目录、浮动对象等复杂结构会提示暂不支持。" [ref=e743]
            - row [ref=e744]:
              - cell "Excel" [ref=e745]
              - cell "单元格与矩形选区、字体与小数字号输入、手动与自动行高/列宽、查找替换、边框与垂直对齐、清除格式、公式和跨表引用、格式、复制粘贴、工作表增删、行列插入删除、合并、冻结、排序、筛选、柱状图与折线图；导入与导出 XLSX" [ref=e746]
              - cell "10,000 行、256 列、32 张表、100,000 个已使用单元格。透视、宏、数组公式及复杂图表暂不支持。" [ref=e747]
            - row [ref=e748]:
              - cell "PDF" [ref=e749]
              - cell "分页与缩略图、缩放、旋转、全文查找、文字与高亮、矩形和手写批注、已有表单、撤销重做；导出 PDF" [ref=e750]
              - cell "批注和表单编辑。任意原始文字修改、原文重排及扫描件 OCR 暂不支持。" [ref=e751]
        - heading "组件接入" [level=2] [ref=e752]
        - paragraph [ref=e753]: UI 组件使用 Tiptap / ProseMirror 和公式计算库；文件适配使用 docx、ExcelJS、pdf-lib 与 PDF.js。本页无需文档服务器。宿主可以替换保存与导入导出回调，接入自己的文件系统。
        - paragraph [ref=e754]:
          - text: PDF 的 worker、字体与渲染由
          - code [ref=e755]: pdfRenderer
          - text: 提供。本页的适配代码位于
          - code [ref=e756]: docs/src/pages/collaboration/office-studio/
          - text: 。组件自 v0.4.0 起随
          - code [ref=e757]: "@zuvi/react"
          - text: 和 Registry 发布。
        - region "组件属性表，可横向滚动" [ref=e758]:
          - table [ref=e759]:
            - rowgroup [ref=e760]:
              - row [ref=e761]:
                - columnheader "属性名" [ref=e762]
                - columnheader "类型" [ref=e763]
                - columnheader "默认值" [ref=e764]
                - columnheader "说明" [ref=e765]
            - rowgroup [ref=e766]:
              - row [ref=e767]:
                - cell "value / defaultValue" [ref=e768]
                - cell [ref=e769]:
                  - code [ref=e770]: OfficeStudioDocument
                - cell [ref=e771]:
                  - code [ref=e772]: —
                - cell "受控文档或非受控初始文档；支持 Word、Excel、PDF 三种模型。" [ref=e773]
              - row [ref=e774]:
                - cell "onChange" [ref=e775]
                - cell [ref=e776]:
                  - code [ref=e777]: (document) => void
                - cell [ref=e778]:
                  - code [ref=e779]: —
                - cell "内容或文件名称变化。" [ref=e780]
              - row [ref=e781]:
                - cell "source / pdfRenderer" [ref=e782]
                - cell [ref=e783]:
                  - code [ref=e784]: Blob / StudioPdfRenderer
                - cell [ref=e785]:
                  - code [ref=e786]: —
                - cell "原始文件及 PDF 渲染适配；worker 资源由宿主管理。" [ref=e787]
              - row [ref=e788]:
                - cell "onSave / onExport / onPrint" [ref=e789]
                - cell [ref=e790]:
                  - code [ref=e791]: (document) => void | Promise<void>
                - cell [ref=e792]:
                  - code [ref=e793]: —
                - cell "宿主处理保存、导出或打印；返回后更新状态，失败可重试。" [ref=e794]
              - row [ref=e795]:
                - cell "onImport / onCreate" [ref=e796]
                - cell [ref=e797]:
                  - code [ref=e798]: (file | kind) => void | Promise<void>
                - cell [ref=e799]:
                  - code [ref=e800]: —
                - cell "宿主解析文件或创建模型，并更新受控值。" [ref=e801]
              - row [ref=e802]:
                - cell "readOnly / disabled" [ref=e803]
                - cell [ref=e804]:
                  - code [ref=e805]: boolean
                - cell [ref=e806]:
                  - code [ref=e807]: "false"
                - cell "只读预览或禁用编辑与文件操作。" [ref=e808]
              - row [ref=e809]:
                - cell "saveState" [ref=e810]
                - cell [ref=e811]:
                  - code [ref=e812]: "'saved' | 'saving' | 'unsaved' | 'error'"
                - cell [ref=e813]:
                  - code [ref=e814]: —
                - cell "宿主自动保存状态。" [ref=e815]
              - row [ref=e816]:
                - cell "height" [ref=e817]
                - cell [ref=e818]:
                  - code [ref=e819]: number | string
                - cell [ref=e820]:
                  - code [ref=e821]: "760"
                - cell "编辑器高度；100% 需要父容器设置确定高度。" [ref=e822]
              - row [ref=e823]:
                - cell "fullscreen / onFullscreenChange" [ref=e824]
                - cell [ref=e825]:
                  - code [ref=e826]: boolean / (value) => void
                - cell [ref=e827]:
                  - code [ref=e828]: —
                - cell "全屏布局，切换时编辑内容保持挂载。" [ref=e829]
              - row [ref=e830]:
                - cell "ref" [ref=e831]
                - cell [ref=e832]:
                  - code [ref=e833]: OfficeStudioHandle
                - cell [ref=e834]:
                  - code [ref=e835]: —
                - cell "getDocument()、save()、export()、print()、setFullscreen()。" [ref=e836]
              - row [ref=e837]:
                - cell "classNames" [ref=e838]
                - cell [ref=e839]:
                  - code [ref=e840]: "{ root?; header?; title?; actions?; stage?; status?; error? }"
                - cell [ref=e841]:
                  - code [ref=e842]: —
                - cell "追加语义结构类名，配合 data-part 与 CSS 变量定制。" [ref=e843]
  - text: ✓ ✓ ✓ ✓ ✓
  - dialog "段落设置" [ref=e846]:
    - generic [ref=e847]:
      - heading "段落设置" [level=2] [ref=e848]
      - button "关闭" [ref=e849] [cursor=pointer]
    - generic [ref=e853]:
      - generic [ref=e854]:
        - text: 对齐
        - generic [ref=e855]:
          - generic [ref=e856]: 段落对齐
          - button "段落对齐 左对齐" [ref=e857] [cursor=pointer]:
            - generic [ref=e858]: 左对齐
      - generic [ref=e859]:
        - generic [ref=e860]:
          - text: 左缩进（pt）
          - textbox "左缩进（pt）" [ref=e862]:
            - /placeholder: 混合（保持）
            - text: "0"
        - generic [ref=e863]:
          - text: 右缩进（pt）
          - textbox "右缩进（pt）" [ref=e865]:
            - /placeholder: 混合（保持）
            - text: "0"
        - generic [ref=e866]:
          - text: 段前（pt）
          - textbox "段前（pt）" [ref=e868]:
            - /placeholder: 混合（保持）
            - text: "0"
        - generic [ref=e869]:
          - text: 段后（pt）
          - textbox "段后（pt）" [ref=e871]:
            - /placeholder: 混合（保持）
            - text: "7.8"
      - generic [ref=e872]:
        - generic [ref=e873]:
          - text: 特殊缩进
          - generic [ref=e874]:
            - generic [ref=e875]: 特殊缩进
            - button "特殊缩进 无" [ref=e876] [cursor=pointer]:
              - generic [ref=e877]: 无
        - generic [ref=e878]:
          - text: 缩进量（pt）
          - textbox "特殊缩进量（pt）" [disabled] [ref=e880]: "0"
        - generic [ref=e881]:
          - text: 行距
          - generic [ref=e882]:
            - generic [ref=e883]: 行距类型
            - button "行距类型 倍数" [expanded] [active] [ref=e884] [cursor=pointer]:
              - generic [ref=e885]: 倍数
        - generic [ref=e886]:
          - text: 倍数值
          - textbox "行距量" [ref=e888]:
            - /placeholder: 混合（保持）
            - text: "1.75"
      - paragraph [ref=e889]: 空白或“保持原值”保留选区各自格式；修改只影响所选段落。
      - generic [ref=e890]:
        - generic [ref=e891]:
          - text: 孤行控制
          - generic [ref=e892]:
            - generic [ref=e893]: 孤行控制
            - button "孤行控制 开启" [ref=e894] [cursor=pointer]:
              - generic [ref=e895]: 开启
        - generic [ref=e896]:
          - text: 与下段同页
          - generic [ref=e897]:
            - generic [ref=e898]: 与下段同页
            - button "与下段同页 关闭" [ref=e899] [cursor=pointer]:
              - generic [ref=e900]: 关闭
        - generic [ref=e901]:
          - text: 段内不分页
          - generic [ref=e902]:
            - generic [ref=e903]: 段内不分页
            - button "段内不分页 关闭" [ref=e904] [cursor=pointer]:
              - generic [ref=e905]: 关闭
      - generic "段落预览" [ref=e906]:
        - paragraph [ref=e907]: 段落缩进与行距预览。第二行展示悬挂与段落间距。
    - generic [ref=e908]:
      - button "取消" [ref=e909] [cursor=pointer]
      - button "应用段落设置" [ref=e911] [cursor=pointer]
  - text: ✓ ✓
  - listbox [ref=e914]:
    - option "保持原值" [ref=e915] [cursor=pointer]
    - option "倍数 ✓" [selected] [ref=e916] [cursor=pointer]
    - option "固定值" [ref=e917] [cursor=pointer]
    - option "最小值" [ref=e918] [cursor=pointer]
  - text: ✓ ✓ ✓
```

# Test source

```ts
  1   | import { expect, test, type Locator, type Page } from '@playwright/test';
  2   | import { mkdir, readFile, writeFile } from 'node:fs/promises';
  3   | import path from 'node:path';
  4   | import {
  5   |   Document,
  6   |   Paragraph,
  7   |   TextRun,
  8   |   Packer,
  9   |   BorderStyle,
  10  |   ShadingType,
  11  |   Tab,
  12  | } from '../docs/node_modules/docx/dist/index.mjs';
  13  | import JSZip from '../docs/node_modules/jszip/lib/index.js';
  14  | 
  15  | const output = path.resolve('.release/office-continuation/paragraph-acceptance/browser');
  16  | const mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  17  | const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  18  | async function select(node: Locator) {
  19  |   await node.evaluate((element) => {
  20  |     (element.closest('[contenteditable="true"]') as HTMLElement).focus();
  21  |     const range = document.createRange();
  22  |     range.selectNodeContents(element);
  23  |     const selection = window.getSelection()!;
  24  |     selection.removeAllRanges();
  25  |     selection.addRange(range);
  26  |     document.dispatchEvent(new Event('selectionchange'));
  27  |   });
  28  | }
  29  | async function choose(page: Page, dialog: Locator, label: string, value: string) {
  30  |   await dialog.getByRole('button', { name: new RegExp(`^${label}`) }).click();
> 31  |   await page.getByRole('option', { name: value, exact: true }).click();
      |                                                                ^ Error: locator.click: Test timeout of 90000ms exceeded.
  32  | }
  33  | async function native(page: Page, bytes: Buffer) {
  34  |   const zip = await JSZip.loadAsync(bytes);
  35  |   const xml = await zip.file('word/document.xml')!.async('string');
  36  |   return page.evaluate(
  37  |     ({ xml, ns }) => {
  38  |       const document = new DOMParser().parseFromString(xml, 'application/xml');
  39  |       if (document.getElementsByTagName('parsererror').length)
  40  |         throw new Error('Invalid native DOCX XML');
  41  |       const attrs = (element: Element | undefined) =>
  42  |         Object.fromEntries(
  43  |           Array.from(element?.attributes ?? []).map((attribute) => [
  44  |             attribute.localName,
  45  |             attribute.value,
  46  |           ])
  47  |         );
  48  |       return Array.from(document.getElementsByTagNameNS(ns, 'p')).map((p) => {
  49  |         const first = (name: string) => p.getElementsByTagNameNS(ns, name)[0];
  50  |         const borders = first('pBdr');
  51  |         return {
  52  |           text: Array.from(p.getElementsByTagNameNS(ns, 't'))
  53  |             .map((t) => t.textContent)
  54  |             .join(''),
  55  |           align: first('jc')?.getAttributeNS(ns, 'val'),
  56  |           indent: attrs(first('ind')),
  57  |           spacing: attrs(first('spacing')),
  58  |           shading: attrs(first('shd')),
  59  |           borders: Object.fromEntries(
  60  |             Array.from(borders?.children ?? []).map((edge) => [edge.localName, attrs(edge)])
  61  |           ),
  62  |           tabs: Array.from(first('tabs')?.children ?? []).map(attrs),
  63  |           bold: Boolean(first('b')),
  64  |         };
  65  |       });
  66  |     },
  67  |     { xml, ns: W }
  68  |   );
  69  | }
  70  | 
  71  | test('original paragraph requirements retain four alignments, indent and line units, tab stops and every border edge over real DOCX reopens', async ({
  72  |   page,
  73  | }) => {
  74  |   test.setTimeout(90000);
  75  |   await mkdir(output, { recursive: true });
  76  |   const labels = [
  77  |     'Alignment left',
  78  |     'Alignment center',
  79  |     'Alignment right',
  80  |     'Alignment justify',
  81  |     'First indent',
  82  |     'Hanging indent',
  83  |     'Single spacing',
  84  |     'Multiple spacing',
  85  |     'Fixed spacing',
  86  |     'Minimum spacing',
  87  |     'Tabs',
  88  |     'Surface',
  89  |     'Cleared surface',
  90  |   ];
  91  |   const source = Buffer.from(
  92  |     await Packer.toArrayBuffer(
  93  |       new Document({
  94  |         sections: [
  95  |           {
  96  |             children: labels.map(
  97  |               (label) =>
  98  |                 new Paragraph({
  99  |                   ...(label === 'Cleared surface'
  100 |                     ? {
  101 |                         border: {
  102 |                           top: { style: BorderStyle.SINGLE, size: 8, space: 2, color: '112233' },
  103 |                           bottom: { style: BorderStyle.DOUBLE, size: 8 },
  104 |                           left: { style: BorderStyle.DOTTED, size: 8 },
  105 |                           right: { style: BorderStyle.DASHED, size: 8 },
  106 |                         },
  107 |                         shading: { type: ShadingType.CLEAR, fill: 'FFEECC' },
  108 |                       }
  109 |                     : {}),
  110 |                   children: [
  111 |                     new TextRun({ text: label, bold: true }),
  112 |                     ...(label === 'Tabs'
  113 |                       ? [
  114 |                           new TextRun({ children: [new Tab(), 'A'] }),
  115 |                           new TextRun({ children: [new Tab(), 'B'] }),
  116 |                           new TextRun({ children: [new Tab(), 'C'] }),
  117 |                           new TextRun({ children: [new Tab(), '12.34'] }),
  118 |                         ]
  119 |                       : []),
  120 |                   ],
  121 |                 })
  122 |             ),
  123 |           },
  124 |         ],
  125 |       })
  126 |     )
  127 |   );
  128 |   await writeFile(path.join(output, 'source.docx'), source);
  129 |   const load = async (bytes: Buffer, name: string) => {
  130 |     await page
  131 |       .getByLabel('导入文档文件', { exact: true })
```