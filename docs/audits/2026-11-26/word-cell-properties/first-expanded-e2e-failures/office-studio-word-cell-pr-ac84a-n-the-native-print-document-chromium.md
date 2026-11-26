# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-word-cell-properties.spec.ts >> aligns actual short content within a taller automatic row with mixed gaps and reproduces it in the native print document
- Location: e2e/office-studio-word-cell-properties.spec.ts:370:1

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 0.1
Received:   196

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
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
                - button "打开本地文档 Auto gaps.docx" [ref=e356] [cursor=pointer]:
                  - generic [ref=e357]: Auto gaps.docx
              - button "历史版本" [ref=e358] [cursor=pointer]
              - switch "只读预览" [ref=e360] [cursor=pointer]
            - region "Word 文档编辑器" [ref=e364]:
              - generic [ref=e365]:
                - generic [ref=e366]:
                  - generic [ref=e371]: Word
                  - generic "可编辑 · ⌘ / Ctrl S 保存" [ref=e372]:
                    - status "已保存" [ref=e373]
                - textbox "文档名称" [ref=e378]: Auto gaps.docx
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
                        - button "表格公式" [ref=e497] [cursor=pointer]
                        - button "数学公式" [ref=e499] [cursor=pointer]
                        - button "刷新公式" [ref=e501] [cursor=pointer]
                        - button "表格转文本" [ref=e503] [cursor=pointer]
                        - button "表格行属性" [ref=e505] [cursor=pointer]
                        - button "单元格对齐与边距" [ref=e507] [cursor=pointer]
                        - button "平均分布表格列" [ref=e509] [cursor=pointer]
                        - button "平均分布行" [disabled] [ref=e511]
                        - button "增加行" [ref=e513] [cursor=pointer]
                        - button "增加列" [ref=e515] [cursor=pointer]
                        - button "删除行" [ref=e517] [cursor=pointer]
                        - button "删除列" [ref=e519] [cursor=pointer]
                        - button "合并单元格" [disabled] [ref=e521]
                        - button "拆分单元格" [disabled] [ref=e523]
                        - button "切换标题行" [ref=e525] [cursor=pointer]
                        - button "删除表格" [ref=e527] [cursor=pointer]
                - generic [ref=e530]:
                  - toolbar "Word 文档工具" [ref=e531]:
                    - button "打开查找与替换" [ref=e532] [cursor=pointer]
                    - button "打开文档大纲" [ref=e537] [cursor=pointer]
                    - button "打开字数统计" [ref=e541] [cursor=pointer]
                  - generic [ref=e546]:
                    - generic "段落缩进标尺" [ref=e547]:
                      - generic [aria-hidden] [ref=e549]: "0"
                      - generic [aria-hidden] [ref=e550]: "1"
                      - generic [aria-hidden] [ref=e551]: "2"
                      - generic [aria-hidden] [ref=e552]: "3"
                      - generic [aria-hidden] [ref=e553]: "4"
                      - generic [aria-hidden] [ref=e554]: "5"
                      - generic [aria-hidden] [ref=e555]: "6"
                      - generic [aria-hidden] [ref=e556]: "7"
                      - generic [aria-hidden] [ref=e557]: "8"
                      - generic [aria-hidden] [ref=e558]: "9"
                      - generic [aria-hidden] [ref=e559]: "10"
                      - generic [aria-hidden] [ref=e560]: "11"
                      - generic [aria-hidden] [ref=e561]: "12"
                      - generic [aria-hidden] [ref=e562]: "13"
                      - generic [aria-hidden] [ref=e563]: "14"
                      - generic [aria-hidden] [ref=e564]: "15"
                      - generic [aria-hidden] [ref=e565]: "16"
                      - generic [aria-hidden] [ref=e566]: "17"
                      - slider "首行缩进标尺" [ref=e567] [cursor=pointer]
                      - slider "悬挂缩进标尺" [ref=e569] [cursor=pointer]
                      - slider "左缩进标尺" [ref=e571] [cursor=pointer]
                      - slider "右缩进标尺" [ref=e573] [cursor=pointer]
                    - generic [ref=e575]:
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
                      - article "文档纸张" [ref=e576]:
                        - region "页眉区域" [ref=e577]
                        - textbox "Word 文档正文" [active] [ref=e579]:
                          - table [ref=e581]:
                            - rowgroup [ref=e585]:
                              - row [ref=e586]:
                                - cell [ref=e587]:
                                  - paragraph [ref=e589]: Long line 0Long line 1Long line 2Long line 3Long line 4Long line 5Long line 6Long line 7
                                - cell [ref=e590]:
                                  - paragraph [ref=e592]: Short
                              - row [ref=e593]:
                                - cell [ref=e594]:
                                  - paragraph [ref=e596]: Zero
                                - cell [ref=e597]:
                                  - paragraph [ref=e599]: End
                        - region "页脚区域" [ref=e600]
                - generic [ref=e601]:
                  - generic [ref=e602]: 84 字 · A4 · 纵向
                  - generic [ref=e603]:
                    - generic [ref=e604]: 缩放
                    - generic [ref=e605]:
                      - generic [ref=e606]: Word 缩放
                      - button "Word 缩放 适应宽度" [ref=e607] [cursor=pointer]:
                        - generic [ref=e608]: 适应宽度
            - paragraph [ref=e609]: 文件保存在当前浏览器的本地文档空间。需要长期留存时，请导出文件。
          - group [ref=e610]:
            - generic "示例代码" [ref=e611] [cursor=pointer]:
              - generic [aria-hidden] [ref=e612]: </>
              - text: 示例代码
              - generic [aria-hidden] [ref=e613]: 展开 / 收起
        - heading "编辑能力" [level=2] [ref=e614]
        - table [ref=e616]:
          - rowgroup [ref=e617]:
            - row [ref=e618]:
              - columnheader "文档" [ref=e619]
              - columnheader "支持的操作" [ref=e620]
              - columnheader "当前范围" [ref=e621]
          - rowgroup [ref=e622]:
            - row [ref=e623]:
              - cell "Word" [ref=e624]
              - cell "字体与小数字号输入、正文排版、列表、表格、图片、页眉页脚、页码、查找替换、页面设置、撤销重做；导入与导出 DOCX" [ref=e625]
              - cell "支持内嵌图片与单节文档。修订、目录、浮动对象等复杂结构会提示暂不支持。" [ref=e626]
            - row [ref=e627]:
              - cell "Excel" [ref=e628]
              - cell "单元格与矩形选区、字体与小数字号输入、手动与自动行高/列宽、查找替换、边框与垂直对齐、清除格式、公式和跨表引用、格式、复制粘贴、工作表增删、行列插入删除、合并、冻结、排序、筛选、柱状图与折线图；导入与导出 XLSX" [ref=e629]
              - cell "10,000 行、256 列、32 张表、100,000 个已使用单元格。透视、宏、数组公式及复杂图表暂不支持。" [ref=e630]
            - row [ref=e631]:
              - cell "PDF" [ref=e632]
              - cell "分页与缩略图、缩放、旋转、全文查找、文字与高亮、矩形和手写批注、已有表单、撤销重做；导出 PDF" [ref=e633]
              - cell "批注和表单编辑。任意原始文字修改、原文重排及扫描件 OCR 暂不支持。" [ref=e634]
        - heading "组件接入" [level=2] [ref=e635]
        - paragraph [ref=e636]: UI 组件使用 Tiptap / ProseMirror 和公式计算库；文件适配使用 docx、ExcelJS、pdf-lib 与 PDF.js。本页无需文档服务器。宿主可以替换保存与导入导出回调，接入自己的文件系统。
        - paragraph [ref=e637]:
          - text: PDF 的 worker、字体与渲染由
          - code [ref=e638]: pdfRenderer
          - text: 提供。本页的适配代码位于
          - code [ref=e639]: docs/src/pages/collaboration/office-studio/
          - text: 。组件自 v0.4.0 起随
          - code [ref=e640]: "@zuvi/react"
          - text: 和 Registry 发布。
        - region "组件属性表，可横向滚动" [ref=e641]:
          - table [ref=e642]:
            - rowgroup [ref=e643]:
              - row [ref=e644]:
                - columnheader "属性名" [ref=e645]
                - columnheader "类型" [ref=e646]
                - columnheader "默认值" [ref=e647]
                - columnheader "说明" [ref=e648]
            - rowgroup [ref=e649]:
              - row [ref=e650]:
                - cell "value / defaultValue" [ref=e651]
                - cell [ref=e652]:
                  - code [ref=e653]: OfficeStudioDocument
                - cell [ref=e654]:
                  - code [ref=e655]: —
                - cell "受控文档或非受控初始文档；支持 Word、Excel、PDF 三种模型。" [ref=e656]
              - row [ref=e657]:
                - cell "onChange" [ref=e658]
                - cell [ref=e659]:
                  - code [ref=e660]: (document) => void
                - cell [ref=e661]:
                  - code [ref=e662]: —
                - cell "内容或文件名称变化。" [ref=e663]
              - row [ref=e664]:
                - cell "source / pdfRenderer" [ref=e665]
                - cell [ref=e666]:
                  - code [ref=e667]: Blob / StudioPdfRenderer
                - cell [ref=e668]:
                  - code [ref=e669]: —
                - cell "原始文件及 PDF 渲染适配；worker 资源由宿主管理。" [ref=e670]
              - row [ref=e671]:
                - cell "onSave / onExport / onPrint" [ref=e672]
                - cell [ref=e673]:
                  - code [ref=e674]: (document) => void | Promise<void>
                - cell [ref=e675]:
                  - code [ref=e676]: —
                - cell "宿主处理保存、导出或打印；返回后更新状态，失败可重试。" [ref=e677]
              - row [ref=e678]:
                - cell "onImport / onCreate" [ref=e679]
                - cell [ref=e680]:
                  - code [ref=e681]: (file | kind) => void | Promise<void>
                - cell [ref=e682]:
                  - code [ref=e683]: —
                - cell "宿主解析文件或创建模型，并更新受控值。" [ref=e684]
              - row [ref=e685]:
                - cell "readOnly / disabled" [ref=e686]
                - cell [ref=e687]:
                  - code [ref=e688]: boolean
                - cell [ref=e689]:
                  - code [ref=e690]: "false"
                - cell "只读预览或禁用编辑与文件操作。" [ref=e691]
              - row [ref=e692]:
                - cell "saveState" [ref=e693]
                - cell [ref=e694]:
                  - code [ref=e695]: "'saved' | 'saving' | 'unsaved' | 'error'"
                - cell [ref=e696]:
                  - code [ref=e697]: —
                - cell "宿主自动保存状态。" [ref=e698]
              - row [ref=e699]:
                - cell "height" [ref=e700]
                - cell [ref=e701]:
                  - code [ref=e702]: number | string
                - cell [ref=e703]:
                  - code [ref=e704]: "760"
                - cell "编辑器高度；100% 需要父容器设置确定高度。" [ref=e705]
              - row [ref=e706]:
                - cell "fullscreen / onFullscreenChange" [ref=e707]
                - cell [ref=e708]:
                  - code [ref=e709]: boolean / (value) => void
                - cell [ref=e710]:
                  - code [ref=e711]: —
                - cell "全屏布局，切换时编辑内容保持挂载。" [ref=e712]
              - row [ref=e713]:
                - cell "ref" [ref=e714]
                - cell [ref=e715]:
                  - code [ref=e716]: OfficeStudioHandle
                - cell [ref=e717]:
                  - code [ref=e718]: —
                - cell "getDocument()、save()、export()、print()、setFullscreen()。" [ref=e719]
              - row [ref=e720]:
                - cell "classNames" [ref=e721]
                - cell [ref=e722]:
                  - code [ref=e723]: "{ root?; header?; title?; actions?; stage?; status?; error? }"
                - cell [ref=e724]:
                  - code [ref=e725]: —
                - cell "追加语义结构类名，配合 data-part 与 CSS 变量定制。" [ref=e726]
  - text: ✓ ✓ ✓ ✓
