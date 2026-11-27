# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-pdf-native-annotations.spec.ts >> P014 saves four text markers from actual original-text selections with exact native quads, alpha, removal and undo
- Location: e2e/office-studio-pdf-native-annotations.spec.ts:322:1

# Error details

```
Test timeout of 180000ms exceeded.
```

```
Error: locator.click: Test timeout of 180000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '高亮', exact: true })

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
                      - document "PDF 第 1 页原文选择复制" [active]: "Native PDF host migration: page 1 Original Contents remain independent from native annotations."
                      - generic "PDF 原生批注外观"
                      - group "PDF 原生批注交互层"
                      - img "PDF 页面标注" [ref=e529]
                      - textbox "PDF 页面表单 reviewer" [ref=e533]: Initial
                    - generic [ref=e534]: 第 1 页 · 100%
                  - complementary "PDF 批注与表单" [ref=e535]:
                    - group "PDF 侧栏内容" [ref=e536]:
                      - button "批注 0" [pressed] [ref=e537] [cursor=pointer]
                      - button "表单 2" [ref=e539] [cursor=pointer]
                      - button "文本查找" [ref=e541] [cursor=pointer]
                      - button "页面缩略图" [ref=e543] [cursor=pointer]
                    - generic [ref=e545]:
                      - strong [ref=e546]: 添加文字批注
                      - generic [ref=e547]:
                        - text: 类型
                        - generic [ref=e548]:
                          - generic [ref=e549]: PDF 新增批注类型
                          - button "PDF 新增批注类型 文字" [ref=e550] [cursor=pointer]:
                            - generic [ref=e551]: 文字
                      - generic [ref=e552]:
                        - text: 文字或说明
                        - textbox "PDF 新增文字" [ref=e554]
                      - generic [ref=e555]:
                        - text: 字体
                        - generic [ref=e556]:
                          - generic [ref=e557]: PDF 新增批注字体
                          - button "PDF 新增批注字体 Noto Sans SC" [ref=e558] [cursor=pointer]:
                            - generic [ref=e559]: Noto Sans SC
                      - generic [ref=e560]:
                        - text: 字号
                        - textbox "PDF 文字字号" [ref=e562]: "16"
                      - generic [ref=e563]:
                        - text: 线宽
                        - textbox "PDF 绘图线宽" [ref=e565]: "2"
                      - generic [ref=e566]:
                        - text: 文字与线条颜色
                        - generic "PDF 标注颜色" [ref=e567]:
                          - button "PDF 标注颜色" [ref=e568] [cursor=pointer]:
                            - generic [ref=e570]: "#253044"
                      - generic [ref=e571]:
                        - text: 文字标记颜色
                        - generic "PDF 文字标记颜色" [ref=e572]:
                          - button "PDF 文字标记颜色" [ref=e573] [cursor=pointer]:
                            - generic [ref=e575]: "#f5c542"
                      - paragraph [ref=e576]: 文字或便签点击页面放置；图形按住拖动，墨迹和多边形沿指针轨迹绘制。选中批注后可用方向键移动，Enter 编辑属性。
                      - generic [ref=e577]:
                        - text: 新批注与回复署名
                        - textbox "PDF 批注署名" [ref=e579]
                      - generic "PDF 批注列表" [ref=e580]
                - group "PDF 状态栏" [ref=e581]:
                  - group "PDF 页面导航" [ref=e582]:
                    - button "PDF 上一页" [disabled] [ref=e583]
                    - generic [ref=e587]:
                      - spinbutton "PDF 跳转页" [ref=e588]: "1"
                      - generic [ref=e589]:
                        - button "增加" [ref=e590] [cursor=pointer]:
                          - generic [aria-hidden] [ref=e591]: +
                        - button "减少" [disabled] [ref=e592]:
                          - generic [aria-hidden] [ref=e593]: −
                    - generic [ref=e594]: / 2
                    - button "PDF 下一页" [ref=e595] [cursor=pointer]
                  - generic "选择工具。PDF 原有正文保持原版式；可编辑新增批注和原文件的可填写表单。" [ref=e599]: 选择工具
                  - group "PDF 视图缩放" [ref=e600]:
                    - button "PDF 缩小视图" [ref=e601] [cursor=pointer]
                    - generic [ref=e606]:
                      - generic [ref=e607]: PDF 缩放
                      - button "PDF 缩放 100%" [ref=e608] [cursor=pointer]:
                        - generic [ref=e609]: 100%
                    - button "PDF 放大视图" [ref=e610] [cursor=pointer]
            - paragraph [ref=e615]: 文件保存在当前浏览器的本地文档空间。需要长期留存时，请导出文件。
          - group [ref=e616]:
            - generic "示例代码" [ref=e617] [cursor=pointer]:
              - generic [aria-hidden] [ref=e618]: </>
              - text: 示例代码
              - generic [aria-hidden] [ref=e619]: 展开 / 收起
        - heading "编辑能力" [level=2] [ref=e620]
        - table [ref=e622]:
          - rowgroup [ref=e623]:
            - row [ref=e624]:
              - columnheader "文档" [ref=e625]
              - columnheader "支持的操作" [ref=e626]
              - columnheader "当前范围" [ref=e627]
          - rowgroup [ref=e628]:
            - row [ref=e629]:
              - cell "Word" [ref=e630]
              - cell "字体与小数字号输入、正文排版、列表、表格、图片、页眉页脚、页码、查找替换、页面设置、撤销重做；导入与导出 DOCX" [ref=e631]
              - cell "支持内嵌图片与单节文档。修订、目录、浮动对象等复杂结构会提示暂不支持。" [ref=e632]
            - row [ref=e633]:
              - cell "Excel" [ref=e634]
              - cell "单元格与矩形选区、字体与小数字号输入、手动与自动行高/列宽、查找替换、边框与垂直对齐、清除格式、公式和跨表引用、格式、复制粘贴、工作表增删、行列插入删除、合并、冻结、排序、筛选、柱状图与折线图；导入与导出 XLSX" [ref=e635]
              - cell "10,000 行、256 列、32 张表、100,000 个已使用单元格。透视、宏、数组公式及复杂图表暂不支持。" [ref=e636]
            - row [ref=e637]:
              - cell "PDF" [ref=e638]
              - cell "分页与缩略图、缩放、旋转、全文查找、文字与高亮、矩形和手写批注、已有表单、撤销重做；导出 PDF" [ref=e639]
              - cell "批注和表单编辑。任意原始文字修改、原文重排及扫描件 OCR 暂不支持。" [ref=e640]
        - heading "组件接入" [level=2] [ref=e641]
        - paragraph [ref=e642]: UI 组件使用 Tiptap / ProseMirror 和公式计算库；文件适配使用 docx、ExcelJS、pdf-lib 与 PDF.js。本页无需文档服务器。宿主可以替换保存与导入导出回调，接入自己的文件系统。
        - paragraph [ref=e643]:
          - text: PDF 的 worker、字体与渲染由
          - code [ref=e644]: pdfRenderer
          - text: 提供。本页的适配代码位于
          - code [ref=e645]: docs/src/pages/collaboration/office-studio/
          - text: 。组件自 v0.4.0 起随
          - code [ref=e646]: "@zuvi/react"
          - text: 和 Registry 发布。
        - region "组件属性表，可横向滚动" [ref=e647]:
          - table [ref=e648]:
            - rowgroup [ref=e649]:
              - row [ref=e650]:
                - columnheader "属性名" [ref=e651]
                - columnheader "类型" [ref=e652]
                - columnheader "默认值" [ref=e653]
                - columnheader "说明" [ref=e654]
            - rowgroup [ref=e655]:
              - row [ref=e656]:
                - cell "value / defaultValue" [ref=e657]
                - cell [ref=e658]:
                  - code [ref=e659]: OfficeStudioDocument
                - cell [ref=e660]:
                  - code [ref=e661]: —
                - cell "受控文档或非受控初始文档；支持 Word、Excel、PDF 三种模型。" [ref=e662]
              - row [ref=e663]:
                - cell "onChange" [ref=e664]
                - cell [ref=e665]:
                  - code [ref=e666]: (document) => void
                - cell [ref=e667]:
                  - code [ref=e668]: —
                - cell "内容或文件名称变化。" [ref=e669]
              - row [ref=e670]:
                - cell "source / pdfRenderer" [ref=e671]
                - cell [ref=e672]:
                  - code [ref=e673]: Blob / StudioPdfRenderer
                - cell [ref=e674]:
                  - code [ref=e675]: —
                - cell "原始文件及 PDF 渲染适配；worker 资源由宿主管理。" [ref=e676]
              - row [ref=e677]:
                - cell "onSave / onExport / onPrint" [ref=e678]
                - cell [ref=e679]:
                  - code [ref=e680]: (document) => void | Promise<void>
                - cell [ref=e681]:
                  - code [ref=e682]: —
                - cell "宿主处理保存、导出或打印；返回后更新状态，失败可重试。" [ref=e683]
              - row [ref=e684]:
                - cell "onImport / onCreate" [ref=e685]
                - cell [ref=e686]:
                  - code [ref=e687]: (file | kind) => void | Promise<void>
                - cell [ref=e688]:
                  - code [ref=e689]: —
                - cell "宿主解析文件或创建模型，并更新受控值。" [ref=e690]
              - row [ref=e691]:
                - cell "readOnly / disabled" [ref=e692]
                - cell [ref=e693]:
                  - code [ref=e694]: boolean
                - cell [ref=e695]:
                  - code [ref=e696]: "false"
                - cell "只读预览或禁用编辑与文件操作。" [ref=e697]
              - row [ref=e698]:
                - cell "saveState" [ref=e699]
                - cell [ref=e700]:
                  - code [ref=e701]: "'saved' | 'saving' | 'unsaved' | 'error'"
                - cell [ref=e702]:
                  - code [ref=e703]: —
                - cell "宿主自动保存状态。" [ref=e704]
              - row [ref=e705]:
                - cell "height" [ref=e706]
                - cell [ref=e707]:
                  - code [ref=e708]: number | string
                - cell [ref=e709]:
                  - code [ref=e710]: "760"
                - cell "编辑器高度；100% 需要父容器设置确定高度。" [ref=e711]
              - row [ref=e712]:
                - cell "fullscreen / onFullscreenChange" [ref=e713]
                - cell [ref=e714]:
                  - code [ref=e715]: boolean / (value) => void
                - cell [ref=e716]:
                  - code [ref=e717]: —
                - cell "全屏布局，切换时编辑内容保持挂载。" [ref=e718]
              - row [ref=e719]:
                - cell "ref" [ref=e720]
                - cell [ref=e721]:
                  - code [ref=e722]: OfficeStudioHandle
                - cell [ref=e723]:
                  - code [ref=e724]: —
                - cell "getDocument()、save()、export()、print()、setFullscreen()。" [ref=e725]
              - row [ref=e726]:
                - cell "classNames" [ref=e727]
                - cell [ref=e728]:
                  - code [ref=e729]: "{ root?; header?; title?; actions?; stage?; status?; error? }"
                - cell [ref=e730]:
                  - code [ref=e731]: —
                - cell "追加语义结构类名，配合 data-part 与 CSS 变量定制。" [ref=e732]
  - text: ✓ ✓ ✓ ✓
```

