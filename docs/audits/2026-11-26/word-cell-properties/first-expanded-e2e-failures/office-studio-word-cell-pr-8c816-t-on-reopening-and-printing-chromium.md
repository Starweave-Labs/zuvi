# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-word-cell-properties.spec.ts >> keeps nested fixed-cell alignment and margins local while preserving native layout on reopening and printing
- Location: e2e/office-studio-word-cell-properties.spec.ts:219:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "flex-start"
Received: "flow-start"
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
                - button "打开本地文档 Nested.docx" [ref=e356] [cursor=pointer]:
                  - generic [ref=e357]: Nested.docx
              - button "历史版本" [ref=e358] [cursor=pointer]
              - switch "只读预览" [ref=e360] [cursor=pointer]
            - region "Word 文档编辑器" [ref=e364]:
              - generic [ref=e365]:
                - generic [ref=e366]:
                  - generic [ref=e371]: Word
                  - generic "可编辑 · ⌘ / Ctrl S 保存" [ref=e372]:
                    - status "已保存" [ref=e373]
                - textbox "文档名称" [ref=e378]: Nested.docx
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
                                  - generic [ref=e695]:
                                    - paragraph [ref=e696]: Outer content
                                    - table [ref=e698]:
                                      - rowgroup [ref=e701]:
                                        - row [ref=e702]:
                                          - cell [ref=e703]:
                                            - paragraph [ref=e705]: Inner content
                                    - paragraph [ref=e706]
                        - region "页脚区域" [ref=e707]
                - generic [ref=e708]:
                  - generic [ref=e709]: 24 字 · A4 · 纵向
                  - generic [ref=e710]:
                    - generic [ref=e711]: 缩放
                    - generic [ref=e712]:
                      - generic [ref=e713]: Word 缩放
                      - button "Word 缩放 适应宽度" [ref=e714] [cursor=pointer]:
                        - generic [ref=e715]: 适应宽度
            - paragraph [ref=e716]: 文件保存在当前浏览器的本地文档空间。需要长期留存时，请导出文件。
          - group [ref=e717]:
            - generic "示例代码" [ref=e718] [cursor=pointer]:
              - generic [aria-hidden] [ref=e719]: </>
              - text: 示例代码
              - generic [aria-hidden] [ref=e720]: 展开 / 收起
        - heading "编辑能力" [level=2] [ref=e721]
        - table [ref=e723]:
          - rowgroup [ref=e724]:
            - row [ref=e725]:
              - columnheader "文档" [ref=e726]
              - columnheader "支持的操作" [ref=e727]
              - columnheader "当前范围" [ref=e728]
          - rowgroup [ref=e729]:
            - row [ref=e730]:
              - cell "Word" [ref=e731]
              - cell "字体与小数字号输入、正文排版、列表、表格、图片、页眉页脚、页码、查找替换、页面设置、撤销重做；导入与导出 DOCX" [ref=e732]
              - cell "支持内嵌图片与单节文档。修订、目录、浮动对象等复杂结构会提示暂不支持。" [ref=e733]
            - row [ref=e734]:
              - cell "Excel" [ref=e735]
              - cell "单元格与矩形选区、字体与小数字号输入、手动与自动行高/列宽、查找替换、边框与垂直对齐、清除格式、公式和跨表引用、格式、复制粘贴、工作表增删、行列插入删除、合并、冻结、排序、筛选、柱状图与折线图；导入与导出 XLSX" [ref=e736]
              - cell "10,000 行、256 列、32 张表、100,000 个已使用单元格。透视、宏、数组公式及复杂图表暂不支持。" [ref=e737]
            - row [ref=e738]:
              - cell "PDF" [ref=e739]
              - cell "分页与缩略图、缩放、旋转、全文查找、文字与高亮、矩形和手写批注、已有表单、撤销重做；导出 PDF" [ref=e740]
              - cell "批注和表单编辑。任意原始文字修改、原文重排及扫描件 OCR 暂不支持。" [ref=e741]
        - heading "组件接入" [level=2] [ref=e742]
        - paragraph [ref=e743]: UI 组件使用 Tiptap / ProseMirror 和公式计算库；文件适配使用 docx、ExcelJS、pdf-lib 与 PDF.js。本页无需文档服务器。宿主可以替换保存与导入导出回调，接入自己的文件系统。
        - paragraph [ref=e744]:
          - text: PDF 的 worker、字体与渲染由
          - code [ref=e745]: pdfRenderer
          - text: 提供。本页的适配代码位于
          - code [ref=e746]: docs/src/pages/collaboration/office-studio/
          - text: 。组件自 v0.4.0 起随
          - code [ref=e747]: "@zuvi/react"
          - text: 和 Registry 发布。
        - region "组件属性表，可横向滚动" [ref=e748]:
          - table [ref=e749]:
            - rowgroup [ref=e750]:
              - row [ref=e751]:
                - columnheader "属性名" [ref=e752]
                - columnheader "类型" [ref=e753]
                - columnheader "默认值" [ref=e754]
                - columnheader "说明" [ref=e755]
            - rowgroup [ref=e756]:
              - row [ref=e757]:
                - cell "value / defaultValue" [ref=e758]
                - cell [ref=e759]:
                  - code [ref=e760]: OfficeStudioDocument
                - cell [ref=e761]:
                  - code [ref=e762]: —
                - cell "受控文档或非受控初始文档；支持 Word、Excel、PDF 三种模型。" [ref=e763]
              - row [ref=e764]:
                - cell "onChange" [ref=e765]
                - cell [ref=e766]:
                  - code [ref=e767]: (document) => void
                - cell [ref=e768]:
                  - code [ref=e769]: —
                - cell "内容或文件名称变化。" [ref=e770]
              - row [ref=e771]:
                - cell "source / pdfRenderer" [ref=e772]
                - cell [ref=e773]:
                  - code [ref=e774]: Blob / StudioPdfRenderer
                - cell [ref=e775]:
                  - code [ref=e776]: —
                - cell "原始文件及 PDF 渲染适配；worker 资源由宿主管理。" [ref=e777]
              - row [ref=e778]:
                - cell "onSave / onExport / onPrint" [ref=e779]
                - cell [ref=e780]:
                  - code [ref=e781]: (document) => void | Promise<void>
                - cell [ref=e782]:
                  - code [ref=e783]: —
                - cell "宿主处理保存、导出或打印；返回后更新状态，失败可重试。" [ref=e784]
              - row [ref=e785]:
                - cell "onImport / onCreate" [ref=e786]
                - cell [ref=e787]:
                  - code [ref=e788]: (file | kind) => void | Promise<void>
                - cell [ref=e789]:
                  - code [ref=e790]: —
                - cell "宿主解析文件或创建模型，并更新受控值。" [ref=e791]
              - row [ref=e792]:
                - cell "readOnly / disabled" [ref=e793]
                - cell [ref=e794]:
                  - code [ref=e795]: boolean
                - cell [ref=e796]:
                  - code [ref=e797]: "false"
                - cell "只读预览或禁用编辑与文件操作。" [ref=e798]
              - row [ref=e799]:
                - cell "saveState" [ref=e800]
                - cell [ref=e801]:
                  - code [ref=e802]: "'saved' | 'saving' | 'unsaved' | 'error'"
                - cell [ref=e803]:
                  - code [ref=e804]: —
                - cell "宿主自动保存状态。" [ref=e805]
              - row [ref=e806]:
                - cell "height" [ref=e807]
                - cell [ref=e808]:
                  - code [ref=e809]: number | string
                - cell [ref=e810]:
                  - code [ref=e811]: "760"
                - cell "编辑器高度；100% 需要父容器设置确定高度。" [ref=e812]
              - row [ref=e813]:
                - cell "fullscreen / onFullscreenChange" [ref=e814]
                - cell [ref=e815]:
                  - code [ref=e816]: boolean / (value) => void
                - cell [ref=e817]:
                  - code [ref=e818]: —
                - cell "全屏布局，切换时编辑内容保持挂载。" [ref=e819]
              - row [ref=e820]:
                - cell "ref" [ref=e821]
                - cell [ref=e822]:
                  - code [ref=e823]: OfficeStudioHandle
                - cell [ref=e824]:
                  - code [ref=e825]: —
                - cell "getDocument()、save()、export()、print()、setFullscreen()。" [ref=e826]
              - row [ref=e827]:
                - cell "classNames" [ref=e828]
                - cell [ref=e829]:
                  - code [ref=e830]: "{ root?; header?; title?; actions?; stage?; status?; error? }"
                - cell [ref=e831]:
                  - code [ref=e832]: —
                - cell "追加语义结构类名，配合 data-part 与 CSS 变量定制。" [ref=e833]
  - text: ✓ ✓ ✓ ✓ ✓
