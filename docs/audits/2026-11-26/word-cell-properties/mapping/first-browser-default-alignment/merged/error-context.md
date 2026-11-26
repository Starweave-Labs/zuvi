# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-word-cell-mapping.spec.ts >> maps real merged multi-cell edits through mixed row gaps, one history action, two native reopens and print
- Location: e2e/office-studio-word-cell-mapping.spec.ts:338:1

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 15
+ Received  + 15

@@ -14,19 +14,19 @@
          false,
        ],
        "colspan": 1,
        "column": 0,
        "horizontal": Array [
-         "left",
-         "left",
-         "left",
-         "left",
-         "left",
-         "left",
-         "left",
-         "left",
-         "left",
+         "start",
+         "start",
+         "start",
+         "start",
+         "start",
+         "start",
+         "start",
+         "start",
+         "start",
        ],
        "italic": Array [
          false,
          false,
          false,
@@ -62,11 +62,11 @@
          false,
        ],
        "colspan": 2,
        "column": 1,
        "horizontal": Array [
-         "left",
+         "start",
        ],
        "italic": Array [
          true,
        ],
        "margins": Object {
@@ -85,11 +85,11 @@
          false,
        ],
        "colspan": 1,
        "column": 1,
        "horizontal": Array [
-         "left",
+         "start",
        ],
        "italic": Array [
          false,
        ],
        "margins": null,
@@ -107,12 +107,12 @@
          false,
        ],
        "colspan": 1,
        "column": 2,
        "horizontal": Array [
-         "left",
-         "left",
+         "start",
+         "start",
        ],
        "italic": Array [
          false,
          false,
        ],
