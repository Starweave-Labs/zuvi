# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-pdf-composition.spec.ts >> merges native pages and fields with editable marks, paired history, persistence, old-version export and two PDF reopens
- Location: e2e/office-studio-pdf-composition.spec.ts:47:1

# Error details

```
Error: locator.click: Error: strict mode violation: getByRole('dialog', { name: '文档历史版本', exact: true }).getByRole('button', { name: '关闭', exact: true }) resolved to 2 elements:
    1) <button type="button" aria-label="关闭" data-part="close" class="zuvi-modal-close">…</button> aka getByLabel('关闭')
    2) <button type="button" data-size="md" data-part="root" class="zuvi-button" data-variant="outline">…</button> aka locator('button').filter({ hasText: '关闭' })

Call log:
  - waiting for getByRole('dialog', { name: '文档历史版本', exact: true }).getByRole('button', { name: '关闭', exact: true })

```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - generic [ref=f1e3]:
    - banner [ref=f1e4]:
      - generic [ref=f1e5]:
        - link "Z ZUVI v1.1.0" [ref=f1e6] [cursor=pointer]:
          - /url: "#/"
          - generic [ref=f1e7]: Z
          - generic [ref=f1e8]: ZUVI
          - generic [ref=f1e9]: v1.1.0
        - generic [ref=f1e10]: 开发文档 / OfficeStudio 独立文档工作台
      - generic [ref=f1e11]:
        - button "打开文档命令面板" [ref=f1e12] [cursor=pointer]:
          - generic [ref=f1e16]: 搜索页面或命令
          - generic [ref=f1e17]: ⌘ / Ctrl K
        - button "切换暗色" [ref=f1e18] [cursor=pointer]
        - link "GitHub" [ref=f1e19] [cursor=pointer]:
          - /url: https://github.com/Starweave-Labs/zuvi
      - status
    - generic [ref=f1e20]:
      - generic [ref=f1e21]:
        - generic [ref=f1e22]: 文档
        - generic [ref=f1e23]: 组件、规范与实践
      - search "搜索文档导航" [ref=f1e24]:
        - searchbox "按名称过滤导航项" [ref=f1e25]
      - navigation "文档导航" [ref=f1e26]:
        - generic [ref=f1e27]:
          - group "开始" [ref=f1e28]:
            - list [ref=f1e30]:
              - listitem [ref=f1e31]:
                - link "概览" [ref=f1e32] [cursor=pointer]:
                  - /url: "#/"
              - listitem [ref=f1e34]:
                - link "设计令牌" [ref=f1e35] [cursor=pointer]:
                  - /url: "#/tokens"
              - listitem [ref=f1e37]:
                - link "主题调参" [ref=f1e38] [cursor=pointer]:
                  - /url: "#/theme"
              - listitem [ref=f1e40]:
                - link "国际化与翻译" [ref=f1e41] [cursor=pointer]:
                  - /url: "#/i18n"
              - listitem [ref=f1e43]:
                - link "设计资源" [ref=f1e44] [cursor=pointer]:
                  - /url: "#/design"
              - listitem [ref=f1e46]:
                - link "图标库" [ref=f1e47] [cursor=pointer]:
                  - /url: "#/icons"
              - listitem [ref=f1e49]:
                - link "页面搭建器" [ref=f1e50] [cursor=pointer]:
                  - /url: "#/builder"
              - listitem [ref=f1e52]:
                - link "业务区块" [ref=f1e53] [cursor=pointer]:
                  - /url: "#/blocks"
              - listitem [ref=f1e55]:
                - link "内容协作实验室" [ref=f1e56] [cursor=pointer]:
                  - /url: "#/collaboration"
              - listitem [ref=f1e58]:
                - link "组件创意工坊" [ref=f1e59] [cursor=pointer]:
                  - /url: "#/lab"
          - group "基础组件" [ref=f1e61]:
            - list [ref=f1e63]:
              - listitem [ref=f1e64]:
                - link "Button 按钮" [ref=f1e65] [cursor=pointer]:
                  - /url: "#/components/button"
              - listitem [ref=f1e67]:
                - link "Typography 排版" [ref=f1e68] [cursor=pointer]:
                  - /url: "#/components/typography"
          - group "布局" [ref=f1e70]:
            - list [ref=f1e72]:
              - listitem [ref=f1e73]:
                - link "Splitter 可调分栏" [ref=f1e74] [cursor=pointer]:
                  - /url: "#/components/splitter"
              - listitem [ref=f1e76]:
                - link "Divider 分割线" [ref=f1e77] [cursor=pointer]:
                  - /url: "#/components/divider"
              - listitem [ref=f1e79]:
                - link "Layout 布局" [ref=f1e80] [cursor=pointer]:
                  - /url: "#/components/layout"
          - group "导航" [ref=f1e82]:
            - list [ref=f1e84]:
              - listitem [ref=f1e85]:
                - link "CommandPalette 命令面板" [ref=f1e86] [cursor=pointer]:
                  - /url: "#/components/command-palette"
              - listitem [ref=f1e88]:
                - link "SideNav 侧边导航" [ref=f1e89] [cursor=pointer]:
                  - /url: "#/components/side-nav"
              - listitem [ref=f1e91]:
                - link "Tabs 标签页" [ref=f1e92] [cursor=pointer]:
                  - /url: "#/components/tabs"
              - listitem [ref=f1e94]:
                - link "DropdownMenu 下拉菜单" [ref=f1e95] [cursor=pointer]:
                  - /url: "#/components/dropdown-menu"
              - listitem [ref=f1e97]:
                - link "Pagination 分页" [ref=f1e98] [cursor=pointer]:
                  - /url: "#/components/pagination"
              - listitem [ref=f1e100]:
                - link "Breadcrumb 面包屑" [ref=f1e101] [cursor=pointer]:
                  - /url: "#/components/breadcrumb"
              - listitem [ref=f1e103]:
                - link "Affix 固钉" [ref=f1e104] [cursor=pointer]:
                  - /url: "#/components/affix"
              - listitem [ref=f1e106]:
                - link "BackTop 返回顶部" [ref=f1e107] [cursor=pointer]:
                  - /url: "#/components/back-top"
              - listitem [ref=f1e109]:
                - link "FloatButton 悬浮按钮" [ref=f1e110] [cursor=pointer]:
                  - /url: "#/components/float-button"
              - listitem [ref=f1e112]:
                - link "Steps 步骤条" [ref=f1e113] [cursor=pointer]:
                  - /url: "#/components/steps"
              - listitem [ref=f1e115]:
                - link "Anchor 锚点" [ref=f1e116] [cursor=pointer]:
                  - /url: "#/components/anchor"
          - group "数据录入" [ref=f1e118]:
            - list [ref=f1e120]:
              - listitem [ref=f1e121]:
                - link "Input 输入框" [ref=f1e122] [cursor=pointer]:
                  - /url: "#/components/input"
              - listitem [ref=f1e124]:
                - link "Checkbox 复选框" [ref=f1e125] [cursor=pointer]:
                  - /url: "#/components/checkbox"
              - listitem [ref=f1e127]:
                - link "Radio 单选框" [ref=f1e128] [cursor=pointer]:
                  - /url: "#/components/radio"
              - listitem [ref=f1e130]:
                - link "Switch 开关" [ref=f1e131] [cursor=pointer]:
                  - /url: "#/components/switch"
              - listitem [ref=f1e133]:
                - link "Select 选择器" [ref=f1e134] [cursor=pointer]:
                  - /url: "#/components/select"
              - listitem [ref=f1e136]:
                - link "Combobox 自动完成" [ref=f1e137] [cursor=pointer]:
                  - /url: "#/components/combobox"
              - listitem [ref=f1e139]:
                - link "OfficeEditor 文档编辑器" [ref=f1e140] [cursor=pointer]:
                  - /url: "#/components/office-editor"
              - listitem [ref=f1e142]:
                - link "OfficeStudio 独立文档工作台" [ref=f1e143] [cursor=pointer]:
                  - /url: "#/components/office-studio"
              - listitem [ref=f1e145]:
                - link "Form 表单" [ref=f1e146] [cursor=pointer]:
                  - /url: "#/components/form"
              - listitem [ref=f1e148]:
                - link "Slider 滑块" [ref=f1e149] [cursor=pointer]:
                  - /url: "#/components/slider"
              - listitem [ref=f1e151]:
                - link "Rate 评分" [ref=f1e152] [cursor=pointer]:
                  - /url: "#/components/rate"
              - listitem [ref=f1e154]:
                - link "InputNumber 数字输入" [ref=f1e155] [cursor=pointer]:
                  - /url: "#/components/input-number"
              - listitem [ref=f1e157]:
                - link "ColorPicker 取色器" [ref=f1e158] [cursor=pointer]:
                  - /url: "#/components/color-picker"
              - listitem [ref=f1e160]:
                - link "DatePicker 日期选择" [ref=f1e161] [cursor=pointer]:
                  - /url: "#/components/date-picker"
              - listitem [ref=f1e163]:
                - link "TreeSelect 树选择" [ref=f1e164] [cursor=pointer]:
                  - /url: "#/components/tree-select"
              - listitem [ref=f1e166]:
                - link "Transfer 穿梭框" [ref=f1e167] [cursor=pointer]:
                  - /url: "#/components/transfer"
              - listitem [ref=f1e169]:
                - link "Cascader 级联选择" [ref=f1e170] [cursor=pointer]:
                  - /url: "#/components/cascader"
              - listitem [ref=f1e172]:
                - link "TimePicker 时间选择" [ref=f1e173] [cursor=pointer]:
                  - /url: "#/components/time-picker"
              - listitem [ref=f1e175]:
                - link "Mentions 提及" [ref=f1e176] [cursor=pointer]:
                  - /url: "#/components/mentions"
              - listitem [ref=f1e178]:
                - link "Segmented 分段控制器" [ref=f1e179] [cursor=pointer]:
                  - /url: "#/components/segmented"
              - listitem [ref=f1e181]:
                - link "Upload 上传" [ref=f1e182] [cursor=pointer]:
                  - /url: "#/components/upload"
              - listitem [ref=f1e184]:
                - link "DateRangePicker 日期范围" [ref=f1e185] [cursor=pointer]:
                  - /url: "#/components/date-range-picker"
          - group "数据展示" [ref=f1e187]:
            - list [ref=f1e189]:
              - listitem [ref=f1e190]:
                - link "Table 表格" [ref=f1e191] [cursor=pointer]:
                  - /url: "#/components/table"
              - listitem [ref=f1e193]:
                - link "Chart 数据图表" [ref=f1e194] [cursor=pointer]:
                  - /url: "#/components/chart"
              - listitem [ref=f1e196]:
                - link "Globe 3D 地球" [ref=f1e197] [cursor=pointer]:
                  - /url: "#/components/globe"
              - listitem [ref=f1e199]:
                - link "Badge 徽标" [ref=f1e200] [cursor=pointer]:
                  - /url: "#/components/badge"
              - listitem [ref=f1e202]:
                - link "Tag 标签" [ref=f1e203] [cursor=pointer]:
                  - /url: "#/components/tag"
              - listitem [ref=f1e205]:
                - link "Avatar 头像" [ref=f1e206] [cursor=pointer]:
                  - /url: "#/components/avatar"
              - listitem [ref=f1e208]:
                - link "Card 卡片" [ref=f1e209] [cursor=pointer]:
                  - /url: "#/components/card"
              - listitem [ref=f1e211]:
                - link "Empty 空状态" [ref=f1e212] [cursor=pointer]:
                  - /url: "#/components/empty"
              - listitem [ref=f1e214]:
                - link "Calendar 日历" [ref=f1e215] [cursor=pointer]:
                  - /url: "#/components/calendar"
              - listitem [ref=f1e217]:
                - link "Descriptions 描述列表" [ref=f1e218] [cursor=pointer]:
                  - /url: "#/components/descriptions"
              - listitem [ref=f1e220]:
                - link "Statistic 统计数值" [ref=f1e221] [cursor=pointer]:
                  - /url: "#/components/statistic"
              - listitem [ref=f1e223]:
                - link "Timeline 时间轴" [ref=f1e224] [cursor=pointer]:
                  - /url: "#/components/timeline"
              - listitem [ref=f1e226]:
                - link "VirtualTable 虚拟滚动表格" [ref=f1e227] [cursor=pointer]:
                  - /url: "#/components/virtual-table"
              - listitem [ref=f1e229]:
                - link "DataGrid 数据网格" [ref=f1e230] [cursor=pointer]:
                  - /url: "#/components/data-grid"
              - listitem [ref=f1e232]:
                - link "Tree 树形控件" [ref=f1e233] [cursor=pointer]:
                  - /url: "#/components/tree"
              - listitem [ref=f1e235]:
                - link "Collapse 折叠面板" [ref=f1e236] [cursor=pointer]:
                  - /url: "#/components/collapse"
              - listitem [ref=f1e238]:
                - link "List 列表" [ref=f1e239] [cursor=pointer]:
                  - /url: "#/components/list"
              - listitem [ref=f1e241]:
                - link "Image 图片" [ref=f1e242] [cursor=pointer]:
                  - /url: "#/components/image"
              - listitem [ref=f1e244]:
                - link "QRCode 二维码" [ref=f1e245] [cursor=pointer]:
                  - /url: "#/components/qrcode"
              - listitem [ref=f1e247]:
                - link "Watermark 水印" [ref=f1e248] [cursor=pointer]:
                  - /url: "#/components/watermark"
          - group "数据可视化" [ref=f1e250]:
            - list [ref=f1e252]:
              - listitem [ref=f1e253]:
                - link "图表画廊" [ref=f1e254] [cursor=pointer]:
                  - /url: "#/charts"
              - listitem [ref=f1e256]:
                - link "交互与联动" [ref=f1e257] [cursor=pointer]:
                  - /url: "#/charts/interactions"
              - listitem [ref=f1e259]:
                - link "可视化实验室" [ref=f1e260] [cursor=pointer]:
                  - /url: "#/charts/playground"
          - group "反馈" [ref=f1e262]:
            - list [ref=f1e264]:
              - listitem [ref=f1e265]:
                - link "Modal 对话框" [ref=f1e266] [cursor=pointer]:
                  - /url: "#/components/modal"
              - listitem [ref=f1e268]:
                - link "Message 全局提示" [ref=f1e269] [cursor=pointer]:
                  - /url: "#/components/message"
              - listitem [ref=f1e271]:
                - link "Tooltip 文字提示" [ref=f1e272] [cursor=pointer]:
                  - /url: "#/components/tooltip"
              - listitem [ref=f1e274]:
                - link "Popover 气泡卡片" [ref=f1e275] [cursor=pointer]:
                  - /url: "#/components/popover"
              - listitem [ref=f1e277]:
                - link "Alert 警告提示" [ref=f1e278] [cursor=pointer]:
                  - /url: "#/components/alert"
              - listitem [ref=f1e280]:
                - link "Skeleton 骨架屏" [ref=f1e281] [cursor=pointer]:
                  - /url: "#/components/skeleton"
              - listitem [ref=f1e283]:
                - link "Drawer 抽屉" [ref=f1e284] [cursor=pointer]:
                  - /url: "#/components/drawer"
              - listitem [ref=f1e286]:
                - link "Spin 加载中" [ref=f1e287] [cursor=pointer]:
                  - /url: "#/components/spin"
              - listitem [ref=f1e289]:
                - link "Progress 进度条" [ref=f1e290] [cursor=pointer]:
                  - /url: "#/components/progress"
              - listitem [ref=f1e292]:
                - link "Notification 通知提醒框" [ref=f1e293] [cursor=pointer]:
                  - /url: "#/components/notification"
              - listitem [ref=f1e295]:
                - link "Popconfirm 气泡确认" [ref=f1e296] [cursor=pointer]:
                  - /url: "#/components/popconfirm"
              - listitem [ref=f1e298]:
                - link "Tour 漫游引导" [ref=f1e299] [cursor=pointer]:
                  - /url: "#/components/tour"
              - listitem [ref=f1e301]:
                - link "Result 结果" [ref=f1e302] [cursor=pointer]:
                  - /url: "#/components/result"
          - group "全局配置" [ref=f1e304]:
            - list [ref=f1e306]:
              - listitem [ref=f1e307]:
                - link "ConfigProvider 全局配置" [ref=f1e308] [cursor=pointer]:
                  - /url: "#/components/config"
              - listitem [ref=f1e310]:
                - link "App 容器" [ref=f1e311] [cursor=pointer]:
                  - /url: "#/components/app"
      - generic [ref=f1e313]: React 19 · CSS 变量驱动
    - main [ref=f1e314]:
      - generic [ref=f1e315]:
        - heading "OfficeStudio 独立文档工作台" [level=1] [ref=f1e316]
        - paragraph [ref=f1e317]: 使用 ZUVI 的工具栏、菜单和表单，在页面内直接编辑文档。Word、Excel、PDF 共用文件操作与保存状态，编辑内容保存在当前浏览器，也可以导出为实际文件。
        - generic [ref=f1e318]:
          - generic [ref=f1e319]: ZUVI 界面
          - generic [ref=f1e321]: 页面内编辑
          - generic [ref=f1e323]: 本地恢复
          - generic [ref=f1e325]: DOCX / XLSX / PDF
        - region "从预览，到完成一份文档" [ref=f1e327]:
          - generic [ref=f1e328]:
            - heading "从预览，到完成一份文档" [level=3] [ref=f1e329]
            - paragraph [ref=f1e330]: 选择一种文档开始。修改会自动保存到当前浏览器；导出后可在 Word、Excel 或 PDF 阅读器中继续使用。
          - generic [ref=f1e332]:
            - group "选择示例文档" [ref=f1e333]:
              - button "Word 文档排版 · 图片与页眉页脚" [ref=f1e334] [cursor=pointer]:
                - generic [ref=f1e335]:
                  - generic [aria-hidden] [ref=f1e336]: W
                  - generic [ref=f1e337]:
                    - strong [ref=f1e338]: Word
                    - generic [ref=f1e339]: 文档排版 · 图片与页眉页脚
              - button "Excel 行列编辑 · 公式与图表" [ref=f1e340] [cursor=pointer]:
                - generic [ref=f1e341]:
                  - generic [aria-hidden] [ref=f1e342]: E
                  - generic [ref=f1e343]:
                    - strong [ref=f1e344]: Excel
                    - generic [ref=f1e345]: 行列编辑 · 公式与图表
              - button "PDF 全文查找 · 批注与手写" [pressed] [ref=f1e346] [cursor=pointer]:
                - generic [ref=f1e347]:
                  - generic [aria-hidden] [ref=f1e348]: P
                  - generic [ref=f1e349]:
                    - strong [ref=f1e350]: PDF
                    - generic [ref=f1e351]: 全文查找 · 批注与手写
            - generic [ref=f1e352]:
              - generic [ref=f1e353]: 本地文档
              - generic [ref=f1e354]:
                - generic [ref=f1e355]: 打开本地文档
                - button "打开本地文档 Primary.pdf" [ref=f1e356] [cursor=pointer]:
                  - generic [ref=f1e357]: Primary.pdf
              - button "历史版本" [ref=f1e358] [cursor=pointer]
              - switch "只读预览" [ref=f1e360] [cursor=pointer]
            - region "PDF 文档编辑器" [ref=f1e364]:
              - generic [ref=f1e365]:
                - generic [ref=f1e366]:
                  - generic [ref=f1e371]: PDF
                  - generic "可编辑 · ⌘ / Ctrl S 保存" [ref=f1e372]:
                    - status "已保存" [ref=f1e373]
                - textbox "文档名称" [ref=f1e378]: Primary.pdf
                - generic [ref=f1e379]:
                  - button "新建" [ref=f1e381] [cursor=pointer]
                  - button "导入" [ref=f1e384] [cursor=pointer]
                  - button "导出文件" [ref=f1e389] [cursor=pointer]
                  - button "打印" [ref=f1e395] [cursor=pointer]
                  - button "保存" [ref=f1e402] [cursor=pointer]
                  - button "全屏编辑" [ref=f1e409] [cursor=pointer]
              - generic [ref=f1e417]:
                - generic [ref=f1e418]:
                  - generic [ref=f1e419]:
                    - button "文件" [ref=f1e422] [cursor=pointer]
                    - tablist "PDF 功能区选项卡" [ref=f1e423]:
                      - tab "开始" [selected] [ref=f1e424] [cursor=pointer]
                      - tab "批注" [ref=f1e425] [cursor=pointer]
                  - group "PDF 编辑工具栏" [ref=f1e426]:
                    - group "编辑" [ref=f1e427]:
                      - generic [ref=f1e428]:
                        - generic [ref=f1e429]:
                          - button "撤销" [disabled] [ref=f1e430]
                          - button "重做" [disabled] [ref=f1e432]
                        - button "选择" [pressed] [ref=f1e434] [cursor=pointer]
                      - generic [aria-hidden] [ref=f1e439]: 编辑
                    - tabpanel "开始" [ref=f1e440]:
                      - group "插入" [ref=f1e441]:
                        - generic [ref=f1e442]:
                          - button "文字" [ref=f1e443] [cursor=pointer]
                          - button "矩形" [ref=f1e448] [cursor=pointer]
                          - button "新建表单字段" [ref=f1e456] [cursor=pointer]
                        - generic [aria-hidden] [ref=f1e458]: 插入
                      - group "页面" [ref=f1e459]:
                        - generic [ref=f1e460]:
                          - button "插入空白页" [ref=f1e461] [cursor=pointer]
                          - button "删除所选页" [ref=f1e463] [cursor=pointer]
                          - button "移动所选页" [ref=f1e465] [cursor=pointer]
                          - button "复制所选页" [ref=f1e467] [cursor=pointer]
                          - button "合并 PDF 文件" [ref=f1e469] [cursor=pointer]
                          - button "提取 PDF 页面" [ref=f1e471] [cursor=pointer]
                          - button "旋转所选页" [ref=f1e473] [cursor=pointer]
                          - button "页面尺寸" [ref=f1e475] [cursor=pointer]
                          - button "旋转当前页" [ref=f1e477] [cursor=pointer]
                          - button "页面" [ref=f1e483] [cursor=pointer]
                        - generic [aria-hidden] [ref=f1e489]: 页面
                      - group "查看" [ref=f1e490]:
                        - generic [ref=f1e491]:
                          - button "查找" [ref=f1e492] [cursor=pointer]
                          - button "PDF 批注与表单侧栏" [pressed] [ref=f1e498] [cursor=pointer]:
                            - generic [ref=f1e503]: 侧栏
                        - generic [aria-hidden] [ref=f1e504]: 查看
                - generic [ref=f1e505]:
                  - navigation "PDF 侧边导航" [ref=f1e506]:
                    - button "PDF 文本查找侧栏" [ref=f1e507] [cursor=pointer]
                    - button "PDF 批注侧栏" [pressed] [ref=f1e512] [cursor=pointer]
                    - button "PDF 页面缩略图侧栏" [ref=f1e516] [cursor=pointer]
                    - button "PDF 表单侧栏" [ref=f1e521] [cursor=pointer]
                  - region "PDF 页面编辑区" [ref=f1e526]:
                    - generic [ref=f1e527]:
                      - img "PDF 第 1 页原文" [ref=f1e528]
                      - img "PDF 页面标注" [ref=f1e529]:
                        - button "PDF 矩形标注 0c0898a4-0557-456c-aa3c-e128f7fc2c32" [ref=f1e530]
                      - generic:
                        - textbox "PDF 页面表单 Text" [ref=f1e536]: 合并前的中文
                        - textbox "PDF 页面表单 Date" [ref=f1e540]:
                          - /placeholder: YYYY-MM-DD
                          - text: 2026-11-26
                        - generic [ref=f1e543] [cursor=pointer]:
                          - img "Image" [ref=f1e544]
                          - button "PDF 页面表单 Image" [ref=f1e545]
                        - checkbox "PDF 页面表单 Checked" [checked] [ref=f1e549] [cursor=pointer]
                        - radiogroup "PDF 页面单选表单 Choice":
                          - radio "PDF 页面表单 Choice A" [checked] [ref=f1e554] [cursor=pointer]
                          - radio "PDF 页面表单 Choice B" [ref=f1e559] [cursor=pointer]
                    - generic [ref=f1e561]: 第 1 页 · 100%
                  - complementary "PDF 批注与表单" [ref=f1e562]:
                    - group "PDF 侧栏内容" [ref=f1e563]:
                      - button "批注 2" [pressed] [ref=f1e564] [cursor=pointer]
                      - button "表单 9" [ref=f1e566] [cursor=pointer]
                      - button "文本查找" [ref=f1e568] [cursor=pointer]
                      - button "页面缩略图" [ref=f1e570] [cursor=pointer]
                    - generic [ref=f1e572]:
                      - strong [ref=f1e573]: 添加文字
                      - generic [ref=f1e574]:
                        - text: 文字内容
                        - textbox "PDF 新增文字" [ref=f1e576]
                      - generic [ref=f1e577]:
                        - text: 字号
                        - generic [ref=f1e578]:
                          - spinbutton "PDF 文字字号" [ref=f1e579]: "16"
                          - generic [ref=f1e580]:
                            - button "增加" [ref=f1e581] [cursor=pointer]:
                              - generic [aria-hidden] [ref=f1e582]: +
                            - button "减少" [ref=f1e583] [cursor=pointer]:
                              - generic [aria-hidden] [ref=f1e584]: −
                      - generic [ref=f1e585]:
                        - generic [ref=f1e586]: 颜色
                        - group "PDF 标注颜色" [ref=f1e587]:
                          - button "PDF 标注颜色" [ref=f1e588] [cursor=pointer]:
                            - generic [ref=f1e590]: "#253044"
                      - paragraph [ref=f1e591]: 选择文字或高亮工具后点击页面放置，也可以使用下方按钮。
                      - button "放在当前页中央" [disabled] [ref=f1e592]
                      - generic "PDF 标注列表" [ref=f1e594]:
                        - button "第 1 页 · 矩形 1 矩形框标注" [ref=f1e595] [cursor=pointer]:
                          - generic [ref=f1e598]:
                            - strong [ref=f1e599]: 第 1 页 · 矩形 1
                            - generic [ref=f1e600]: 矩形框标注
                        - button "第 5 页 · 矩形 2 矩形框标注" [ref=f1e601] [cursor=pointer]:
                          - generic [ref=f1e604]:
                            - strong [ref=f1e605]: 第 5 页 · 矩形 2
                            - generic [ref=f1e606]: 矩形框标注
                - group "PDF 状态栏" [ref=f1e607]:
                  - group "PDF 页面导航" [ref=f1e608]:
                    - button "PDF 上一页" [disabled] [ref=f1e609]
                    - generic [ref=f1e613]:
                      - spinbutton "PDF 跳转页" [ref=f1e614]: "1"
                      - generic [ref=f1e615]:
                        - button "增加" [ref=f1e616] [cursor=pointer]:
                          - generic [aria-hidden] [ref=f1e617]: +
                        - button "减少" [disabled] [ref=f1e618]:
                          - generic [aria-hidden] [ref=f1e619]: −
                    - generic [ref=f1e620]: / 5
                    - button "PDF 下一页" [ref=f1e621] [cursor=pointer]
                  - generic "选择工具。PDF 原有正文保持原版式；可编辑新增批注和原文件的可填写表单。" [ref=f1e625]: 选择工具
                  - group "PDF 视图缩放" [ref=f1e626]:
                    - button "PDF 缩小视图" [ref=f1e627] [cursor=pointer]
                    - generic [ref=f1e632]:
                      - generic [ref=f1e633]: PDF 缩放
                      - button "PDF 缩放 100%" [ref=f1e634] [cursor=pointer]:
                        - generic [ref=f1e635]: 100%
                    - button "PDF 放大视图" [ref=f1e636] [cursor=pointer]
            - paragraph [ref=f1e641]: 文件保存在当前浏览器的本地文档空间。需要长期留存时，请导出文件。
          - group [ref=f1e642]:
            - generic "示例代码" [ref=f1e643] [cursor=pointer]:
              - generic [aria-hidden] [ref=f1e644]: </>
              - text: 示例代码
              - generic [aria-hidden] [ref=f1e645]: 展开 / 收起
        - heading "编辑能力" [level=2] [ref=f1e646]
        - table [ref=f1e648]:
          - rowgroup [ref=f1e649]:
            - row [ref=f1e650]:
              - columnheader "文档" [ref=f1e651]
              - columnheader "支持的操作" [ref=f1e652]
              - columnheader "当前范围" [ref=f1e653]
          - rowgroup [ref=f1e654]:
            - row [ref=f1e655]:
              - cell "Word" [ref=f1e656]
              - cell "字体与小数字号输入、正文排版、列表、表格、图片、页眉页脚、页码、查找替换、页面设置、撤销重做；导入与导出 DOCX" [ref=f1e657]
              - cell "支持内嵌图片与单节文档。修订、目录、浮动对象等复杂结构会提示暂不支持。" [ref=f1e658]
            - row [ref=f1e659]:
              - cell "Excel" [ref=f1e660]
              - cell "单元格与矩形选区、字体与小数字号输入、手动与自动行高/列宽、查找替换、边框与垂直对齐、清除格式、公式和跨表引用、格式、复制粘贴、工作表增删、行列插入删除、合并、冻结、排序、筛选、柱状图与折线图；导入与导出 XLSX" [ref=f1e661]
              - cell "10,000 行、256 列、32 张表、100,000 个已使用单元格。透视、宏、数组公式及复杂图表暂不支持。" [ref=f1e662]
            - row [ref=f1e663]:
              - cell "PDF" [ref=f1e664]
              - cell "分页与缩略图、缩放、旋转、全文查找、文字与高亮、矩形和手写批注、已有表单、撤销重做；导出 PDF" [ref=f1e665]
              - cell "批注和表单编辑。任意原始文字修改、原文重排及扫描件 OCR 暂不支持。" [ref=f1e666]
        - heading "组件接入" [level=2] [ref=f1e667]
        - paragraph [ref=f1e668]: UI 组件使用 Tiptap / ProseMirror 和公式计算库；文件适配使用 docx、ExcelJS、pdf-lib 与 PDF.js。本页无需文档服务器。宿主可以替换保存与导入导出回调，接入自己的文件系统。
        - paragraph [ref=f1e669]:
          - text: PDF 的 worker、字体与渲染由
          - code [ref=f1e670]: pdfRenderer
          - text: 提供。本页的适配代码位于
          - code [ref=f1e671]: docs/src/pages/collaboration/office-studio/
          - text: 。组件自 v0.4.0 起随
          - code [ref=f1e672]: "@zuvi/react"
          - text: 和 Registry 发布。
        - region "组件属性表，可横向滚动" [ref=f1e673]:
          - table [ref=f1e674]:
            - rowgroup [ref=f1e675]:
              - row [ref=f1e676]:
                - columnheader "属性名" [ref=f1e677]
                - columnheader "类型" [ref=f1e678]
                - columnheader "默认值" [ref=f1e679]
                - columnheader "说明" [ref=f1e680]
            - rowgroup [ref=f1e681]:
              - row [ref=f1e682]:
                - cell "value / defaultValue" [ref=f1e683]
                - cell [ref=f1e684]:
                  - code [ref=f1e685]: OfficeStudioDocument
                - cell [ref=f1e686]:
                  - code [ref=f1e687]: —
                - cell "受控文档或非受控初始文档；支持 Word、Excel、PDF 三种模型。" [ref=f1e688]
              - row [ref=f1e689]:
                - cell "onChange" [ref=f1e690]
                - cell [ref=f1e691]:
                  - code [ref=f1e692]: (document) => void
                - cell [ref=f1e693]:
                  - code [ref=f1e694]: —
                - cell "内容或文件名称变化。" [ref=f1e695]
              - row [ref=f1e696]:
                - cell "source / pdfRenderer" [ref=f1e697]
                - cell [ref=f1e698]:
                  - code [ref=f1e699]: Blob / StudioPdfRenderer
                - cell [ref=f1e700]:
                  - code [ref=f1e701]: —
                - cell "原始文件及 PDF 渲染适配；worker 资源由宿主管理。" [ref=f1e702]
              - row [ref=f1e703]:
                - cell "onSave / onExport / onPrint" [ref=f1e704]
                - cell [ref=f1e705]:
                  - code [ref=f1e706]: (document) => void | Promise<void>
                - cell [ref=f1e707]:
                  - code [ref=f1e708]: —
                - cell "宿主处理保存、导出或打印；返回后更新状态，失败可重试。" [ref=f1e709]
              - row [ref=f1e710]:
                - cell "onImport / onCreate" [ref=f1e711]
                - cell [ref=f1e712]:
                  - code [ref=f1e713]: (file | kind) => void | Promise<void>
                - cell [ref=f1e714]:
                  - code [ref=f1e715]: —
                - cell "宿主解析文件或创建模型，并更新受控值。" [ref=f1e716]
              - row [ref=f1e717]:
                - cell "readOnly / disabled" [ref=f1e718]
                - cell [ref=f1e719]:
                  - code [ref=f1e720]: boolean
                - cell [ref=f1e721]:
                  - code [ref=f1e722]: "false"
                - cell "只读预览或禁用编辑与文件操作。" [ref=f1e723]
              - row [ref=f1e724]:
                - cell "saveState" [ref=f1e725]
                - cell [ref=f1e726]:
                  - code [ref=f1e727]: "'saved' | 'saving' | 'unsaved' | 'error'"
                - cell [ref=f1e728]:
                  - code [ref=f1e729]: —
                - cell "宿主自动保存状态。" [ref=f1e730]
              - row [ref=f1e731]:
                - cell "height" [ref=f1e732]
                - cell [ref=f1e733]:
                  - code [ref=f1e734]: number | string
                - cell [ref=f1e735]:
                  - code [ref=f1e736]: "760"
                - cell "编辑器高度；100% 需要父容器设置确定高度。" [ref=f1e737]
              - row [ref=f1e738]:
                - cell "fullscreen / onFullscreenChange" [ref=f1e739]
                - cell [ref=f1e740]:
                  - code [ref=f1e741]: boolean / (value) => void
                - cell [ref=f1e742]:
                  - code [ref=f1e743]: —
                - cell "全屏布局，切换时编辑内容保持挂载。" [ref=f1e744]
              - row [ref=f1e745]:
                - cell "ref" [ref=f1e746]
                - cell [ref=f1e747]:
                  - code [ref=f1e748]: OfficeStudioHandle
                - cell [ref=f1e749]:
                  - code [ref=f1e750]: —
                - cell "getDocument()、save()、export()、print()、setFullscreen()。" [ref=f1e751]
              - row [ref=f1e752]:
                - cell "classNames" [ref=f1e753]
                - cell [ref=f1e754]:
                  - code [ref=f1e755]: "{ root?; header?; title?; actions?; stage?; status?; error? }"
                - cell [ref=f1e756]:
                  - code [ref=f1e757]: —
                - cell "追加语义结构类名，配合 data-part 与 CSS 变量定制。" [ref=f1e758]
  - text: ✓ ✓
  - dialog "文档历史版本" [ref=f1e761]:
    - generic [ref=f1e762]:
      - heading "文档历史版本" [level=2] [ref=f1e763]
      - button "关闭" [ref=f1e764] [cursor=pointer]
    - paragraph [ref=f1e768]: 保留最近 20 次保存前的版本。选择一个版本查看，恢复后会创建新文档。
    - generic [ref=f1e769]:
      - generic "已保存的历史版本" [ref=f1e770]:
        - button "版本 5 · 2026/11/27 00:54:23" [ref=f1e771] [cursor=pointer]
        - button "版本 4 · 2026/11/27 00:54:23" [ref=f1e773] [cursor=pointer]
        - button "版本 3 · 2026/11/27 00:54:22" [ref=f1e775] [cursor=pointer]
        - button "版本 2 · 2026/11/27 00:54:20" [pressed] [ref=f1e777] [cursor=pointer]
        - button "版本 1 · 2026/11/27 00:54:17" [ref=f1e779] [cursor=pointer]
      - region "PDF 文档编辑器" [ref=f1e781]:
        - generic [ref=f1e782]:
          - generic [ref=f1e783]:
            - generic [ref=f1e788]: PDF
            - generic "只读预览" [ref=f1e789]:
              - status "已保存" [ref=f1e790]
              - generic [ref=f1e793]: 只读
          - textbox "文档名称" [ref=f1e796]: Primary.pdf
          - generic [ref=f1e797]:
            - button "新建" [disabled] [ref=f1e799] [cursor=pointer]
            - button "导入" [disabled] [ref=f1e802]
            - button "导出文件" [ref=f1e807] [cursor=pointer]
            - button "打印" [ref=f1e813] [cursor=pointer]
            - button "保存" [disabled] [ref=f1e820]
            - button "全屏编辑" [ref=f1e827] [cursor=pointer]
        - generic [ref=f1e835]:
          - generic [ref=f1e836]:
            - generic [ref=f1e837]:
              - button "文件" [ref=f1e840] [cursor=pointer]
              - tablist "PDF 功能区选项卡" [ref=f1e841]:
                - tab "开始" [selected] [ref=f1e842] [cursor=pointer]
                - tab "批注" [ref=f1e843] [cursor=pointer]
            - group "PDF 编辑工具栏" [ref=f1e844]:
              - group "编辑" [ref=f1e845]:
                - generic [ref=f1e846]:
                  - generic [ref=f1e847]:
                    - button "撤销" [disabled] [ref=f1e848]
                    - button "重做" [disabled] [ref=f1e850]
                  - button "选择" [pressed] [ref=f1e852] [cursor=pointer]
                - generic [aria-hidden] [ref=f1e857]: 编辑
              - tabpanel "开始" [ref=f1e858]:
                - group "插入" [ref=f1e859]:
                  - generic [ref=f1e860]:
                    - button "文字" [disabled] [ref=f1e861]
                    - button "矩形" [disabled] [ref=f1e866]
                    - button "新建表单字段" [disabled] [ref=f1e874]
                  - generic [aria-hidden] [ref=f1e876]: 插入
                - group "页面" [ref=f1e877]:
                  - generic [ref=f1e878]:
                    - button "插入空白页" [disabled] [ref=f1e879]
                    - button "删除所选页" [disabled] [ref=f1e881]
                    - button "移动所选页" [disabled] [ref=f1e883]
                    - button "复制所选页" [disabled] [ref=f1e885]
                    - button "合并 PDF 文件" [disabled] [ref=f1e887]
                    - button "提取 PDF 页面" [disabled] [ref=f1e889]
                    - button "旋转所选页" [disabled] [ref=f1e891]
                    - button "页面尺寸" [disabled] [ref=f1e893]
                    - button "旋转当前页" [disabled] [ref=f1e895]
                    - button "页面" [ref=f1e901] [cursor=pointer]
                  - generic [aria-hidden] [ref=f1e907]: 页面
                - group "查看" [ref=f1e908]:
                  - generic [ref=f1e909]:
                    - button "查找" [ref=f1e910] [cursor=pointer]
                    - button "PDF 批注与表单侧栏" [pressed] [ref=f1e916] [cursor=pointer]:
                      - generic [ref=f1e921]: 侧栏
                  - generic [aria-hidden] [ref=f1e922]: 查看
          - generic [ref=f1e923]:
            - navigation "PDF 侧边导航" [ref=f1e924]:
              - button "PDF 文本查找侧栏" [ref=f1e925] [cursor=pointer]
              - button "PDF 批注侧栏" [pressed] [ref=f1e930] [cursor=pointer]
              - button "PDF 页面缩略图侧栏" [ref=f1e934] [cursor=pointer]
              - button "PDF 表单侧栏" [ref=f1e939] [cursor=pointer]
            - region "PDF 页面编辑区" [ref=f1e944]:
              - generic [ref=f1e945]:
                - img "PDF 第 1 页原文" [ref=f1e946]
                - img "PDF 页面标注" [ref=f1e947]:
                  - button "PDF 矩形标注 0c0898a4-0557-456c-aa3c-e128f7fc2c32" [ref=f1e948]
                - generic:
                  - textbox "PDF 页面表单 Text" [disabled] [ref=f1e954]: 合并前的中文
                  - textbox "PDF 页面表单 Date" [disabled] [ref=f1e958]:
                    - /placeholder: YYYY-MM-DD
                    - text: 2026-11-26
                  - generic [ref=f1e961] [cursor=pointer]:
                    - img "Image" [ref=f1e962]
                    - button "PDF 页面表单 Image" [disabled] [ref=f1e963]
                  - checkbox "PDF 页面表单 Checked" [checked] [disabled] [ref=f1e967]
                  - radiogroup "PDF 页面单选表单 Choice":
                    - radio "PDF 页面表单 Choice A" [checked] [disabled] [ref=f1e972]
                    - radio "PDF 页面表单 Choice B" [disabled] [ref=f1e977]
              - generic [ref=f1e979]: 第 1 页 · 100%
            - complementary "PDF 批注与表单" [ref=f1e980]:
              - group "PDF 侧栏内容" [ref=f1e981]:
                - button "批注 2" [pressed] [ref=f1e982] [cursor=pointer]
                - button "表单 8" [ref=f1e984] [cursor=pointer]
                - button "文本查找" [ref=f1e986] [cursor=pointer]
                - button "页面缩略图" [ref=f1e988] [cursor=pointer]
              - generic [ref=f1e990]:
                - strong [ref=f1e991]: 添加文字
                - generic [ref=f1e992]:
                  - text: 文字内容
                  - textbox "PDF 新增文字" [disabled] [ref=f1e994]
                - generic [ref=f1e995]:
                  - text: 字号
                  - generic [ref=f1e996]:
                    - spinbutton "PDF 文字字号" [disabled] [ref=f1e997]: "16"
                    - generic [ref=f1e998]:
                      - button "增加" [disabled] [ref=f1e999]:
                        - generic [aria-hidden] [ref=f1e1000]: +
                      - button "减少" [disabled] [ref=f1e1001]:
                        - generic [aria-hidden] [ref=f1e1002]: −
                - generic [ref=f1e1003]:
                  - generic [ref=f1e1004]: 颜色
                  - group "PDF 标注颜色" [ref=f1e1005]:
                    - button "PDF 标注颜色" [disabled] [ref=f1e1006]:
                      - generic [ref=f1e1008]: "#253044"
                - paragraph [ref=f1e1009]: 选择文字或高亮工具后点击页面放置，也可以使用下方按钮。
                - button "放在当前页中央" [disabled] [ref=f1e1010]
                - generic "PDF 标注列表" [ref=f1e1012]:
                  - button "第 1 页 · 矩形 1 矩形框标注" [ref=f1e1013] [cursor=pointer]:
                    - generic [ref=f1e1016]:
                      - strong [ref=f1e1017]: 第 1 页 · 矩形 1
                      - generic [ref=f1e1018]: 矩形框标注
                  - button "第 3 页 · 矩形 2 矩形框标注" [ref=f1e1019] [cursor=pointer]:
                    - generic [ref=f1e1022]:
                      - strong [ref=f1e1023]: 第 3 页 · 矩形 2
                      - generic [ref=f1e1024]: 矩形框标注
          - group "PDF 状态栏" [ref=f1e1025]:
            - group "PDF 页面导航" [ref=f1e1026]:
              - button "PDF 上一页" [disabled] [ref=f1e1027]
              - generic [ref=f1e1031]:
                - spinbutton "PDF 跳转页" [ref=f1e1032]: "1"
                - generic [ref=f1e1033]:
                  - button "增加" [ref=f1e1034] [cursor=pointer]:
                    - generic [aria-hidden] [ref=f1e1035]: +
                  - button "减少" [disabled] [ref=f1e1036]:
                    - generic [aria-hidden] [ref=f1e1037]: −
              - generic [ref=f1e1038]: / 3
              - button "PDF 下一页" [ref=f1e1039] [cursor=pointer]
            - generic "只读。PDF 原有正文保持原版式；可编辑新增批注和原文件的可填写表单。" [ref=f1e1043]: 只读
            - group "PDF 视图缩放" [ref=f1e1044]:
              - button "PDF 缩小视图" [ref=f1e1045] [cursor=pointer]
              - generic [ref=f1e1050]:
                - generic [ref=f1e1051]: PDF 缩放
                - button "PDF 缩放 100%" [ref=f1e1052] [cursor=pointer]:
                  - generic [ref=f1e1053]: 100%
              - button "PDF 放大视图" [ref=f1e1054] [cursor=pointer]
    - generic [ref=f1e1059]:
      - button "关闭" [ref=f1e1060] [cursor=pointer]
      - button "恢复为新文档" [ref=f1e1062] [cursor=pointer]
  - text: ✓
