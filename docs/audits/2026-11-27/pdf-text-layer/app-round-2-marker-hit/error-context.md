# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-pdf-text-layer.spec.ts >> uses real selected PDF glyph QuadPoints for four native text markups and survives history and two reopens
- Location: e2e/office-studio-pdf-text-layer.spec.ts:286:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "ECTABLE"
Received: ""

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
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
              - button "Excel 行列编辑 · 公式与图表" [ref=e340] [cursor=pointer]:
                - generic [ref=e341]:
                  - generic [aria-hidden] [ref=e342]: E
                  - generic [ref=e343]:
                    - strong [ref=e344]: Excel
                    - generic [ref=e345]: 行列编辑 · 公式与图表
              - button "PDF 全文查找 · 批注与手写" [pressed] [ref=e346] [cursor=pointer]:
                - generic [ref=e347]:
                  - generic [aria-hidden] [ref=e348]: P
                  - generic [ref=e349]:
                    - strong [ref=e350]: PDF
                    - generic [ref=e351]: 全文查找 · 批注与手写
            - generic [ref=e352]:
              - generic [ref=e353]: 本地文档
              - generic [ref=e354]:
                - generic [ref=e355]: 打开本地文档
                - button "打开本地文档 Text-markups-reopened-1.pdf" [ref=e356] [cursor=pointer]:
                  - generic [ref=e357]: Text-markups-reopened-1.pdf
              - button "历史版本" [ref=e358] [cursor=pointer]
              - switch "只读预览" [ref=e360] [cursor=pointer]
            - region "PDF 文档编辑器" [ref=e364]:
              - generic [ref=e365]:
                - generic [ref=e366]:
                  - generic [ref=e371]: PDF
                  - generic "可编辑 · ⌘ / Ctrl S 保存" [ref=e372]:
                    - status "已保存" [ref=e373]
                - textbox "文档名称" [ref=e378]: Text-markups-reopened-1.pdf
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
                    - tablist "PDF 功能区选项卡" [ref=e423]:
                      - tab "开始" [selected] [ref=e424] [cursor=pointer]
                      - tab "批注" [ref=e425] [cursor=pointer]
                  - group "PDF 编辑工具栏" [ref=e426]:
                    - group "编辑" [ref=e427]:
                      - generic [ref=e428]:
                        - generic [ref=e429]:
                          - button "撤销" [ref=e430] [cursor=pointer]
                          - button "重做" [disabled] [ref=e432]
                        - button "选择" [pressed] [ref=e434] [cursor=pointer]
                      - generic [aria-hidden] [ref=e439]: 编辑
                    - tabpanel "开始" [ref=e440]:
                      - group "插入" [ref=e441]:
                        - generic [ref=e442]:
                          - button "文字" [ref=e443] [cursor=pointer]
                          - button "矩形" [ref=e448] [cursor=pointer]
                          - button "新建表单字段" [ref=e456] [cursor=pointer]
                        - generic [aria-hidden] [ref=e458]: 插入
                      - group "页面" [ref=e459]:
                        - generic [ref=e460]:
                          - button "插入空白页" [ref=e461] [cursor=pointer]
                          - button "删除所选页" [ref=e463] [cursor=pointer]
                          - button "移动所选页" [ref=e465] [cursor=pointer]
                          - button "复制所选页" [ref=e467] [cursor=pointer]
                          - button "合并 PDF 文件" [ref=e469] [cursor=pointer]
                          - button "提取 PDF 页面" [ref=e471] [cursor=pointer]
                          - button "旋转所选页" [ref=e473] [cursor=pointer]
                          - button "页面尺寸" [ref=e475] [cursor=pointer]
                          - button "旋转当前页" [ref=e477] [cursor=pointer]
                          - button "页面" [ref=e483] [cursor=pointer]
                        - generic [aria-hidden] [ref=e489]: 页面
                      - group "查看" [ref=e490]:
                        - generic [ref=e491]:
                          - button "查找" [ref=e492] [cursor=pointer]
                          - button "PDF 批注与表单侧栏" [pressed] [ref=e498] [cursor=pointer]:
                            - generic [ref=e503]: 侧栏
                        - generic [aria-hidden] [ref=e504]: 查看
                - generic [ref=e505]:
                  - navigation "PDF 侧边导航" [ref=e506]:
                    - button "PDF 文本查找侧栏" [ref=e507] [cursor=pointer]
                    - button "PDF 批注侧栏" [pressed] [ref=e512] [cursor=pointer]
                    - button "PDF 页面缩略图侧栏" [ref=e516] [cursor=pointer]
                    - button "PDF 表单侧栏" [ref=e521] [cursor=pointer]
                  - region "PDF 页面编辑区" [ref=e526]:
                    - generic [ref=e527]:
                      - img "PDF 第 1 页原文" [ref=e528]
                      - document "PDF 第 1 页原文选择复制": SELECTABLE ORIGINAL Angled source text Second source line
                      - generic "PDF 原生批注外观":
                        - region "PDF 批注 Highlight" [ref=e529]
                        - region "PDF 批注 Squiggly" [ref=e530]
                        - region "PDF 批注 Underline" [ref=e531]
                        - region "PDF 批注 Original note" [ref=e532]:
                          - img "PDF 便利贴"
                        - region "PDF 批注 StrikeOut" [ref=e533]
                        - region "PDF 批注 blue-no-zoom-rotate" [ref=e534]
                        - region "PDF 批注 Highlight" [ref=e537]
                        - region "PDF 批注 red-no-rotate" [ref=e538]
                        - region "PDF 批注 green-no-zoom" [ref=e541]
                      - group "PDF 原生批注交互层":
                        - button "PDF 批注 矩形 red-no-rotate" [ref=e544] [cursor=pointer]
                        - button "PDF 批注 矩形 green-no-zoom" [ref=e545] [cursor=pointer]
                        - button "PDF 批注 矩形 blue-no-zoom-rotate" [ref=e546] [cursor=pointer]
                        - button "PDF 批注 便签 Original note" [ref=e547] [cursor=pointer]
                        - button "PDF 批注 高亮 single-alpha" [ref=e548] [cursor=pointer]
                        - button "PDF 批注 高亮 bf156e06-e705-40e3-a53a-ba07ff444923" [pressed] [ref=e549] [cursor=pointer]
                        - button "PDF 批注 下划线 3ab83e37-0ca9-4ea1-bf70-ba7a1d8f5d98" [ref=e551] [cursor=pointer]
                        - button "PDF 批注 删除线 6f6768db-1eaa-432f-bc00-b11f9398fffd" [ref=e552] [cursor=pointer]
                        - button "PDF 批注 波浪线 9aba8f39-4c0a-4c72-8f41-1c52c419805b" [ref=e553] [cursor=pointer]
                      - img "PDF 页面标注" [ref=e554]
                      - textbox "PDF 页面表单 source-field" [ref=e558]: Field value
                    - generic [ref=e559]: 第 1 页 · 100%
                  - complementary "PDF 批注与表单" [ref=e560]:
                    - group "PDF 侧栏内容" [ref=e561]:
                      - button "批注 9" [pressed] [ref=e562] [cursor=pointer]
                      - button "表单 1" [ref=e564] [cursor=pointer]
                      - button "文本查找" [ref=e566] [cursor=pointer]
                      - button "页面缩略图" [ref=e568] [cursor=pointer]
                    - generic [ref=e570]:
                      - strong [ref=e571]: 高亮
                      - paragraph [ref=e572]: 未填写内容
                      - generic [ref=e573]: 未署名 · 11/27/2026, 6:22:23 AM
                      - button "编辑批注属性" [ref=e574] [cursor=pointer]
                      - generic "PDF 原生批注回复" [ref=e576]:
                        - strong [ref=e577]: 回复（0）
                        - textbox "PDF 回复内容" [ref=e579]
                        - generic [ref=e580]:
                          - button "回复" [disabled] [ref=e581]
                          - button "解决讨论" [ref=e583] [cursor=pointer]
                      - button "删除选中标注" [ref=e585] [cursor=pointer]
                      - button "新增批注" [ref=e587] [cursor=pointer]
                      - generic [ref=e589]:
                        - text: 新批注与回复署名
                        - textbox "PDF 批注署名" [ref=e591]
                      - generic "PDF 批注列表" [ref=e592]:
                        - button "第 1 页 · 矩形 red-no-rotate" [ref=e593] [cursor=pointer]:
                          - generic [ref=e595]:
                            - strong [ref=e596]: 第 1 页 · 矩形
                            - generic [ref=e597]: red-no-rotate
                        - button "第 1 页 · 矩形 green-no-zoom" [ref=e598] [cursor=pointer]:
                          - generic [ref=e600]:
                            - strong [ref=e601]: 第 1 页 · 矩形
                            - generic [ref=e602]: green-no-zoom
                        - button "第 1 页 · 矩形 blue-no-zoom-rotate" [ref=e603] [cursor=pointer]:
                          - generic [ref=e605]:
                            - strong [ref=e606]: 第 1 页 · 矩形
                            - generic [ref=e607]: blue-no-zoom-rotate
                        - button "第 1 页 · 便签 Original note" [ref=e608] [cursor=pointer]:
                          - generic [ref=e610]:
                            - strong [ref=e611]: 第 1 页 · 便签
                            - generic [ref=e612]: Original note
                        - button "第 1 页 · 高亮 未填写内容" [ref=e613] [cursor=pointer]:
                          - generic [ref=e615]:
                            - strong [ref=e616]: 第 1 页 · 高亮
                            - generic [ref=e617]: 未填写内容
                        - button "第 1 页 · 高亮 未填写内容" [pressed] [ref=e618] [cursor=pointer]:
                          - generic [ref=e620]:
                            - strong [ref=e621]: 第 1 页 · 高亮
                            - generic [ref=e622]: 未填写内容
                        - button "第 1 页 · 下划线 未填写内容" [ref=e623] [cursor=pointer]:
                          - generic [ref=e625]:
                            - strong [ref=e626]: 第 1 页 · 下划线
                            - generic [ref=e627]: 未填写内容
                        - button "第 1 页 · 删除线 未填写内容" [ref=e628] [cursor=pointer]:
                          - generic [ref=e630]:
                            - strong [ref=e631]: 第 1 页 · 删除线
                            - generic [ref=e632]: 未填写内容
                        - button "第 1 页 · 波浪线 未填写内容" [ref=e633] [cursor=pointer]:
                          - generic [ref=e635]:
                            - strong [ref=e636]: 第 1 页 · 波浪线
                            - generic [ref=e637]: 未填写内容
                - group "PDF 状态栏" [ref=e638]:
                  - group "PDF 页面导航" [ref=e639]:
                    - button "PDF 上一页" [disabled] [ref=e640]
                    - generic [ref=e644]:
                      - spinbutton "PDF 跳转页" [ref=e645]: "1"
                      - generic [ref=e646]:
                        - button "增加" [ref=e647] [cursor=pointer]:
                          - generic [aria-hidden] [ref=e648]: +
                        - button "减少" [disabled] [ref=e649]:
                          - generic [aria-hidden] [ref=e650]: −
                    - generic [ref=e651]: / 2
                    - button "PDF 下一页" [ref=e652] [cursor=pointer]
                  - generic "选择工具。PDF 原有正文保持原版式；可编辑新增批注和原文件的可填写表单。" [ref=e656]: 选择工具
                  - group "PDF 视图缩放" [ref=e657]:
                    - button "PDF 缩小视图" [ref=e658] [cursor=pointer]
                    - generic [ref=e663]:
                      - generic [ref=e664]: PDF 缩放
                      - button "PDF 缩放 100%" [ref=e665] [cursor=pointer]:
                        - generic [ref=e666]: 100%
                    - button "PDF 放大视图" [ref=e667] [cursor=pointer]
            - paragraph [ref=e672]: 文件保存在当前浏览器的本地文档空间。需要长期留存时，请导出文件。
          - group [ref=e673]:
            - generic "示例代码" [ref=e674] [cursor=pointer]:
              - generic [aria-hidden] [ref=e675]: </>
              - text: 示例代码
              - generic [aria-hidden] [ref=e676]: 展开 / 收起
        - heading "编辑能力" [level=2] [ref=e677]
        - table [ref=e679]:
          - rowgroup [ref=e680]:
            - row [ref=e681]:
              - columnheader "文档" [ref=e682]
              - columnheader "支持的操作" [ref=e683]
              - columnheader "当前范围" [ref=e684]
          - rowgroup [ref=e685]:
            - row [ref=e686]:
              - cell "Word" [ref=e687]
              - cell "字体与小数字号输入、正文排版、列表、表格、图片、页眉页脚、页码、查找替换、页面设置、撤销重做；导入与导出 DOCX" [ref=e688]
              - cell "支持内嵌图片与单节文档。修订、目录、浮动对象等复杂结构会提示暂不支持。" [ref=e689]
            - row [ref=e690]:
              - cell "Excel" [ref=e691]
              - cell "单元格与矩形选区、字体与小数字号输入、手动与自动行高/列宽、查找替换、边框与垂直对齐、清除格式、公式和跨表引用、格式、复制粘贴、工作表增删、行列插入删除、合并、冻结、排序、筛选、柱状图与折线图；导入与导出 XLSX" [ref=e692]
              - cell "10,000 行、256 列、32 张表、100,000 个已使用单元格。透视、宏、数组公式及复杂图表暂不支持。" [ref=e693]
            - row [ref=e694]:
              - cell "PDF" [ref=e695]
              - cell "分页与缩略图、缩放、旋转、全文查找、文字与高亮、矩形和手写批注、已有表单、撤销重做；导出 PDF" [ref=e696]
              - cell "批注和表单编辑。任意原始文字修改、原文重排及扫描件 OCR 暂不支持。" [ref=e697]
        - heading "组件接入" [level=2] [ref=e698]
        - paragraph [ref=e699]: UI 组件使用 Tiptap / ProseMirror 和公式计算库；文件适配使用 docx、ExcelJS、pdf-lib 与 PDF.js。本页无需文档服务器。宿主可以替换保存与导入导出回调，接入自己的文件系统。
        - paragraph [ref=e700]:
          - text: PDF 的 worker、字体与渲染由
          - code [ref=e701]: pdfRenderer
          - text: 提供。本页的适配代码位于
          - code [ref=e702]: docs/src/pages/collaboration/office-studio/
          - text: 。组件自 v0.4.0 起随
          - code [ref=e703]: "@zuvi/react"
          - text: 和 Registry 发布。
        - region "组件属性表，可横向滚动" [ref=e704]:
          - table [ref=e705]:
            - rowgroup [ref=e706]:
              - row [ref=e707]:
                - columnheader "属性名" [ref=e708]
                - columnheader "类型" [ref=e709]
                - columnheader "默认值" [ref=e710]
                - columnheader "说明" [ref=e711]
            - rowgroup [ref=e712]:
              - row [ref=e713]:
                - cell "value / defaultValue" [ref=e714]
                - cell [ref=e715]:
                  - code [ref=e716]: OfficeStudioDocument
                - cell [ref=e717]:
                  - code [ref=e718]: —
                - cell "受控文档或非受控初始文档；支持 Word、Excel、PDF 三种模型。" [ref=e719]
              - row [ref=e720]:
                - cell "onChange" [ref=e721]
                - cell [ref=e722]:
                  - code [ref=e723]: (document) => void
                - cell [ref=e724]:
                  - code [ref=e725]: —
                - cell "内容或文件名称变化。" [ref=e726]
              - row [ref=e727]:
                - cell "source / pdfRenderer" [ref=e728]
                - cell [ref=e729]:
                  - code [ref=e730]: Blob / StudioPdfRenderer
                - cell [ref=e731]:
                  - code [ref=e732]: —
                - cell "原始文件及 PDF 渲染适配；worker 资源由宿主管理。" [ref=e733]
              - row [ref=e734]:
                - cell "onSave / onExport / onPrint" [ref=e735]
                - cell [ref=e736]:
                  - code [ref=e737]: (document) => void | Promise<void>
                - cell [ref=e738]:
                  - code [ref=e739]: —
                - cell "宿主处理保存、导出或打印；返回后更新状态，失败可重试。" [ref=e740]
              - row [ref=e741]:
                - cell "onImport / onCreate" [ref=e742]
                - cell [ref=e743]:
                  - code [ref=e744]: (file | kind) => void | Promise<void>
                - cell [ref=e745]:
                  - code [ref=e746]: —
                - cell "宿主解析文件或创建模型，并更新受控值。" [ref=e747]
              - row [ref=e748]:
                - cell "readOnly / disabled" [ref=e749]
                - cell [ref=e750]:
                  - code [ref=e751]: boolean
                - cell [ref=e752]:
                  - code [ref=e753]: "false"
                - cell "只读预览或禁用编辑与文件操作。" [ref=e754]
              - row [ref=e755]:
                - cell "saveState" [ref=e756]
                - cell [ref=e757]:
                  - code [ref=e758]: "'saved' | 'saving' | 'unsaved' | 'error'"
                - cell [ref=e759]:
                  - code [ref=e760]: —
                - cell "宿主自动保存状态。" [ref=e761]
              - row [ref=e762]:
                - cell "height" [ref=e763]
                - cell [ref=e764]:
                  - code [ref=e765]: number | string
                - cell [ref=e766]:
                  - code [ref=e767]: "760"
                - cell "编辑器高度；100% 需要父容器设置确定高度。" [ref=e768]
              - row [ref=e769]:
                - cell "fullscreen / onFullscreenChange" [ref=e770]
                - cell [ref=e771]:
                  - code [ref=e772]: boolean / (value) => void
                - cell [ref=e773]:
                  - code [ref=e774]: —
                - cell "全屏布局，切换时编辑内容保持挂载。" [ref=e775]
              - row [ref=e776]:
                - cell "ref" [ref=e777]
                - cell [ref=e778]:
                  - code [ref=e779]: OfficeStudioHandle
                - cell [ref=e780]:
                  - code [ref=e781]: —
                - cell "getDocument()、save()、export()、print()、setFullscreen()。" [ref=e782]
              - row [ref=e783]:
                - cell "classNames" [ref=e784]
                - cell [ref=e785]:
                  - code [ref=e786]: "{ root?; header?; title?; actions?; stage?; status?; error? }"
                - cell [ref=e787]:
                  - code [ref=e788]: —
                - cell "追加语义结构类名，配合 data-part 与 CSS 变量定制。" [ref=e789]
  - text: ✓ ✓