@@ -131,11 +131,11 @@
          true,
        ],
        "colspan": 2,
        "column": 0,
        "horizontal": Array [
-         "left",
+         "start",
        ],
        "italic": Array [
          false,
        ],
        "margins": Object {
@@ -154,11 +154,11 @@
          false,
        ],
        "colspan": 1,
        "column": 2,
        "horizontal": Array [
-         "left",
+         "start",
        ],
        "italic": Array [
          true,
        ],
        "margins": null,

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
                - button "打开本地文档 Merged mapping.docx" [ref=e356] [cursor=pointer]:
                  - generic [ref=e357]: Merged mapping.docx
              - button "历史版本" [ref=e358] [cursor=pointer]
              - switch "只读预览" [ref=e360] [cursor=pointer]
            - region "Word 文档编辑器" [ref=e364]:
              - generic [ref=e365]:
                - generic [ref=e366]:
                  - generic [ref=e371]: Word
                  - generic "可编辑 · ⌘ / Ctrl S 保存" [ref=e372]:
                    - status "已保存" [ref=e373]
                - textbox "文档名称" [ref=e378]: Merged mapping.docx
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
                      - slider "首行缩进标尺" [ref=e671] [cursor=pointer]
                      - slider "悬挂缩进标尺" [ref=e673] [cursor=pointer]
                      - slider "左缩进标尺" [ref=e675] [cursor=pointer]
                      - slider "右缩进标尺" [ref=e677] [cursor=pointer]
                    - generic [ref=e679]:
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
                      - article "文档纸张" [ref=e680]:
                        - region "页眉区域" [ref=e681]
                        - textbox "Word 文档正文" [ref=e683]:
                          - paragraph [ref=e684]: Mixed merged cell mapping
                          - table [ref=e686]:
                            - rowgroup [ref=e691]:
                              - row [ref=e692]:
                                - cell [ref=e693]:
                                  - generic [ref=e694]:
                                    - paragraph [ref=e695]:
                                      - strong [ref=e696]: Span A
                                    - paragraph [ref=e697]: A line 1
                                    - paragraph [ref=e698]: A line 2
                                    - paragraph [ref=e699]: A line 3
                                    - paragraph [ref=e700]: A line 4
                                    - paragraph [ref=e701]: A line 5
                                    - paragraph [ref=e702]: A line 6
                                    - paragraph [ref=e703]: A line 7
                                    - paragraph [ref=e704]: A line 8
                                - cell [ref=e705]:
                                  - paragraph [ref=e707]:
                                    - emphasis [ref=e708]: Wide B
                              - row [ref=e709]:
                                - cell [ref=e710]:
                                  - paragraph [ref=e712]: Cell C
                                - cell [ref=e713]:
                                  - generic [ref=e714]:
                                    - paragraph [ref=e715]:
                                      - strong [ref=e716]: D first
                                    - paragraph [ref=e717]: D last
                              - row [ref=e718]:
                                - cell [ref=e719]:
                                  - paragraph [ref=e721]:
                                    - strong [ref=e722]: Unselected E
                                - cell [ref=e723]:
                                  - paragraph [ref=e725]:
                                    - emphasis [ref=e726]: Unselected F
                          - paragraph [ref=e727]: After the mapping table
                        - region "页脚区域" [ref=e728]
                - generic [ref=e729]:
                  - generic [ref=e730]: 138 字 · A4 · 纵向
                  - generic [ref=e731]:
                    - generic [ref=e732]: 缩放
                    - generic [ref=e733]:
                      - generic [ref=e734]: Word 缩放
                      - button "Word 缩放 适应宽度" [ref=e735] [cursor=pointer]:
                        - generic [ref=e736]: 适应宽度
            - paragraph [ref=e737]: 文件保存在当前浏览器的本地文档空间。需要长期留存时，请导出文件。
          - group [ref=e738]:
            - generic "示例代码" [ref=e739] [cursor=pointer]:
              - generic [aria-hidden] [ref=e740]: </>
              - text: 示例代码
              - generic [aria-hidden] [ref=e741]: 展开 / 收起
        - heading "编辑能力" [level=2] [ref=e742]
        - table [ref=e744]:
          - rowgroup [ref=e745]:
            - row [ref=e746]:
              - columnheader "文档" [ref=e747]
              - columnheader "支持的操作" [ref=e748]
              - columnheader "当前范围" [ref=e749]
          - rowgroup [ref=e750]:
            - row [ref=e751]:
              - cell "Word" [ref=e752]
              - cell "字体与小数字号输入、正文排版、列表、表格、图片、页眉页脚、页码、查找替换、页面设置、撤销重做；导入与导出 DOCX" [ref=e753]
              - cell "支持内嵌图片与单节文档。修订、目录、浮动对象等复杂结构会提示暂不支持。" [ref=e754]
            - row [ref=e755]:
              - cell "Excel" [ref=e756]
              - cell "单元格与矩形选区、字体与小数字号输入、手动与自动行高/列宽、查找替换、边框与垂直对齐、清除格式、公式和跨表引用、格式、复制粘贴、工作表增删、行列插入删除、合并、冻结、排序、筛选、柱状图与折线图；导入与导出 XLSX" [ref=e757]
              - cell "10,000 行、256 列、32 张表、100,000 个已使用单元格。透视、宏、数组公式及复杂图表暂不支持。" [ref=e758]
            - row [ref=e759]:
              - cell "PDF" [ref=e760]
              - cell "分页与缩略图、缩放、旋转、全文查找、文字与高亮、矩形和手写批注、已有表单、撤销重做；导出 PDF" [ref=e761]
              - cell "批注和表单编辑。任意原始文字修改、原文重排及扫描件 OCR 暂不支持。" [ref=e762]
        - heading "组件接入" [level=2] [ref=e763]
        - paragraph [ref=e764]: UI 组件使用 Tiptap / ProseMirror 和公式计算库；文件适配使用 docx、ExcelJS、pdf-lib 与 PDF.js。本页无需文档服务器。宿主可以替换保存与导入导出回调，接入自己的文件系统。
        - paragraph [ref=e765]:
          - text: PDF 的 worker、字体与渲染由
          - code [ref=e766]: pdfRenderer
          - text: 提供。本页的适配代码位于
          - code [ref=e767]: docs/src/pages/collaboration/office-studio/
          - text: 。组件自 v0.4.0 起随
          - code [ref=e768]: "@zuvi/react"
          - text: 和 Registry 发布。
        - region "组件属性表，可横向滚动" [ref=e769]:
          - table [ref=e770]:
            - rowgroup [ref=e771]:
              - row [ref=e772]:
                - columnheader "属性名" [ref=e773]
                - columnheader "类型" [ref=e774]
                - columnheader "默认值" [ref=e775]
                - columnheader "说明" [ref=e776]
            - rowgroup [ref=e777]:
              - row [ref=e778]:
                - cell "value / defaultValue" [ref=e779]
                - cell [ref=e780]:
                  - code [ref=e781]: OfficeStudioDocument
                - cell [ref=e782]:
                  - code [ref=e783]: —
                - cell "受控文档或非受控初始文档；支持 Word、Excel、PDF 三种模型。" [ref=e784]
              - row [ref=e785]:
                - cell "onChange" [ref=e786]
                - cell [ref=e787]:
                  - code [ref=e788]: (document) => void
                - cell [ref=e789]:
                  - code [ref=e790]: —
                - cell "内容或文件名称变化。" [ref=e791]
              - row [ref=e792]:
                - cell "source / pdfRenderer" [ref=e793]
                - cell [ref=e794]:
                  - code [ref=e795]: Blob / StudioPdfRenderer
                - cell [ref=e796]:
                  - code [ref=e797]: —
                - cell "原始文件及 PDF 渲染适配；worker 资源由宿主管理。" [ref=e798]
              - row [ref=e799]:
                - cell "onSave / onExport / onPrint" [ref=e800]
                - cell [ref=e801]:
                  - code [ref=e802]: (document) => void | Promise<void>
                - cell [ref=e803]:
                  - code [ref=e804]: —
                - cell "宿主处理保存、导出或打印；返回后更新状态，失败可重试。" [ref=e805]
              - row [ref=e806]:
                - cell "onImport / onCreate" [ref=e807]
                - cell [ref=e808]:
                  - code [ref=e809]: (file | kind) => void | Promise<void>
                - cell [ref=e810]:
                  - code [ref=e811]: —
                - cell "宿主解析文件或创建模型，并更新受控值。" [ref=e812]
              - row [ref=e813]:
                - cell "readOnly / disabled" [ref=e814]
                - cell [ref=e815]:
                  - code [ref=e816]: boolean
                - cell [ref=e817]:
                  - code [ref=e818]: "false"
                - cell "只读预览或禁用编辑与文件操作。" [ref=e819]
              - row [ref=e820]:
                - cell "saveState" [ref=e821]
                - cell [ref=e822]:
                  - code [ref=e823]: "'saved' | 'saving' | 'unsaved' | 'error'"
                - cell [ref=e824]:
                  - code [ref=e825]: —
                - cell "宿主自动保存状态。" [ref=e826]
              - row [ref=e827]:
                - cell "height" [ref=e828]
                - cell [ref=e829]:
                  - code [ref=e830]: number | string
                - cell [ref=e831]:
                  - code [ref=e832]: "760"
                - cell "编辑器高度；100% 需要父容器设置确定高度。" [ref=e833]
              - row [ref=e834]:
                - cell "fullscreen / onFullscreenChange" [ref=e835]
                - cell [ref=e836]:
                  - code [ref=e837]: boolean / (value) => void
                - cell [ref=e838]:
                  - code [ref=e839]: —
                - cell "全屏布局，切换时编辑内容保持挂载。" [ref=e840]
              - row [ref=e841]:
                - cell "ref" [ref=e842]
                - cell [ref=e843]:
                  - code [ref=e844]: OfficeStudioHandle
                - cell [ref=e845]:
                  - code [ref=e846]: —
                - cell "getDocument()、save()、export()、print()、setFullscreen()。" [ref=e847]
              - row [ref=e848]:
                - cell "classNames" [ref=e849]
                - cell [ref=e850]:
                  - code [ref=e851]: "{ root?; header?; title?; actions?; stage?; status?; error? }"
                - cell [ref=e852]:
                  - code [ref=e853]: —
                - cell "追加语义结构类名，配合 data-part 与 CSS 变量定制。" [ref=e854]
  - text: ✓ ✓ ✓ ✓ ✓
