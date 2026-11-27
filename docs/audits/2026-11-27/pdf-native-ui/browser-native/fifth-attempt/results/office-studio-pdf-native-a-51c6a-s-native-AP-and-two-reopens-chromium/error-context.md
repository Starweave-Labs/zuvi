# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-pdf-native-annotations.spec.ts >> P012 creates and formats CJK FreeText with transactional history, IME drafts, native AP and two reopens
- Location: e2e/office-studio-pdf-native-annotations.spec.ts:307:1

# Error details

```
TimeoutError: locator.click: Timeout 20000ms exceeded.
Call log:
  - waiting for getByRole('option', { name: '文字', exact: true })

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
                - button "打开本地文档 Native-original.pdf" [ref=e356] [cursor=pointer]:
                  - generic [ref=e357]: Native-original.pdf
              - button "历史版本" [ref=e358] [cursor=pointer]
              - switch "只读预览" [ref=e360] [cursor=pointer]
            - region "PDF 文档编辑器" [ref=e364]:
              - generic [ref=e365]:
                - generic [ref=e366]:
                  - generic [ref=e371]: PDF
                  - generic "可编辑 · ⌘ / Ctrl S 保存" [ref=e372]:
                    - status "已保存" [ref=e373]
                - textbox "文档名称" [ref=e378]: Native-original.pdf
                - generic [ref=e379]:
                  - button "新建" [ref=e381] [cursor=pointer]
                  - button "导入" [ref=e384] [cursor=pointer]
                  - button "导出文件" [ref=e389] [cursor=pointer]
                  - button "打印" [ref=e395] [cursor=pointer]
                  - button "保存" [ref=e402] [cursor=pointer]
                  - button "退出全屏" [pressed] [ref=e409] [cursor=pointer]
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
                          - button "撤销" [disabled] [ref=e430]
                          - button "重做" [disabled] [ref=e432]
                        - button "选择" [pressed] [ref=e434] [cursor=pointer]
                        - button "选择文字" [ref=e439] [cursor=pointer]
                      - generic [aria-hidden] [ref=e444]: 编辑
                    - tabpanel "开始" [ref=e445]:
                      - group "插入" [ref=e446]:
                        - generic [ref=e447]:
                          - button "文字" [ref=e448] [cursor=pointer]
                          - button "矩形" [ref=e453] [cursor=pointer]
                          - button "新建表单字段" [ref=e461] [cursor=pointer]
                        - generic [aria-hidden] [ref=e463]: 插入
                      - group "页面" [ref=e464]:
                        - generic [ref=e465]:
                          - button "插入空白页" [ref=e466] [cursor=pointer]
                          - button "删除所选页" [ref=e468] [cursor=pointer]
                          - button "移动所选页" [ref=e470] [cursor=pointer]
                          - button "复制所选页" [ref=e472] [cursor=pointer]
                          - button "合并 PDF 文件" [ref=e474] [cursor=pointer]
                          - button "提取 PDF 页面" [ref=e476] [cursor=pointer]
                          - button "旋转所选页" [ref=e478] [cursor=pointer]
                          - button "页面尺寸" [ref=e480] [cursor=pointer]
                          - button "旋转当前页" [ref=e482] [cursor=pointer]
                          - button "页面" [ref=e488] [cursor=pointer]
                        - generic [aria-hidden] [ref=e494]: 页面
                      - group "查看" [ref=e495]:
                        - generic [ref=e496]:
                          - button "查找" [ref=e497] [cursor=pointer]
                          - button "PDF 批注与表单侧栏" [pressed] [ref=e503] [cursor=pointer]:
                            - generic [ref=e508]: 侧栏
                        - generic [aria-hidden] [ref=e509]: 查看
                - generic [ref=e510]:
                  - navigation "PDF 侧边导航" [ref=e511]:
                    - button "PDF 文本查找侧栏" [ref=e512] [cursor=pointer]
                    - button "PDF 批注侧栏" [pressed] [ref=e517] [cursor=pointer]
                    - button "PDF 页面缩略图侧栏" [ref=e521] [cursor=pointer]
                    - button "PDF 表单侧栏" [ref=e526] [cursor=pointer]
                  - region "PDF 页面编辑区" [ref=e531]:
                    - generic [ref=e532]:
                      - img "PDF 第 1 页原文" [ref=e533]
                      - document "PDF 第 1 页原文选择复制": "Native PDF host migration: page 1 Original Contents remain independent from native annotations."
                      - generic "PDF 原生批注外观"
                      - group "PDF 原生批注交互层"
                      - img "PDF 页面标注" [ref=e534]
                      - textbox "PDF 页面表单 reviewer" [ref=e538]: Initial
                    - generic [ref=e539]: 第 1 页 · 100%
                  - complementary "PDF 批注与表单" [ref=e540]:
                    - group "PDF 侧栏内容" [ref=e541]:
                      - button "批注 0" [pressed] [ref=e542] [cursor=pointer]
                      - button "表单 2" [ref=e544] [cursor=pointer]
                      - button "文本查找" [ref=e546] [cursor=pointer]
                      - button "页面缩略图" [ref=e548] [cursor=pointer]
                    - generic [ref=e550]:
                      - strong [ref=e551]: 添加文字批注
                      - generic [ref=e552]:
                        - text: 类型
                        - generic [ref=e553]:
                          - generic [ref=e554]: PDF 新增批注类型
                          - button "PDF 新增批注类型 文字" [expanded] [active] [ref=e555] [cursor=pointer]:
                            - generic [ref=e556]: 文字
                      - generic [ref=e557]:
                        - text: 文字或说明
                        - textbox "PDF 新增文字" [ref=e559]
                      - generic [ref=e560]:
                        - text: 字体
                        - generic [ref=e561]:
                          - generic [ref=e562]: PDF 新增批注字体
                          - button "PDF 新增批注字体 Noto Sans SC" [ref=e563] [cursor=pointer]:
                            - generic [ref=e564]: Noto Sans SC
                      - generic [ref=e565]:
                        - text: 字号
                        - textbox "PDF 文字字号" [ref=e567]: "16"
                      - generic [ref=e568]:
                        - text: 线宽
                        - textbox "PDF 绘图线宽" [ref=e570]: "2"
                      - generic [ref=e571]:
                        - text: 文字与线条颜色
                        - generic "PDF 标注颜色" [ref=e572]:
                          - button "PDF 标注颜色" [ref=e573] [cursor=pointer]:
                            - generic [ref=e575]: "#253044"
                      - generic [ref=e576]:
                        - text: 文字标记颜色
                        - generic "PDF 文字标记颜色" [ref=e577]:
                          - button "PDF 文字标记颜色" [ref=e578] [cursor=pointer]:
                            - generic [ref=e580]: "#f5c542"
                      - paragraph [ref=e581]: 文字或便签点击页面放置；图形按住拖动，墨迹和多边形沿指针轨迹绘制。选中批注后可用方向键移动，Enter 编辑属性。
                      - generic [ref=e582]:
                        - text: 新批注与回复署名
                        - textbox "PDF 批注署名" [ref=e584]
                      - generic "PDF 批注列表" [ref=e585]
                - group "PDF 状态栏" [ref=e586]:
                  - group "PDF 页面导航" [ref=e587]:
                    - button "PDF 上一页" [disabled] [ref=e588]
                    - generic [ref=e592]:
                      - spinbutton "PDF 跳转页" [ref=e593]: "1"
                      - generic [ref=e594]:
                        - button "增加" [ref=e595] [cursor=pointer]:
                          - generic [aria-hidden] [ref=e596]: +
                        - button "减少" [disabled] [ref=e597]:
                          - generic [aria-hidden] [ref=e598]: −
                    - generic [ref=e599]: / 2
                    - button "PDF 下一页" [ref=e600] [cursor=pointer]
                  - generic "选择工具。PDF 原有正文保持原版式；可编辑新增批注和原文件的可填写表单。" [ref=e604]: 选择工具
                  - group "PDF 视图缩放" [ref=e605]:
                    - button "PDF 缩小视图" [ref=e606] [cursor=pointer]
                    - generic [ref=e611]:
                      - generic [ref=e612]: PDF 缩放
                      - button "PDF 缩放 100%" [ref=e613] [cursor=pointer]:
                        - generic [ref=e614]: 100%
                    - button "PDF 放大视图" [ref=e615] [cursor=pointer]
            - paragraph [ref=e620]: 文件保存在当前浏览器的本地文档空间。需要长期留存时，请导出文件。
          - group [ref=e621]:
            - generic "示例代码" [ref=e622] [cursor=pointer]:
              - generic [aria-hidden] [ref=e623]: </>
              - text: 示例代码
              - generic [aria-hidden] [ref=e624]: 展开 / 收起
        - heading "编辑能力" [level=2] [ref=e625]
        - table [ref=e627]:
          - rowgroup [ref=e628]:
            - row [ref=e629]:
              - columnheader "文档" [ref=e630]
              - columnheader "支持的操作" [ref=e631]
              - columnheader "当前范围" [ref=e632]
          - rowgroup [ref=e633]:
            - row [ref=e634]:
              - cell "Word" [ref=e635]
              - cell "字体与小数字号输入、正文排版、列表、表格、图片、页眉页脚、页码、查找替换、页面设置、撤销重做；导入与导出 DOCX" [ref=e636]
              - cell "支持内嵌图片与单节文档。修订、目录、浮动对象等复杂结构会提示暂不支持。" [ref=e637]
            - row [ref=e638]:
              - cell "Excel" [ref=e639]
              - cell "单元格与矩形选区、字体与小数字号输入、手动与自动行高/列宽、查找替换、边框与垂直对齐、清除格式、公式和跨表引用、格式、复制粘贴、工作表增删、行列插入删除、合并、冻结、排序、筛选、柱状图与折线图；导入与导出 XLSX" [ref=e640]
              - cell "10,000 行、256 列、32 张表、100,000 个已使用单元格。透视、宏、数组公式及复杂图表暂不支持。" [ref=e641]
            - row [ref=e642]:
              - cell "PDF" [ref=e643]
              - cell "分页与缩略图、缩放、旋转、全文查找、文字与高亮、矩形和手写批注、已有表单、撤销重做；导出 PDF" [ref=e644]
              - cell "批注和表单编辑。任意原始文字修改、原文重排及扫描件 OCR 暂不支持。" [ref=e645]
        - heading "组件接入" [level=2] [ref=e646]
        - paragraph [ref=e647]: UI 组件使用 Tiptap / ProseMirror 和公式计算库；文件适配使用 docx、ExcelJS、pdf-lib 与 PDF.js。本页无需文档服务器。宿主可以替换保存与导入导出回调，接入自己的文件系统。
        - paragraph [ref=e648]:
          - text: PDF 的 worker、字体与渲染由
          - code [ref=e649]: pdfRenderer
          - text: 提供。本页的适配代码位于
          - code [ref=e650]: docs/src/pages/collaboration/office-studio/
          - text: 。组件自 v0.4.0 起随
          - code [ref=e651]: "@zuvi/react"
          - text: 和 Registry 发布。
        - region "组件属性表，可横向滚动" [ref=e652]:
          - table [ref=e653]:
            - rowgroup [ref=e654]:
              - row [ref=e655]:
                - columnheader "属性名" [ref=e656]
                - columnheader "类型" [ref=e657]
                - columnheader "默认值" [ref=e658]
                - columnheader "说明" [ref=e659]
            - rowgroup [ref=e660]:
              - row [ref=e661]:
                - cell "value / defaultValue" [ref=e662]
                - cell [ref=e663]:
                  - code [ref=e664]: OfficeStudioDocument
                - cell [ref=e665]:
                  - code [ref=e666]: —
                - cell "受控文档或非受控初始文档；支持 Word、Excel、PDF 三种模型。" [ref=e667]
              - row [ref=e668]:
                - cell "onChange" [ref=e669]
                - cell [ref=e670]:
                  - code [ref=e671]: (document) => void
                - cell [ref=e672]:
                  - code [ref=e673]: —
                - cell "内容或文件名称变化。" [ref=e674]
              - row [ref=e675]:
                - cell "source / pdfRenderer" [ref=e676]
                - cell [ref=e677]:
                  - code [ref=e678]: Blob / StudioPdfRenderer
                - cell [ref=e679]:
                  - code [ref=e680]: —
                - cell "原始文件及 PDF 渲染适配；worker 资源由宿主管理。" [ref=e681]
              - row [ref=e682]:
                - cell "onSave / onExport / onPrint" [ref=e683]
                - cell [ref=e684]:
                  - code [ref=e685]: (document) => void | Promise<void>
                - cell [ref=e686]:
                  - code [ref=e687]: —
                - cell "宿主处理保存、导出或打印；返回后更新状态，失败可重试。" [ref=e688]
              - row [ref=e689]:
                - cell "onImport / onCreate" [ref=e690]
                - cell [ref=e691]:
                  - code [ref=e692]: (file | kind) => void | Promise<void>
                - cell [ref=e693]:
                  - code [ref=e694]: —
                - cell "宿主解析文件或创建模型，并更新受控值。" [ref=e695]
              - row [ref=e696]:
                - cell "readOnly / disabled" [ref=e697]
                - cell [ref=e698]:
                  - code [ref=e699]: boolean
                - cell [ref=e700]:
                  - code [ref=e701]: "false"
                - cell "只读预览或禁用编辑与文件操作。" [ref=e702]
              - row [ref=e703]:
                - cell "saveState" [ref=e704]
                - cell [ref=e705]:
                  - code [ref=e706]: "'saved' | 'saving' | 'unsaved' | 'error'"
                - cell [ref=e707]:
                  - code [ref=e708]: —
                - cell "宿主自动保存状态。" [ref=e709]
              - row [ref=e710]:
                - cell "height" [ref=e711]
                - cell [ref=e712]:
                  - code [ref=e713]: number | string
                - cell [ref=e714]:
                  - code [ref=e715]: "760"
                - cell "编辑器高度；100% 需要父容器设置确定高度。" [ref=e716]
              - row [ref=e717]:
                - cell "fullscreen / onFullscreenChange" [ref=e718]
                - cell [ref=e719]:
                  - code [ref=e720]: boolean / (value) => void
                - cell [ref=e721]:
                  - code [ref=e722]: —
                - cell "全屏布局，切换时编辑内容保持挂载。" [ref=e723]
              - row [ref=e724]:
                - cell "ref" [ref=e725]
                - cell [ref=e726]:
                  - code [ref=e727]: OfficeStudioHandle
                - cell [ref=e728]:
                  - code [ref=e729]: —
                - cell "getDocument()、save()、export()、print()、setFullscreen()。" [ref=e730]
              - row [ref=e731]:
                - cell "classNames" [ref=e732]
                - cell [ref=e733]:
                  - code [ref=e734]: "{ root?; header?; title?; actions?; stage?; status?; error? }"
                - cell [ref=e735]:
                  - code [ref=e736]: —
                - cell "追加语义结构类名，配合 data-part 与 CSS 变量定制。" [ref=e737]
  - text: ✓
  - listbox [ref=e739]:
    - option "文字 ✓" [selected] [ref=e740] [cursor=pointer]
    - option "便签" [ref=e741] [cursor=pointer]
    - option "高亮" [ref=e742] [cursor=pointer]
    - option "下划线" [ref=e743] [cursor=pointer]
    - option "删除线" [ref=e744] [cursor=pointer]
    - option "波浪线" [ref=e745] [cursor=pointer]
    - option "矩形" [ref=e746] [cursor=pointer]
    - option "椭圆" [ref=e747] [cursor=pointer]
    - option "直线" [ref=e748] [cursor=pointer]
    - option "箭头" [ref=e749] [cursor=pointer]
    - option "多边形" [ref=e750] [cursor=pointer]
    - option "折线" [ref=e751] [cursor=pointer]
    - option "墨迹" [ref=e752] [cursor=pointer]
  - text: ✓ ✓
```