```

# Test source

```ts
  130 |       return { scale, rotation, view, selection, boxes, icons, alpha: qa.pixel(140, 260), hash: await qa.sourceHash(),
  131 |         duplicateWidgets: document.querySelectorAll('.zuvi-studio-pdf-annotation-paint-layer input, .zuvi-studio-pdf-annotation-paint-layer select, .zuvi-studio-pdf-annotation-paint-layer textarea').length };
  132 |     }, { scale, rotation });
  133 |     expect(result.selection.text).toBe('ECTABLE'); expect(result.selection.quadPoints).toHaveLength(8);
  134 |     expect(result.selection.rect.x).toBeGreaterThan(70); expect(result.selection.rect.y).toBeLessThan(450);
  135 |     expect(result.selection.rect.height).toBeGreaterThan(10); expect(result.hash).toBe(hash);
  136 |     expect(result.duplicateWidgets).toBe(0);
  137 |     expect(result.icons).toHaveLength(1); expect(result.icons[0].loaded).toBe(true);
  138 |     for (const [id, color] of [['red-no-rotate', [255, 0, 0]], ['green-no-zoom', [0, 255, 0]], ['blue-no-zoom-rotate', [0, 0, 255]]] as const) {
  139 |       expect(result.boxes[id].canvas?.pixel.slice(0, 3)).toEqual(color);
  140 |       expect(result.boxes[id].canvas!.width).toBeGreaterThanOrEqual(60 * scale * 1.5);
  141 |     }
  142 |     expect(result.boxes['red-no-rotate'].width).toBeCloseTo(90 * scale, 1);
  143 |     expect(result.boxes['red-no-rotate'].height).toBeCloseTo(60 * scale, 1);
  144 |     expect(result.boxes['blue-no-zoom-rotate'].width).toBeCloseTo(90, 1);
  145 |     expect(result.boxes['blue-no-zoom-rotate'].height).toBeCloseTo(60, 1);
  146 |     expect(result.boxes['green-no-zoom'].width).toBeCloseTo(rotation % 180 ? 60 : 90, 1);
  147 |     expect(result.boxes['green-no-zoom'].height).toBeCloseTo(rotation % 180 ? 90 : 60, 1);
  148 |     expect(result.alpha.slice(0, 3)).toEqual([255, 255, 178]);
  149 |     matrix.push(result);
  150 |   }
  151 |   await page.locator('[data-studio-annotation-id="no-ap-note"]').click();
  152 |   expect(await page.evaluate(() => (window as unknown as { pdfLayerQA: { selected: string[] } }).pdfLayerQA.selected)).toContain('no-ap-note');
  153 |   await page.evaluate(() => (window as unknown as { pdfLayerQA: { select(text: string, start: number, end: number): unknown } }).pdfLayerQA.select('Angled source text', 0, 6));
  154 |   const angled = await page.evaluate(() => (window as unknown as { pdfLayerQA: { selection(): { text: string; quadPoints: number[] } } }).pdfLayerQA.selection());
  155 |   expect(angled.text).toBe('Angled'); expect(angled.quadPoints[1]).not.toBe(angled.quadPoints[3]);
  156 |   await page.screenshot({ path: path.join(audit, 'renderer-text-and-annotations.png'), fullPage: true });
  157 |   const virtual = await page.evaluate(async () => {
  158 |     const qa = (window as unknown as { pdfLayerQA: { virtual(blank: boolean): Promise<unknown> } }).pdfLayerQA;
  159 |     return { copy: await qa.virtual(false), blank: await qa.virtual(true) };
  160 |   }) as { copy: { text: string; annotations: number }; blank: { width: number; height: number; text: string; annotations: number; pixel: number[] } };
  161 |   expect(virtual.copy.text).toContain('SELECTABLE ORIGINAL'); expect(virtual.copy.annotations).toBeGreaterThan(0);
  162 |   expect(virtual.blank).toEqual({ width: 320, height: 240, text: '', annotations: 0, pixel: [255, 255, 255, 255] });
  163 |   expect(errors).toEqual([]);
  164 |   await writeFile(path.join(audit, 'renderer-matrix.json'), JSON.stringify({ hash, matrix, angled, virtual, errors }, null, 2) + '\n');
  165 |   await page.evaluate(() => (window as unknown as { pdfLayerQA: { destroy(): Promise<void> } }).pdfLayerQA.destroy());
  166 | });
  167 | 
  168 | async function appFixture() {
  169 |   const data = await fixture(), pdf = await PDFDocument.load(data.bytes), font = await pdf.embedFont(StandardFonts.Helvetica);
  170 |   const second = pdf.addPage([320, 420]); second.setRotation(degrees(90));
  171 |   second.drawText('Searchable second source page', { x: 30, y: 360, size: 16, font });
  172 |   return new Uint8Array(await pdf.save({ updateFieldAppearances: false }));
  173 | }
  174 | async function appReady(page: Page) {
  175 |   await expect(page.getByRole('region', { name: 'PDF 页面编辑区', exact: true }).first()).toHaveAttribute('aria-busy', 'false');
  176 |   await expect(page.locator('.zuvi-studio-pdf-paper .zuvi-studio-pdf-text-layer')).toHaveAttribute('data-ready', 'true');
  177 |   await expect(page.locator('.zuvi-studio-pdf-paper .zuvi-studio-pdf-annotation-paint-layer')).toHaveAttribute('data-ready', 'true');
  178 | }
  179 | async function appImport(page: Page, bytes: Uint8Array, name: string) {
  180 |   await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name, mimeType: 'application/pdf', buffer: Buffer.from(bytes) });
  181 |   await appReady(page);
  182 | }
  183 | async function appSave(page: Page) {
  184 |   await page.getByRole('button', { name: '保存', exact: true }).click();
  185 |   await expect(page.locator('.zuvi-office-studio [data-save-state]').first()).toHaveAttribute('data-save-state', 'saved');
  186 | }
  187 | async function appSnapshot(page: Page) {
  188 |   return page.evaluate(async () => {
  189 |     const database = await new Promise<IDBDatabase>((resolve, reject) => {
  190 |       const request = indexedDB.open('zuvi-office-studio', 2); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  191 |     });
  192 |     const id = await new Promise<string>((resolve, reject) => {
  193 |       const request = database.transaction('preferences').objectStore('preferences').get('active'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  194 |     });
  195 |     const file = await new Promise<{ revision: number; source: Blob; document: { kind: string; name: string; marks: { id: string; nativeId?: string; type: string }[] } }>((resolve, reject) => {
  196 |       const request = database.transaction('files').objectStore('files').get(id); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  197 |     });
  198 |     database.close();
  199 |     const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', await file.source.arrayBuffer()))].map(value => value.toString(16).padStart(2, '0')).join('');
  200 |     return { revision: file.revision, sourceHash: hash, document: file.document };
  201 |   });
  202 | }
  203 | async function appExport(page: Page, name: string) {
  204 |   const pending = page.waitForEvent('download'); await page.getByRole('button', { name: '导出文件', exact: true }).click();
  205 |   const bytes = await readFile((await (await pending).path())!); await writeFile(path.join(audit, name), bytes); return bytes;
  206 | }
  207 | async function selectSource(page: Page, needle: string, start: number, end: number, pointer = false) {
  208 |   const layer = page.locator('.zuvi-studio-pdf-paper .zuvi-studio-pdf-text-layer');
  209 |   if (pointer) {
  210 |     await layer.getByText(needle, { exact: true }).scrollIntoViewIfNeeded();
  211 |     const positions = await layer.evaluate((element, { needle, start, end }) => {
  212 |       const span = [...element.querySelectorAll('span')].find(value => value.textContent === needle);
  213 |       if (!span?.firstChild) throw new Error('Original PDF text is missing');
  214 |       const first = document.createRange(), last = document.createRange();
  215 |       first.setStart(span.firstChild, start); first.setEnd(span.firstChild, start + 1);
  216 |       last.setStart(span.firstChild, end - 1); last.setEnd(span.firstChild, end);
  217 |       const a = first.getBoundingClientRect(), b = last.getBoundingClientRect();
  218 |       return { from: { x: a.left + a.width * 0.1, y: a.top + a.height / 2 }, to: { x: b.right - b.width * 0.1, y: b.top + b.height / 2 } };
  219 |     }, { needle, start, end });
  220 |     await page.mouse.move(positions.from.x, positions.from.y); await page.mouse.down();
  221 |     await page.mouse.move(positions.to.x, positions.to.y, { steps: 8 }); await page.mouse.up();
  222 |   } else {
  223 |     await layer.evaluate((element, { needle, start, end }) => {
  224 |       const span = [...element.querySelectorAll('span')].find(value => value.textContent === needle);
  225 |       if (!span?.firstChild) throw new Error('Original PDF text is missing');
  226 |       const range = document.createRange(); range.setStart(span.firstChild, start); range.setEnd(span.firstChild, end);
  227 |       const selected = document.getSelection(); selected?.removeAllRanges(); selected?.addRange(range);
  228 |     }, { needle, start, end });
  229 |   }
> 230 |   await expect.poll(() => page.evaluate(() => document.getSelection()?.toString())).toBe(needle.slice(start, end));
      |                                                                                     ^ Error: expect(received).toBe(expected) // Object.is equality
  231 | }
  232 | function pageStreams(pdf: PDFDocument) {
  233 |   return pdf.getPages().map(page => {
  234 |     const contents = page.node.Contents(), values = contents && 'asArray' in contents ? contents.asArray() : contents ? [contents] : [];
  235 |     return values.map(value => {
  236 |       const stream = pdf.context.lookup(value); if (!(stream instanceof PDFRawStream)) throw new Error('Page content is not a real PDF stream');
  237 |       return createHash('sha256').update(stream.contents).digest('hex');
  238 |     });
  239 |   });
  240 | }
  241 | 
  242 | test('selects and copies original PDF text in OfficeStudio, searches real pages and preserves source bytes in readonly mode', async ({ page, context }) => {
  243 |   test.setTimeout(180000); await mkdir(audit, { recursive: true });
  244 |   await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  245 |   const bytes = await appFixture(), hash = createHash('sha256').update(bytes).digest('hex');
  246 |   await writeFile(path.join(audit, 'app-source.pdf'), bytes);
  247 |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  248 |   await page.goto('/#/components/office-studio'); await appImport(page, bytes, 'Selectable-source.pdf'); await appSave(page);
  249 |   const initial = await appSnapshot(page); expect(initial.sourceHash).toBe(hash);
  250 |   await selectSource(page, 'SELECTABLE ORIGINAL', 3, 10, true);
  251 |   await page.keyboard.press(process.platform === 'darwin' ? 'Meta+c' : 'Control+c');
  252 |   await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('ECTABLE');
  253 |   const textLayer = page.getByRole('document', { name: 'PDF 第 1 页原文选择复制', exact: true });
  254 |   await textLayer.focus(); await page.keyboard.press('Control+a');
  255 |   await page.keyboard.press(process.platform === 'darwin' ? 'Meta+c' : 'Control+c');
  256 |   const copy = await page.evaluate(() => navigator.clipboard.readText());
  257 |   expect(copy).toContain('SELECTABLE ORIGINAL'); expect(copy).toContain('Angled source text'); expect(copy).toContain('Second source line');
  258 |   await page.getByRole('button', { name: 'PDF 文本查找侧栏', exact: true }).click();
  259 |   await page.getByRole('textbox', { name: 'PDF 查找文字', exact: true }).fill('source');
  260 |   await page.getByRole('button', { name: '查找全部', exact: true }).click();
  261 |   const results = page.getByLabel('PDF 查找结果', { exact: true }).getByRole('button');
  262 |   await expect(results).toHaveCount(3); await results.last().click(); await appReady(page);
  263 |   await expect(page.getByRole('spinbutton', { name: 'PDF 跳转页', exact: true })).toHaveValue('2');
  264 |   expect(await page.evaluate(() => document.getSelection()?.isCollapsed)).toBe(true);
  265 |   await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  266 |   await appReady(page);
  267 |   await expect(page.getByRole('spinbutton', { name: 'PDF 跳转页', exact: true })).toHaveValue('2');
  268 |   const secondLayer = page.getByRole('document', { name: 'PDF 第 2 页原文选择复制', exact: true });
  269 |   await secondLayer.focus(); await page.keyboard.press('Control+a');
  270 |   await page.keyboard.press(process.platform === 'darwin' ? 'Meta+c' : 'Control+c');
  271 |   await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('Searchable second source page');
  272 |   await expect(page.getByRole('button', { name: '新建表单字段', exact: true })).toBeDisabled();
  273 |   expect((await appSnapshot(page)).sourceHash).toBe(hash);
  274 |   await page.screenshot({ path: path.join(audit, 'app-readonly-text-light.png'), fullPage: true, animations: 'disabled' });
  275 |   await page.locator('html').evaluate(element => element.setAttribute('data-theme', 'dark'));
  276 |   await page.screenshot({ path: path.join(audit, 'app-readonly-text-dark.png'), fullPage: true, animations: 'disabled' });
  277 |   await page.setViewportSize({ width: 320, height: 780 });
  278 |   await secondLayer.focus(); await page.keyboard.press('Control+a');
  279 |   await page.keyboard.press(process.platform === 'darwin' ? 'Meta+c' : 'Control+c');
  280 |   await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('Searchable second source page');
  281 |   await page.screenshot({ path: path.join(audit, 'app-readonly-text-dark-320.png'), fullPage: true, animations: 'disabled' });
  282 |   const final = await appSnapshot(page); expect(final.sourceHash).toBe(hash); expect(final.revision).toBe(initial.revision);
  283 |   expect(errors).toEqual([]); await writeFile(path.join(audit, 'app-selection-results.json'), JSON.stringify({ hash, initial, final, copy, errors }, null, 2) + '\n');
  284 | });
  285 | 
  286 | test('uses real selected PDF glyph QuadPoints for four native text markups and survives history and two reopens', async ({ page, context }) => {
  287 |   test.setTimeout(180000); await mkdir(audit, { recursive: true });
  288 |   await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  289 |   const bytes = await appFixture(), original = await PDFDocument.load(bytes), originalStreams = pageStreams(original);
  290 |   await writeFile(path.join(audit, 'app-markup-source.pdf'), bytes);
  291 |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  292 |   await page.goto('/#/components/office-studio'); await appImport(page, bytes, 'Text-markup-source.pdf'); await appSave(page);
  293 |   await page.getByRole('tab', { name: '批注', exact: true }).click();
  294 |   const sourceCount = await page.locator('.zuvi-studio-pdf-native-hit').count(), operations: unknown[] = [];
  295 |   for (const [index, [label, subtype, needle, start, end]] of [
  296 |     ['高亮', 'Highlight', 'SELECTABLE ORIGINAL', 3, 10],
  297 |     ['下划线', 'Underline', 'Second source line', 0, 6],
  298 |     ['删除线', 'StrikeOut', 'Angled source text', 0, 6],
  299 |     ['波浪线', 'Squiggly', 'SELECTABLE ORIGINAL', 11, 19],
  300 |   ].entries()) {
  301 |     await page.getByRole('button', { name: '选择', exact: true }).click(); await appReady(page);
  302 |     await selectSource(page, String(needle), Number(start), Number(end));
  303 |     await page.getByRole('button', { name: /^PDF 新增批注类型/ }).click();
  304 |     await page.getByRole('option', { name: String(label), exact: true }).click();
  305 |     const apply = page.getByRole('button', { name: '应用到所选文字', exact: true });
  306 |     await expect(apply).toBeEnabled();
  307 |     const before = await appSnapshot(page); await apply.click(); await appReady(page); await appSave(page);
  308 |     await expect(page.locator('.zuvi-studio-pdf-native-hit')).toHaveCount(sourceCount + index + 1);
  309 |     const after = await appSnapshot(page); expect(after.sourceHash).not.toBe(before.sourceHash);
  310 |     const output = await appExport(page, `app-created-${String(subtype).toLowerCase()}.pdf`), native = await PDFDocument.load(output);
  311 |     const annotations = native.getPages()[0].node.Annots()!.asArray().map(ref => native.context.lookup(ref)).filter((value): value is PDFDict => value instanceof PDFDict);
  312 |     const marks = annotations.filter(dict => dict.lookup(PDFName.of('Subtype')) === PDFName.of(String(subtype)));
  313 |     const latest = marks.at(-1)!;
  314 |     const quads = latest.lookup(PDFName.of('QuadPoints')); expect(quads && 'asArray' in quads).toBe(true);
  315 |     expect(String(quads)).not.toBe('[]'); expect(latest.lookup(PDFName.of('AP'))).toBeDefined();
  316 |     expect(pageStreams(native)).toEqual(originalStreams);
  317 |     operations.push({ label, subtype, before: before.sourceHash, after: after.sourceHash, quads: String(quads) });
  318 |     if (index === 3) {
  319 |       await page.getByRole('button', { name: '撤销', exact: true }).click(); await appReady(page); await appSave(page);
  320 |       await expect(page.locator('.zuvi-studio-pdf-native-hit')).toHaveCount(sourceCount + 3); expect((await appSnapshot(page)).sourceHash).toBe(before.sourceHash);
  321 |       await page.getByRole('button', { name: '重做', exact: true }).click(); await appReady(page); await appSave(page);
  322 |       await expect(page.locator('.zuvi-studio-pdf-native-hit')).toHaveCount(sourceCount + 4); expect((await appSnapshot(page)).sourceHash).toBe(after.sourceHash);
  323 |     }
  324 |   }
  325 |   const rounds: unknown[] = [];
  326 |   for (let round = 1; round <= 2; round++) {
  327 |     const output = await appExport(page, `app-text-markups-round-${round}.pdf`), native = await PDFDocument.load(output);
  328 |     expect(pageStreams(native)).toEqual(originalStreams); expect(native.getForm().getTextField('source-field').getText()).toBe('Field value');
  329 |     const subtypes = native.getPages()[0].node.Annots()!.asArray().map(ref => native.context.lookup(ref)).filter((value): value is PDFDict => value instanceof PDFDict).map(value => String(value.lookup(PDFName.of('Subtype'))));
  330 |     expect(subtypes.filter(value => value === '/Highlight')).toHaveLength(2); for (const value of ['/Underline', '/StrikeOut', '/Squiggly']) expect(subtypes.filter(subtype => subtype === value)).toHaveLength(1);
```