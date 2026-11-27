# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: builder-studio.spec.ts >> 完整编辑器：缩小画布后仍可真实拖入嵌套组件，操作栏保持可点击大小
- Location: e2e/builder-studio.spec.ts:337:1

# Error details

```
TypeError: Cannot read properties of null (reading 'x')
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e4]:
    - generic [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e10]:
          - generic [ref=e11]: S
          - heading "页面搭建器" [level=1] [ref=e12]
          - generic [ref=e13]: STUDIO
        - generic [ref=e14]:
          - generic [ref=e18]: 当前页面
          - combobox "当前页面" [ref=e19]:
            - option "我的第一个页面"
            - option "空白页面" [selected]
        - button "新建页面" [ref=e20]
        - group [ref=e22]:
          - generic "页面操作" [ref=e23]
        - generic [ref=e28]:
          - button "撤销" [ref=e29]
          - button "重做" [disabled] [ref=e33]
        - status [ref=e37]:
          - generic [ref=e41]: 已保存到本机
          - time [ref=e42]: 14:43:46
        - button "保存版本" [ref=e43]
        - button "预览页面" [ref=e49]
        - group [ref=e54]:
          - generic "文件与备份" [ref=e55]
      - generic [ref=e59]:
        - navigation "编辑器面板" [ref=e60]:
          - button "组件库" [pressed] [ref=e61]:
            - generic [ref=e63]: 组件
          - button "图层结构" [ref=e64]:
            - generic [ref=e69]: 图层
          - button "页面管理" [ref=e70]:
            - generic [ref=e74]: 页面
          - button "图片资源" [ref=e75]:
            - generic [ref=e80]: 图片
          - button "页面数据" [ref=e81]:
            - generic [ref=e86]: 数据
          - button "设计规范" [ref=e87]:
            - generic [ref=e90]: 规范
          - button "主组件与变体" [ref=e91]:
            - generic [ref=e95]: 主组件
          - button "页面设计检查" [ref=e96]:
            - generic [ref=e100]: 检查
          - button "主题：切换深色界面" [ref=e102]:
            - generic [ref=e105]: 主题
          - button "帮助与键盘快捷键" [ref=e106]:
            - generic [ref=e110]: 帮助
          - link "返回文档" [ref=e111]:
            - /url: "#/"
            - generic [ref=e114]: 文档
        - complementary "组件库" [ref=e115]:
          - generic [ref=e116]:
            - generic [ref=e117]:
              - text: YOUR CREATIVE SPACE
              - heading "组件库" [level=2] [ref=e118]
            - button "收起左侧面板" [ref=e119]
          - generic [ref=e123]:
            - group "组件库类型" [ref=e124]:
              - button "基础组件 92" [pressed] [ref=e125]
              - button "预设区块 15" [ref=e126]
              - button "我的区块 0" [ref=e127]
            - textbox "搜索组件或区块" [ref=e132]:
              - /placeholder: 搜索组件或区块…
            - paragraph [ref=e133]: 拖入画布，或点 + 一键插入
            - generic [ref=e134]:
              - generic [ref=e135]:
                - heading "布局与容器 14" [level=3] [ref=e136]:
                  - text: 布局与容器
                  - generic [ref=e137]: "14"
                - generic [ref=e138]:
                  - generic [ref=e139]:
                    - generic [ref=e141]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 自由布局容器
                            - generic: Container
                      - button "自由布局容器 Container" [ref=e143]:
                        - generic [ref=e144]:
                          - generic [ref=e149]: 自由布局容器
                          - generic [ref=e150]: Container
                    - button "插入自由布局容器" [ref=e151]
                  - generic [ref=e153]:
                    - generic [ref=e155]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 内容分区
                            - generic: Section
                      - button "内容分区 Section" [ref=e157]:
                        - generic [ref=e158]:
                          - generic [ref=e163]: 内容分区
                          - generic [ref=e164]: Section
                    - button "插入内容分区" [ref=e165]
                  - generic [ref=e167]:
                    - generic [ref=e169]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 响应式分栏
                            - generic: Columns
                      - button "响应式分栏 Columns" [ref=e171]:
                        - generic [ref=e172]:
                          - generic [ref=e177]: 响应式分栏
                          - generic [ref=e178]: Columns
                    - button "插入响应式分栏" [ref=e179]
                  - generic [ref=e181]:
                    - generic [ref=e183]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 分割线
                            - generic: Divider
                      - button "分割线 Divider" [ref=e185]:
                        - generic [ref=e186]:
                          - generic [ref=e190]: 分割线
                          - generic [ref=e191]: Divider
                    - button "插入分割线" [ref=e192]
                  - generic [ref=e194]:
                    - generic [ref=e196]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 留白
                            - generic: Spacer
                      - button "留白 Spacer" [ref=e198]:
                        - generic [ref=e199]:
                          - generic [ref=e203]: 留白
                          - generic [ref=e204]: Spacer
                    - button "插入留白" [ref=e205]
                  - generic [ref=e207]:
                    - generic [ref=e209]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Row 栅格行
                            - generic: Row
                      - button "Row 栅格行 Row" [ref=e211]:
                        - generic [ref=e212]:
                          - generic [ref=e217]: Row 栅格行
                          - generic [ref=e218]: Row
                    - button "插入Row 栅格行" [ref=e219]
                  - generic [ref=e221]:
                    - generic [ref=e223]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Col 栅格列
                            - generic: Col
                      - button "Col 栅格列 Col" [ref=e225]:
                        - generic [ref=e226]:
                          - generic [ref=e231]: Col 栅格列
                          - generic [ref=e232]: Col
                    - button "插入Col 栅格列" [ref=e233]
                  - generic [ref=e235]:
                    - generic [ref=e237]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Flex 弹性布局
                            - generic: Flex
                      - button "Flex 弹性布局 Flex" [ref=e239]:
                        - generic [ref=e240]:
                          - generic [ref=e245]: Flex 弹性布局
                          - generic [ref=e246]: Flex
                    - button "插入Flex 弹性布局" [ref=e247]
                  - generic [ref=e249]:
                    - generic [ref=e251]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Space 间距
                            - generic: Space
                      - button "Space 间距 Space" [ref=e253]:
                        - generic [ref=e254]:
                          - generic [ref=e259]: Space 间距
                          - generic [ref=e260]: Space
                    - button "插入Space 间距" [ref=e261]
                  - generic [ref=e263]:
                    - generic [ref=e265]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Splitter 可调分栏
                            - generic: Splitter
                      - button "Splitter 可调分栏 Splitter" [ref=e267]:
                        - generic [ref=e268]:
                          - generic [ref=e273]: Splitter 可调分栏
                          - generic [ref=e274]: Splitter
                    - button "插入Splitter 可调分栏" [ref=e275]
                  - generic [ref=e277]:
                    - generic [ref=e279]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Watermark 水印
                            - generic: Watermark
                      - button "Watermark 水印 Watermark" [ref=e281]:
                        - generic [ref=e282]:
                          - generic [ref=e287]: Watermark 水印
                          - generic [ref=e288]: Watermark
                    - button "插入Watermark 水印" [ref=e289]
                  - generic [ref=e291]:
                    - generic [ref=e293]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Affix 固钉
                            - generic: Affix
                      - button "Affix 固钉 Affix" [ref=e295]:
                        - generic [ref=e296]:
                          - generic [ref=e301]: Affix 固钉
                          - generic [ref=e302]: Affix
                    - button "插入Affix 固钉" [ref=e303]
                  - generic [ref=e305]:
                    - generic [ref=e307]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: ConfigProvider 全局配置
                            - generic: ConfigProvider
                      - button "ConfigProvider 全局配置 ConfigProvider" [ref=e309]:
                        - generic [ref=e310]:
                          - generic [ref=e315]: ConfigProvider 全局配置
                          - generic [ref=e316]: ConfigProvider
                    - button "插入ConfigProvider 全局配置" [ref=e317]
                  - generic [ref=e319]:
                    - generic [ref=e321]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: App 应用容器
                            - generic: App
                      - button "App 应用容器 App" [ref=e323]:
                        - generic [ref=e324]:
                          - generic [ref=e329]: App 应用容器
                          - generic [ref=e330]: App
                    - button "插入App 应用容器" [ref=e331]
              - generic [ref=e333]:
                - heading "内容与数据展示 23" [level=3] [ref=e334]:
                  - text: 内容与数据展示
                  - generic [ref=e335]: "23"
                - generic [ref=e336]:
                  - generic [ref=e337]:
                    - generic [ref=e339]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 标题
                            - generic: Heading
                      - generic [ref=e340]:
                        - button "标题 Heading" [pressed]:
                          - generic:
                            - generic: 标题
                            - generic: Heading
                    - button "插入标题" [ref=e341]
                  - generic [ref=e343]:
                    - generic [ref=e345]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 文本
                            - generic: Text
                      - button "文本 Text" [ref=e347]:
                        - generic [ref=e348]:
                          - generic [ref=e351]: 文本
                          - generic [ref=e352]: Text
                    - button "插入文本" [ref=e353]
                  - generic [ref=e355]:
                    - generic [ref=e357]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 图片
                            - generic: Image
                      - button "图片 Image" [ref=e359]:
                        - generic [ref=e360]:
                          - generic [ref=e365]: 图片
                          - generic [ref=e366]: Image
                    - button "插入图片" [ref=e367]
                  - generic [ref=e369]:
                    - generic [ref=e371]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 卡片
                            - generic: Card
                      - button "卡片 Card" [ref=e373]:
                        - generic [ref=e374]:
                          - generic [ref=e379]: 卡片
                          - generic [ref=e380]: Card
                    - button "插入卡片" [ref=e381]
                  - generic [ref=e383]:
                    - generic [ref=e385]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 标签
                            - generic: Tag
                      - button "标签 Tag" [ref=e387]:
                        - generic [ref=e388]:
                          - generic [ref=e392]: 标签
                          - generic [ref=e393]: Tag
                    - button "插入标签" [ref=e394]
                  - generic [ref=e396]:
                    - generic [ref=e398]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 徽标
                            - generic: Badge
                      - button "徽标 Badge" [ref=e400]:
                        - generic [ref=e401]:
                          - generic [ref=e405]: 徽标
                          - generic [ref=e406]: Badge
                    - button "插入徽标" [ref=e407]
                  - generic [ref=e409]:
                    - generic [ref=e411]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 进度条
                            - generic: Progress
                      - button "进度条 Progress" [ref=e413]:
                        - generic [ref=e414]:
                          - generic [ref=e418]: 进度条
                          - generic [ref=e419]: Progress
                    - button "插入进度条" [ref=e420]
                  - generic [ref=e422]:
                    - generic [ref=e424]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 警告提示
                            - generic: Alert
                      - button "警告提示 Alert" [ref=e426]:
                        - generic [ref=e427]:
                          - generic [ref=e431]: 警告提示
                          - generic [ref=e432]: Alert
                    - button "插入警告提示" [ref=e433]
                  - generic [ref=e435]:
                    - generic [ref=e437]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Typography 排版
                            - generic: Typography
                      - button "Typography 排版 Typography" [ref=e439]:
                        - generic [ref=e440]:
                          - generic [ref=e444]: Typography 排版
                          - generic [ref=e445]: Typography
                    - button "插入Typography 排版" [ref=e446]
                  - generic [ref=e448]:
                    - generic [ref=e450]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Avatar 头像
                            - generic: Avatar
                      - button "Avatar 头像 Avatar" [ref=e452]:
                        - generic [ref=e453]:
                          - generic [ref=e457]: Avatar 头像
                          - generic [ref=e458]: Avatar
                    - button "插入Avatar 头像" [ref=e459]
                  - generic [ref=e461]:
                    - generic [ref=e463]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Descriptions 描述列表
                            - generic: Descriptions
                      - button "Descriptions 描述列表 Descriptions" [ref=e465]:
                        - generic [ref=e466]:
                          - generic [ref=e470]: Descriptions 描述列表
                          - generic [ref=e471]: Descriptions
                    - button "插入Descriptions 描述列表" [ref=e472]
                  - generic [ref=e474]:
                    - generic [ref=e476]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Statistic 统计数值
                            - generic: Statistic
                      - button "Statistic 统计数值 Statistic" [ref=e478]:
                        - generic [ref=e479]:
                          - generic [ref=e483]: Statistic 统计数值
                          - generic [ref=e484]: Statistic
                    - button "插入Statistic 统计数值" [ref=e485]
                  - generic [ref=e487]:
                    - generic [ref=e489]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Timeline 时间线
                            - generic: Timeline
                      - button "Timeline 时间线 Timeline" [ref=e491]:
                        - generic [ref=e492]:
                          - generic [ref=e496]: Timeline 时间线
                          - generic [ref=e497]: Timeline
                    - button "插入Timeline 时间线" [ref=e498]
                  - generic [ref=e500]:
                    - generic [ref=e502]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Chart 数据图表
                            - generic: Chart
                      - button "Chart 数据图表 Chart" [ref=e504]:
                        - generic [ref=e505]:
                          - generic [ref=e509]: Chart 数据图表
                          - generic [ref=e510]: Chart
                    - button "插入Chart 数据图表" [ref=e511]
                  - generic [ref=e513]:
                    - generic [ref=e515]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Globe 3D 地球
                            - generic: Globe
                      - button "Globe 3D 地球 Globe" [ref=e517]:
                        - generic [ref=e518]:
                          - generic [ref=e522]: Globe 3D 地球
                          - generic [ref=e523]: Globe
                    - button "插入Globe 3D 地球" [ref=e524]
                  - generic [ref=e526]:
                    - generic [ref=e528]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Table 表格
                            - generic: Table
                      - button "Table 表格 Table" [ref=e530]:
                        - generic [ref=e531]:
                          - generic [ref=e535]: Table 表格
                          - generic [ref=e536]: Table
                    - button "插入Table 表格" [ref=e537]
                  - generic [ref=e539]:
                    - generic [ref=e541]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: VirtualTable 虚拟表格
                            - generic: VirtualTable
                      - button "VirtualTable 虚拟表格 VirtualTable" [ref=e543]:
                        - generic [ref=e544]:
                          - generic [ref=e548]: VirtualTable 虚拟表格
                          - generic [ref=e549]: VirtualTable
                    - button "插入VirtualTable 虚拟表格" [ref=e550]
                  - generic [ref=e552]:
                    - generic [ref=e554]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: DataGrid 数据网格
                            - generic: DataGrid
                      - button "DataGrid 数据网格 DataGrid" [ref=e556]:
                        - generic [ref=e557]:
                          - generic [ref=e561]: DataGrid 数据网格
                          - generic [ref=e562]: DataGrid
                    - button "插入DataGrid 数据网格" [ref=e563]
                  - generic [ref=e565]:
                    - generic [ref=e567]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Tree 树形控件
                            - generic: Tree
                      - button "Tree 树形控件 Tree" [ref=e569]:
                        - generic [ref=e570]:
                          - generic [ref=e574]: Tree 树形控件
                          - generic [ref=e575]: Tree
                    - button "插入Tree 树形控件" [ref=e576]
                  - generic [ref=e578]:
                    - generic [ref=e580]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Collapse 折叠面板
                            - generic: Collapse
                      - button "Collapse 折叠面板 Collapse" [ref=e582]:
                        - generic [ref=e583]:
                          - generic [ref=e587]: Collapse 折叠面板
                          - generic [ref=e588]: Collapse
                    - button "插入Collapse 折叠面板" [ref=e589]
                  - generic [ref=e591]:
                    - generic [ref=e593]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: List 列表
                            - generic: List
                      - button "List 列表 List" [ref=e595]:
                        - generic [ref=e596]:
                          - generic [ref=e600]: List 列表
                          - generic [ref=e601]: List
                    - button "插入List 列表" [ref=e602]
                  - generic [ref=e604]:
                    - generic [ref=e606]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Calendar 日历
                            - generic: Calendar
                      - button "Calendar 日历 Calendar" [ref=e608]:
                        - generic [ref=e609]:
                          - generic [ref=e613]: Calendar 日历
                          - generic [ref=e614]: Calendar
                    - button "插入Calendar 日历" [ref=e615]
                  - generic [ref=e617]:
                    - generic [ref=e619]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: QRCode 二维码
                            - generic: QRCode
                      - button "QRCode 二维码 QRCode" [ref=e621]:
                        - generic [ref=e622]:
                          - generic [ref=e626]: QRCode 二维码
                          - generic [ref=e627]: QRCode
                    - button "插入QRCode 二维码" [ref=e628]
              - generic [ref=e630]:
                - heading "表单与输入 24" [level=3] [ref=e631]:
                  - text: 表单与输入
                  - generic [ref=e632]: "24"
                - generic [ref=e633]:
                  - generic [ref=e634]:
                    - generic [ref=e636]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 表单容器
                            - generic: Form
                      - button "表单容器 Form" [ref=e638]:
                        - generic [ref=e639]:
                          - generic [ref=e644]: 表单容器
                          - generic [ref=e645]: Form
                    - button "插入表单容器" [ref=e646]
                  - generic [ref=e648]:
                    - generic [ref=e650]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 输入框
                            - generic: Input
                      - button "输入框 Input" [ref=e652]:
                        - generic [ref=e653]:
                          - generic [ref=e657]: 输入框
                          - generic [ref=e658]: Input
                    - button "插入输入框" [ref=e659]
                  - generic [ref=e661]:
                    - generic [ref=e663]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 多行输入
                            - generic: TextArea
                      - button "多行输入 TextArea" [ref=e665]:
                        - generic [ref=e666]:
                          - generic [ref=e670]: 多行输入
                          - generic [ref=e671]: TextArea
                    - button "插入多行输入" [ref=e672]
                  - generic [ref=e674]:
                    - generic [ref=e676]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 下拉选项
                            - generic: FormSelect
                      - button "下拉选项 FormSelect" [ref=e678]:
                        - generic [ref=e679]:
                          - generic [ref=e683]: 下拉选项
                          - generic [ref=e684]: FormSelect
                    - button "插入下拉选项" [ref=e685]
                  - generic [ref=e687]:
                    - generic [ref=e689]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 复选框
                            - generic: Checkbox
                      - button "复选框 Checkbox" [ref=e691]:
                        - generic [ref=e692]:
                          - generic [ref=e696]: 复选框
                          - generic [ref=e697]: Checkbox
                    - button "插入复选框" [ref=e698]
                  - generic [ref=e700]:
                    - generic [ref=e702]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 开关
                            - generic: Switch
                      - button "开关 Switch" [ref=e704]:
                        - generic [ref=e705]:
                          - generic [ref=e709]: 开关
                          - generic [ref=e710]: Switch
                    - button "插入开关" [ref=e711]
                  - generic [ref=e713]:
                    - generic [ref=e715]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 按钮
                            - generic: Button
                      - button "按钮 Button" [ref=e717]:
                        - generic [ref=e718]:
                          - generic [ref=e722]: 按钮
                          - generic [ref=e723]: Button
                    - button "插入按钮" [ref=e724]
                  - generic [ref=e726]:
                    - generic [ref=e728]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Radio 单选框
                            - generic: Radio
                      - button "Radio 单选框 Radio" [ref=e730]:
                        - generic [ref=e731]:
                          - generic [ref=e735]: Radio 单选框
                          - generic [ref=e736]: Radio
                    - button "插入Radio 单选框" [ref=e737]
                  - generic [ref=e739]:
                    - generic [ref=e741]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Select 选择器
                            - generic: Select
                      - button "Select 选择器 Select" [ref=e743]:
                        - generic [ref=e744]:
                          - generic [ref=e748]: Select 选择器
                          - generic [ref=e749]: Select
                    - button "插入Select 选择器" [ref=e750]
                  - generic [ref=e752]:
                    - generic [ref=e754]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Combobox 自动完成
                            - generic: Combobox
                      - button "Combobox 自动完成 Combobox" [ref=e756]:
                        - generic [ref=e757]:
                          - generic [ref=e761]: Combobox 自动完成
                          - generic [ref=e762]: Combobox
                    - button "插入Combobox 自动完成" [ref=e763]
                  - generic [ref=e765]:
                    - generic [ref=e767]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: MultiCombobox 多项选择
                            - generic: MultiCombobox
                      - button "MultiCombobox 多项选择 MultiCombobox" [ref=e769]:
                        - generic [ref=e770]:
                          - generic [ref=e774]: MultiCombobox 多项选择
                          - generic [ref=e775]: MultiCombobox
                    - button "插入MultiCombobox 多项选择" [ref=e776]
                  - generic [ref=e778]:
                    - generic [ref=e780]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Slider 滑块
                            - generic: Slider
                      - button "Slider 滑块 Slider" [ref=e782]:
                        - generic [ref=e783]:
                          - generic [ref=e787]: Slider 滑块
                          - generic [ref=e788]: Slider
                    - button "插入Slider 滑块" [ref=e789]
                  - generic [ref=e791]:
                    - generic [ref=e793]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Rate 评分
                            - generic: Rate
                      - button "Rate 评分 Rate" [ref=e795]:
                        - generic [ref=e796]:
                          - generic [ref=e800]: Rate 评分
                          - generic [ref=e801]: Rate
                    - button "插入Rate 评分" [ref=e802]
                  - generic [ref=e804]:
                    - generic [ref=e806]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: InputNumber 数字输入
                            - generic: InputNumber
                      - button "InputNumber 数字输入 InputNumber" [ref=e808]:
                        - generic [ref=e809]:
                          - generic [ref=e813]: InputNumber 数字输入
                          - generic [ref=e814]: InputNumber
                    - button "插入InputNumber 数字输入" [ref=e815]
                  - generic [ref=e817]:
                    - generic [ref=e819]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: ColorPicker 颜色选择
                            - generic: ColorPicker
                      - button "ColorPicker 颜色选择 ColorPicker" [ref=e821]:
                        - generic [ref=e822]:
                          - generic [ref=e826]: ColorPicker 颜色选择
                          - generic [ref=e827]: ColorPicker
                    - button "插入ColorPicker 颜色选择" [ref=e828]
                  - generic [ref=e830]:
                    - generic [ref=e832]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: DatePicker 日期选择
                            - generic: DatePicker
                      - button "DatePicker 日期选择 DatePicker" [ref=e834]:
                        - generic [ref=e835]:
                          - generic [ref=e839]: DatePicker 日期选择
                          - generic [ref=e840]: DatePicker
                    - button "插入DatePicker 日期选择" [ref=e841]
                  - generic [ref=e843]:
                    - generic [ref=e845]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: DateRangePicker 日期范围
                            - generic: DateRangePicker
                      - button "DateRangePicker 日期范围 DateRangePicker" [ref=e847]:
                        - generic [ref=e848]:
                          - generic [ref=e852]: DateRangePicker 日期范围
                          - generic [ref=e853]: DateRangePicker
                    - button "插入DateRangePicker 日期范围" [ref=e854]
                  - generic [ref=e856]:
                    - generic [ref=e858]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: TimePicker 时间选择
                            - generic: TimePicker
                      - button "TimePicker 时间选择 TimePicker" [ref=e860]:
                        - generic [ref=e861]:
                          - generic [ref=e865]: TimePicker 时间选择
                          - generic [ref=e866]: TimePicker
                    - button "插入TimePicker 时间选择" [ref=e867]
                  - generic [ref=e869]:
                    - generic [ref=e871]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: TreeSelect 树选择
                            - generic: TreeSelect
                      - button "TreeSelect 树选择 TreeSelect" [ref=e873]:
                        - generic [ref=e874]:
                          - generic [ref=e878]: TreeSelect 树选择
                          - generic [ref=e879]: TreeSelect
                    - button "插入TreeSelect 树选择" [ref=e880]
                  - generic [ref=e882]:
                    - generic [ref=e884]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Cascader 级联选择
                            - generic: Cascader
                      - button "Cascader 级联选择 Cascader" [ref=e886]:
                        - generic [ref=e887]:
                          - generic [ref=e891]: Cascader 级联选择
                          - generic [ref=e892]: Cascader
                    - button "插入Cascader 级联选择" [ref=e893]
                  - generic [ref=e895]:
                    - generic [ref=e897]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Transfer 穿梭框
                            - generic: Transfer
                      - button "Transfer 穿梭框 Transfer" [ref=e899]:
                        - generic [ref=e900]:
                          - generic [ref=e904]: Transfer 穿梭框
                          - generic [ref=e905]: Transfer
                    - button "插入Transfer 穿梭框" [ref=e906]
                  - generic [ref=e908]:
                    - generic [ref=e910]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Mentions 提及
                            - generic: Mentions
                      - button "Mentions 提及 Mentions" [ref=e912]:
                        - generic [ref=e913]:
                          - generic [ref=e917]: Mentions 提及
                          - generic [ref=e918]: Mentions
                    - button "插入Mentions 提及" [ref=e919]
                  - generic [ref=e921]:
                    - generic [ref=e923]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Upload 文件选择与上传
                            - generic: Upload
                      - button "Upload 文件选择与上传 Upload" [ref=e925]:
                        - generic [ref=e926]:
                          - generic [ref=e930]: Upload 文件选择与上传
                          - generic [ref=e931]: Upload
                    - button "插入Upload 文件选择与上传" [ref=e932]
                  - generic [ref=e934]:
                    - generic [ref=e936]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Form.Item 表单字段
                            - generic: FormItem
                      - button "Form.Item 表单字段 FormItem" [ref=e938]:
                        - generic [ref=e939]:
                          - generic [ref=e943]: Form.Item 表单字段
                          - generic [ref=e944]: FormItem
                    - button "插入Form.Item 表单字段" [ref=e945]
              - generic [ref=e947]:
                - heading "应用与数据 7" [level=3] [ref=e948]:
                  - text: 应用与数据
                  - generic [ref=e949]: "7"
                - generic [ref=e950]:
                  - generic [ref=e951]:
                    - generic [ref=e953]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 应用框架
                            - generic: AppShell
                      - button "应用框架 AppShell" [ref=e955]:
                        - generic [ref=e956]:
                          - generic [ref=e961]: 应用框架
                          - generic [ref=e962]: AppShell
                    - button "插入应用框架" [ref=e963]
                  - generic [ref=e965]:
                    - generic [ref=e967]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 应用内容视图
                            - generic: AppView
                      - button "应用内容视图 AppView" [ref=e969]:
                        - generic [ref=e970]:
                          - generic [ref=e975]: 应用内容视图
                          - generic [ref=e976]: AppView
                    - button "插入应用内容视图" [ref=e977]
                  - generic [ref=e979]:
                    - generic [ref=e981]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 数据管理表格
                            - generic: DataTable
                      - button "数据管理表格 DataTable" [ref=e983]:
                        - generic [ref=e984]:
                          - generic [ref=e988]: 数据管理表格
                          - generic [ref=e989]: DataTable
                    - button "插入数据管理表格" [ref=e990]
                  - generic [ref=e992]:
                    - generic [ref=e994]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 数据统计卡
                            - generic: DataMetric
                      - button "数据统计卡 DataMetric" [ref=e996]:
                        - generic [ref=e997]:
                          - generic [ref=e1001]: 数据统计卡
                          - generic [ref=e1002]: DataMetric
                    - button "插入数据统计卡" [ref=e1003]
                  - generic [ref=e1005]:
                    - generic [ref=e1007]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 数据图表
                            - generic: DataChart
                      - button "数据图表 DataChart" [ref=e1009]:
                        - generic [ref=e1010]:
                          - generic [ref=e1014]: 数据图表
                          - generic [ref=e1015]: DataChart
                    - button "插入数据图表" [ref=e1016]
                  - generic [ref=e1018]:
                    - generic [ref=e1020]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 数据内容集合
                            - generic: RecordList
                      - button "数据内容集合 RecordList" [ref=e1022]:
                        - generic [ref=e1023]:
                          - generic [ref=e1027]: 数据内容集合
                          - generic [ref=e1028]: RecordList
                    - button "插入数据内容集合" [ref=e1029]
                  - generic [ref=e1031]:
                    - generic [ref=e1033]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: 数据录入表单
                            - generic: RecordForm
                      - button "数据录入表单 RecordForm" [ref=e1035]:
                        - generic [ref=e1036]:
                          - generic [ref=e1040]: 数据录入表单
                          - generic [ref=e1041]: RecordForm
                    - button "插入数据录入表单" [ref=e1042]
              - generic [ref=e1044]:
                - heading "导航与流程 9" [level=3] [ref=e1045]:
                  - text: 导航与流程
                  - generic [ref=e1046]: "9"
                - generic [ref=e1047]:
                  - generic [ref=e1048]:
                    - generic [ref=e1050]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Tabs 标签页
                            - generic: Tabs
                      - button "Tabs 标签页 Tabs" [ref=e1052]:
                        - generic [ref=e1053]:
                          - generic [ref=e1058]: Tabs 标签页
                          - generic [ref=e1059]: Tabs
                    - button "插入Tabs 标签页" [ref=e1060]
                  - generic [ref=e1062]:
                    - generic [ref=e1064]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Tabs.Panel 自定义面板
                            - generic: TabPanel
                      - button "Tabs.Panel 自定义面板 TabPanel" [ref=e1066]:
                        - generic [ref=e1067]:
                          - generic [ref=e1072]: Tabs.Panel 自定义面板
                          - generic [ref=e1073]: TabPanel
                    - button "插入Tabs.Panel 自定义面板" [ref=e1074]
                  - generic [ref=e1076]:
                    - generic [ref=e1078]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Segmented 分段控制
                            - generic: Segmented
                      - button "Segmented 分段控制 Segmented" [ref=e1080]:
                        - generic [ref=e1081]:
                          - generic [ref=e1085]: Segmented 分段控制
                          - generic [ref=e1086]: Segmented
                    - button "插入Segmented 分段控制" [ref=e1087]
                  - generic [ref=e1089]:
                    - generic [ref=e1091]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Steps 步骤条
                            - generic: Steps
                      - button "Steps 步骤条 Steps" [ref=e1093]:
                        - generic [ref=e1094]:
                          - generic [ref=e1098]: Steps 步骤条
                          - generic [ref=e1099]: Steps
                    - button "插入Steps 步骤条" [ref=e1100]
                  - generic [ref=e1102]:
                    - generic [ref=e1104]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Pagination 分页
                            - generic: Pagination
                      - button "Pagination 分页 Pagination" [ref=e1106]:
                        - generic [ref=e1107]:
                          - generic [ref=e1111]: Pagination 分页
                          - generic [ref=e1112]: Pagination
                    - button "插入Pagination 分页" [ref=e1113]
                  - generic [ref=e1115]:
                    - generic [ref=e1117]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Breadcrumb 面包屑
                            - generic: Breadcrumb
                      - button "Breadcrumb 面包屑 Breadcrumb" [ref=e1119]:
                        - generic [ref=e1120]:
                          - generic [ref=e1124]: Breadcrumb 面包屑
                          - generic [ref=e1125]: Breadcrumb
                    - button "插入Breadcrumb 面包屑" [ref=e1126]
                  - generic [ref=e1128]:
                    - generic [ref=e1130]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: SideNav 侧边导航
                            - generic: SideNav
                      - button "SideNav 侧边导航 SideNav" [ref=e1132]:
                        - generic [ref=e1133]:
                          - generic [ref=e1137]: SideNav 侧边导航
                          - generic [ref=e1138]: SideNav
                    - button "插入SideNav 侧边导航" [ref=e1139]
                  - generic [ref=e1141]:
                    - generic [ref=e1143]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Anchor 锚点导航
                            - generic: Anchor
                      - button "Anchor 锚点导航 Anchor" [ref=e1145]:
                        - generic [ref=e1146]:
                          - generic [ref=e1150]: Anchor 锚点导航
                          - generic [ref=e1151]: Anchor
                    - button "插入Anchor 锚点导航" [ref=e1152]
                  - generic [ref=e1154]:
                    - generic [ref=e1156]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: CommandPalette 命令面板
                            - generic: CommandPalette
                      - button "CommandPalette 命令面板 CommandPalette" [ref=e1158]:
                        - generic [ref=e1159]:
                          - generic [ref=e1163]: CommandPalette 命令面板
                          - generic [ref=e1164]: CommandPalette
                    - button "插入CommandPalette 命令面板" [ref=e1165]
              - generic [ref=e1167]:
                - heading "反馈与浮层 15" [level=3] [ref=e1168]:
                  - text: 反馈与浮层
                  - generic [ref=e1169]: "15"
                - generic [ref=e1170]:
                  - generic [ref=e1171]:
                    - generic [ref=e1173]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Modal 对话框
                            - generic: Modal
                      - button "Modal 对话框 Modal" [ref=e1175]:
                        - generic [ref=e1176]:
                          - generic [ref=e1181]: Modal 对话框
                          - generic [ref=e1182]: Modal
                    - button "插入Modal 对话框" [ref=e1183]
                  - generic [ref=e1185]:
                    - generic [ref=e1187]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Drawer 抽屉
                            - generic: Drawer
                      - button "Drawer 抽屉 Drawer" [ref=e1189]:
                        - generic [ref=e1190]:
                          - generic [ref=e1195]: Drawer 抽屉
                          - generic [ref=e1196]: Drawer
                    - button "插入Drawer 抽屉" [ref=e1197]
                  - generic [ref=e1199]:
                    - generic [ref=e1201]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Tooltip 文字提示
                            - generic: Tooltip
                      - button "Tooltip 文字提示 Tooltip" [ref=e1203]:
                        - generic [ref=e1204]:
                          - generic [ref=e1208]: Tooltip 文字提示
                          - generic [ref=e1209]: Tooltip
                    - button "插入Tooltip 文字提示" [ref=e1210]
                  - generic [ref=e1212]:
                    - generic [ref=e1214]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Popover 气泡卡片
                            - generic: Popover
                      - button "Popover 气泡卡片 Popover" [ref=e1216]:
                        - generic [ref=e1217]:
                          - generic [ref=e1222]: Popover 气泡卡片
                          - generic [ref=e1223]: Popover
                    - button "插入Popover 气泡卡片" [ref=e1224]
                  - generic [ref=e1226]:
                    - generic [ref=e1228]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: DropdownMenu 下拉菜单
                            - generic: DropdownMenu
                      - button "DropdownMenu 下拉菜单 DropdownMenu" [ref=e1230]:
                        - generic [ref=e1231]:
                          - generic [ref=e1235]: DropdownMenu 下拉菜单
                          - generic [ref=e1236]: DropdownMenu
                    - button "插入DropdownMenu 下拉菜单" [ref=e1237]
                  - generic [ref=e1239]:
                    - generic [ref=e1241]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Popconfirm 气泡确认
                            - generic: Popconfirm
                      - button "Popconfirm 气泡确认 Popconfirm" [ref=e1243]:
                        - generic [ref=e1244]:
                          - generic [ref=e1248]: Popconfirm 气泡确认
                          - generic [ref=e1249]: Popconfirm
                    - button "插入Popconfirm 气泡确认" [ref=e1250]
                  - generic [ref=e1252]:
                    - generic [ref=e1254]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Message 全局提示
                            - generic: Message
                      - button "Message 全局提示 Message" [ref=e1256]:
                        - generic [ref=e1257]:
                          - generic [ref=e1261]: Message 全局提示
                          - generic [ref=e1262]: Message
                    - button "插入Message 全局提示" [ref=e1263]
                  - generic [ref=e1265]:
                    - generic [ref=e1267]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Notification 通知
                            - generic: Notification
                      - button "Notification 通知 Notification" [ref=e1269]:
                        - generic [ref=e1270]:
                          - generic [ref=e1274]: Notification 通知
                          - generic [ref=e1275]: Notification
                    - button "插入Notification 通知" [ref=e1276]
                  - generic [ref=e1278]:
                    - generic [ref=e1280]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Tour 漫游引导
                            - generic: Tour
                      - button "Tour 漫游引导 Tour" [ref=e1282]:
                        - generic [ref=e1283]:
                          - generic [ref=e1287]: Tour 漫游引导
                          - generic [ref=e1288]: Tour
                    - button "插入Tour 漫游引导" [ref=e1289]
                  - generic [ref=e1291]:
                    - generic [ref=e1293]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Empty 空状态
                            - generic: Empty
                      - button "Empty 空状态 Empty" [ref=e1295]:
                        - generic [ref=e1296]:
                          - generic [ref=e1300]: Empty 空状态
                          - generic [ref=e1301]: Empty
                    - button "插入Empty 空状态" [ref=e1302]
                  - generic [ref=e1304]:
                    - generic [ref=e1306]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Skeleton 骨架屏
                            - generic: Skeleton
                      - button "Skeleton 骨架屏 Skeleton" [ref=e1308]:
                        - generic [ref=e1309]:
                          - generic [ref=e1313]: Skeleton 骨架屏
                          - generic [ref=e1314]: Skeleton
                    - button "插入Skeleton 骨架屏" [ref=e1315]
                  - generic [ref=e1317]:
                    - generic [ref=e1319]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Spin 加载指示
                            - generic: Spin
                      - button "Spin 加载指示 Spin" [ref=e1321]:
                        - generic [ref=e1322]:
                          - generic [ref=e1327]: Spin 加载指示
                          - generic [ref=e1328]: Spin
                    - button "插入Spin 加载指示" [ref=e1329]
                  - generic [ref=e1331]:
                    - generic [ref=e1333]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: Result 结果页
                            - generic: Result
                      - button "Result 结果页 Result" [ref=e1335]:
                        - generic [ref=e1336]:
                          - generic [ref=e1341]: Result 结果页
                          - generic [ref=e1342]: Result
                    - button "插入Result 结果页" [ref=e1343]
                  - generic [ref=e1345]:
                    - generic [ref=e1347]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: BackTop 回到顶部
                            - generic: BackTop
                      - button "BackTop 回到顶部 BackTop" [ref=e1349]:
                        - generic [ref=e1350]:
                          - generic [ref=e1354]: BackTop 回到顶部
                          - generic [ref=e1355]: BackTop
                    - button "插入BackTop 回到顶部" [ref=e1356]
                  - generic [ref=e1358]:
                    - generic [ref=e1360]:
                      - generic:
                        - generic:
                          - generic:
                            - generic: FloatButton 悬浮按钮
                            - generic: FloatButton
                      - button "FloatButton 悬浮按钮 FloatButton" [ref=e1362]:
                        - generic [ref=e1363]:
                          - generic [ref=e1367]: FloatButton 悬浮按钮
                          - generic [ref=e1368]: FloatButton
                    - button "插入FloatButton 悬浮按钮" [ref=e1369]
        - region "画布工作区" [ref=e1371]:
          - generic [ref=e1372]:
            - generic [ref=e1373]:
              - button "编辑模式" [pressed] [ref=e1374]
              - button "交互预览模式" [ref=e1378]
            - group "画布设备" [ref=e1382]:
              - button "切换到桌面画布" [pressed] [ref=e1383]
              - button "切换到平板画布" [ref=e1386]
              - button "切换到手机画布" [ref=e1389]
            - generic [ref=e1392]:
              - spinbutton "画布宽度" [ref=e1393]: "1280"
              - generic [ref=e1394]: px
            - combobox "画布缩放" [ref=e1395]:
              - option "适应 · 50%"
              - option "25%"
              - option "50%" [selected]
              - option "75%"
              - option "100%"
              - option "125%"
              - option "150%"
            - button "专注模式" [ref=e1396]
            - button "切换属性面板" [pressed] [ref=e1402]
          - generic "画布快捷编辑" [ref=e1406]: 双击文字直接修改 · 选中组件可拖动边缘调整尺寸
          - generic [ref=e1408]:
            - generic [ref=e1409]:
              - text: 桌面画布 · 点击组件开始编辑
              - generic [ref=e1411]: 1280 × 自适应
            - iframe [ref=e1417]:
              - main "页面搭建器画布" [ref=f4e3]:
                - heading "页面搭建器画布" [level=1] [ref=f4e4]
          - generic [ref=e1418]:
            - generic "当前选中路径" [ref=e1419]:
              - button "页面" [ref=e1420]
            - generic [ref=e1424]: 1 个组件
        - complementary "属性面板" [ref=e1425]:
          - generic [ref=e1426]:
            - generic [ref=e1427]:
              - text: PAGE
              - heading "页面设置" [level=2] [ref=e1428]
              - paragraph [ref=e1429]: 设置浏览器标题、页面主题与内容宽度。
            - generic [ref=e1430]:
              - text: 全局视觉风格
              - generic [ref=e1431]:
                - button "应用鸢尾紫风格" [pressed] [ref=e1432]
                - button "应用海洋蓝风格" [ref=e1433]
                - button "应用松石绿风格" [ref=e1434]
                - button "应用琥珀橙风格" [ref=e1435]
                - button "应用蔷薇粉风格" [ref=e1436]
                - button "应用石墨灰风格" [ref=e1437]
              - generic [ref=e1438]: 统一组件主色、图表与交互状态；详细参数在下方继续调整。
            - generic [ref=e1439]:
              - generic [ref=e1442]:
                - generic [ref=e1445]:
                  - generic [ref=e1446]: 网页标题
                  - textbox "网页标题" [ref=e1450]: 未命名页面
                - generic [ref=e1453]:
                  - generic [ref=e1454]: 网页描述
                  - textbox "网页描述" [ref=e1458]
                - generic [ref=e1461]:
                  - generic [ref=e1462]: 页面主题
                  - generic [ref=e1467]:
                    - generic [ref=e1468]:
                      - radio "浅色" [checked] [ref=e1469]
                      - generic [ref=e1470]: 浅色
                    - generic [ref=e1471]:
                      - radio "深色" [ref=e1472]
                      - generic [ref=e1473]: 深色
                - generic [ref=e1476]:
                  - generic [ref=e1477]: 内容最大宽度（px）
                  - spinbutton "内容最大宽度（px）" [ref=e1482]: "1120"
                - generic [ref=e1485]:
                  - generic [ref=e1486]: 页面边距（px）
                  - spinbutton "页面边距（px）" [ref=e1491]: "32"
                - generic [ref=e1494]:
                  - generic [ref=e1495]: 组件默认间距（px）
                  - spinbutton "组件默认间距（px）" [ref=e1500]: "20"
                - generic [ref=e1503]:
                  - generic [ref=e1504]: "页面品牌色（如 #6366f1）"
                  - 'textbox "页面品牌色（如 #6366f1）" [ref=e1508]'
                - generic [ref=e1511]:
                  - generic [ref=e1512]: 页面背景色
                  - textbox "页面背景色" [ref=e1516]
                - generic [ref=e1519]:
                  - generic [ref=e1520]: 页面字体族
                  - textbox "页面字体族" [ref=e1524]
                - generic [ref=e1527]:
                  - generic [ref=e1528]: 页面内容 CSS
                  - textbox "页面内容 CSS" [ref=e1529]:
                    - /placeholder: "border-radius: 24px;\nbackground: linear-gradient(135deg, #eef2ff, #faf5ff);"
                  - button "应用页面内容 CSS" [ref=e1530]
                - generic [ref=e1533]:
                  - generic [ref=e1534]: 视觉风格
                  - combobox "视觉风格" [ref=e1539]:
                    - option [selected]
                    - option
                    - option
                    - option
                    - option
                    - option
                - generic [ref=e1542]:
                  - generic [ref=e1543]: 全局圆角（px）
                  - spinbutton "全局圆角（px）" [ref=e1548]: "12"
              - group [ref=e1549]:
                - generic "页面状态与交互变量 +" [ref=e1550]
      - generic [ref=e1551]:
        - status [ref=e1552]: 已创建“空白页面”，原页面继续保留。
        - button "⌘ / Ctrl S 保存版本" [ref=e1553]
  - status [ref=e1554]: Draggable item Heading-bf3af8df-dcf6-4e8f-a730-22af8ea1a048 was moved over droppable target _r_2u_.
```

