# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-word-format.spec.ts >> Word painting preserves exact formats and links, clears formatting without losing structure and reopens native DOCX
- Location: e2e/office-studio-word-format.spec.ts:29:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForEvent: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for event "download"
============================================================
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
              - button "Word 文档排版 · 图片与页眉页脚" [disabled] [pressed] [ref=e334]:
                - generic [ref=e335]:
                  - generic [aria-hidden] [ref=e336]: W
                  - generic [ref=e337]:
                    - strong [ref=e338]: Word
                    - generic [ref=e339]: 文档排版 · 图片与页眉页脚
              - button "Excel 行列编辑 · 公式与图表" [disabled] [ref=e340]:
                - generic [ref=e341]:
                  - generic [aria-hidden] [ref=e342]: E
                  - generic [ref=e343]:
                    - strong [ref=e344]: Excel
                    - generic [ref=e345]: 行列编辑 · 公式与图表
              - button "PDF 全文查找 · 批注与手写" [disabled] [ref=e346]:
                - generic [ref=e347]:
                  - generic [aria-hidden] [ref=e348]: P
                  - generic [ref=e349]:
                    - strong [ref=e350]: PDF
                    - generic [ref=e351]: 全文查找 · 批注与手写
            - generic [ref=e352]:
              - generic [ref=e353]: 本地文档
              - generic [ref=e354]:
                - generic [ref=e355]: 打开本地文档
                - button "打开本地文档 保存的文档会出现在这里" [disabled] [ref=e356]:
                  - generic [ref=e357]: 保存的文档会出现在这里
              - button "历史版本" [disabled] [ref=e358]
              - switch "只读预览" [disabled] [ref=e360]
            - region "Word 文档编辑器" [ref=e364]:
              - generic [ref=e365]:
                - generic [ref=e366]:
                  - generic [ref=e371]: Word
                  - generic "正在准备文档…" [ref=e372]:
                    - status "正在准备文档…" [ref=e373]
                - textbox "文档名称" [disabled] [ref=e378]: Reopened.docx
                - generic [ref=e379]:
                  - button "新建" [disabled] [ref=e381] [cursor=pointer]
                  - button "导入" [disabled] [ref=e384]
                  - button "导出文件" [disabled] [ref=e389]
                  - button "打印" [disabled] [ref=e395]
                  - button "保存" [disabled] [ref=e402]
                  - button "全屏编辑" [ref=e409] [cursor=pointer]
              - generic [ref=e417]:
                - generic [ref=e418]:
                  - generic [ref=e419]:
                    - button "文件" [disabled] [ref=e422] [cursor=pointer]
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
                        - button "粘贴" [disabled] [ref=e433]
                        - generic [ref=e439]:
                          - button "剪切" [disabled] [ref=e440]
                          - button "复制" [disabled] [ref=e449]
                    - button "格式刷" [disabled] [ref=e456]
                    - group "历史" [ref=e461]:
                      - generic [ref=e462]:
                        - button "撤销" [disabled] [ref=e463]
                        - button "重做" [disabled] [ref=e469]
                    - group "字体" [ref=e476]:
                      - generic [ref=e477]:
                        - generic [ref=e478]:
                          - generic [ref=e481]:
                            - combobox "字体" [disabled] [ref=e482]: 思源黑体
                            - button "展开选项" [disabled] [ref=e483]
                          - generic [ref=e488]:
                            - combobox "字号" [disabled] [ref=e489]: "12"
                            - button "展开选项" [disabled] [ref=e490]
                          - button "增大字号" [disabled] [ref=e493]
                          - button "减小字号" [disabled] [ref=e496]
                        - button "字符间距与位置" [disabled] [ref=e499]
                        - generic [ref=e501]:
                          - button "粗体" [disabled] [pressed] [ref=e502]
                          - button "斜体" [disabled] [ref=e507]
                          - button "下划线" [disabled] [ref=e511]:
                            - generic [ref=e512]: U
                          - button "删除线" [disabled] [ref=e514]:
                            - generic [ref=e515]: S
                          - button "上标" [disabled] [ref=e517]:
                            - generic [ref=e518]:
                              - text: x
                              - superscript [ref=e519]: "2"
                          - button "下标" [disabled] [ref=e520]:
                            - generic [ref=e521]:
                              - text: x
                              - subscript [ref=e522]: "2"
                          - generic "文字颜色" [ref=e523]:
                            - button "文字颜色" [disabled] [ref=e524]: A
                          - button "清除格式" [disabled] [ref=e526]:
                            - generic [aria-hidden] [ref=e528]: A
                          - button "文字高亮" [disabled] [ref=e530]
                          - button "变更大小写" [disabled] [ref=e535]
                    - group "段落" [ref=e539]:
                      - generic [ref=e540]:
                        - generic [ref=e541]:
                          - button "项目符号" [disabled] [pressed] [ref=e542]:
                            - generic [aria-hidden] [ref=e544]: • ≡
                          - button "编号列表" [disabled] [ref=e545]:
                            - generic [aria-hidden] [ref=e547]: 1. ≡
                          - button "列表下沉缩进" [disabled] [ref=e548]:
                            - generic [aria-hidden] [ref=e550]: 1.1 →
                          - button "列表上提缩进" [disabled] [ref=e551]:
                            - generic [aria-hidden] [ref=e553]: ← 1.1
                          - button "减少缩进" [disabled] [ref=e554]:
                            - generic [ref=e555]: ← ≡
                          - button "增加缩进" [disabled] [ref=e556]:
                            - generic [ref=e557]: ≡ →
                          - button "继续编号" [disabled] [ref=e558]
                          - textbox "编号起始值" [disabled] [ref=e561]: "1"
                          - button "重新开始编号" [disabled] [ref=e562]
                          - generic [ref=e564]:
                            - generic [ref=e565]: 编号格式
                            - button "编号格式 • 项目符号" [disabled] [ref=e566]:
                              - generic [ref=e567]: • 项目符号
                          - button "多级编号定义" [disabled] [ref=e568]
                          - button "段落边框与底纹" [disabled] [ref=e570]
                          - generic [ref=e572]:
                            - generic [ref=e573]: 段落行距
                            - button "段落行距 1.75 倍行距" [disabled] [ref=e574]:
                              - generic [ref=e575]: 1.75 倍行距
                          - button "段落设置" [disabled] [ref=e576]
                          - button "制表位" [disabled] [ref=e578]
                          - button "插入制表符" [disabled] [ref=e580]
                        - generic [ref=e582]:
                          - button "左对齐" [disabled] [pressed] [ref=e583]
                          - button "居中" [disabled] [ref=e586]
                          - button "右对齐" [disabled] [ref=e589]
                          - button "两端对齐" [disabled] [ref=e592]
                          - button "显示非打印字符" [disabled] [ref=e595]:
                            - generic [aria-hidden] [ref=e597]: ¶
                    - group "样式" [ref=e599]:
                      - generic [ref=e600]:
                        - generic [ref=e601]:
                          - button "正文样式" [disabled] [ref=e602]:
                            - generic [ref=e603]:
                              - generic [aria-hidden] [ref=e604]: AaBbCc
                              - generic [ref=e605]: 正文
                          - button "无间距样式" [disabled] [ref=e606]:
                            - generic [ref=e607]:
                              - generic [aria-hidden] [ref=e608]: AaBbCc
                              - generic [ref=e609]: 无间距
                          - button "标题 1样式" [disabled] [ref=e610]:
                            - generic [ref=e611]:
                              - generic [aria-hidden] [ref=e612]: AaBbCc
                              - generic [ref=e613]: 标题 1
                        - generic [ref=e614]:
                          - generic [ref=e615]: 段落样式
                          - button "段落样式 List Paragraph" [disabled] [ref=e616]:
                            - generic [ref=e617]: List Paragraph
                        - generic [ref=e618]:
                          - button "新建段落样式" [disabled] [ref=e619]:
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
                      - slider "首行缩进标尺" [disabled] [ref=e673]
                      - slider "悬挂缩进标尺" [disabled] [ref=e675]
                      - slider "左缩进标尺" [disabled] [ref=e677]
                      - slider "右缩进标尺" [disabled] [ref=e679]
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
                            - strong [ref=e688]: Source format
                          - paragraph [ref=e689]:
                            - strong [ref=e691]: Target one
                          - heading [level=2] [ref=e692]:
                            - link "Linked heading" [ref=e693] [cursor=pointer]:
                              - /url: https://example.com/linked
                          - list [ref=e694]:
                            - listitem [ref=e695]:
                              - paragraph [ref=e696]:
                                - text: ●
                                - strong [ref=e698]: Keep list structure
                        - region "页脚区域" [ref=e699]
                - generic [ref=e700]:
                  - generic [ref=e701]: 51 字 · A4 · 纵向 · 只读
                  - generic [ref=e702]:
                    - generic [ref=e703]: 缩放
                    - generic [ref=e704]:
                      - generic [ref=e705]: Word 缩放
                      - button "Word 缩放 适应宽度" [ref=e706] [cursor=pointer]:
                        - generic [ref=e707]: 适应宽度
            - paragraph [ref=e708]: 文件保存在当前浏览器的本地文档空间。需要长期留存时，请导出文件。
          - group [ref=e709]:
            - generic "示例代码" [ref=e710] [cursor=pointer]:
              - generic [aria-hidden] [ref=e711]: </>
              - text: 示例代码
              - generic [aria-hidden] [ref=e712]: 展开 / 收起
        - heading "编辑能力" [level=2] [ref=e713]
        - table [ref=e715]:
          - rowgroup [ref=e716]:
            - row [ref=e717]:
              - columnheader "文档" [ref=e718]
              - columnheader "支持的操作" [ref=e719]
              - columnheader "当前范围" [ref=e720]
          - rowgroup [ref=e721]:
            - row [ref=e722]:
              - cell "Word" [ref=e723]
              - cell "字体与小数字号输入、正文排版、列表、表格、图片、页眉页脚、页码、查找替换、页面设置、撤销重做；导入与导出 DOCX" [ref=e724]
              - cell "支持内嵌图片与单节文档。修订、目录、浮动对象等复杂结构会提示暂不支持。" [ref=e725]
            - row [ref=e726]:
              - cell "Excel" [ref=e727]
              - cell "单元格与矩形选区、字体与小数字号输入、手动与自动行高/列宽、查找替换、边框与垂直对齐、清除格式、公式和跨表引用、格式、复制粘贴、工作表增删、行列插入删除、合并、冻结、排序、筛选、柱状图与折线图；导入与导出 XLSX" [ref=e728]
              - cell "10,000 行、256 列、32 张表、100,000 个已使用单元格。透视、宏、数组公式及复杂图表暂不支持。" [ref=e729]
            - row [ref=e730]:
              - cell "PDF" [ref=e731]
              - cell "分页与缩略图、缩放、旋转、全文查找、文字与高亮、矩形和手写批注、已有表单、撤销重做；导出 PDF" [ref=e732]
              - cell "批注和表单编辑。任意原始文字修改、原文重排及扫描件 OCR 暂不支持。" [ref=e733]
        - heading "组件接入" [level=2] [ref=e734]
        - paragraph [ref=e735]: UI 组件使用 Tiptap / ProseMirror 和公式计算库；文件适配使用 docx、ExcelJS、pdf-lib 与 PDF.js。本页无需文档服务器。宿主可以替换保存与导入导出回调，接入自己的文件系统。
        - paragraph [ref=e736]:
          - text: PDF 的 worker、字体与渲染由
          - code [ref=e737]: pdfRenderer
          - text: 提供。本页的适配代码位于
          - code [ref=e738]: docs/src/pages/collaboration/office-studio/
          - text: 。组件自 v0.4.0 起随
          - code [ref=e739]: "@zuvi/react"
          - text: 和 Registry 发布。
        - region "组件属性表，可横向滚动" [ref=e740]:
          - table [ref=e741]:
            - rowgroup [ref=e742]:
              - row [ref=e743]:
                - columnheader "属性名" [ref=e744]
                - columnheader "类型" [ref=e745]
                - columnheader "默认值" [ref=e746]
                - columnheader "说明" [ref=e747]
            - rowgroup [ref=e748]:
              - row [ref=e749]:
                - cell "value / defaultValue" [ref=e750]
                - cell [ref=e751]:
                  - code [ref=e752]: OfficeStudioDocument
                - cell [ref=e753]:
                  - code [ref=e754]: —
                - cell "受控文档或非受控初始文档；支持 Word、Excel、PDF 三种模型。" [ref=e755]
              - row [ref=e756]:
                - cell "onChange" [ref=e757]
                - cell [ref=e758]:
                  - code [ref=e759]: (document) => void
                - cell [ref=e760]:
                  - code [ref=e761]: —
                - cell "内容或文件名称变化。" [ref=e762]
              - row [ref=e763]:
                - cell "source / pdfRenderer" [ref=e764]
                - cell [ref=e765]:
                  - code [ref=e766]: Blob / StudioPdfRenderer
                - cell [ref=e767]:
                  - code [ref=e768]: —
                - cell "原始文件及 PDF 渲染适配；worker 资源由宿主管理。" [ref=e769]
              - row [ref=e770]:
                - cell "onSave / onExport / onPrint" [ref=e771]
                - cell [ref=e772]:
                  - code [ref=e773]: (document) => void | Promise<void>
                - cell [ref=e774]:
                  - code [ref=e775]: —
                - cell "宿主处理保存、导出或打印；返回后更新状态，失败可重试。" [ref=e776]
              - row [ref=e777]:
                - cell "onImport / onCreate" [ref=e778]
                - cell [ref=e779]:
                  - code [ref=e780]: (file | kind) => void | Promise<void>
                - cell [ref=e781]:
                  - code [ref=e782]: —
                - cell "宿主解析文件或创建模型，并更新受控值。" [ref=e783]
              - row [ref=e784]:
                - cell "readOnly / disabled" [ref=e785]
                - cell [ref=e786]:
                  - code [ref=e787]: boolean
                - cell [ref=e788]:
                  - code [ref=e789]: "false"
                - cell "只读预览或禁用编辑与文件操作。" [ref=e790]
              - row [ref=e791]:
                - cell "saveState" [ref=e792]
                - cell [ref=e793]:
                  - code [ref=e794]: "'saved' | 'saving' | 'unsaved' | 'error'"
                - cell [ref=e795]:
                  - code [ref=e796]: —
                - cell "宿主自动保存状态。" [ref=e797]
              - row [ref=e798]:
                - cell "height" [ref=e799]
                - cell [ref=e800]:
                  - code [ref=e801]: number | string
                - cell [ref=e802]:
                  - code [ref=e803]: "760"
                - cell "编辑器高度；100% 需要父容器设置确定高度。" [ref=e804]
              - row [ref=e805]:
                - cell "fullscreen / onFullscreenChange" [ref=e806]
                - cell [ref=e807]:
                  - code [ref=e808]: boolean / (value) => void
                - cell [ref=e809]:
                  - code [ref=e810]: —
                - cell "全屏布局，切换时编辑内容保持挂载。" [ref=e811]
              - row [ref=e812]:
                - cell "ref" [ref=e813]
                - cell [ref=e814]:
                  - code [ref=e815]: OfficeStudioHandle
                - cell [ref=e816]:
                  - code [ref=e817]: —
                - cell "getDocument()、save()、export()、print()、setFullscreen()。" [ref=e818]
              - row [ref=e819]:
                - cell "classNames" [ref=e820]
                - cell [ref=e821]:
                  - code [ref=e822]: "{ root?; header?; title?; actions?; stage?; status?; error? }"
                - cell [ref=e823]:
                  - code [ref=e824]: —
                - cell "追加语义结构类名，配合 data-part 与 CSS 变量定制。" [ref=e825]
  - text: ✓ ✓ ✓ ✓