```

# Test source

```ts
  159 |         return value === null ? null : Number(value);
  160 |       }),
  161 |       cells,
  162 |     };
  163 |   });
  164 | }
  165 | 
  166 | // Read-only geometry from the actual editor DOM or the actual print document.
  167 | function tableGeometry(element: Element) {
  168 |   const tableRect = element.getBoundingClientRect();
  169 |   const scale = tableRect.width / (element as HTMLElement).offsetWidth;
  170 |   const box = (rect: DOMRect) => ({
  171 |     left: (rect.left - tableRect.left) / scale,
  172 |     right: (rect.right - tableRect.left) / scale,
  173 |     top: (rect.top - tableRect.top) / scale,
  174 |     bottom: (rect.bottom - tableRect.top) / scale,
  175 |     width: rect.width / scale,
  176 |     height: rect.height / scale,
  177 |   });
  178 |   const cells = Array.from(element.querySelectorAll<HTMLTableCellElement>(':scope > tbody > tr:not([data-word-auto-page-row]) > td'));
  179 |   return {
  180 |     width: tableRect.width / scale,
  181 |     columns: Array.from(element.querySelectorAll<HTMLElement>(':scope > colgroup > col')).map(column => parseFloat(column.style.width)),
  182 |     cells: cells.map(cell => {
  183 |       const content = cell.querySelector<HTMLElement>(':scope > [data-word-cell-content]')!;
  184 |       const paragraphs = Array.from(content.querySelectorAll<HTMLElement>(':scope > p'));
  185 |       const first = paragraphs[0], last = paragraphs[paragraphs.length - 1];
  186 |       const outer = getComputedStyle(cell), inner = getComputedStyle(content);
  187 |       const firstStyle = getComputedStyle(first), lastStyle = getComputedStyle(last);
  188 |       const range = cell.ownerDocument.createRange();
  189 |       range.selectNodeContents(last);
  190 |       const tdRect = cell.getBoundingClientRect(), rect = content.getBoundingClientRect();
  191 |       return {
  192 |         name: first.textContent || '',
  193 |         box: box(rect), outerBox: box(tdRect),
  194 |         fillError: (tdRect.height - rect.height) / scale - parseFloat(outer.paddingTop) - parseFloat(outer.paddingBottom),
  195 |         topGap: (first.getBoundingClientRect().top - rect.top) / scale,
  196 |         bottomGap: (rect.bottom - last.getBoundingClientRect().bottom) / scale,
  197 |         expectedTop: parseFloat(inner.paddingTop) + parseFloat(inner.borderTopWidth) + parseFloat(firstStyle.marginTop),
  198 |         expectedBottom: parseFloat(inner.paddingBottom) + parseFloat(inner.borderBottomWidth) + parseFloat(lastStyle.marginBottom),
  199 |         rangeRightGap: (last.getBoundingClientRect().right - range.getBoundingClientRect().right) / scale,
  200 |         padding: {
  201 |           top: parseFloat(inner.paddingTop), right: parseFloat(inner.paddingRight),
  202 |           bottom: parseFloat(inner.paddingBottom), left: parseFloat(inner.paddingLeft),
  203 |         },
  204 |         outerPadding: {
  205 |           top: parseFloat(outer.paddingTop), right: parseFloat(outer.paddingRight),
  206 |           bottom: parseFloat(outer.paddingBottom), left: parseFloat(outer.paddingLeft),
  207 |         },
  208 |         inlineMinHeight: content.style.minHeight,
  209 |       };
  210 |     }),
  211 |   };
  212 | }
  213 | type Geometry = ReturnType<typeof tableGeometry>;
  214 | function near(actual: number, expected: number) {
  215 |   expect(Math.abs(actual - expected)).toBeLessThan(0.1);
  216 | }
  217 | function assertMergedGeometry(actual: Geometry, aligned: boolean) {
  218 |   near(actual.width, 440);
  219 |   expect(actual.columns).toEqual([140, 150, 150]);
  220 |   expect(actual.cells.map(cell => cell.name)).toEqual(['Span A', 'Wide B', 'Cell C', 'D first', 'Unselected E', 'Unselected F']);
  221 |   const [a, b, c, d, e, f] = actual.cells;
  222 |   const horizontal = [[8, 136], [144, 432], [148, 282], [298, 424], [0, 290], [290, 440]];
  223 |   actual.cells.forEach((cell, index) => {
  224 |     near(cell.box.left, horizontal[index][0]); near(cell.box.right, horizontal[index][1]);
  225 |     near(cell.fillError, 0);
  226 |   });
  227 |   // The rowspan ends in the second row, whose physical half-gap is 8px.
  228 |   near(a.box.top, b.box.top); near(a.box.bottom, c.box.bottom); near(c.box.bottom, d.box.bottom);
  229 |   near(c.box.top - b.box.bottom, 12); near(e.box.top - c.box.bottom, 8); near(e.box.top, f.box.top);
  230 |   if (aligned) {
  231 |     for (const cell of [a, b, c, d]) {
  232 |       near(cell.padding.left, 4.25 * 4 / 3);
  233 |       near(cell.padding.bottom, 5.5 * 4 / 3);
  234 |       near(cell.bottomGap, cell.expectedBottom);
  235 |       near(cell.rangeRightGap, 0);
  236 |     }
  237 |     near(a.padding.top, 0); near(a.padding.right, 3.25 * 4 / 3);
  238 |     near(e.padding.top, 12); near(e.padding.left, 2);
  239 |   }
  240 | }
  241 | function assertClearedGeometry(actual: Geometry) {
  242 |   expect(actual.cells).toHaveLength(4);
  243 |   expect(actual.columns).toEqual([208, 208]);
  244 |   const [direct, inherited, other] = actual.cells;
  245 |   near(inherited.outerBox.left - direct.outerBox.right, 0);
  246 |   near(direct.outerPadding.top, 0); near(inherited.outerPadding.top, 8);
  247 |   near(direct.outerPadding.left, 7.2); near(inherited.outerPadding.left, 7.2);
  248 |   near(other.outerPadding.left, 2); near(other.outerPadding.bottom, 3);
  249 |   for (const cell of actual.cells) expect(cell.inlineMinHeight).toBe('');
  250 | }
  251 | 
  252 | async function upload(page: Page, bytes: Buffer, name: string) {
  253 |   await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name, mimeType, buffer: bytes });
  254 |   await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
  255 |   await expect(bodyTable(page)).toBeVisible();
  256 |   await page.evaluate(() => document.fonts.ready);
  257 | }
  258 | async function assertState(table: Locator, expected: TableState) {
> 259 |   await expect(async () => expect(await readTable(table)).toEqual(expected)).toPass({ timeout: 5000 });
      |                                                                              ^ Error: expect(received).toEqual(expected) // deep equality
  260 | }
  261 | async function openDialog(page: Page, cell?: Locator) {
  262 |   if (cell) await cell.locator(':scope > [data-word-cell-content] > p').first().click();
  263 |   await page.getByRole('tab', { name: '插入', exact: true }).click();
  264 |   await page.getByRole('button', { name: '单元格对齐与边距', exact: true }).click();
  265 |   const dialog = page.getByRole('dialog', { name: '单元格对齐与边距', exact: true });
  266 |   await expect(dialog).toBeVisible();
  267 |   return dialog;
  268 | }
  269 | async function selectMergedBlock(page: Page, table: Locator) {
  270 |   const startCell = table.locator('td[rowspan="2"]');
  271 |   const endCell = table.locator('tr').first().locator('td[colspan="2"]');
  272 |   await startCell.scrollIntoViewIfNeeded();
  273 |   const start = (await startCell.boundingBox())!, end = (await endCell.boundingBox())!;
  274 |   await page.mouse.move(start.x + 4, start.y + Math.min(18, start.height / 2));
  275 |   await page.mouse.down();
  276 |   await page.mouse.move(end.x + end.width - 4, end.y + end.height / 2, { steps: 12 });
  277 |   await page.mouse.up();
  278 |   await expect(table.locator('td.selectedCell')).toHaveCount(4);
  279 |   expect(await table.locator('td.selectedCell').evaluateAll(cells => cells.map(cell => cell.querySelector('p')?.textContent))).toEqual(['Span A', 'Wide B', 'Cell C', 'D first']);
  280 | }
  281 | async function undoRedo(page: Page, table: Locator, before: TableState, after: TableState) {
  282 |   await page.getByRole('tab', { name: '开始', exact: true }).click();
  283 |   await page.getByRole('button', { name: '撤销', exact: true }).click();
  284 |   await assertState(table, before);
  285 |   await page.getByRole('button', { name: '重做', exact: true }).click();
  286 |   await assertState(table, after);
  287 | }
  288 | async function reopenTwice(page: Page, table: Locator, stem: string, expected: TableState, grid: number[], verify: (actual: Geometry) => void) {
  289 |   const rounds: Geometry[] = [];
  290 |   for (let round = 1; round <= 2; round++) {
  291 |     const pending = page.waitForEvent('download');
  292 |     await page.getByRole('button', { name: '导出文件', exact: true }).click();
  293 |     const bytes = await readFile((await (await pending).path())!);
  294 |     await writeFile(path.join(audit, `${stem}-round-${round}.docx`), bytes);
  295 |     const native = await nativeTable(bytes);
  296 |     expect(native.state).toEqual(expected); expect(native.grid).toEqual(grid);
  297 |     expect(native.continuations).toEqual(stem === 'merged' ? [{ row: 1, column: 0, colspan: 1, text: '' }] : []);
  298 |     await writeFile(path.join(audit, `${stem}-round-${round}.xml`), native.xml);
  299 |     await upload(page, bytes, `${stem}-round-${round}.docx`);
  300 |     await assertState(table, expected);
  301 |     await expect(async () => verify(await table.evaluate(tableGeometry))).toPass({ timeout: 5000 });
  302 |     rounds.push(await table.evaluate(tableGeometry));
  303 |   }
  304 |   return rounds;
  305 | }
  306 | async function printDocument(page: Page, context: BrowserContext, stem: string, verify: (actual: Geometry) => void) {
  307 |   await page.evaluate(() => {
  308 |     window.addEventListener('message', event => {
  309 |       if (event.data?.type === 'word-cell-mapping-print')
  310 |         (window as Window & { wordCellMappingPrint?: string }).wordCellMappingPrint = event.data.html;
  311 |     });
  312 |   });
  313 |   await page.addInitScript(() => {
  314 |     window.print = () => {
  315 |       window.parent.postMessage({ type: 'word-cell-mapping-print', html: document.documentElement.outerHTML }, '*');
  316 |       window.dispatchEvent(new Event('afterprint'));
  317 |     };
  318 |   });
  319 |   await page.getByRole('button', { name: '打印', exact: true }).click();
  320 |   await expect.poll(() => page.evaluate(() => (window as Window & { wordCellMappingPrint?: string }).wordCellMappingPrint)).toBeTruthy();
  321 |   const html = await page.evaluate(() => (window as Window & { wordCellMappingPrint?: string }).wordCellMappingPrint!);
  322 |   await writeFile(path.join(audit, `${stem}-print.html`), html);
  323 |   const preview = await context.newPage();
  324 |   try {
  325 |     await preview.setContent(html);
  326 |     await preview.evaluate(() => document.fonts.ready);
  327 |     const table = preview.locator('table').first();
  328 |     await expect(async () => verify(await table.evaluate(tableGeometry))).toPass({ timeout: 5000 });
  329 |     const geometry = await table.evaluate(tableGeometry);
  330 |     await preview.pdf({ path: path.join(audit, `${stem}-print.pdf`), preferCSSPageSize: true, printBackground: true });
  331 |     await preview.screenshot({ path: path.join(audit, `${stem}-print.png`), fullPage: true, animations: 'disabled' });
  332 |     return geometry;
  333 |   } finally {
  334 |     await preview.close();
  335 |   }
  336 | }
  337 | 
  338 | test('maps real merged multi-cell edits through mixed row gaps, one history action, two native reopens and print', async ({ page, context }) => {
  339 |   test.setTimeout(120000);
  340 |   await mkdir(audit, { recursive: true });
  341 |   const source = await readFile(path.join(audit, 'merged-source.docx'));
  342 |   const native = await nativeTable(source), before = native.state;
  343 |   expect(native.grid).toEqual([2100, 2250, 2250]);
  344 |   expect(native.continuations).toEqual([{ row: 1, column: 0, colspan: 1, text: '' }]);
  345 |   expect(before.defaults).toEqual({ top: 4, right: 5, bottom: 6, left: 7 });
  346 |   expect(before.rowSpacings).toEqual([null, 12, 0]);
  347 |   expect(before.cells.map(cell => [cell.row, cell.column, cell.colspan, cell.rowspan])).toEqual([[0, 0, 1, 2], [0, 1, 2, 1], [1, 1, 1, 1], [1, 2, 1, 1], [2, 0, 2, 1], [2, 2, 1, 1]]);
  348 |   await page.goto('/#/components/office-studio');
  349 |   await upload(page, source, 'Merged mapping.docx');
  350 |   const table = bodyTable(page);
  351 |   await expect(table).toHaveAttribute('data-word-spacing-layout', 'mixed');
  352 |   await assertState(table, before);
  353 |   await expect(async () => assertMergedGeometry(await table.evaluate(tableGeometry), false)).toPass({ timeout: 5000 });
  354 |   const initial = await table.evaluate(tableGeometry);
  355 |   await selectMergedBlock(page, table);
  356 |   let dialog = await openDialog(page);
  357 |   await expect(dialog).toContainText('所选 4 个单元格');
  358 |   await dialog.getByRole('button', { name: '下右对齐', exact: true }).click();
  359 |   await dialog.getByRole('textbox', { name: '单元格left内边距', exact: true }).fill('4.25');
```