```

# Test source

```ts
  1   | import { expect, test, type Page, type Locator } from '@playwright/test';
  2   | import { mkdir, readFile, writeFile } from 'node:fs/promises';
  3   | import path from 'node:path';
  4   | import { createHash } from 'node:crypto';
  5   | import { PDFDocument, PDFName, PDFDict } from '../docs/node_modules/pdf-lib/cjs/index.js';
  6   | import { basicPdf, sevenFields, addLink } from '../docs/tests/studio-pdf-compose-fixtures.mjs';
  7   |
  8   | const audit = path.resolve('docs/audits/2026-11-27/pdf-composition');
  9   | const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
  10  | async function ready(page: Page) {
  11  |   await expect(page.getByRole('region', { name: 'PDF 页面编辑区', exact: true }).first()).toHaveAttribute('aria-busy', 'false');
  12  | }
  13  | async function snapshot(page: Page) {
  14  |   return page.evaluate(async () => {
  15  |     const database = await new Promise<IDBDatabase>((resolve, reject) => {
  16  |       const request = indexedDB.open('zuvi-office-studio', 2); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  17  |     });
  18  |     const id = await new Promise<string>((resolve, reject) => {
  19  |       const request = database.transaction('preferences').objectStore('preferences').get('active'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  20  |     });
  21  |     const file = await new Promise<{ id: string; revision: number; document: { kind: string; pageCount: number; sourcePageCount: number; name: string; pages: { id: string; sourcePage: number }[]; marks: { id: string; page: number }[]; fields: { name: string; value: string | boolean; type: string; readOnly: boolean; widgets?: { page: number }[] }[] }; source: Blob }>((resolve, reject) => {
  22  |       const request = database.transaction('files').objectStore('files').get(id); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  23  |     });
  24  |     database.close();
  25  |     const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await file.source.arrayBuffer()))).map((value) => value.toString(16).padStart(2, '0')).join('');
  26  |     return { id: file.id, revision: file.revision, document: file.document, sourceHash: digest, sourceSize: file.source.size };
  27  |   });
  28  | }
  29  | async function save(page: Page) {
  30  |   await page.getByRole('button', { name: '保存', exact: true }).click();
  31  |   await expect(page.locator('.zuvi-office-studio [data-save-state]').first()).toHaveAttribute('data-save-state', 'saved');
  32  | }
  33  | async function imported(page: Page, bytes: Uint8Array, name: string) {
  34  |   await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name, mimeType: 'application/pdf', buffer: Buffer.from(bytes) }); await ready(page);
  35  | }
  36  | async function exported(page: Page, name: string, scope: Page | Locator = page) {
  37  |   const pending = page.waitForEvent('download'); await scope.getByRole('button', { name: '导出文件', exact: true }).click();
  38  |   const bytes = await readFile((await (await pending).path())!); await writeFile(path.join(audit, name), bytes); return bytes;
  39  | }
  40  | async function merge(page: Page, bytes: Uint8Array, name: string) {
  41  |   await page.getByRole('button', { name: '合并 PDF 文件', exact: true }).click();
  42  |   const dialog = page.getByRole('dialog', { name: '合并 PDF 文件', exact: true });
  43  |   await dialog.getByLabel('选择合并 PDF 文件', { exact: true }).setInputFiles({ name, mimeType: 'application/pdf', buffer: Buffer.from(bytes) });
  44  |   await expect(dialog.getByLabel('加入 PDF 页码', { exact: true })).toHaveValue('1-2'); return dialog;
  45  | }
  46  |
  47  | test('merges native pages and fields with editable marks, paired history, persistence, old-version export and two PDF reopens', async ({ page }) => {
  48  |   test.setTimeout(180000); await mkdir(audit, { recursive: true });
  49  |   const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  50  |   const first = await sevenFields(), second = await basicPdf({ pages: 2, fieldName: 'Text', value: 'Incoming', label: 'INCOMING' });
  51  |   const vendor = first.pdf.getForm().createTextField('Vendor'); vendor.setText('PASSIVE'); vendor.addToPage(first.pages[0], { x: 20, y: 30, width: 150, height: 27, font: first.font }); vendor.enableReadOnly(); vendor.updateAppearances(first.font); vendor.acroField.dict.set(PDFName.of('FT'), PDFName.of('VendorPassive'));
  52  |   addLink(second.pdf, second.pages[0], second.pages[1], { NM: 'incoming-link' });
  53  |   const original = await first.bytes(), incoming = await second.bytes();
  54  |   await writeFile(path.join(audit, 'primary-source.pdf'), original); await writeFile(path.join(audit, 'incoming-source.pdf'), incoming);
  55  |   await page.goto('/#/components/office-studio'); await imported(page, original, 'Primary.pdf');
  56  |   await page.getByLabel('PDF 页面表单 Text', { exact: true }).fill('合并前的中文');
  57  |   await page.getByRole('tab', { name: '批注', exact: true }).click(); await page.getByRole('button', { name: '矩形', exact: true }).click();
  58  |   const paper = page.locator('.zuvi-studio-pdf-paper'); await paper.scrollIntoViewIfNeeded(); const box = await paper.boundingBox();
  59  |   await page.mouse.move(box!.x + 210, box!.y + 330); await page.mouse.down(); await page.mouse.move(box!.x + 260, box!.y + 350, { steps: 4 }); await page.mouse.up();
  60  |   await page.getByRole('tab', { name: '开始', exact: true }).click();
  61  |   await page.getByRole('button', { name: '复制所选页', exact: true }).click();
  62  |   const copy = page.getByRole('dialog', { name: '复制所选 PDF 页面', exact: true }); await copy.getByLabel('PDF 页面插入位置').fill('3'); await copy.getByRole('button', { name: '应用 PDF 页面操作' }).click();
  63  |   await save(page); const before = await snapshot(page); expect(before.document.pageCount).toBe(3); expect(before.document.marks).toHaveLength(2); expect(before.sourceHash).toBe(hash(original));
  64  |   let dialog = await merge(page, incoming, 'Incoming.pdf');
  65  |   await dialog.getByLabel('合并 PDF 插入位置').fill('2'); await dialog.getByLabel('加入 PDF 页码').fill('2,1'); await dialog.getByRole('button', { name: '取消', exact: true }).click();
  66  |   expect(await snapshot(page)).toEqual(before);
  67  |   dialog = await merge(page, incoming, 'Incoming.pdf'); await dialog.getByLabel('合并 PDF 插入位置').fill('2'); await dialog.getByLabel('加入 PDF 页码').fill('2,1'); await dialog.getByRole('button', { name: '应用 PDF 合并', exact: true }).click();
  68  |   await expect(dialog).not.toBeVisible(); await ready(page); await save(page);
  69  |   const combined = await snapshot(page); expect(combined.document.pageCount).toBe(5); expect(combined.document.sourcePageCount).toBe(5); expect(combined.sourceHash).not.toBe(before.sourceHash);
  70  |   expect(combined.document.fields.map((field) => field.name)).toContain('Text__2'); expect(combined.document.fields.find((field) => field.name === 'Vendor')?.readOnly).toBe(true);
  71  |   expect(combined.document.marks.map((mark) => mark.page)).toEqual([0, 4]);
  72  |   await page.getByLabel('PDF 页面表单 Text', { exact: true }).first().fill('After merge');
  73  |   await page.getByRole('button', { name: '撤销', exact: true }).click(); await expect(page.getByLabel('PDF 页面表单 Text', { exact: true }).first()).toHaveValue('合并前的中文'); await save(page);
  74  |   expect((await snapshot(page)).sourceHash).toBe(combined.sourceHash);
  75  |   await page.getByRole('button', { name: '撤销', exact: true }).click(); await ready(page); await save(page);
  76  |   const undone = await snapshot(page); expect(undone.document.pageCount).toBe(3); expect(undone.sourceHash).toBe(before.sourceHash); expect(undone.document.marks).toEqual(before.document.marks);
  77  |   await page.getByRole('button', { name: '重做', exact: true }).click(); await ready(page); await save(page); expect((await snapshot(page)).sourceHash).toBe(combined.sourceHash);
  78  |   await page.reload(); await ready(page); const fresh = await snapshot(page); expect(fresh.document.pageCount).toBe(5); expect(fresh.sourceHash).toBe(combined.sourceHash); expect(fresh.document.marks).toEqual(combined.document.marks);
  79  |   await page.getByRole('button', { name: '历史版本', exact: true }).click(); const history = page.getByRole('dialog', { name: '文档历史版本', exact: true });
  80  |   await history.getByRole('button', { name: new RegExp(`^版本 ${before.revision} ·`) }).click(); await expect(history.getByLabel('PDF 页面表单 Text', { exact: true }).first()).toHaveValue('合并前的中文');
  81  |   const historical = await PDFDocument.load(await exported(page, 'before-composition-history.pdf', history)); expect(historical.getPageCount()).toBe(3); expect(historical.getForm().getTextField('Text').getText()).toBe('合并前的中文'); expect(historical.getForm().getFields().some((field) => field.getName() === 'Text__2')).toBe(false);
> 82  |   await history.getByRole('button', { name: '关闭', exact: true }).click();
      |                                                                  ^ Error: locator.click: Error: strict mode violation: getByRole('dialog', { name: '文档历史版本', exact: true }).getByRole('button', { name: '关闭', exact: true }) resolved to 2 elements:
  83  |   await page.getByRole('button', { name: '页面缩略图', exact: true }).click(); await expect(page.getByRole('button', { name: /PDF 第 \d+ 页缩略图/ })).toHaveCount(5);
  84  |   await page.screenshot({ path: path.join(audit, 'combined-light.png'), fullPage: true, animations: 'disabled' });
  85  |   for (let round = 1; round <= 2; round++) {
  86  |     const bytes = await exported(page, `combined-round-${round}.pdf`), native = await PDFDocument.load(bytes); expect(native.getPageCount()).toBe(5); expect(native.getForm().getTextField('Text').getText()).toBe('合并前的中文'); expect(native.getForm().getTextField('Text__2').getText()).toBe('Incoming'); expect(native.getForm().getTextField('Text').acroField.getWidgets()).toHaveLength(2);
  87  |     const link = native.getPages()[2].node.Annots()!.asArray().map((ref) => native.context.lookup(ref)).find((dict) => dict instanceof PDFDict && dict.lookup(PDFName.of('Subtype')) === PDFName.of('Link')) as PDFDict;
  88  |     expect(link.lookup(PDFName.of('Dest')).get(0).toString()).toBe(native.getPages()[1].ref.toString());
  89  |     await imported(page, bytes, `Reopened-${round}.pdf`); await expect(page.getByLabel('PDF 页面表单 Text', { exact: true }).first()).toHaveValue('合并前的中文');
  90  |   }
  91  |   await writeFile(path.join(audit, 'paired-history-and-refresh.json'), JSON.stringify({ before, combined, undone, fresh, errors }, null, 2) + '\n'); expect(errors).toEqual([]);
  92  | });
  93  |
  94  | test('extracts radio pages with an explicit value policy, native V/DV checks, undo and repeated reopens', async ({ page }) => {
  95  |   test.setTimeout(120000); await mkdir(audit, { recursive: true });
  96  |   const fixture = await basicPdf({ pages: 2, form: false, label: 'RADIO' }), radio = fixture.pdf.getForm().createRadioGroup('Choice'); radio.disableMutualExclusion();
  97  |   radio.addOptionToPage('A', fixture.pages[0], { x: 40, y: 120, width: 20, height: 20 }); radio.addOptionToPage('B', fixture.pages[1], { x: 40, y: 120, width: 20, height: 20 }); radio.select('B'); radio.acroField.dict.set(PDFName.of('DV'), radio.acroField.getWidgets()[0].getOnValue()!);
  98  |   const bytes = await fixture.bytes(); await writeFile(path.join(audit, 'radio-source.pdf'), bytes); await page.goto('/#/components/office-studio'); await imported(page, bytes, 'Radio.pdf'); const before = await snapshot(page);
  99  |   await page.getByRole('button', { name: '提取 PDF 页面', exact: true }).click(); const dialog = page.getByRole('dialog', { name: '提取 PDF 页面', exact: true }); await dialog.getByLabel('提取 PDF 页码').fill('1'); await dialog.getByRole('button', { name: '应用 PDF 提取', exact: true }).click(); await expect(dialog.getByRole('alert')).toContainText('单选值'); expect((await snapshot(page)).sourceHash).toBe(before.sourceHash);
  100 |   const clearing = dialog.getByRole('checkbox', { name: '清除在所选页面中已无控件的单选值', exact: true }); await dialog.locator('label.zuvi-checkbox').filter({ has: clearing }).click(); await expect(clearing).toBeChecked(); await dialog.getByRole('button', { name: '应用 PDF 提取', exact: true }).click(); await expect(dialog).not.toBeVisible(); await ready(page); await save(page);
  101 |   const extracted = await snapshot(page); expect(extracted.document.pageCount).toBe(1); expect(extracted.document.fields[0].value).toBe('');
  102 |   let native = await PDFDocument.load(await exported(page, 'radio-cleared.pdf')), field = native.getForm().getRadioGroup('Choice'); expect(field.getSelected()).toBeUndefined(); expect(field.acroField.dict.lookup(PDFName.of('DV')).toString()).toBe(field.acroField.getWidgets()[0].getOnValue()!.toString());
  103 |   await page.getByRole('button', { name: '撤销', exact: true }).click(); await ready(page); await save(page); expect((await snapshot(page)).sourceHash).toBe(before.sourceHash); expect((await snapshot(page)).document.pageCount).toBe(2);
  104 |   await page.getByRole('button', { name: '重做', exact: true }).click(); await ready(page);
  105 |   const choose = page.getByRole('radio', { name: 'PDF 页面表单 Choice A', exact: true }); await choose.locator('..').click(); await expect(choose).toBeChecked();
  106 |   for (let round = 1; round <= 2; round++) { const output = await exported(page, `radio-round-${round}.pdf`); native = await PDFDocument.load(output); field = native.getForm().getRadioGroup('Choice'); expect(native.getPageCount()).toBe(1); expect(field.getSelected()).toBe('A'); expect(field.acroField.dict.lookup(PDFName.of('DV')).toString()).toBe(field.acroField.getWidgets()[0].getOnValue()!.toString()); await imported(page, output, `Radio-reopened-${round}.pdf`); }
  107 |   await writeFile(path.join(audit, 'radio-policy.json'), JSON.stringify({ before, extracted }, null, 2) + '\n');
  108 | });
  109 |
  110 | test('keeps rejected field conflicts unchanged and verifies the actual merge and extraction dialogs in light, dark and 320px', async ({ page }) => {
  111 |   test.setTimeout(120000); await mkdir(audit, { recursive: true });
  112 |   const first = await basicPdf({ pages: 2, value: 'Current' }), second = await basicPdf({ pages: 2, value: 'Incoming' });
  113 |   const original = await first.bytes(), incoming = await second.bytes(); await page.goto('/#/components/office-studio'); await imported(page, original, 'Conflict.pdf'); const before = await snapshot(page);
  114 |   let dialog = await merge(page, incoming, 'Conflict-incoming.pdf'); await dialog.getByRole('button', { name: /^PDF 同名字段处理/ }).click(); await page.getByRole('option', { name: '连接兼容字段，共享填写值', exact: true }).click(); await dialog.getByRole('button', { name: '应用 PDF 合并', exact: true }).click(); await expect(dialog.getByRole('alert')).toContainText('同名字段'); expect(await snapshot(page)).toEqual(before); await dialog.getByRole('button', { name: '取消', exact: true }).click();
  115 |   dialog = await merge(page, incoming, 'Conflict-incoming.pdf'); await page.screenshot({ path: path.join(audit, 'merge-dialog-light.png'), fullPage: true, animations: 'disabled' });
  116 |   await dialog.getByRole('button', { name: '取消', exact: true }).click(); await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  117 |   dialog = await merge(page, incoming, 'Conflict-incoming.pdf'); await page.screenshot({ path: path.join(audit, 'merge-dialog-dark.png'), fullPage: true, animations: 'disabled' });
  118 |   await page.setViewportSize({ width: 320, height: 720 }); const bounds = await dialog.boundingBox(); expect(bounds!.width).toBeLessThanOrEqual(320); const sizes = await dialog.evaluate((element) => ({ width: element.clientWidth, scroll: element.scrollWidth })); expect(sizes.scroll).toBeLessThanOrEqual(sizes.width + 1);
  119 |   await dialog.getByLabel('组合后的 PDF 名称').fill('Merged.pdf'); await expect(dialog.getByRole('button', { name: '应用 PDF 合并', exact: true })).toBeInViewport(); await page.screenshot({ path: path.join(audit, 'merge-dialog-dark-320.png'), fullPage: true, animations: 'disabled' }); await dialog.getByRole('button', { name: '取消', exact: true }).click();
  120 |   await page.getByRole('button', { name: '提取 PDF 页面', exact: true }).click(); dialog = page.getByRole('dialog', { name: '提取 PDF 页面', exact: true }); await dialog.getByLabel('提取 PDF 页码').fill('1,1'); await dialog.getByRole('button', { name: '应用 PDF 提取', exact: true }).click(); await expect(dialog.getByRole('alert')).toContainText('不能重复'); await page.screenshot({ path: path.join(audit, 'extract-dialog-dark-320.png'), fullPage: true, animations: 'disabled' }); await dialog.getByRole('button', { name: '取消', exact: true }).click();
  121 |   const readonly = page.getByRole('switch', { name: '只读预览', exact: true }); await readonly.click(); await expect(page.getByRole('button', { name: '合并 PDF 文件', exact: true })).toBeDisabled(); await expect(page.getByRole('button', { name: '提取 PDF 页面', exact: true })).toBeDisabled(); expect((await snapshot(page)).sourceHash).toBe(before.sourceHash);
  122 |   await writeFile(path.join(audit, 'conflicts-and-dialog-geometry.json'), JSON.stringify({ before, bounds, sizes }, null, 2) + '\n');
  123 | });
  124 |
```