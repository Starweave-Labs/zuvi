# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-word-cell-properties.spec.ts >> keeps native exact row height with explicit cell padding while editing and reopening twice
- Location: e2e/office-studio-word-cell-properties.spec.ts:5:1

# Error details

```
Error: expect(received).toBeGreaterThanOrEqual(expected)

Expected: >= 31
Received:    0
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
                - button "打开本地文档 Cell.docx" [ref=e356] [cursor=pointer]:
                  - generic [ref=e357]: Cell.docx
              - button "历史版本" [ref=e358] [cursor=pointer]
              - switch "只读预览" [ref=e360] [cursor=pointer]
            - region "Word 文档编辑器" [ref=e364]:
              - generic [ref=e365]:
                - generic [ref=e366]:
                  - generic [ref=e371]: Word
                  - generic "可编辑 · ⌘ / Ctrl S 保存" [ref=e372]:
                    - status "已保存" [ref=e373]
                - textbox "文档名称" [ref=e378]: Cell.docx
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
                          - button "剪切" [disabled] [ref=e440]
                          - button "复制" [disabled] [ref=e449]
                    - button "格式刷" [disabled] [ref=e456]
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
                          - button "粗体" [ref=e502] [cursor=pointer]
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
                      - generic [aria-hidden] [ref=e673]: "16"
                      - generic [aria-hidden] [ref=e674]: "17"
                      - slider "首行缩进标尺" [ref=e675] [cursor=pointer]
                      - slider "悬挂缩进标尺" [ref=e677] [cursor=pointer]
                      - slider "左缩进标尺" [ref=e679] [cursor=pointer]
                      - slider "右缩进标尺" [ref=e681] [cursor=pointer]
                    - generic [ref=e683]:
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
                      - article "文档纸张" [ref=e684]:
                        - region "页眉区域" [ref=e685]
                        - textbox "Word 文档正文" [ref=e687]:
                          - table [ref=e689]:
                            - rowgroup [ref=e692]:
                              - row [ref=e693]:
                                - cell [ref=e694]:
                                  - paragraph [ref=e696]: Cell content
                        - region "页脚区域" [ref=e697]
                - generic [ref=e698]:
                  - generic [ref=e699]: 11 字 · A4 · 纵向
                  - generic [ref=e700]:
                    - generic [ref=e701]: 缩放
                    - generic [ref=e702]:
                      - generic [ref=e703]: Word 缩放
                      - button "Word 缩放 适应宽度" [ref=e704] [cursor=pointer]:
                        - generic [ref=e705]: 适应宽度
            - paragraph [ref=e706]: 文件保存在当前浏览器的本地文档空间。需要长期留存时，请导出文件。
          - group [ref=e707]:
            - generic "示例代码" [ref=e708] [cursor=pointer]:
              - generic [aria-hidden] [ref=e709]: </>
              - text: 示例代码
              - generic [aria-hidden] [ref=e710]: 展开 / 收起
        - heading "编辑能力" [level=2] [ref=e711]
        - table [ref=e713]:
          - rowgroup [ref=e714]:
            - row [ref=e715]:
              - columnheader "文档" [ref=e716]
              - columnheader "支持的操作" [ref=e717]
              - columnheader "当前范围" [ref=e718]
          - rowgroup [ref=e719]:
            - row [ref=e720]:
              - cell "Word" [ref=e721]
              - cell "字体与小数字号输入、正文排版、列表、表格、图片、页眉页脚、页码、查找替换、页面设置、撤销重做；导入与导出 DOCX" [ref=e722]
              - cell "支持内嵌图片与单节文档。修订、目录、浮动对象等复杂结构会提示暂不支持。" [ref=e723]
            - row [ref=e724]:
              - cell "Excel" [ref=e725]
              - cell "单元格与矩形选区、字体与小数字号输入、手动与自动行高/列宽、查找替换、边框与垂直对齐、清除格式、公式和跨表引用、格式、复制粘贴、工作表增删、行列插入删除、合并、冻结、排序、筛选、柱状图与折线图；导入与导出 XLSX" [ref=e726]
              - cell "10,000 行、256 列、32 张表、100,000 个已使用单元格。透视、宏、数组公式及复杂图表暂不支持。" [ref=e727]
            - row [ref=e728]:
              - cell "PDF" [ref=e729]
              - cell "分页与缩略图、缩放、旋转、全文查找、文字与高亮、矩形和手写批注、已有表单、撤销重做；导出 PDF" [ref=e730]
              - cell "批注和表单编辑。任意原始文字修改、原文重排及扫描件 OCR 暂不支持。" [ref=e731]
        - heading "组件接入" [level=2] [ref=e732]
        - paragraph [ref=e733]: UI 组件使用 Tiptap / ProseMirror 和公式计算库；文件适配使用 docx、ExcelJS、pdf-lib 与 PDF.js。本页无需文档服务器。宿主可以替换保存与导入导出回调，接入自己的文件系统。
        - paragraph [ref=e734]:
          - text: PDF 的 worker、字体与渲染由
          - code [ref=e735]: pdfRenderer
          - text: 提供。本页的适配代码位于
          - code [ref=e736]: docs/src/pages/collaboration/office-studio/
          - text: 。组件自 v0.4.0 起随
          - code [ref=e737]: "@zuvi/react"
          - text: 和 Registry 发布。
        - region "组件属性表，可横向滚动" [ref=e738]:
          - table [ref=e739]:
            - rowgroup [ref=e740]:
              - row [ref=e741]:
                - columnheader "属性名" [ref=e742]
                - columnheader "类型" [ref=e743]
                - columnheader "默认值" [ref=e744]
                - columnheader "说明" [ref=e745]
            - rowgroup [ref=e746]:
              - row [ref=e747]:
                - cell "value / defaultValue" [ref=e748]
                - cell [ref=e749]:
                  - code [ref=e750]: OfficeStudioDocument
                - cell [ref=e751]:
                  - code [ref=e752]: —
                - cell "受控文档或非受控初始文档；支持 Word、Excel、PDF 三种模型。" [ref=e753]
              - row [ref=e754]:
                - cell "onChange" [ref=e755]
                - cell [ref=e756]:
                  - code [ref=e757]: (document) => void
                - cell [ref=e758]:
                  - code [ref=e759]: —
                - cell "内容或文件名称变化。" [ref=e760]
              - row [ref=e761]:
                - cell "source / pdfRenderer" [ref=e762]
                - cell [ref=e763]:
                  - code [ref=e764]: Blob / StudioPdfRenderer
                - cell [ref=e765]:
                  - code [ref=e766]: —
                - cell "原始文件及 PDF 渲染适配；worker 资源由宿主管理。" [ref=e767]
              - row [ref=e768]:
                - cell "onSave / onExport / onPrint" [ref=e769]
                - cell [ref=e770]:
                  - code [ref=e771]: (document) => void | Promise<void>
                - cell [ref=e772]:
                  - code [ref=e773]: —
                - cell "宿主处理保存、导出或打印；返回后更新状态，失败可重试。" [ref=e774]
              - row [ref=e775]:
                - cell "onImport / onCreate" [ref=e776]
                - cell [ref=e777]:
                  - code [ref=e778]: (file | kind) => void | Promise<void>
                - cell [ref=e779]:
                  - code [ref=e780]: —
                - cell "宿主解析文件或创建模型，并更新受控值。" [ref=e781]
              - row [ref=e782]:
                - cell "readOnly / disabled" [ref=e783]
                - cell [ref=e784]:
                  - code [ref=e785]: boolean
                - cell [ref=e786]:
                  - code [ref=e787]: "false"
                - cell "只读预览或禁用编辑与文件操作。" [ref=e788]
              - row [ref=e789]:
                - cell "saveState" [ref=e790]
                - cell [ref=e791]:
                  - code [ref=e792]: "'saved' | 'saving' | 'unsaved' | 'error'"
                - cell [ref=e793]:
                  - code [ref=e794]: —
                - cell "宿主自动保存状态。" [ref=e795]
              - row [ref=e796]:
                - cell "height" [ref=e797]
                - cell [ref=e798]:
                  - code [ref=e799]: number | string
                - cell [ref=e800]:
                  - code [ref=e801]: "760"
                - cell "编辑器高度；100% 需要父容器设置确定高度。" [ref=e802]
              - row [ref=e803]:
                - cell "fullscreen / onFullscreenChange" [ref=e804]
                - cell [ref=e805]:
                  - code [ref=e806]: boolean / (value) => void
                - cell [ref=e807]:
                  - code [ref=e808]: —
                - cell "全屏布局，切换时编辑内容保持挂载。" [ref=e809]
              - row [ref=e810]:
                - cell "ref" [ref=e811]
                - cell [ref=e812]:
                  - code [ref=e813]: OfficeStudioHandle
                - cell [ref=e814]:
                  - code [ref=e815]: —
                - cell "getDocument()、save()、export()、print()、setFullscreen()。" [ref=e816]
              - row [ref=e817]:
                - cell "classNames" [ref=e818]
                - cell [ref=e819]:
                  - code [ref=e820]: "{ root?; header?; title?; actions?; stage?; status?; error? }"
                - cell [ref=e821]:
                  - code [ref=e822]: —
                - cell "追加语义结构类名，配合 data-part 与 CSS 变量定制。" [ref=e823]
  - text: ✓ ✓ ✓ ✓ ✓
```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test';
  2   | import { mkdir, readFile, writeFile } from 'node:fs/promises';
  3   | import path from 'node:path';
  4   | import JSZip from '../docs/node_modules/jszip/lib/index.js';
  5   | test('keeps native exact row height with explicit cell padding while editing and reopening twice', async ({ page, context }) => {
  6   |   const audit = path.resolve('docs/audits/2026-11-26/word-cell-properties');
  7   |   await mkdir(audit, { recursive: true });
  8   |   const zip = await JSZip.loadAsync(await readFile('docs/audits/2026-11-26/word-math-groups/math-source.docx'));
  9   |   const xml = await zip.file('word/document.xml')!.async('string');
  10  |   const table = '<w:tbl><w:tblGrid><w:gridCol w:w="6000"/></w:tblGrid><w:tr><w:trPr><w:trHeight w:val="480" w:hRule="exact"/></w:trPr><w:tc><w:tcPr><w:vAlign w:val="bottom"/><w:tcMar><w:top w:w="0" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/></w:tcMar></w:tcPr><w:p><w:r><w:t>Cell content</w:t></w:r></w:p></w:tc></w:tr></w:tbl>';
  11  |   zip.file('word/document.xml', xml.replace(/<w:body>[\s\S]*?(<w:sectPr[\s\S]*?<\/w:sectPr>)<\/w:body>/, `<w:body>${table}$1</w:body>`));
  12  |   const source = await zip.generateAsync({ type: 'nodebuffer' });
  13  |   await writeFile(path.join(audit, 'cell-source.docx'), source);
  14  |   await page.goto('/#/components/office-studio');
  15  |   const importFile = (buffer: Buffer, name: string) => page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer });
  16  |   await importFile(source, 'Cell.docx');
  17  |   const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  18  |   const cell = body.locator('td').first();
  19  |   const check = async () => {
  20  |     await expect(cell).toBeVisible();
  21  |     const metrics = await cell.evaluate(element => {
  22  |       const wrapper = element.querySelector<HTMLElement>('[data-word-cell-content]')!;
  23  |       return { height: element.getBoundingClientRect().height, top: getComputedStyle(wrapper).paddingTop, bottom: getComputedStyle(wrapper).paddingBottom };
  24  |     });
> 25  |     expect(metrics.height).toBeGreaterThanOrEqual(31); expect(metrics.height).toBeLessThanOrEqual(33);
      |                            ^ Error: expect(received).toBeGreaterThanOrEqual(expected)
  26  |     expect(metrics.top).toBe('0px'); expect(parseFloat(metrics.bottom)).toBeCloseTo(20 / 3, 1);
  27  |   };
  28  |   await check();
  29  |   await cell.locator('p').click();
  30  |   await page.getByRole('tab', { name: '插入', exact: true }).click();
  31  |   await page.getByRole('button', { name: '单元格对齐与边距', exact: true }).click();
  32  |   await page.getByRole('button', { name: '下右对齐', exact: true }).click();
  33  |   await page.getByRole('textbox', { name: '单元格left内边距', exact: true }).fill('5.25');
  34  |   await page.getByRole('button', { name: '应用单元格属性', exact: true }).click();
  35  |   await check();
  36  |   for (let round = 1; round <= 2; round++) {
  37  |     const pending = page.waitForEvent('download');
  38  |     await page.getByRole('button', { name: '导出文件', exact: true }).click();
  39  |     const bytes = await readFile((await (await pending).path())!);
  40  |     await writeFile(path.join(audit, `cell-round-${round}.docx`), bytes);
  41  |     await importFile(bytes, `Cell-round-${round}.docx`);
  42  |     await check();
  43  |     await expect(cell).toHaveCSS('padding-left', '7px');
  44  |   }
  45  |   await page.evaluate(() => window.addEventListener('message', event => {
  46  |     if (event.data?.type === 'cell-print') (window as Window & { cellPrint?: string }).cellPrint = event.data.html;
  47  |   }));
  48  |   await page.addInitScript(() => { window.print = () => {
  49  |     window.parent.postMessage({ type: 'cell-print', html: document.documentElement.outerHTML }, '*');
  50  |     window.dispatchEvent(new Event('afterprint'));
  51  |   }; });
  52  |   await page.getByRole('button', { name: '打印', exact: true }).click();
  53  |   await expect.poll(() => page.evaluate(() => (window as Window & { cellPrint?: string }).cellPrint)).toBeTruthy();
  54  |   const html = await page.evaluate(() => (window as Window & { cellPrint?: string }).cellPrint!);
  55  |   const preview = await context.newPage();
  56  |   await preview.setContent(html); await preview.evaluate(() => document.fonts.ready);
  57  |   const printed = await preview.locator('td').first().evaluate(element => {
  58  |     const wrapper = element.querySelector<HTMLElement>('[data-word-cell-content]')!;
  59  |     return { height: element.getBoundingClientRect().height, top: getComputedStyle(wrapper).paddingTop, bottom: getComputedStyle(wrapper).paddingBottom };
  60  |   });
  61  |   expect(printed.height).toBeGreaterThanOrEqual(31); expect(printed.height).toBeLessThanOrEqual(33);
  62  |   expect(printed.top).toBe('0px'); expect(parseFloat(printed.bottom)).toBeCloseTo(20 / 3, 1);
  63  |   await preview.pdf({ path: path.join(audit, 'cell-fixed-print.pdf'), preferCSSPageSize: true, printBackground: true });
  64  |   await writeFile(path.join(audit, 'cell-fixed-print-metrics.json'), JSON.stringify(printed, null, 2) + '\n');
  65  |   await preview.close();
  66  |   await page.screenshot({ path: path.join(audit, 'cell-fixed-light.png'), fullPage: true });
  67  |   await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  68  |   await page.screenshot({ path: path.join(audit, 'cell-fixed-dark.png'), fullPage: true });
  69  |   await page.setViewportSize({ width: 320, height: 720 });
  70  |   await page.screenshot({ path: path.join(audit, 'cell-fixed-320.png'), fullPage: true });
  71  | 
  72  | });
  73  | 
  74  | test('moves actual text through all nine fixed-cell alignments and restores the transaction', async ({ page }) => {
  75  |   const audit = path.resolve('docs/audits/2026-11-26/word-cell-properties');
  76  |   const zip = await JSZip.loadAsync(await readFile(path.join(audit, 'cell-source.docx')));
  77  |   zip.file('word/document.xml', (await zip.file('word/document.xml')!.async('string')).replace('w:val="480" w:hRule="exact"', 'w:val="1440" w:hRule="exact"'));
  78  |   await page.goto('/#/components/office-studio');
  79  |   await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name: 'Alignment.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: await zip.generateAsync({ type: 'nodebuffer' }) });
  80  |   const cell = page.getByRole('textbox', { name: 'Word 文档正文', exact: true }).locator('td').first();
  81  |   await expect(cell).toBeVisible();
  82  |   const metrics = () => cell.evaluate(element => {
  83  |     const wrapper = element.querySelector<HTMLElement>('[data-word-cell-content]')!;
  84  |     const paragraph = wrapper.querySelector('p')!;
  85  |     const text = paragraph.firstChild!;
  86  |     const range = document.createRange(); range.selectNodeContents(text);
  87  |     const r = range.getBoundingClientRect(), w = wrapper.getBoundingClientRect();
  88  |     return { top: r.top - w.top, left: r.left - w.left, height: element.getBoundingClientRect().height, align: getComputedStyle(paragraph).textAlign };
  89  |   });
  90  |   const samples: Record<string, Awaited<ReturnType<typeof metrics>>> = {};
  91  |   for (const vertical of ['上', '中', '下']) {
  92  |     for (const horizontal of ['左', '中', '右']) {
  93  |       await cell.locator('p').click();
  94  |       await page.getByRole('tab', { name: '插入', exact: true }).click();
  95  |       await page.getByRole('button', { name: '单元格对齐与边距', exact: true }).click();
  96  |       await page.getByRole('button', { name: `${vertical}${horizontal}对齐`, exact: true }).click();
  97  |       await page.getByRole('button', { name: '应用单元格属性', exact: true }).click();
  98  |       const sample = await metrics(); samples[`${vertical}${horizontal}`] = sample;
  99  |       expect(sample.height).toBeGreaterThanOrEqual(95); expect(sample.height).toBeLessThanOrEqual(97);
  100 |       expect(sample.align).toBe(horizontal === '左' ? 'left' : horizontal === '中' ? 'center' : 'right');
  101 |     }
  102 |   }
  103 |   for (const horizontal of ['左', '中', '右']) {
  104 |     expect(samples[`中${horizontal}`].top - samples[`上${horizontal}`].top).toBeGreaterThan(20);
  105 |     expect(samples[`下${horizontal}`].top - samples[`中${horizontal}`].top).toBeGreaterThan(20);
  106 |   }
  107 |   for (const vertical of ['上', '中', '下']) {
  108 |     expect(samples[`${vertical}中`].left - samples[`${vertical}左`].left).toBeGreaterThan(50);
  109 |     expect(samples[`${vertical}右`].left - samples[`${vertical}中`].left).toBeGreaterThan(50);
  110 |   }
  111 |   await page.getByRole('tab', { name: '开始', exact: true }).click();
  112 |   await page.getByRole('button', { name: '撤销', exact: true }).click();
  113 |   expect((await metrics()).align).toBe('center');
  114 |   await page.getByRole('button', { name: '重做', exact: true }).click();
  115 |   expect((await metrics()).align).toBe('right');
  116 |   await writeFile(path.join(audit, 'cell-nine-alignments.json'), JSON.stringify(samples, null, 2) + '\n');
  117 |   await page.screenshot({ path: path.join(audit, 'cell-nine-alignments-light.png'), fullPage: true });
  118 | });
  119 | 
```