# Test source

```ts
  236 |       document = helpers.withNativePdfState({ ...document, ...mapped, rotations: { '1': 90 },
  237 |         fields: mapped.fields.map(field => field.name === 'reviewer' ? { ...field, value: 'Recipe current field' } : field) }, workspace);
  238 |     }
  239 |     const storage = storageModule.createStudioStorage();
  240 |     await storage.commit({ id: document.id, document, source, revision: 1, savedAt: Date.now() }, 0);
  241 |     await storage.select(document.id);
  242 |     return document;
  243 |   }, { bytes: [...bytes], kind });
  244 |   await writeFile(path.join(audit, `fixture-${kind}-source.pdf`), bytes);
  245 |   await writeFile(path.join(audit, `fixture-${kind}-model.json`), JSON.stringify(document, null, 2));
  246 |   await page.setViewportSize({ width: 1440, height: 1100 });
  247 |   await page.goto('/#/components/office-studio'); await waitReady(page);
  248 |   await page.getByRole('button', { name: '全屏编辑', exact: true }).click();
  249 |   return { bytes, document };
  250 | }
  251 | 
  252 | test.beforeEach(async ({ page }) => {
  253 |   const errors: string[] = [];
  254 |   page.on('pageerror', error => errors.push(error.message));
  255 |   await page.exposeFunction('nativeBrowserErrors', () => errors);
  256 | });
  257 | test.afterEach(async ({ page }, info) => {
  258 |   const errors = await page.evaluate(async () => {
  259 |     const reader = (window as unknown as { nativeBrowserErrors?: () => Promise<string[]> }).nativeBrowserErrors;
  260 |     return reader ? reader() : [];
  261 |   }).catch(() => [] as string[]);
  262 |   await info.attach('native-page-errors', { body: JSON.stringify(errors), contentType: 'application/json' });
  263 |   expect(errors).toEqual([]);
  264 | });
  265 | 
  266 | test('P012 creates and formats CJK FreeText with transactional history, IME drafts, native AP and two reopens', async ({ page }) => {
  267 |   test.setTimeout(180000);
  268 |   const original = await open(page), id = await create(page, 'freeText', [[45, 590]], '中文原生批注');
  269 |   let dialog = await properties(page, id);
  270 |   await expect(dialog.getByRole('checkbox', { name: '无颜色', exact: true })).toBeChecked();
  271 |   await dialog.getByLabel('PDF 批注内容', { exact: true }).fill('中文原生批注\n第二行可编辑');
  272 |   await dialog.getByLabel('PDF 批注横坐标').fill('55'); await dialog.getByLabel('PDF 批注纵坐标').fill('500');
  273 |   await dialog.getByLabel('PDF 批注宽度').fill('290'); await dialog.getByLabel('PDF 批注高度').fill('80');
  274 |   await dialog.getByLabel('PDF 批注字号', { exact: true }).fill('18');
  275 |   await selectValue(page, dialog, 'PDF 批注对齐', '居中');
  276 |   await color(page, dialog, 'PDF 批注文字颜色', '#234567');
  277 |   await dialog.getByLabel('PDF 批注不透明度百分比').fill('65');
  278 |   await saveProperties(page, dialog);
  279 |   dialog = await properties(page, id);
  280 |   await expect(dialog.getByLabel('PDF 批注宽度')).toHaveValue('290');
  281 |   await dialog.getByRole('button', { name: '取消', exact: true }).click();
  282 |   await page.getByRole('button', { name: '撤销', exact: true }).click(); await waitReady(page);
  283 |   dialog = await properties(page, id);
  284 |   await expect(dialog.getByLabel('PDF 批注内容', { exact: true })).toHaveValue('中文原生批注');
  285 |   await expect(dialog.getByLabel('PDF 批注字号', { exact: true })).toHaveValue('16');
  286 |   await dialog.getByRole('button', { name: '取消', exact: true }).click();
  287 |   await page.getByRole('button', { name: '重做', exact: true }).click(); await waitReady(page);
  288 |   const prior = await activeRecord(page);
  289 |   dialog = await properties(page, id);
  290 |   const input = dialog.getByLabel('PDF 批注内容', { exact: true });
  291 |   await input.dispatchEvent('compositionstart'); await input.fill('正在输入中文草稿');
  292 |   await dialog.getByRole('button', { name: '应用批注属性', exact: true }).click();
  293 |   await expect(dialog).toBeVisible();
  294 |   await input.dispatchEvent('compositionend');
  295 |   await dialog.getByLabel('PDF 批注宽度').fill('bad');
  296 |   await dialog.getByRole('button', { name: '应用批注属性', exact: true }).click();
  297 |   await expect(dialog.getByRole('alert')).toContainText('有效的数值');
  298 |   await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
  299 |   const cancelled = await activeRecord(page); expect(cancelled.sourceHash).toBe(prior.sourceHash);
  300 |   expect(cancelled.document).toEqual(prior.document);
  301 |   await reopenTwice(page, 'p012-freetext', original, pdf => {
  302 |     const record = annots(pdf).find(item => item.id === id)!;
  303 |     expect(record.subtype).toBe('FreeText'); expect(record.contents).toBe('中文原生批注\n第二行可编辑');
  304 |     expect(record.rect).toEqual([55, 500, 345, 580]); expect(numbersAsScalar(record.dict, 'CA')).toBe(0.65);
  305 |     expect(numbersAsScalar(record.dict, 'Q')).toBe(1); expect(record.dict.lookup(PDFName.of('AP'))).toBeInstanceOf(PDFDict);
  306 |     expect(pdf.getForm().getTextField('reviewer').getText()).toBe('Initial');
  307 |   });
  308 |   await page.screenshot({ path: path.join(audit, 'p012-light.png'), fullPage: true, animations: 'disabled' });
  309 |   await page.getByRole('button', { name: '退出全屏', exact: true }).click();
  310 |   await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  311 |   await page.getByRole('button', { name: '全屏编辑', exact: true }).click();
  312 |   await page.screenshot({ path: path.join(audit, 'p012-dark.png'), fullPage: true, animations: 'disabled' });
  313 |   dialog = await properties(page, id); await page.setViewportSize({ width: 320, height: 800 });
  314 |   expect((await dialog.boundingBox())!.width).toBeLessThanOrEqual(320);
  315 |   const dimensions = await dialog.evaluate(element => ({ width: element.clientWidth, scroll: element.scrollWidth }));
  316 |   expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width + 1);
  317 |   await page.screenshot({ path: path.join(audit, 'p012-dark-dialog-320.png'), fullPage: true, animations: 'disabled' });
  318 |   await dialog.getByRole('button', { name: '取消', exact: true }).click();
  319 | });
  320 | 
  321 | test('P014 saves four text markers from actual original-text selections with exact native quads, alpha, removal and undo', async ({ page }) => {
  322 |   test.setTimeout(180000);
  323 |   const original = await open(page), ids: string[] = [], selections: { id: string; text: string }[] = [];
  324 |   const tools = ['highlight', 'underline', 'strikeOut', 'squiggly'] as const;
  325 |   for (const [index, tool] of tools.entries()) {
  326 |     const previous = await nativeIds(page);
  327 |     await page.getByRole('button', { name: '选择', exact: true }).click();
  328 |     const span = page.locator('.zuvi-studio-pdf-text-layer span').filter({ hasText: index < 2 ? 'Native PDF host migration' : 'Original Contents remain independent' }).first();
  329 |     const box = await span.boundingBox(); if (!box) throw new Error('Original text selection span is missing');
  330 |     const start = index % 2 ? 0.55 : 0.05, end = index % 2 ? 0.9 : 0.4;
  331 |     await page.mouse.move(box.x + box.width * start, box.y + box.height / 2); await page.mouse.down();
  332 |     await page.mouse.move(box.x + box.width * end, box.y + box.height / 2, { steps: 12 }); await page.mouse.up();
  333 |     const selected = await page.evaluate(() => document.getSelection()?.toString() ?? '');
  334 |     expect(selected.trim().length).toBeGreaterThan(2);
  335 |     await page.getByRole('button', { name: labels[tool], exact: true }).click();
> 336 |     const applySelection = page.getByRole('button', { name: '应用到所选文字', exact: true });
      |                                                                         ^ Error: locator.click: Test timeout of 180000ms exceeded.
  337 |     await expect(applySelection).toBeEnabled(); await applySelection.click();
  338 |     await expect.poll(async () => (await nativeIds(page)).length).toBe(previous.length + 1); await waitReady(page);
  339 |     const id = (await nativeIds(page)).find(id => !previous.includes(id))!; ids.push(id); selections.push({ id, text: selected });
  340 |     const dialog = await properties(page, id);
  341 |     await dialog.getByLabel('PDF 批注不透明度百分比').fill('45');
  342 |     await color(page, dialog, 'PDF 批注线条或背景颜色', '#e08020');
  343 |     await saveProperties(page, dialog);
  344 |   }
  345 |   // Selecting text already covered by a native marker must remain a real mouse interaction.
  346 |   await page.getByRole('button', { name: '选择', exact: true }).click();
  347 |   const covered = page.locator('.zuvi-studio-pdf-text-layer span').filter({ hasText: 'Native PDF host migration' }).first();
  348 |   const coveredBox = await covered.boundingBox(); if (!coveredBox) throw new Error('Covered original text span is missing');
  349 |   await page.mouse.move(coveredBox.x + coveredBox.width * 0.05, coveredBox.y + coveredBox.height / 2); await page.mouse.down();
  350 |   await page.mouse.move(coveredBox.x + coveredBox.width * 0.4, coveredBox.y + coveredBox.height / 2, { steps: 12 }); await page.mouse.up();
  351 |   expect(await page.evaluate(() => document.getSelection()?.toString() ?? '')).toBe(selections[0].text);
  352 |   await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  353 |   await page.keyboard.press('ControlOrMeta+C');
  354 |   expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(selections[0].text);
  355 |   await page.getByRole('button', { name: '下划线', exact: true }).click();
  356 |   await page.getByRole('button', { name: '应用到所选文字', exact: true }).click();
  357 |   await expect.poll(async () => (await nativeIds(page)).length).toBe(5); await waitReady(page);
  358 |   const repeated = (await nativeIds(page)).find(id => !ids.includes(id))!;
  359 |   await hit(page, ids[3]).click();
  360 |   await page.getByRole('button', { name: '删除选中标注', exact: true }).click();
  361 |   await expect(hit(page, ids[3])).toHaveCount(0);
  362 |   await page.getByRole('button', { name: '撤销', exact: true }).click(); await expect(hit(page, ids[3])).toBeVisible(); await waitReady(page);
  363 |   await writeFile(path.join(audit, 'p014-source-selections.json'), JSON.stringify(selections, null, 2));
  364 |   await reopenTwice(page, 'p014-markers', original, pdf => {
  365 |     for (const [index, id] of ids.entries()) {
  366 |       const item = annots(pdf).find(item => item.id === id)!;
  367 |       expect(item.subtype).toBe(['Highlight', 'Underline', 'StrikeOut', 'Squiggly'][index]);
  368 |       expect(item.contents).toBe(selections[index].text); expect(numbers(item.dict, 'QuadPoints')).toHaveLength(8);
  369 |       expect(numbers(item.dict, 'QuadPoints').every(Number.isFinite)).toBe(true);
  370 |       expect(numbers(item.dict, 'C')).toEqual([224 / 255, 128 / 255, 32 / 255]);
  371 |       expect(numbersAsScalar(item.dict, 'CA')).toBe(0.45);
  372 |     }
  373 |     expect(annots(pdf).find(item => item.id === repeated)?.subtype).toBe('Underline');
  374 |   });
  375 |   await page.screenshot({ path: path.join(audit, 'p014-four-markers.png'), fullPage: true, animations: 'disabled' });
  376 | });
  377 | 
  378 | test('P016 creates native shapes, arrow, polyline and ink through real pointers and edits fill, dash, ends and vertices', async ({ page }) => {
  379 |   test.setTimeout(240000);
  380 |   const original = await open(page), ids = new Map<Tool, string>();
  381 |   const drawings: [Tool, readonly (readonly [number, number])[]][] = [
  382 |     ['square', [[40, 570], [180, 520]]], ['circle', [[240, 570], [410, 510]]],
  383 |     ['line', [[40, 470], [180, 430]]], ['arrow', [[240, 470], [410, 430]]],
  384 |     ['polygon', [[45, 340], [110, 405], [190, 345], [125, 320]]],
  385 |     ['polyLine', [[250, 325], [285, 400], [330, 340], [405, 385]]],
  386 |     ['ink', [[50, 250], [90, 290], [140, 245], [190, 285]]],
  387 |   ];
  388 |   for (const [tool, points] of drawings) ids.set(tool, await create(page, tool, points, 'UI ' + tool));
  389 |   let dialog = await properties(page, ids.get('square')!);
  390 |   await dialog.getByRole('checkbox', { name: '无填充', exact: true }).uncheck();
  391 |   await color(page, dialog, 'PDF 批注填充颜色', '#aaddff');
  392 |   await color(page, dialog, 'PDF 批注线条或背景颜色', '#334455');
  393 |   await dialog.getByLabel('PDF 批注不透明度百分比').fill('60');
  394 |   await dialog.getByLabel('PDF 批注线宽', { exact: true }).fill('3');
  395 |   await selectValue(page, dialog, 'PDF 批注线型', '虚线'); await saveProperties(page, dialog);
  396 |   dialog = await properties(page, ids.get('circle')!);
  397 |   await dialog.getByLabel('PDF 批注宽度').fill('160'); await dialog.getByLabel('PDF 批注高度').fill('70'); await saveProperties(page, dialog);
  398 |   for (const tool of ['line', 'arrow'] as const) {
  399 |     dialog = await properties(page, ids.get(tool)!);
  400 |     await selectValue(page, dialog, 'PDF 批注起点形状', '圆形');
  401 |     await selectValue(page, dialog, 'PDF 批注终点形状', '实心箭头'); await saveProperties(page, dialog);
  402 |   }
  403 |   dialog = await properties(page, ids.get('polygon')!);
  404 |   await dialog.getByLabel('PDF 批注顶点坐标').fill('55, 340\n110, 390\n175, 345'); await saveProperties(page, dialog);
  405 |   dialog = await properties(page, ids.get('polyLine')!);
  406 |   await dialog.getByLabel('PDF 批注顶点坐标').fill('270, 340\n290, 380\n330, 345\n385, 375');
  407 |   await selectValue(page, dialog, 'PDF 批注终点形状', '空心箭头'); await saveProperties(page, dialog);
  408 |   dialog = await properties(page, ids.get('ink')!);
  409 |   const inkWidth = Number(await dialog.getByLabel('PDF 批注宽度').inputValue());
  410 |   await dialog.getByLabel('PDF 批注宽度').fill(String(inkWidth + 20)); await saveProperties(page, dialog);
  411 |   await reopenTwice(page, 'p016-geometry', original, pdf => {
  412 |     const records = annots(pdf);
  413 |     expect([...new Set(records.filter(item => item.subtype !== 'Widget').map(item => item.subtype))].sort()).toEqual(['Circle', 'Ink', 'Line', 'PolyLine', 'Polygon', 'Square']);
  414 |     for (const id of ids.values()) expect(records.find(item => item.id === id)?.dict.lookup(PDFName.of('AP'))).toBeInstanceOf(PDFDict);
  415 |     const square = records.find(item => item.id === ids.get('square'))!;
  416 |     expect(numbers(square.dict, 'IC')).toEqual([170 / 255, 221 / 255, 1]); expect(numbersAsScalar(square.dict, 'CA')).toBe(0.6);
  417 |     expect(decoded(square.dict.lookup(PDFName.of('BS')) as PDFDict, 'S')).toBe('D');
  418 |     for (const tool of ['line', 'arrow'] as const) {
  419 |       const ends = records.find(item => item.id === ids.get(tool))!.dict.lookup(PDFName.of('LE')) as PDFArray;
  420 |       expect(ends.asArray().map(value => value.toString())).toEqual(['/Circle', '/ClosedArrow']);
  421 |     }
  422 |     expect(numbers(records.find(item => item.id === ids.get('polygon'))!.dict, 'Vertices')).toEqual([55, 340, 110, 390, 175, 345]);
  423 |     const ink = records.find(item => item.id === ids.get('ink'))!.dict.lookup(PDFName.of('InkList')) as PDFArray;
  424 |     expect((pdf.context.lookup(ink.asArray()[0]) as PDFArray).size()).toBeGreaterThanOrEqual(8);
  425 |   });
  426 |   await writeFile(path.join(audit, 'p016-created-ids.json'), JSON.stringify(Object.fromEntries(ids), null, 2));
  427 |   await page.screenshot({ path: path.join(audit, 'p016-geometry.png'), fullPage: true, animations: 'disabled' });
  428 | });
  429 | 
  430 | test('P012/P016 moving and resizing show ghosts, cancel without history and accept one undoable pointer transaction', async ({ page }) => {
  431 |   test.setTimeout(180000);
  432 |   const original = await open(page, 'native-twelve-types.pdf');
  433 |   const id = await page.locator('.zuvi-studio-pdf-native-hit[data-native-kind="square"]').first().getAttribute('data-native-id');
  434 |   if (!id) throw new Error('Native source square is missing');
  435 |   await expect(page.getByRole('button', { name: '撤销', exact: true })).toBeDisabled();
  436 |   const before = await activeRecord(page), box = await hit(page, id).boundingBox(); if (!box) throw new Error('Native source hit bounds are missing');
```