```

# Test source

```ts
  8   |   ExternalHyperlink,
  9   |   HeadingLevel,
  10  |   AlignmentType,
  11  |   Packer,
  12  | } from '../docs/node_modules/docx/dist/index.mjs';
  13  | import JSZip from '../docs/node_modules/jszip/lib/index.js';
  14  |
  15  | const audit = path.resolve('docs/audits/2026-11-25/word-format');
  16  | async function select(node: Locator) {
  17  |   await node.evaluate((element) => {
  18  |     const root = element.closest('[contenteditable="true"]') as HTMLElement;
  19  |     root.focus();
  20  |     const range = document.createRange();
  21  |     range.selectNodeContents(element);
  22  |     const selection = window.getSelection()!;
  23  |     selection.removeAllRanges();
  24  |     selection.addRange(range);
  25  |     document.dispatchEvent(new Event('selectionchange'));
  26  |   });
  27  | }
  28  |
  29  | test('Word painting preserves exact formats and links, clears formatting without losing structure and reopens native DOCX', async ({
  30  |   page,
  31  | }) => {
  32  |   await mkdir(audit, { recursive: true });
  33  |   const document = new Document({
  34  |     sections: [
  35  |       {
  36  |         children: [
  37  |           new Paragraph({
  38  |             alignment: AlignmentType.RIGHT,
  39  |             indent: { left: 360 },
  40  |             children: [
  41  |               new TextRun({ text: 'Source format', bold: true, size: 36, color: '0055AA' }),
  42  |             ],
  43  |           }),
  44  |           new Paragraph({ children: [new TextRun({ text: 'Target one', bold: true })] }),
  45  |           new Paragraph({
  46  |             heading: HeadingLevel.HEADING_2,
  47  |             children: [
  48  |               new ExternalHyperlink({
  49  |                 link: 'https://example.com/linked',
  50  |                 children: [new TextRun({ text: 'Linked heading', italics: true })],
  51  |               }),
  52  |             ],
  53  |           }),
  54  |           new Paragraph({
  55  |             bullet: { level: 0 },
  56  |             children: [new TextRun({ text: 'Keep list structure', bold: true })],
  57  |           }),
  58  |         ],
  59  |       },
  60  |     ],
  61  |   });
  62  |   await page.goto('/#/components/office-studio');
  63  |   await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
  64  |     name: 'Formats.docx',
  65  |     mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  66  |     buffer: Buffer.from(await Packer.toArrayBuffer(document)),
  67  |   });
  68  |   const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  69  |   const source = body.locator('p').filter({ hasText: 'Source format' });
  70  |   const target = body.locator('p').filter({ hasText: 'Target one' });
  71  |   const heading = body.locator('h2').filter({ hasText: 'Linked heading' });
  72  |   await expect(source).toBeVisible();
  73  |   await select(source);
  74  |   await page.getByRole('button', { name: '格式刷', exact: true }).dblclick();
  75  |   await select(target);
  76  |   await expect(target.locator('strong')).toHaveText('Target one');
  77  |   await expect(target).toHaveCSS('text-align', 'right');
  78  |   await expect(target.locator('span').first()).toHaveCSS('font-size', '24px');
  79  |   await expect(target.locator('span').first()).toHaveCSS('color', 'rgb(0, 85, 170)');
  80  |   await expect(page.getByRole('button', { name: '格式刷', exact: true })).toHaveAttribute(
  81  |     'aria-pressed',
  82  |     'true'
  83  |   );
  84  |   await select(heading);
  85  |   await expect(heading.locator('strong')).toHaveText('Linked heading');
  86  |   await expect(heading.locator('a')).toHaveAttribute('href', 'https://example.com/linked');
  87  |   await expect(heading.locator('em')).toHaveCount(0);
  88  |   await body.press('Escape');
  89  |   await expect(page.getByRole('button', { name: '格式刷', exact: true })).not.toHaveAttribute(
  90  |     'aria-pressed'
  91  |   );
  92  |   await page.getByRole('button', { name: '撤销', exact: true }).click();
  93  |   await expect(heading.locator('em')).toHaveText('Linked heading');
  94  |   await expect(target.locator('strong')).toHaveText('Target one');
  95  |   await page.getByRole('button', { name: '重做', exact: true }).click();
  96  |   await expect(heading.locator('em')).toHaveCount(0);
  97  |   await select(heading);
  98  |   await page.getByRole('button', { name: '清除格式', exact: true }).click();
  99  |   await expect(heading).toBeVisible();
  100 |   await expect(heading.locator('strong')).toHaveCount(0);
  101 |   await expect(heading.locator('a')).toHaveAttribute('href', 'https://example.com/linked');
  102 |   await expect(body.locator('ul li')).toContainText('Keep list structure');
  103 |   await page.getByRole('button', { name: '撤销', exact: true }).click();
  104 |   await expect(heading.locator('strong')).toHaveText('Linked heading');
  105 |   await page.getByRole('button', { name: '重做', exact: true }).click();
  106 |   await expect(heading.locator('strong')).toHaveCount(0);
  107 |   for (let pass = 1; pass <= 2; pass++) {
> 108 |     const pending = page.waitForEvent('download');
      |                          ^ Error: page.waitForEvent: Test timeout of 30000ms exceeded.
  109 |     await page.getByRole('button', { name: '导出文件', exact: true }).click();
  110 |     const bytes = await readFile((await (await pending).path())!);
  111 |     await writeFile(path.join(audit, `formats-roundtrip-${pass}.docx`), bytes);
  112 |     const zip = await JSZip.loadAsync(bytes);
  113 |     const xml = await zip.file('word/document.xml')!.async('string');
  114 |     const relationships = await zip.file('word/_rels/document.xml.rels')!.async('string');
  115 |     expect(xml).toContain('Linked heading');
  116 |     expect(xml).toContain('<w:hyperlink');
  117 |     expect(xml).toContain('<w:numPr>');
  118 |     expect(relationships).toContain('https://example.com/linked');
  119 |     await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
  120 |       name: 'Reopened.docx',
  121 |       mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  122 |       buffer: bytes,
  123 |     });
  124 |     await expect(heading.locator('a')).toHaveAttribute('href', 'https://example.com/linked');
  125 |     await expect(heading.locator('strong')).toHaveCount(0);
  126 |     await expect(target.locator('span').first()).toHaveCSS('font-size', '24px');
  127 |     await expect(target).toHaveCSS('text-align', 'right');
  128 |     await expect(body.locator('ul li')).toContainText('Keep list structure');
  129 |   }
  130 |   await page.screenshot({
  131 |     path: path.join(audit, 'word-format-light.png'),
  132 |     fullPage: true,
  133 |     animations: 'disabled',
  134 |   });
  135 |   await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  136 |   await page.screenshot({
  137 |     path: path.join(audit, 'word-format-dark.png'),
  138 |     fullPage: true,
  139 |     animations: 'disabled',
  140 |   });
  141 |   await page.setViewportSize({ width: 320, height: 720 });
  142 |   await select(target);
  143 |   await page.getByRole('button', { name: '格式刷', exact: true }).dblclick();
  144 |   await select(heading);
  145 |   await body.press('Escape');
  146 |   await expect(heading.locator('a')).toHaveAttribute('href', 'https://example.com/linked');
  147 |   await page.screenshot({
  148 |     path: path.join(audit, 'word-format-320.png'),
  149 |     fullPage: true,
  150 |     animations: 'disabled',
  151 |   });
  152 |   await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  153 |   await expect(page.getByRole('button', { name: '格式刷', exact: true })).toBeDisabled();
  154 |   await expect(page.getByRole('button', { name: '清除格式', exact: true })).toBeDisabled();
  155 | });
  156 |
```