# Test source

```ts
  45  |       const stream = pdf.context.lookup(ref);
  46  |       if (!(stream instanceof PDFRawStream)) throw new Error('Original Contents stream is missing');
  47  |       return { page, sha256: sha(stream.getContents()), decodedSha256: sha(decodePDFRawStream(stream).decode()) };
  48  |     });
  49  |   });
  50  | }
  51  | async function inspect(bytes: Uint8Array) {
  52  |   const pdf = await PDFDocument.load(bytes), annotations = annots(pdf);
  53  |   return {
  54  |     sha256: sha(bytes), pages: pdf.getPageCount(), contents: contentRecords(pdf),
  55  |     annotations: annotations.map(item => {
  56  |       const ap = item.dict.lookup(PDFName.of('AP'));
  57  |       const normal = ap instanceof PDFDict ? ap.lookup(PDFName.of('N')) : undefined;
  58  |       const border = item.dict.lookup(PDFName.of('BS'));
  59  |       const alpha = item.dict.lookup(PDFName.of('CA'));
  60  |       const reply = item.dict.get(PDFName.of('IRT'));
  61  |       const ends = item.dict.lookup(PDFName.of('LE'));
  62  |       const ink = item.dict.lookup(PDFName.of('InkList'));
  63  |       return {
  64  |         id: item.id, subtype: item.subtype, contents: item.contents, rect: item.rect, page: item.page,
  65  |         author: decoded(item.dict, 'T'), created: decoded(item.dict, 'CreationDate'), modified: decoded(item.dict, 'M'),
  66  |         color: numbers(item.dict, 'C'), fill: numbers(item.dict, 'IC'), quads: numbers(item.dict, 'QuadPoints'),
  67  |         line: numbers(item.dict, 'L'), vertices: numbers(item.dict, 'Vertices'),
  68  |         lineEnds: ends instanceof PDFArray ? ends.asArray().map(value => pdf.context.lookup(value)?.toString()) : [],
  69  |         ink: ink instanceof PDFArray ? ink.asArray().map(value => {
  70  |           const points = pdf.context.lookup(value);
  71  |           return points instanceof PDFArray ? points.asArray().map(number => (pdf.context.lookup(number) as PDFNumber).asNumber()) : [];
  72  |         }) : [],
  73  |         opacity: alpha instanceof PDFNumber ? alpha.asNumber() : 1,
  74  |         border: border instanceof PDFDict ? { width: numbersAsScalar(border, 'W'), style: decoded(border, 'S') } : undefined,
  75  |         appearanceSha256: normal instanceof PDFRawStream ? sha(normal.getContents()) : undefined,
  76  |         replyTo: reply instanceof PDFRef ? annotations.find(parent => parent.ref.toString() === reply.toString())?.id : undefined,
  77  |         replyType: decoded(item.dict, 'RT'), state: decoded(item.dict, 'State'), stateModel: decoded(item.dict, 'StateModel'),
  78  |       };
  79  |     }),
  80  |     fields: pdf.getForm().getFields().map(field => ({ name: field.getName(), readOnly: field.isReadOnly(), widgets: field.acroField.getWidgets().length })),
  81  |   };
  82  | }
  83  | function numbersAsScalar(dict: PDFDict, key: string): number | undefined {
  84  |   const value = dict.lookup(PDFName.of(key));
  85  |   return value instanceof PDFNumber ? value.asNumber() : undefined;
  86  | }
  87  | 
  88  | async function waitReady(page: Page) {
  89  |   await expect(page.locator('.zuvi-studio-pdf-paper > canvas').first()).toBeVisible();
  90  |   await expect(page.getByLabel('PDF 批注署名', { exact: true })).toBeEnabled();
  91  | }
  92  | async function waitSaved(page: Page) {
  93  |   await expect(page.locator('[data-save-state="saved"]')).toBeVisible();
  94  | }
  95  | async function activeRecord(page: Page) {
  96  |   await waitSaved(page);
  97  |   return page.evaluate(async () => {
  98  |     const modulePath = '/src/pages/collaboration/office-studio/studio-storage.ts';
  99  |     const module = await import(modulePath) as typeof import('../docs/src/pages/collaboration/office-studio/studio-storage');
  100 |     const storage = module.createStudioStorage(), id = await storage.activeId();
  101 |     const file = id ? await storage.load(id) : undefined;
  102 |     if (!file || !file.source || file.document.kind !== 'pdf') throw new Error('Active persisted PDF pair is missing');
  103 |     const hash = await crypto.subtle.digest('SHA-256', await file.source.arrayBuffer());
  104 |     return { revision: file.revision, document: file.document,
  105 |       sourceHash: [...new Uint8Array(hash)].map(value => value.toString(16).padStart(2, '0')).join('') };
  106 |   });
  107 | }
  108 | async function open(page: Page, name = 'original.pdf', fullscreen = true, input?: Uint8Array) {
  109 |   await mkdir(audit, { recursive: true });
  110 |   const bytes = input ? Buffer.from(input) : await readFile(path.join(hostEvidence, name));
  111 |   await writeFile(path.join(audit, 'fixture-' + name), bytes);
  112 |   await page.setViewportSize({ width: 1440, height: 1100 });
  113 |   await page.goto('/#/components/office-studio');
  114 |   await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name: 'Native-' + name, mimeType: 'application/pdf', buffer: bytes });
  115 |   await waitReady(page);
  116 |   if (fullscreen) await page.getByRole('button', { name: '全屏编辑', exact: true }).click();
  117 |   await waitReady(page);
  118 |   return bytes;
  119 | }
  120 | async function lockedAndNoApFixture() {
  121 |   const pdf = await PDFDocument.load(await readFile(path.join(hostEvidence, 'native-twelve-types.pdf')));
  122 |   const paper = pdf.getPages()[0], square = annots(pdf).find(item => item.subtype === 'Square')!;
  123 |   const locked = pdf.context.register(pdf.context.obj({ Type: 'Annot', Subtype: 'Square', P: paper.ref,
  124 |     Rect: [315, 425, 445, 465], F: 4 | 64, C: [0.1, 0.2, 0.3],
  125 |     AP: square.dict.get(PDFName.of('AP')), Contents: PDFHexString.fromText('Source locked square'),
  126 |     ZuviAnnotationId: PDFHexString.fromText('native-ui-locked-square'), NM: PDFHexString.fromText('native-ui-locked-square') }));
  127 |   paper.node.addAnnot(locked);
  128 |   const note = pdf.context.register(pdf.context.obj({ Type: 'Annot', Subtype: 'Text', P: paper.ref,
  129 |     Rect: [430, 520, 430, 520], F: 4, Name: 'Note', Contents: PDFHexString.fromText('Source zero-rect no-AP note'),
  130 |     ZuviAnnotationId: PDFHexString.fromText('native-ui-noap-note'), NM: PDFHexString.fromText('native-ui-noap-note') }));
  131 |   paper.node.addAnnot(note);
  132 |   return new Uint8Array(await pdf.save({ updateFieldAppearances: false, useObjectStreams: false }));
  133 | }
  134 | async function nativeIds(page: Page) {
  135 |   return page.locator('.zuvi-studio-pdf-native-hit').evaluateAll(elements => elements.map(element => element.getAttribute('data-native-id')!));
  136 | }
  137 | function hit(page: Page, id: string): Locator {
  138 |   return page.locator(`.zuvi-studio-pdf-native-hit[data-native-id="${id}"]`);
  139 | }
  140 | async function choose(page: Page, tool: Tool) {
  141 |   await waitReady(page);
  142 |   const select = page.getByRole('button', { name: /^PDF 新增批注类型/ });
  143 |   if (!(await select.count())) await page.getByRole('button', { name: '新增批注', exact: true }).click();
  144 |   await select.click();
> 145 |   await page.getByRole('option', { name: labels[tool], exact: true }).click();
      |                                                                       ^ TimeoutError: locator.click: Timeout 20000ms exceeded.
  146 | }
  147 | async function point(page: Page, x: number, y: number) {
  148 |   const paper = page.locator('.zuvi-studio-pdf-paper');
  149 |   const box = await paper.boundingBox();
  150 |   if (!box) throw new Error('Native paper has no rendered bounds');
  151 |   return { x: box.x + x * box.width / 500, y: box.y + (700 - y) * box.height / 700 };
  152 | }
  153 | async function create(page: Page, tool: Tool, points: readonly (readonly [number, number])[], contents = '') {
  154 |   const previous = await nativeIds(page);
  155 |   await choose(page, tool);
  156 |   await page.getByLabel('PDF 新增文字', { exact: true }).fill(contents);
  157 |   const first = await point(page, points[0][0], points[0][1]);
  158 |   await page.mouse.move(first.x, first.y); await page.mouse.down();
  159 |   for (const [x, y] of points.slice(1)) {
  160 |     const target = await point(page, x, y); await page.mouse.move(target.x, target.y, { steps: 4 });
  161 |   }
  162 |   await page.mouse.up();
  163 |   await expect.poll(async () => (await nativeIds(page)).length).toBe(previous.length + 1);
  164 |   await waitReady(page);
  165 |   const added = (await nativeIds(page)).find(id => !previous.includes(id));
  166 |   if (!added) throw new Error('No accepted native annotation identity');
  167 |   return added;
  168 | }
  169 | async function properties(page: Page, id: string) {
  170 |   await hit(page, id).click();
  171 |   await page.getByRole('button', { name: '编辑批注属性', exact: true }).click();
  172 |   const dialog = page.getByRole('dialog').filter({ has: page.getByLabel('PDF 批注横坐标', { exact: true }) });
  173 |   await expect(dialog).toBeVisible();
  174 |   return dialog;
  175 | }
  176 | async function selectValue(page: Page, scope: Locator, label: string, option: string) {
  177 |   await scope.getByRole('button', { name: new RegExp('^' + label) }).click();
  178 |   await page.getByRole('option', { name: option, exact: true }).click();
  179 | }
  180 | async function color(page: Page, scope: Locator, label: string, value: string) {
  181 |   await scope.getByRole('button', { name: label, exact: true }).click();
  182 |   const input = page.locator('.zuvi-color-picker-panel input[data-part="hex"]');
  183 |   await input.fill(value); await input.press('Enter'); await input.press('Escape');
  184 | }
  185 | async function saveProperties(page: Page, dialog: Locator) {
  186 |   await dialog.getByRole('button', { name: '应用批注属性', exact: true }).click();
  187 |   await expect(dialog).toHaveCount(0); await waitReady(page);
  188 | }
  189 | async function exported(page: Page, name: string) {
  190 |   const pending = page.waitForEvent('download');
  191 |   await page.getByRole('button', { name: '导出文件', exact: true }).click();
  192 |   const download = await pending, file = await download.path();
  193 |   if (!file) throw new Error('Native PDF download has no bytes');
  194 |   const bytes = await readFile(file); await writeFile(path.join(audit, name), bytes);
  195 |   await writeFile(path.join(audit, name.replace(/\.pdf$/, '.json')), JSON.stringify(await inspect(bytes), null, 2));
  196 |   return bytes;
  197 | }
  198 | async function reopenTwice(page: Page, prefix: string, original: Uint8Array, verify: (pdf: PDFDocument, round: number) => Promise<void> | void) {
  199 |   const originalHashes = contentRecords(await PDFDocument.load(original)).map(item => item.sha256);
  200 |   let bytes: Uint8Array = original;
  201 |   for (let round = 1; round <= 2; round++) {
  202 |     bytes = await exported(page, `${prefix}-round-${round}.pdf`);
  203 |     const pdf = await PDFDocument.load(bytes), hashes = contentRecords(pdf).map(item => item.sha256);
  204 |     for (const hash of originalHashes) expect(hashes).toContain(hash);
  205 |     for (const hash of hashes) expect(originalHashes).toContain(hash);
  206 |     await verify(pdf, round);
  207 |     await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name: `${prefix}-round-${round}.pdf`, mimeType: 'application/pdf', buffer: Buffer.from(bytes) });
  208 |     await waitReady(page);
  209 |   }
  210 |   return bytes;
  211 | }
  212 | async function persistFixture(page: Page, kind: 'legacy' | 'recipe') {
  213 |   await mkdir(audit, { recursive: true });
  214 |   const bytes = await readFile(path.join(hostEvidence, 'original.pdf'));
  215 |   await page.goto('/');
  216 |   const document = await page.evaluate(async ({ bytes, kind }) => {
  217 |     const codecPath = '/src/pages/collaboration/office-studio/studio-pdf-codec.ts';
  218 |     const storagePath = '/src/pages/collaboration/office-studio/studio-storage.ts';
  219 |     const codec = await import(codecPath) as typeof import('../docs/src/pages/collaboration/office-studio/studio-pdf-codec');
  220 |     const storageModule = await import(storagePath) as typeof import('../docs/src/pages/collaboration/office-studio/studio-storage');
  221 |     const source = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
  222 |     let document = await codec.importStudioPdf(source, `Persisted-${kind}.pdf`, { native: false });
  223 |     if (kind === 'legacy') {
  224 |       document = { ...document, marks: [
  225 |         { id: 'legacy-ui-text', type: 'text', page: 0, x: 45, y: 570, size: 14, color: '#253044', text: '旧中文批注继续编辑', replies: [{ id: 'legacy-ui-reply', text: '旧回复保留一次' }] },
  226 |         { id: 'legacy-ui-highlight', type: 'highlight', page: 0, x: 45, y: 520, width: 250, height: 18, size: 12, text: 'Old highlight', color: '#f5c542' },
  227 |         { id: 'legacy-ui-square', type: 'rectangle', page: 0, x: 45, y: 430, width: 180, height: 45, size: 12, text: 'Old square', color: '#253044', lineWidth: 2 },
  228 |         { id: 'legacy-ui-ink', type: 'ink', page: 0, x: 270, y: 420, width: 140, height: 50, size: 12, text: 'Old ink', color: '#253044', lineWidth: 2, points: [[0, 10], [45, 45], [90, 0], [140, 40]] },
  229 |       ] };
  230 |     } else {
  231 |       const workspacePath = '/src/pages/collaboration/office-studio/studio-pdf-native/workspace.ts';
  232 |       const documentPath = '/src/pages/collaboration/office-studio/studio-pdf-native-document.ts';
  233 |       const native = await import(workspacePath) as typeof import('../docs/src/pages/collaboration/office-studio/studio-pdf-native/workspace');
  234 |       const helpers = await import(documentPath) as typeof import('../docs/src/pages/collaboration/office-studio/studio-pdf-native-document');
  235 |       let workspace = await native.NativePdfWorkspace.read(new Uint8Array(bytes), document.pages!.map(page => page.id));
  236 |       const now = new Date().toISOString();
  237 |       workspace = workspace.accept({ type: 'create', now, annotation: {
  238 |         id: 'recipe-ui-main', pageId: document.pages![0].id, kind: 'freeText', rect: [45, 430, 330, 480],
  239 |         contents: '未保存记录原生中文', font: { family: 'Noto Sans SC', size: 16, color: [0.1, 0.2, 0.3] },
  240 |       } });
  241 |       const targets = [
  242 |         { id: document.pages![1].id, fromPageId: document.pages![1].id },
  243 |         { id: 'recipe-ui-copy', fromPageId: document.pages![0].id, copyGroup: 'recipe-ui-copy-group' },
  244 |         { id: document.pages![0].id, fromPageId: document.pages![0].id },
  245 |       ];
```