```

# Test source

```ts
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
  339 |   expect(await width()).toBe(600);
  340 |   await page.mouse.move(point.x + 35 * point.scale, point.y, { steps: 4 });
  341 |   await expect(table).toHaveAttribute('data-word-column-resize-preview', ''); expect(await width()).toBeGreaterThan(630);
  342 |   expect(await table.locator('td').evaluateAll(cells => cells.map(cell => cell.getAttribute('data-colwidth')))).toEqual(initialColumns);
  343 |   await page.keyboard.press('Escape'); await page.mouse.up();
  344 |   await expect(table).not.toHaveAttribute('data-word-column-resize-preview'); expect(await width()).toBe(600);
  345 |   expect(await table.locator('td').evaluateAll(cells => cells.map(cell => cell.getAttribute('data-colwidth')))).toEqual(initialColumns);
  346 |   point = await handle(); await page.mouse.move(point.x, point.y); await page.mouse.down(); expect(await width()).toBe(600);
  347 |   await page.mouse.move(point.x + 40 * point.scale, point.y, { steps: 5 });
  348 |   const previewWidth = await width(); expect(previewWidth).toBeGreaterThanOrEqual(639); expect(previewWidth).toBeLessThanOrEqual(641);
  349 |   await page.screenshot({ path: path.join(audit, 'cell-column-preview.png'), fullPage: true });
  350 |   await page.mouse.up(); await expect(table).not.toHaveAttribute('data-word-column-resize-preview'); expect(await width()).toBe(previewWidth);
  351 |   const resized = Number((await target.getAttribute('data-colwidth'))!.split(',')[0]); expect(resized).toBeGreaterThanOrEqual(327); expect(resized).toBeLessThanOrEqual(329);
  352 |   await page.getByRole('tab', { name: '开始', exact: true }).click(); await page.getByRole('button', { name: '撤销', exact: true }).click(); expect(await width()).toBe(600);
  353 |   expect(await table.locator('td').evaluateAll(cells => cells.map(cell => cell.getAttribute('data-colwidth')))).toEqual(initialColumns);
  354 |   await page.getByRole('button', { name: '重做', exact: true }).click(); expect(await width()).toBe(previewWidth);
  355 |   let expectedGrid = Math.round((resized + 12) * 15);
  356 |   for (let round = 1; round <= 2; round++) {
  357 |     const download = page.waitForEvent('download'); await page.getByRole('button', { name: '导出文件', exact: true }).click();
  358 |     const bytes = await readFile((await (await download).path())!); await writeFile(path.join(audit, `cell-column-round-${round}.docx`), bytes);
  359 |     const xml = await (await JSZip.loadAsync(bytes)).file('word/document.xml')!.async('string');
  360 |     const grids = Array.from(xml.matchAll(/<w:gridCol[^>]*w:w="(\d+)"/g), match => Number(match[1])); expect(grids).toEqual([expectedGrid, 4500]);
  361 |     await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name: `Columns-${round}.docx`, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: bytes });
  362 |     await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(`Columns-${round}.docx`);
  363 |     await expect(table).toHaveAttribute('data-word-spacing-layout', 'mixed');
  364 |     expect(Number((await target.getAttribute('data-colwidth'))!.split(',')[0])).toBeCloseTo(expectedGrid / 15 - 12, 1);
  365 |     expectedGrid = grids[0];
  366 |   }
  367 |   await writeFile(path.join(audit, 'cell-column-metrics.json'), JSON.stringify({ initialColumns, previewWidth, resized, expectedGrid }, null, 2) + '\n');
  368 | });
  369 | 
  370 | test('aligns actual short content within a taller automatic row with mixed gaps and reproduces it in the native print document', async ({ page, context }) => {
  371 |   const audit = path.resolve('docs/audits/2026-11-26/word-cell-properties');
  372 |   const long = Array.from({ length: 8 }, (_, index) => `<w:r><w:t>Long line ${index}</w:t>${index < 7 ? '<w:br/>' : ''}</w:r>`).join('');
  373 |   const source = await tableFile(`<w:tbl><w:tblPr><w:tblCellSpacing w:w="60" w:type="dxa"/></w:tblPr><w:tblGrid><w:gridCol w:w="4500"/><w:gridCol w:w="4500"/></w:tblGrid><w:tr><w:tc><w:p>${long}</w:p></w:tc><w:tc><w:p><w:r><w:t>Short</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:trPr><w:tblCellSpacing w:type="nil"/></w:trPr><w:tc><w:p><w:r><w:t>Zero</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>End</w:t></w:r></w:p></w:tc></w:tr></w:tbl>`);
  374 |   await writeFile(path.join(audit, 'cell-auto-source.docx'), source);
  375 |   await page.goto('/#/components/office-studio'); await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name: 'Auto gaps.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: source });
  376 |   await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue('Auto gaps.docx');
  377 |   const table = page.getByRole('textbox', { name: 'Word 文档正文', exact: true }).locator('table').first(), target = table.locator('td').nth(1);
  378 |   await expect(table).toHaveAttribute('data-word-spacing-layout', 'mixed');
  379 |   const measure = (element: Element) => {
  380 |     const cells = element.querySelectorAll<HTMLElement>(':scope > tbody > tr > td'), first = cells[0].querySelector<HTMLElement>(':scope > [data-word-cell-content]')!, short = cells[1].querySelector<HTMLElement>(':scope > [data-word-cell-content]')!;
  381 |     const range = document.createRange(); range.selectNodeContents(short.querySelector('p')!);
  382 |     const scale = element.getBoundingClientRect().width / (element as HTMLElement).offsetWidth;
  383 |     return { longHeight: first.getBoundingClientRect().height / scale, shortHeight: short.getBoundingClientRect().height / scale, top: (range.getBoundingClientRect().top - short.getBoundingClientRect().top) / scale, minHeight: getComputedStyle(short).minHeight };
  384 |   };
  385 |   await expect.poll(async () => parseFloat((await table.evaluate(measure)).minHeight)).toBeGreaterThan(100);
  386 |   const positions: Record<string, ReturnType<typeof measure>> = {};
  387 |   for (const [label, key] of [['上左对齐', 'top'], ['中左对齐', 'center'], ['下左对齐', 'bottom']]) {
  388 |     await target.locator('p').click(); await page.getByRole('tab', { name: '插入', exact: true }).click(); await page.getByRole('button', { name: '单元格对齐与边距', exact: true }).click();
  389 |     await page.getByRole('button', { name: label, exact: true }).click(); await page.getByRole('button', { name: '应用单元格属性', exact: true }).click();
> 390 |     await expect.poll(async () => Math.abs((await table.evaluate(measure)).longHeight - (await table.evaluate(measure)).shortHeight)).toBeLessThan(0.1);
      |                                                                                                                                       ^ Error: expect(received).toBeLessThan(expected)
  391 |     positions[key] = await table.evaluate(measure);
  392 |   }
  393 |   expect(positions.center.top - positions.top.top).toBeGreaterThan(50); expect(positions.bottom.top - positions.center.top).toBeGreaterThan(50);
  394 |   for (let round = 1; round <= 2; round++) {
  395 |     const pending = page.waitForEvent('download'); await page.getByRole('button', { name: '导出文件', exact: true }).click(); const bytes = await readFile((await (await pending).path())!); await writeFile(path.join(audit, `cell-auto-round-${round}.docx`), bytes);
  396 |     await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name: `Auto-${round}.docx`, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: bytes });
  397 |     await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(`Auto-${round}.docx`); await expect.poll(async () => (await table.evaluate(measure)).top).toBeGreaterThan(positions.center.top + 50);
  398 |   }
  399 |   await page.evaluate(() => window.addEventListener('message', event => { if (event.data?.type === 'cell-auto-print') (window as Window & { autoPrint?: string }).autoPrint = event.data.html; }));
  400 |   await page.addInitScript(() => { window.print = () => { window.parent.postMessage({ type: 'cell-auto-print', html: document.documentElement.outerHTML }, '*'); window.dispatchEvent(new Event('afterprint')); }; });
  401 |   await page.getByRole('button', { name: '打印', exact: true }).click(); await expect.poll(() => page.evaluate(() => (window as Window & { autoPrint?: string }).autoPrint)).toBeTruthy();
  402 |   const preview = await context.newPage(); await preview.setContent(await page.evaluate(() => (window as Window & { autoPrint?: string }).autoPrint!)); await preview.evaluate(() => document.fonts.ready);
  403 |   const printed = await preview.locator('table').first().evaluate(measure); expect(Math.abs(printed.longHeight - printed.shortHeight)).toBeLessThan(0.1); expect(printed.top).toBeGreaterThan(100);
  404 |   await preview.pdf({ path: path.join(audit, 'cell-auto-print.pdf'), preferCSSPageSize: true, printBackground: true }); await preview.close();
  405 |   await page.screenshot({ path: path.join(audit, 'cell-auto-light.png'), fullPage: true });
  406 |   await writeFile(path.join(audit, 'cell-auto-metrics.json'), JSON.stringify({ positions, printed }, null, 2) + '\n');
  407 | });
  408 | 
```