# Test source

```ts
  250 |       .getByRole('button', { name: '页面', exact: true })
  251 |       .click();
  252 |     await page.getByRole('button', { name: new RegExp(name) }).click();
  253 |   }
  254 |   await expect.poll(async () => (await data(page)).content.length).toBe(6);
  255 |   const allIds = (value: {
  256 |     content?: { props: { id: string; content?: unknown[] } }[];
  257 |   }): string[] =>
  258 |     (value.content || []).flatMap((item) => [
  259 |       item.props.id,
  260 |       ...allIds({ content: item.props.content as typeof value.content }),
  261 |     ]);
  262 |   const ids = allIds(await data(page));
  263 |   expect(new Set(ids).size).toBe(ids.length);
  264 |   await page.getByRole('button', { name: '图层结构', exact: true }).click();
  265 |   const rootIds = (await data(page)).content.map(
  266 |     (node: { props: { id: string } }) => node.props.id
  267 |   );
  268 |   await selectLayer(page, rootIds[0]);
  269 |   await page.getByRole('button', { name: '样式', exact: true }).click();
  270 |   await page.getByRole('combobox', { name: '编辑设备' }).selectOption('mobile');
  271 |   await page.getByRole('spinbutton', { name: '内边距 上', exact: true }).fill('16');
  272 |   await selectLayer(page, rootIds[4]);
  273 |   await page.getByRole('button', { name: '可见', exact: true }).click();
  274 |   const before = await data(page);
  275 |   const jsonDownload = page.waitForEvent('download');
  276 |   await fileAction(page, '导出 JSON');
  277 |   const { readFileSync } = await import('node:fs');
  278 |   const json = readFileSync((await (await jsonDownload).path())!, 'utf8');
  279 |   await page.locator('input[aria-label="导入页面或工作区 JSON"]').setInputFiles({
  280 |     name: 'roundtrip.json',
  281 |     mimeType: 'application/json',
  282 |     buffer: Buffer.from(json),
  283 |   });
  284 |   await expect.poll(async () => (await data(page)).content.length).toBe(6);
  285 |   expect(await data(page)).toEqual(before);
  286 |   const htmlDownload = page.waitForEvent('download');
  287 |   await fileAction(page, '导出 HTML');
  288 |   const html = readFileSync((await (await htmlDownload).path())!, 'utf8');
  289 |   const offline = await context.newPage();
  290 |   await offline.route('**/*', (route) => route.abort());
  291 |   await offline.setViewportSize({ width: 390, height: 900 });
  292 |   await offline.setContent(html);
  293 |   await expect(offline.getByRole('heading', { name: '你可能还想了解' })).toHaveCount(0);
  294 |   await expect(offline.locator('.zuvi-builder-section').first()).toHaveCSS('padding-top', '16px');
  295 |   await expect(offline.getByRole('heading', { name: /让好想法/ })).toBeVisible();
  296 |   await page.getByRole('button', { name: '切换到桌面画布' }).click();
  297 |   await page.getByRole('button', { name: '图层结构', exact: true }).click();
  298 |   await selectLayer(page, rootIds[0]);
  299 |   await page.getByRole('button', { name: '样式', exact: true }).click();
  300 |   await page.getByRole('button', { name: '组件库', exact: true }).click();
  301 |   await page.getByRole('button', { name: /^基础组件/ }).click();
  302 |   await checkEditorA11y(page);
  303 |   await page.screenshot({ path: 'docs/audits/2026-11-10/builder-studio/composed-page.png' });
  304 |   await page.getByRole('button', { name: '主题：切换深色界面' }).click();
  305 |   await checkEditorA11y(page);
  306 |   await page.screenshot({ path: 'docs/audits/2026-11-10/builder-studio/composed-dark.png' });
  307 | });
  308 | 
  309 | for (const width of [1440, 768, 320]) {
  310 |   test(`完整编辑器：${width}px 面板切换、搜索插入与页面设置可使用`, async ({ page }) => {
  311 |     await open(page, width);
  312 |     await blank(page);
  313 |     if (width <= 1050) await page.getByRole('button', { name: '组件库', exact: true }).click();
  314 |     await page.getByRole('textbox', { name: '搜索组件或区块' }).fill('Heading');
  315 |     await page.getByRole('button', { name: '插入标题', exact: true }).click();
  316 |     if (width <= 1050)
  317 |       await expect(
  318 |         page.getByRole('dialog').getByRole('textbox', { name: '标题文字' })
  319 |       ).toBeVisible();
  320 |     await page.getByRole('textbox', { name: '标题文字' }).fill(`${width} 像素也能编辑`);
  321 |     if (width <= 1050) await page.keyboard.press('Escape');
  322 |     await expect(
  323 |       page.frameLocator('#preview-frame').getByRole('heading', { name: `${width} 像素也能编辑` })
  324 |     ).toBeVisible();
  325 |     const geometry = await page.locator('.studio').evaluate((node) => ({
  326 |       left: node.getBoundingClientRect().left,
  327 |       right: node.getBoundingClientRect().right,
  328 |       width: document.documentElement.scrollWidth,
  329 |     }));
  330 |     expect(geometry.left).toBeGreaterThanOrEqual(0);
  331 |     expect(geometry.right).toBeLessThanOrEqual(width);
  332 |     expect(geometry.width).toBe(width);
  333 |     await page.screenshot({ path: `docs/audits/2026-11-10/builder-studio/editor-${width}.png` });
  334 |   });
  335 | }
  336 | 
  337 | test('完整编辑器：缩小画布后仍可真实拖入嵌套组件，操作栏保持可点击大小', async ({ page }) => {
  338 |   await open(page);
  339 |   await blank(page);
  340 |   const canvas = page.frameLocator('#preview-frame');
  341 |   async function drag(type: string, selector: string) {
  342 |     const source = page.getByTestId(`drawer-item:${type}`);
  343 |     const target = canvas.locator(selector);
  344 |     await source.scrollIntoViewIfNeeded();
  345 |     const from = (await source.boundingBox())!;
  346 |     const to = (await target.boundingBox())!;
  347 |     await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  348 |     await page.mouse.down();
  349 |     await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2, { steps: 5 });
> 350 |     await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 30 });
      |                              ^ TypeError: Cannot read properties of null (reading 'x')
  351 |     await expect(
  352 |       target.locator('[data-puck-line-placeholder], [data-puck-preview-mode="placeholder"]').first()
  353 |     ).toBeVisible();
  354 |     await page.mouse.up();
  355 |   }
  356 |   await drag('Container', '[data-puck-dropzone="root:default-zone"]');
  357 |   await expect
  358 |     .poll(async () => (await data(page)).content.map((node: { type: string }) => node.type))
  359 |     .toEqual(['Container']);
  360 |   await page.getByRole('combobox', { name: '画布缩放' }).selectOption('50');
  361 |   await drag('Heading', '[data-puck-dropzone$=":content"]');
  362 |   await expect
  363 |     .poll(async () =>
  364 |       (await data(page)).content[0]?.props.content?.map((node: { type: string }) => node.type)
  365 |     )
  366 |     .toEqual(['Heading']);
  367 |   const actions = canvas
  368 |     .locator('[data-puck-overlay][class*="--isSelected"]')
  369 |     .getByRole('region', { name: '选中组件操作' });
  370 |   await expect(actions.getByRole('button', { name: '复制组件', exact: true })).toBeVisible();
  371 |   const box = (await actions.getByRole('button', { name: '复制组件', exact: true }).boundingBox())!;
  372 |   expect(box.width).toBeGreaterThanOrEqual(24);
  373 |   await actions.getByRole('button', { name: '复制组件', exact: true }).click();
  374 |   await expect.poll(async () => (await data(page)).content[0].props.content.length).toBe(2);
  375 | });
  376 | 
  377 | test('完整编辑器：图片资源可上传并复用，非法样式导入不会改动页面', async ({ page }) => {
  378 |   await open(page);
  379 |   await blank(page);
  380 |   await page.getByRole('button', { name: '图片资源', exact: true }).click();
  381 |   await page.getByLabel('上传工作区图片', { exact: true }).setInputFiles({
  382 |     name: '封面.png',
  383 |     mimeType: 'image/png',
  384 |     buffer: Buffer.from(
  385 |       'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jh0kAAAAASUVORK5CYII=',
  386 |       'base64'
  387 |     ),
  388 |   });
  389 |   await expect.poll(async () => (await data(page)).content.length).toBe(1);
  390 |   await expect(
  391 |     page.frameLocator('#preview-frame').getByRole('img', { name: '封面', exact: true })
  392 |   ).toBeVisible();
  393 |   await page.getByRole('button', { name: '插入图片 封面', exact: true }).click();
  394 |   await expect.poll(async () => (await data(page)).content.length).toBe(2);
  395 |   const before = await data(page);
  396 |   expect(before.content[0].props.src).toBe(before.content[1].props.src);
  397 |   expect(before.content[0].props.id).not.toBe(before.content[1].props.id);
  398 |   for (const styles of [
  399 |     { backgroundImage: 'url(https://example.com/image)' },
  400 |     { color: 'red;display:none' },
  401 |     { width: '100000px' },
  402 |   ]) {
  403 |     const invalid = structuredClone(before);
  404 |     invalid.content[0].props._design = { desktop: styles };
  405 |     await page.getByLabel('导入页面或工作区 JSON', { exact: true }).setInputFiles({
  406 |       name: 'invalid.json',
  407 |       mimeType: 'application/json',
  408 |       buffer: Buffer.from(JSON.stringify(invalid)),
  409 |     });
  410 |     await expect(page.locator('.doc-builder-notice')).toContainText('导入失败');
  411 |     expect(await data(page)).toEqual(before);
  412 |   }
  413 |   await expect(page.locator('.doc-builder-save-state')).toContainText('已保存到本机');
  414 |   await page.reload();
  415 |   await expect(
  416 |     page.frameLocator('#preview-frame').getByRole('img', { name: '封面', exact: true })
  417 |   ).toHaveCount(2);
  418 | });
  419 | 
  420 | test('完整编辑器：原生图层拖动可移入容器，拒绝循环层级和间接嵌套表单', async ({ page }) => {
  421 |   await open(page);
  422 |   await blank(page);
  423 |   await page.getByRole('button', { name: '插入自由布局容器', exact: true }).click();
  424 |   const container = (await data(page)).content[0].props.id;
  425 |   await page
  426 |     .locator('.studio-breadcrumb')
  427 |     .getByRole('button', { name: '页面', exact: true })
  428 |     .click();
  429 |   await page.getByRole('button', { name: '插入标题', exact: true }).click();
  430 |   const heading = (await data(page)).content[1].props.id;
  431 |   await page.getByRole('button', { name: '图层结构', exact: true }).click();
  432 |   await page
  433 |     .locator(`[data-builder-layer-id="${heading}"] > .studio-layer-row .studio-layer-select`)
  434 |     .dragTo(page.locator(`[data-builder-layer-id="${container}"] > .studio-layer-row`));
  435 |   await expect
  436 |     .poll(async () =>
  437 |       (await data(page)).content[0]?.props.content?.map(
  438 |         (node: { props: { id: string } }) => node.props.id
  439 |       )
  440 |     )
  441 |     .toEqual([heading]);
  442 |   expect((await data(page)).content.length).toBe(1);
  443 |   await selectLayer(page, container);
  444 |   await expect(
  445 |     page.getByRole('combobox', { name: '移动到容器' }).locator(`option[value="${container}"]`)
  446 |   ).toHaveCount(0);
  447 |   expect((await data(page)).content.length).toBe(1);
  448 |   await page
  449 |     .locator('.studio-breadcrumb')
  450 |     .getByRole('button', { name: '页面', exact: true })
```