```

# Test source

```ts
  138 | 
  139 | test('edits table defaults and spacing without materializing direct margins, restores inheritance and reopens twice', async ({ page, context }) => {
  140 |   const audit = path.resolve('docs/audits/2026-11-26/word-cell-properties');
  141 |   const cellXml = (text: string, direct = '') => `<w:tc><w:tcPr>${direct}</w:tcPr><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:tc>`;
  142 |   const source = await tableFile(`<w:tbl><w:tblPr><w:tblCellSpacing w:w="60" w:type="dxa"/><w:tblCellMar><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="4500"/><w:gridCol w:w="4500"/></w:tblGrid><w:tr>${cellXml('Direct', '<w:tcMar><w:top w:w="0" w:type="dxa"/><w:right w:w="165" w:type="dxa"/></w:tcMar>')}${cellXml('Inherited')}</w:tr><w:tr>${cellXml('Second row')}${cellXml('Last')}</w:tr></w:tbl>`);
  143 |   await writeFile(path.join(audit, 'cell-defaults-source.docx'), source);
  144 |   await page.goto('/#/components/office-studio');
  145 |   const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  146 |   const table = body.locator('table').first(), cells = table.locator(':scope > tbody > tr > td');
  147 |   const upload = async (bytes: Buffer, name: string) => {
  148 |     await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: bytes });
  149 |     await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
  150 |     await expect(cells.first()).toContainText('Direct');
  151 |     await expect(table).toHaveAttribute('data-word-cell-spacing', '6');
  152 |   };
  153 |   await upload(source, 'Defaults.docx');
  154 |   const measure = () => table.evaluate(element => {
  155 |     const cells = element.querySelectorAll<HTMLTableCellElement>(':scope > tbody > tr > td');
  156 |     const rect = element.getBoundingClientRect(), scale = rect.width / (element as HTMLElement).offsetWidth;
  157 |     return { width: (element as HTMLElement).offsetWidth, gap: (cells[1].getBoundingClientRect().left - cells[0].getBoundingClientRect().right) / scale, top0: getComputedStyle(cells[0]).paddingTop, top1: getComputedStyle(cells[1]).paddingTop, left1: getComputedStyle(cells[1]).paddingLeft, right0: getComputedStyle(cells[0]).paddingRight };
  158 |   });
  159 |   const initial = await measure(); expect(initial.width).toBe(600); expect(initial.gap).toBeCloseTo(8, 1); expect(initial.top0).toBe('0px'); expect(initial.top1).toBe('8px');
  160 |   const open = async () => {
  161 |     await cells.first().locator('p').click();
  162 |     await page.getByRole('tab', { name: '插入', exact: true }).click();
  163 |     await page.getByRole('button', { name: '单元格对齐与边距', exact: true }).click();
  164 |   };
  165 |   await open();
  166 |   await page.getByRole('textbox', { name: '单元格间距', exact: true }).fill('1.01');
  167 |   await page.getByRole('button', { name: '应用单元格属性', exact: true }).click();
  168 |   await expect(page.getByRole('alert')).toContainText('精度'); expect(await measure()).toEqual(initial);
  169 |   await page.getByRole('button', { name: '取消', exact: true }).click();
  170 |   await open(); await page.getByRole('textbox', { name: '表格默认top内边距', exact: true }).fill('20');
  171 |   await page.getByRole('button', { name: '取消', exact: true }).click(); expect(await measure()).toEqual(initial);
  172 |   await open();
  173 |   await page.getByRole('button', { name: '中中对齐', exact: true }).click();
  174 |   await page.getByRole('textbox', { name: '表格默认top内边距', exact: true }).fill('12');
  175 |   await page.getByRole('textbox', { name: '表格默认left内边距', exact: true }).fill('10');
  176 |   await page.getByRole('textbox', { name: '单元格间距', exact: true }).fill('12');
  177 |   await page.getByRole('button', { name: '应用单元格属性', exact: true }).click();
  178 |   const changed = await measure(); expect(changed.width).toBe(624); expect(changed.gap).toBeCloseTo(16, 1); expect(changed.top0).toBe('0px'); expect(changed.top1).toBe('16px'); expect(parseFloat(changed.left1)).toBeCloseTo(40 / 3, 1); expect(changed.right0).toBe('11px');
  179 |   await page.getByRole('tab', { name: '开始', exact: true }).click();
  180 |   await page.getByRole('button', { name: '撤销', exact: true }).click(); expect(await measure()).toEqual(initial);
  181 |   await page.getByRole('button', { name: '重做', exact: true }).click(); expect(await measure()).toEqual(changed);
  182 |   for (let round = 1; round <= 2; round++) {
  183 |     const pending = page.waitForEvent('download'); await page.getByRole('button', { name: '导出文件', exact: true }).click();
  184 |     const bytes = await readFile((await (await pending).path())!); await writeFile(path.join(audit, `cell-defaults-round-${round}.docx`), bytes);
  185 |     const xml = await (await JSZip.loadAsync(bytes)).file('word/document.xml')!.async('string');
  186 |     expect(xml).toMatch(/<w:tblCellSpacing[^>]*w:w="120"/); expect(xml.match(/<w:tcMar>/g)).toHaveLength(1); expect(xml).toMatch(/<w:gridCol[^>]*w:w="4680"/);
  187 |     await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name: `Defaults-${round}.docx`, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: bytes });
  188 |     await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(`Defaults-${round}.docx`);
  189 |     await expect(table).toHaveAttribute('data-word-cell-spacing', '12'); expect(await measure()).toEqual(changed);
  190 |   }
  191 |   await open(); await page.getByRole('button', { name: '恢复表格默认边距', exact: true }).click();
  192 |   await page.getByRole('button', { name: '取消', exact: true }).click(); expect(await measure()).toEqual(changed);
  193 |   await open(); await page.getByRole('button', { name: '恢复表格默认边距', exact: true }).click();
  194 |   await page.getByRole('button', { name: '应用单元格属性', exact: true }).click();
  195 |   await expect(cells.first()).not.toHaveAttribute('data-word-cell-margins'); expect((await measure()).top0).toBe('16px');
  196 |   await page.getByRole('tab', { name: '开始', exact: true }).click(); await page.getByRole('button', { name: '撤销', exact: true }).click(); expect(await measure()).toEqual(changed);
  197 |   await page.getByRole('button', { name: '重做', exact: true }).click();
  198 |   await page.screenshot({ path: path.join(audit, 'cell-defaults-light.png'), fullPage: true });
  199 |   await open(); await page.screenshot({ path: path.join(audit, 'cell-dialog-light.png'), fullPage: true });
  200 |   await page.getByRole('button', { name: '取消', exact: true }).click();
  201 |   await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  202 |   await open(); await page.screenshot({ path: path.join(audit, 'cell-dialog-dark.png'), fullPage: true });
  203 |   await page.setViewportSize({ width: 320, height: 720 });
  204 |   const dialog = page.getByRole('dialog'); const box = await dialog.boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  205 |   await page.screenshot({ path: path.join(audit, 'cell-dialog-320.png'), fullPage: true });
  206 |   await page.getByRole('button', { name: '取消', exact: true }).click();
  207 |   await page.setViewportSize({ width: 1280, height: 800 });
  208 |   await page.evaluate(() => window.addEventListener('message', event => { if (event.data?.type === 'cell-default-print') (window as Window & { cellDefaultPrint?: string }).cellDefaultPrint = event.data.html; }));
  209 |   await page.addInitScript(() => { window.print = () => { window.parent.postMessage({ type: 'cell-default-print', html: document.documentElement.outerHTML }, '*'); window.dispatchEvent(new Event('afterprint')); }; });
  210 |   await page.getByRole('button', { name: '打印', exact: true }).click();
  211 |   await expect.poll(() => page.evaluate(() => (window as Window & { cellDefaultPrint?: string }).cellDefaultPrint)).toBeTruthy();
  212 |   const preview = await context.newPage(); await preview.setContent(await page.evaluate(() => (window as Window & { cellDefaultPrint?: string }).cellDefaultPrint!)); await preview.evaluate(() => document.fonts.ready);
  213 |   const printed = await preview.locator('table').first().evaluate(element => ({ width: (element as HTMLElement).offsetWidth, gap: parseFloat(getComputedStyle(element).borderSpacing), top: getComputedStyle(element.querySelector('td')!).paddingTop }));
  214 |   expect(printed.width).toBe(624); expect(printed.gap).toBe(16); expect(printed.top).toBe('16px');
  215 |   await preview.pdf({ path: path.join(audit, 'cell-defaults-print.pdf'), preferCSSPageSize: true, printBackground: true }); await preview.close();
  216 |   await writeFile(path.join(audit, 'cell-defaults-metrics.json'), JSON.stringify({ initial, changed, printed }, null, 2) + '\n');
  217 | });
  218 | 
  219 | test('keeps nested fixed-cell alignment and margins local while preserving native layout on reopening and printing', async ({ page, context }) => {
  220 |   const audit = path.resolve('docs/audits/2026-11-26/word-cell-properties');
  221 |   const source = await tableFile('<w:tbl><w:tblGrid><w:gridCol w:w="6000"/></w:tblGrid><w:tr><w:tc><w:tcPr><w:vAlign w:val="bottom"/><w:tcMar><w:top w:w="400" w:type="dxa"/><w:bottom w:w="600" w:type="dxa"/></w:tcMar></w:tcPr><w:p><w:r><w:t>Outer content</w:t></w:r></w:p><w:tbl><w:tblGrid><w:gridCol w:w="3000"/></w:tblGrid><w:tr><w:trPr><w:trHeight w:val="1440" w:hRule="exact"/></w:trPr><w:tc><w:p><w:r><w:t>Inner content</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p/></w:tc></w:tr></w:tbl>');
  222 |   await writeFile(path.join(audit, 'cell-nested-source.docx'), source);
  223 |   await page.goto('/#/components/office-studio');
  224 |   const upload = async (bytes: Buffer, name: string) => {
  225 |     await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: bytes });
  226 |     await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
  227 |   };
  228 |   const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  229 |   const inner = body.locator('table table td').first();
  230 |   const check = async () => {
  231 |     await expect(inner).toContainText('Inner content');
  232 |     const actual = await inner.evaluate(cell => {
  233 |       const wrapper = cell.querySelector<HTMLElement>(':scope > [data-word-cell-content]')!, rect = wrapper.getBoundingClientRect();
  234 |       const range = document.createRange(); range.selectNodeContents(wrapper.querySelector('p')!);
  235 |       const table = cell.closest('table')!, scale = table.getBoundingClientRect().width / table.offsetWidth;
  236 |       return { height: cell.getBoundingClientRect().height / scale, justify: getComputedStyle(wrapper).justifyContent, top: getComputedStyle(wrapper).paddingTop, bottom: getComputedStyle(wrapper).paddingBottom, textTop: (range.getBoundingClientRect().top - rect.top) / scale };
  237 |     });
> 238 |     expect(actual.height).toBeCloseTo(97, 1); expect(actual.justify).toBe('flex-start'); expect(actual.top).toBe('0px'); expect(actual.bottom).toBe('0px'); expect(actual.textTop).toBeLessThan(8);
      |                                                                      ^ Error: expect(received).toBe(expected) // Object.is equality
  239 |     return actual;
  240 |   };
  241 |   await upload(source, 'Nested.docx'); const initial = await check();
  242 |   for (let round = 1; round <= 2; round++) {
  243 |     await inner.locator('p').click(); await page.getByRole('tab', { name: '插入', exact: true }).click();
  244 |     await page.getByRole('button', { name: '单元格对齐与边距', exact: true }).click();
  245 |     await page.getByRole('button', { name: '上左对齐', exact: true }).click();
  246 |     await page.getByRole('button', { name: '应用单元格属性', exact: true }).click();
  247 |     await check(); const download = page.waitForEvent('download'); await page.getByRole('button', { name: '导出文件', exact: true }).click();
  248 |     const bytes = await readFile((await (await download).path())!); await writeFile(path.join(audit, `cell-nested-round-${round}.docx`), bytes);
  249 |     await upload(bytes, `Nested-${round}.docx`); await check();
  250 |   }
  251 |   await page.evaluate(() => window.addEventListener('message', event => { if (event.data?.type === 'cell-nested-print') (window as Window & { nestedPrint?: string }).nestedPrint = event.data.html; }));
  252 |   await page.addInitScript(() => { window.print = () => { window.parent.postMessage({ type: 'cell-nested-print', html: document.documentElement.outerHTML }, '*'); window.dispatchEvent(new Event('afterprint')); }; });
  253 |   await page.getByRole('button', { name: '打印', exact: true }).click();
  254 |   await expect.poll(() => page.evaluate(() => (window as Window & { nestedPrint?: string }).nestedPrint)).toBeTruthy();
  255 |   const preview = await context.newPage(); await preview.setContent(await page.evaluate(() => (window as Window & { nestedPrint?: string }).nestedPrint!)); await preview.evaluate(() => document.fonts.ready);
  256 |   const printed = await preview.locator('table table td').first().evaluate(cell => {
  257 |     const wrapper = cell.querySelector<HTMLElement>(':scope > [data-word-cell-content]')!;
  258 |     return { height: cell.getBoundingClientRect().height, top: getComputedStyle(wrapper).paddingTop, bottom: getComputedStyle(wrapper).paddingBottom, justify: getComputedStyle(wrapper).justifyContent };
  259 |   });
  260 |   expect(printed.height).toBeCloseTo(97, 1); expect(printed.top).toBe('0px'); expect(printed.bottom).toBe('0px'); expect(printed.justify).toBe('flex-start');
  261 |   await preview.pdf({ path: path.join(audit, 'cell-nested-print.pdf'), preferCSSPageSize: true, printBackground: true }); await preview.close();
  262 |   await page.screenshot({ path: path.join(audit, 'cell-nested-light.png'), fullPage: true });
  263 |   await writeFile(path.join(audit, 'cell-nested-metrics.json'), JSON.stringify({ initial, printed }, null, 2) + '\n');
  264 | });
  265 | 
  266 | test('uses each native row gap with one shared column grid and preserves fixed-cell budgets through printing and reopening', async ({ page, context }) => {
  267 |   const audit = path.resolve('docs/audits/2026-11-26/word-cell-properties');
  268 |   const row = (label: string, spacing = '') => `<w:tr><w:trPr><w:trHeight w:val="1440" w:hRule="exact"/>${spacing}</w:trPr>${[0, 1].map(index => `<w:tc><w:p><w:r><w:t>${label}${index}</w:t></w:r></w:p></w:tc>`).join('')}</w:tr>`;
  269 |   const source = await tableFile(`<w:tbl><w:tblPr><w:tblCellSpacing w:w="60" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="4500"/><w:gridCol w:w="4500"/></w:tblGrid>${row('Default')}${row('Override', '<w:tblCellSpacing w:w="120" w:type="dxa"/>')}${row('Zero', '<w:tblCellSpacing w:type="nil"/>')}</w:tbl>`);
  270 |   await writeFile(path.join(audit, 'cell-row-spacing-source.docx'), source);
  271 |   await page.goto('/#/components/office-studio');
  272 |   const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true }), table = body.locator('table').first();
  273 |   const upload = async (bytes: Buffer, name: string) => {
  274 |     await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: bytes });
  275 |     await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
  276 |     await expect(table).toHaveAttribute('data-word-spacing-layout', 'mixed');
  277 |     await expect(table.locator('td').last()).toContainText('Zero1');
  278 |   };
  279 |   const measure = (element: Element) => {
  280 |     const rowElements = element.querySelectorAll(':scope > tbody > tr:not([data-word-auto-page-row])');
  281 |     const tableRect = element.getBoundingClientRect();
  282 |     const scale = tableRect.width / (element as HTMLElement).offsetWidth;
  283 |     const boxes = Array.from(rowElements, row => Array.from(row.querySelectorAll(':scope > td > [data-word-cell-content]'), cell => {
  284 |       const rect = cell.getBoundingClientRect(); return { left: (rect.left - tableRect.left) / scale, top: (rect.top - tableRect.top) / scale, right: (rect.right - tableRect.left) / scale, bottom: (rect.bottom - tableRect.top) / scale, width: rect.width / scale, height: rect.height / scale };
  285 |     }));
  286 |     return { width: tableRect.width / scale, columns: Array.from(element.querySelectorAll('col'), col => parseFloat((col as HTMLElement).style.width)), boxes };
  287 |   };
  288 |   const assertGeometry = (actual: ReturnType<typeof measure>) => {
  289 |     expect(actual.width).toBeCloseTo(600, 1); expect(actual.columns).toEqual([300, 300]);
  290 |     const gaps = [8, 16, 0], heights = [(72 + 5 - 6 + 0.75) * 4 / 3, (72 + 5 - 12 + 0.75) * 4 / 3, (72 + 5 + 0.75) * 4 / 3];
  291 |     actual.boxes.forEach((row, index) => {
  292 |       expect(row[1].left - row[0].right).toBeCloseTo(gaps[index], 1);
  293 |       expect(row[0].left).toBeCloseTo(gaps[index], 1);
  294 |       expect(row[0].height).toBeCloseTo(heights[index], 1); expect(row[1].height).toBeCloseTo(heights[index], 1);
  295 |     });
  296 |     expect(actual.boxes[1][0].top - actual.boxes[0][0].bottom).toBeCloseTo(12, 1);
  297 |     expect(actual.boxes[2][0].top - actual.boxes[1][0].bottom).toBeCloseTo(8, 1);
  298 |   };
  299 |   await upload(source, 'Row spacing.docx');
  300 |   const initial = await table.evaluate(measure); assertGeometry(initial);
  301 |   const target = table.locator('td').nth(2); await target.locator('p').click();
  302 |   await page.getByRole('tab', { name: '插入', exact: true }).click(); await page.getByRole('button', { name: '单元格对齐与边距', exact: true }).click();
  303 |   await page.getByRole('button', { name: '下右对齐', exact: true }).click(); await page.getByRole('button', { name: '应用单元格属性', exact: true }).click();
  304 |   assertGeometry(await table.evaluate(measure));
  305 |   await expect(target.locator('[data-word-cell-content]')).toHaveCSS('justify-content', 'safe flex-end');
  306 |   for (let round = 1; round <= 2; round++) {
  307 |     const pending = page.waitForEvent('download'); await page.getByRole('button', { name: '导出文件', exact: true }).click();
  308 |     const bytes = await readFile((await (await pending).path())!); await writeFile(path.join(audit, `cell-row-spacing-round-${round}.docx`), bytes);
  309 |     const xml = await (await JSZip.loadAsync(bytes)).file('word/document.xml')!.async('string'); expect(xml).toMatch(/<w:gridCol[^>]*w:w="4500"/); expect(xml).toMatch(/<w:tblCellSpacing[^>]*w:w="120"/);
  310 |     await upload(bytes, `Row spacing-${round}.docx`); assertGeometry(await table.evaluate(measure));
  311 |   }
  312 |   await page.evaluate(() => window.addEventListener('message', event => { if (event.data?.type === 'cell-row-spacing-print') (window as Window & { spacingPrint?: string }).spacingPrint = event.data.html; }));
  313 |   await page.addInitScript(() => { window.print = () => { window.parent.postMessage({ type: 'cell-row-spacing-print', html: document.documentElement.outerHTML }, '*'); window.dispatchEvent(new Event('afterprint')); }; });
  314 |   await page.getByRole('button', { name: '打印', exact: true }).click(); await expect.poll(() => page.evaluate(() => (window as Window & { spacingPrint?: string }).spacingPrint)).toBeTruthy();
  315 |   const preview = await context.newPage(); await preview.setContent(await page.evaluate(() => (window as Window & { spacingPrint?: string }).spacingPrint!)); await preview.evaluate(() => document.fonts.ready);
  316 |   const printed = await preview.locator('table').first().evaluate(measure); assertGeometry(printed);
  317 |   await preview.pdf({ path: path.join(audit, 'cell-row-spacing-print.pdf'), preferCSSPageSize: true, printBackground: true }); await preview.close();
  318 |   await page.screenshot({ path: path.join(audit, 'cell-row-spacing-light.png'), fullPage: true });
  319 |   await writeFile(path.join(audit, 'cell-row-spacing-metrics.json'), JSON.stringify({ initial, printed }, null, 2) + '\n');
  320 | });
  321 | 
  322 | test('previews column resizing without jumping between native and model grids, cancels cleanly and saves one history action', async ({ page }) => {
  323 |   const audit = path.resolve('docs/audits/2026-11-26/word-cell-properties');
  324 |   const row = (label: string, spacing = '') => `<w:tr><w:trPr>${spacing}</w:trPr>${[0, 1].map(index => `<w:tc><w:p><w:r><w:t>${label}${index}</w:t></w:r></w:p></w:tc>`).join('')}</w:tr>`;
  325 |   const source = await tableFile(`<w:tbl><w:tblPr><w:tblCellSpacing w:w="60" w:type="dxa"/></w:tblPr><w:tblGrid><w:gridCol w:w="4500"/><w:gridCol w:w="4500"/></w:tblGrid>${row('Default')}${row('Zero', '<w:tblCellSpacing w:type="nil"/>')}</w:tbl>`);
  326 |   await page.goto('/#/components/office-studio'); await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name: 'Column gaps.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: source });
  327 |   await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue('Column gaps.docx');
  328 |   const table = page.getByRole('textbox', { name: 'Word 文档正文', exact: true }).locator('table').first(), target = table.locator('td').first();
  329 |   await expect(table).toHaveAttribute('data-word-spacing-layout', 'mixed');
  330 |   const width = () => table.evaluate(element => (element as HTMLElement).offsetWidth);
  331 |   const initialColumns = await table.locator('td').evaluateAll(cells => cells.map(cell => cell.getAttribute('data-colwidth')));
  332 |   expect(await width()).toBe(600);
  333 |   const handle = async () => {
  334 |     await target.scrollIntoViewIfNeeded(); const box = await target.boundingBox();
  335 |     const scale = await table.evaluate(element => element.getBoundingClientRect().width / (element as HTMLElement).offsetWidth);
  336 |     return { x: box!.x + box!.width - 2 * scale, y: box!.y + box!.height / 2, scale };
  337 |   };
  338 |   let point = await handle(); await page.mouse.move(point.x, point.y); await page.mouse.down();
```