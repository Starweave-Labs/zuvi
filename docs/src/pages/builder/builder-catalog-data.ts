import type { GlobeArc, GlobeCategory, GlobePoint } from '@zuvi/react';
import type {
  ChartProps,
  ChartHeatmapCell,
  ChartScatterPoint,
  ChartScatterSeries,
  ChartSeries,
  ChartSlice,
  ChartType,
  ChartWaterfallStep,
} from '@zuvi/react';

/** Serializable component contracts, shared by the editor, importer and HTML runtime. */
export interface CatalogField {
  kind: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'items' | 'rows' | 'slot';
  label: string;
  value: unknown;
  options?: string[];
  min?: number;
  max?: number;
}
export interface CatalogDefinition {
  label: string;
  group: string;
  description: string;
  fields: Record<string, CatalogField>;
}
export interface CatalogItem {
  value: string;
  label: string;
  description?: string;
  content?: string;
  href?: string;
  disabled?: boolean;
  children?: CatalogItem[];
  width?: number;
  span?: number;
}
const text = (label: string, value = ''): CatalogField => ({ kind: 'text', label, value });
const area = (label: string, value = ''): CatalogField => ({ kind: 'textarea', label, value });
const number = (label: string, value: number, min = 0, max = 10000): CatalogField => ({
  kind: 'number',
  label,
  value,
  min,
  max,
});
const flag = (label: string, value = false): CatalogField => ({ kind: 'boolean', label, value });
const choice = (label: string, options: string[], value = options[0]): CatalogField => ({
  kind: 'select',
  label,
  options,
  value,
});
const items = (label: string, value: CatalogItem[]): CatalogField => ({
  kind: 'items',
  label,
  value,
});
const slot: CatalogField = { kind: 'slot', label: '子组件', value: [] };
const sizes = choice('尺寸', ['sm', 'md', 'lg'], 'md');
const disabled = flag('禁用');
const name = text('提交字段名', 'field');
const label = text('字段标签', '请选择');
const options: CatalogItem[] = [
  { value: 'design', label: '产品设计' },
  { value: 'development', label: '技术开发' },
  { value: 'operations', label: '运营管理' },
];
const tree: CatalogItem[] = [
  {
    value: 'product',
    label: '产品团队',
    children: [
      { value: 'design', label: '设计组' },
      { value: 'development', label: '开发组' },
    ],
  },
  { value: 'operations', label: '运营团队' },
];
const itemField = items('选项数据', options);
const picker = { label, name, placeholder: text('占位文本', '请选择'), disabled, size: sizes };
const entry = (
  label: string,
  group: string,
  description: string,
  fields: Record<string, CatalogField>
): CatalogDefinition => ({ label, group, description, fields });

export const catalogDefinitions: Record<string, CatalogDefinition> = {
  Radio: entry('Radio 单选框', 'form', '可配置选项、方向与默认值的单选组。', {
    label,
    name,
    options: itemField,
    defaultValue: text('默认值', 'design'),
    orientation: choice('排列方向', ['horizontal', 'vertical']),
    disabled,
  }),
  Select: entry('Select 选择器', 'form', '支持键盘导航与浮层的 ZUVI 选择器。', {
    ...picker,
    options: itemField,
    defaultValue: text('默认值'),
    clearable: flag('可清除', true),
  }),
  Combobox: entry('Combobox 自动完成', 'form', '可搜索、清空和自由输入的选择框。', {
    ...picker,
    options: itemField,
    defaultValue: text('默认值'),
    clearable: flag('可清除', true),
  }),
  MultiCombobox: entry('MultiCombobox 多项选择', 'form', '支持搜索与多选标签。', {
    ...picker,
    options: itemField,
    defaultValue: text('默认值（逗号分隔）'),
    clearable: flag('可清除', true),
  }),
  Slider: entry('Slider 滑块', 'form', '可设置范围、步长与默认数值。', {
    label: text('字段标签', '进度'),
    name,
    min: number('最小值', 0, -100000),
    max: number('最大值', 100, -100000, 100000),
    step: number('步长', 1, 0.01),
    defaultValue: number('默认值', 30, -100000, 100000),
    disabled,
  }),
  Rate: entry('Rate 评分', 'form', '可配置星数与半星的评分控件。', {
    label: text('字段标签', '评分'),
    name,
    count: number('星数', 5, 1, 10),
    defaultValue: number('默认评分', 3, 0, 10),
    allowHalf: flag('允许半星', true),
    disabled,
  }),
  InputNumber: entry('InputNumber 数字输入', 'form', '带步进器的数值输入框。', {
    label: text('字段标签', '数量'),
    name,
    min: number('最小值', 0, -100000),
    max: number('最大值', 100, -100000, 100000),
    step: number('步长', 1, 0.01),
    defaultValue: number('默认值', 1, -100000, 100000),
    disabled,
    size: sizes,
  }),
  ColorPicker: entry('ColorPicker 颜色选择', 'form', '选择与输入颜色，表单提交保存色值。', {
    label: text('字段标签', '品牌颜色'),
    name,
    defaultValue: text('默认色值', '#6366f1'),
    disabled,
    size: sizes,
  }),
  DatePicker: entry('DatePicker 日期选择', 'form', '日历选择，支持日期范围限制。', {
    ...picker,
    defaultValue: text('默认日期 YYYY-MM-DD'),
    min: text('最早日期'),
    max: text('最晚日期'),
    allowClear: flag('可清除', true),
  }),
  DateRangePicker: entry('DateRangePicker 日期范围', 'form', '双日历选择开始与结束日期。', {
    label: text('字段标签', '日期范围'),
    name,
    start: text('默认开始日期'),
    end: text('默认结束日期'),
    min: text('最早日期'),
    max: text('最晚日期'),
    disabled,
    size: sizes,
    allowClear: flag('可清除', true),
  }),
  TimePicker: entry('TimePicker 时间选择', 'form', '可配置显示精度的时间选择器。', {
    ...picker,
    defaultValue: text('默认时间', '09:30:00'),
    format: choice('显示格式', ['HH:mm:ss', 'HH:mm']),
  }),
  TreeSelect: entry('TreeSelect 树选择', 'form', '支持搜索的层级数据选择。', {
    ...picker,
    options: items('树形选项', tree),
    defaultValue: text('默认选中值'),
    multiple: flag('多选'),
  }),
  Cascader: entry('Cascader 级联选择', 'form', '根据层级选项逐级选择。', {
    ...picker,
    options: items('层级选项', tree),
    defaultValue: text('默认路径（逗号分隔）'),
  }),
  Transfer: entry('Transfer 穿梭框', 'form', '搜索并在两个列表间移动项目。', {
    label: text('标题', '分配成员'),
    name,
    options: itemField,
    defaultValue: text('默认目标值（逗号分隔）', 'design'),
    sourceTitle: text('来源标题', '待选'),
    targetTitle: text('目标标题', '已选'),
    showSearch: flag('显示搜索', true),
    disabled,
  }),
  Mentions: entry('Mentions 提及', 'form', '支持 @ 提及与键盘选择。', {
    label: text('字段标签', '备注'),
    name,
    options: itemField,
    placeholder: text('占位文本', '输入 @ 提及成员'),
    defaultValue: area('默认内容'),
    disabled,
  }),
  Upload: entry('Upload 文件选择与上传', 'form', '选择真实本地文件；可配置服务地址上传。', {
    label: text('按钮 / 拖拽提示', '选择文件'),
    name: text('附件字段名', 'files'),
    accept: text('文件类型', '.pdf,.png,.jpg,.txt,.docx'),
    multiple: flag('允许多选', true),
    maxCount: number('最多文件数', 5, 1, 50),
    maxSize: number('单文件上限 MB', 10, 1, 100),
    draggable: flag('拖拽上传', true),
    mode: choice('处理方式', ['local', 'server']),
    action: text('上传服务地址（http/https）'),
    disabled,
  }),
  FormItem: entry('Form.Item 表单字段', 'form', '为单个 ZUVI 控件添加标签、必填校验与受控绑定。', {
    label: text('字段标签', '字段'),
    name,
    required: flag('必填'),
    control: choice('控件', [
      'Input',
      'TextArea',
      'Select',
      'InputNumber',
      'Switch',
      'Checkbox',
      'DatePicker',
    ]),
    placeholder: text('占位文本', '请输入'),
    options: itemField,
  }),

  Row: entry('Row 栅格行', 'layout', 'ZUVI 的 24 栅格行；拖入 Col 组成布局。', {
    gutter: number('栅格间距', 24, 0, 160),
    justify: choice('水平对齐', ['start', 'center', 'end', 'space-between', 'space-around']),
    align: choice('垂直对齐', ['top', 'middle', 'bottom']),
    wrap: flag('自动换行', true),
    content: slot,
  }),
  Col: entry('Col 栅格列', 'layout', '24 栅格跨度、偏移和自定义子组件。', {
    span: number('占用栅格', 12, 1, 24),
    offset: number('偏移栅格', 0, 0, 23),
    content: slot,
  }),
  Flex: entry('Flex 弹性布局', 'layout', '横纵排列、换行与对齐的 ZUVI 容器。', {
    vertical: flag('纵向排列'),
    gap: number('间距', 16, 0, 160),
    justify: choice('主轴对齐', ['start', 'center', 'end', 'space-between', 'space-around']),
    align: choice('交叉轴对齐', ['stretch', 'start', 'center', 'end']),
    wrap: flag('自动换行', true),
    content: slot,
  }),
  Space: entry('Space 间距', 'layout', '让子组件保持统一的方向和间距。', {
    direction: choice('排列方向', ['horizontal', 'vertical']),
    size: number('间距', 16, 0, 160),
    wrap: flag('允许换行', true),
    align: choice('对齐方式', ['start', 'center', 'end', 'baseline']),
    content: slot,
  }),
  Splitter: entry('Splitter 可调分栏', 'layout', '可拖拽 / 键盘调整和折叠的分栏。', {
    orientation: choice('分割方向', ['horizontal', 'vertical']),
    stackOnMobile: flag('小屏自动堆叠', true),
    height: number('高度', 280, 120, 1200),
    items: items('面板（value、label、content）', [
      { value: 'navigation', label: '导航', content: '拖动中间分割线调整面板大小。' },
      { value: 'workspace', label: '工作区', content: '这里是工作区内容。' },
    ]),
    collapsible: flag('允许折叠', true),
    content: slot,
  }),
  Watermark: entry('Watermark 水印', 'layout', '为任意子组件叠加可配置水印。', {
    text: text('水印内容', 'ZUVI / 内部资料'),
    rotate: number('旋转角度', -22, -180, 180),
    gap: number('水印间距', 100, 20, 400),
    content: slot,
  }),
  Affix: entry('Affix 固钉', 'layout', '滚动时将自定义内容固定在顶部。', {
    offsetTop: number('距顶部 px', 12, 0, 300),
    content: slot,
  }),
  ConfigProvider: entry('ConfigProvider 全局配置', 'layout', '为子组件覆盖中文或英文的语言文案。', {
    locale: choice('组件语言', ['zh-CN', 'en-US']),
    content: slot,
  }),
  App: entry('App 应用容器', 'layout', '为自定义子组件提供消息、通知和弹窗上下文。', {
    content: slot,
  }),

  Tabs: entry('Tabs 标签页', 'navigation', '配置页签与文本，也可拖入 TabPanel 自由搭建每个面板。', {
    items: items('标签页', [
      { value: 'overview', label: '概览', content: '在这里介绍你的产品。' },
      { value: 'details', label: '详细信息', content: '在这里补充产品细节。' },
    ]),
    defaultValue: text('默认标签值', 'overview'),
    orientation: choice('排列方向', ['horizontal', 'vertical']),
    content: slot,
  }),
  TabPanel: entry(
    'Tabs.Panel 自定义面板',
    'navigation',
    '放入 Tabs，并将面板值与标签项的 value 保持一致。',
    {
      value: text('对应标签值', 'overview'),
      title: text('编辑时面板名称', '概览面板'),
      content: slot,
    }
  ),
  Segmented: entry('Segmented 分段控制', 'navigation', '切换视图或表单选项。', {
    label: text('组名称', '分段选项'),
    options: itemField,
    defaultValue: text('默认值', 'design'),
    size: sizes,
    block: flag('撑满容器'),
    name,
  }),
  Steps: entry('Steps 步骤条', 'navigation', '可点击切换的步骤与说明。', {
    items: items('步骤', [
      { value: '1', label: '填写信息', description: '完善基础资料' },
      { value: '2', label: '确认内容', description: '核对提交数据' },
      { value: '3', label: '完成', description: '提交成功' },
    ]),
    current: number('当前步骤（从 0 开始）', 0, 0, 50),
    direction: choice('方向', ['horizontal', 'vertical']),
    size: choice('尺寸', ['md', 'sm']),
  }),
  Pagination: entry('Pagination 分页', 'navigation', '页码、每页数量与快速跳页。', {
    total: number('总条数', 100, 0, 1000000),
    pageSize: number('每页数量', 10, 1, 1000),
    defaultPage: number('初始页码', 1, 1, 100000),
    showJumper: flag('显示跳页', true),
    disabled,
  }),
  Breadcrumb: entry('Breadcrumb 面包屑', 'navigation', '配置层级名称与安全跳转地址。', {
    items: items('导航项', [
      { value: 'home', label: '首页', href: '#' },
      { value: 'projects', label: '项目' },
    ]),
    separator: text('分隔符', '/'),
  }),
  SideNav: entry('SideNav 侧边导航', 'navigation', '支持嵌套分组、折叠和选中项。', {
    title: text('导航标题', '工作空间'),
    items: items('导航项', [
      { value: 'home', label: '概览', href: '#home' },
      {
        value: 'projects',
        label: '项目',
        children: [
          { value: 'active', label: '进行中', href: '#active' },
          { value: 'archive', label: '归档', href: '#archive' },
        ],
      },
    ]),
    currentKey: text('初始选中项', 'home'),
    collapsible: flag('允许折叠', true),
  }),
  Anchor: entry('Anchor 锚点导航', 'navigation', '跳转至同页分区的锚点 ID。', {
    items: items('锚点链接', [
      { value: 'intro', label: '产品介绍', href: '#intro' },
      { value: 'contact', label: '联系我们', href: '#contact' },
    ]),
    direction: choice('方向', ['vertical', 'horizontal']),
    offsetTop: number('顶部偏移', 16, 0, 300),
  }),
  CommandPalette: entry(
    'CommandPalette 命令面板',
    'navigation',
    '点击打开可搜索的命令面板；命令可跳转链接。',
    {
      label: text('触发按钮', '搜索命令'),
      placeholder: text('搜索提示', '输入命令或页面名称…'),
      items: items('命令', [
        { value: 'intro', label: '查看介绍', description: '导航', href: '#intro' },
        { value: 'contact', label: '联系我们', description: '导航', href: '#contact' },
      ]),
    }
  ),

  Typography: entry('Typography 排版', 'content', '标题、段落和文本的完整 ZUVI 排版选项。', {
    text: area('文字内容', '每个想法，都值得一个好页面。'),
    variant: choice('排版类型', ['title', 'paragraph', 'text'], 'paragraph'),
    level: number('标题等级', 2, 1, 5),
    strong: flag('加粗'),
    italic: flag('斜体'),
    underline: flag('下划线'),
    mark: flag('高亮'),
    code: flag('代码'),
    copyable: flag('段落可复制'),
    type: choice('语义颜色', ['default', 'secondary', 'success', 'warning', 'danger']),
  }),
  Avatar: entry('Avatar 头像', 'content', '图片或文字头像，支持尺寸与形状。', {
    src: text('图片地址'),
    text: text('文字', 'ZU'),
    alt: text('替代文本', '用户头像'),
    size: number('尺寸 px', 48, 16, 240),
    shape: choice('形状', ['circle', 'square']),
  }),
  Descriptions: entry('Descriptions 描述列表', 'content', '用标签和值展示详情数据。', {
    title: text('标题', '项目信息'),
    items: items('描述项（label、content）', [
      { value: 'name', label: '项目名称', content: '品牌设计系统' },
      { value: 'owner', label: '负责人', content: '设计团队' },
      { value: 'status', label: '状态', content: '进行中' },
    ]),
    column: number('列数', 2, 1, 4),
    bordered: flag('显示边框', true),
    size: choice('尺寸', ['md', 'sm']),
  }),
  Statistic: entry('Statistic 统计数值', 'content', '格式化数值、精度及前后缀。', {
    title: text('标题', '本月收入'),
    value: number('数值', 128640, -1000000000, 1000000000),
    precision: number('小数位数', 2, 0, 8),
    prefix: text('前缀', '¥'),
    suffix: text('后缀'),
  }),
  Timeline: entry('Timeline 时间线', 'content', '自定义时间线内容与排列模式。', {
    items: items('时间线', [
      { value: 'start', label: '项目启动', description: '2026-11-01', content: '确认方向与目标' },
      { value: 'design', label: '设计完成', description: '2026-11-10', content: '交付设计方案' },
    ]),
    mode: choice('排列模式', ['left', 'right', 'alternate']),
    pending: text('待完成提示'),
  }),
  Chart: entry(
    'Chart 数据图表',
    'content',
    '13 种类型、17 种形式。分类 / 雷达 / 迷你图用 category + 数值列和 valueKey；切片 / 仪表 / 瀑布用 id、label、value；热力用 id、row、col、value；散点 / 气泡用 id、seriesId、x、y、可选 value。所有数据均为扁平行，示例数值不代表实际业务。',
    {
      type: choice('图表类型', [
        'line',
        'area',
        'bar',
        'pie',
        'donut',
        'scatter',
        'radar',
        'heatmap',
        'treemap',
        'funnel',
        'gauge',
        'waterfall',
        'sparkline',
      ]),
      title: text('标题（可选）', '半年趋势（示例）'),
      description: text('说明（可选）', '合成示例数据，不代表实际业务。'),
      label: text('可访问名称（可选）', '数据图表示例'),
      rowsJson: {
        kind: 'rows',
        label: '行数据（按图表类型配置）',
        value: [
          { category: '1 月', design: 28, development: 20 },
          { category: '2 月', design: 36, development: 28 },
          { category: '3 月', design: 32, development: 38 },
          { category: '4 月', design: 48, development: 34 },
          { category: '5 月', design: 54, development: 46 },
          { category: '6 月', design: 64, development: 52 },
        ],
      },
      seriesJson: {
        kind: 'rows',
        label: '系列（id、name、valueKey、color；散点无需 valueKey）',
        value: [
          {
            id: 'design',
            name: '设计项目',
            valueKey: 'design',
            color: 'var(--zuvi-color-primary)',
          },
          {
            id: 'development',
            name: '研发项目',
            valueKey: 'development',
            color: 'var(--zuvi-color-success)',
          },
        ],
      },
      height: number('绘图区高度 px', 300, 180, 800),
      xLabel: text('横轴名称（可选）', '月份'),
      yLabel: text('纵轴名称（可选）', '项目数'),
      legend: flag('显示图例', true),
      grid: flag('显示网格', true),
      tooltip: flag('显示数据提示', true),
      showDataTable: flag('显示数据表', true),
      stack: flag('堆叠系列（仅面积 / 柱状）'),
      orientation: choice('柱状方向', ['vertical', 'horizontal'], 'vertical'),
      bubble: flag('按可选 value 显示气泡（仅散点）'),
      min: { kind: 'number', label: '仪表最小值（仅 gauge）', value: 0 },
      max: { kind: 'number', label: '仪表最大值（仅 gauge）', value: 100 },
      tooltipMode: choice('数据提示模式', ['datum', 'crosshair'], 'datum'),
      zoom: flag('启用缩放（分类 / 散点）'),
      brush: flag('启用框选缩放（分类 / 散点）'),
      animated: flag('启用过渡动画（尊重减少动态效果设置）'),
      csv: flag('下载完整原始 CSV'),
      loading: flag('正在加载'),
      error: text('外部错误说明（可选）'),
      disabled,
      defaultValue: text('默认选中数据 id（可选）'),
      defaultHiddenSeries: text('初始隐藏的系列 / 切片 id（逗号分隔）'),
      dataTableLabel: text('数据表展开文案（可选）'),
      emptyLabel: text('空数据文案（可选）'),
    }
  ),
  Globe: entry(
    'Globe 3D 地球',
    'content',
    '城市经纬度与示例连接；编辑画布用二维，预览和离线导出使用配置的模式。',
    {
      label: text('地球名称', '全球城市网络'),
      rowsJson: {
        kind: 'rows',
        label: '点位（id、lat、lng）',
        value: [
          { id: 'shanghai', name: '上海', lat: 31.2304, lng: 121.4737, value: '城市中心' },
          { id: 'tokyo', name: '东京', lat: 35.6762, lng: 139.6503, value: '城市中心' },
          { id: 'singapore', name: '新加坡', lat: 1.3521, lng: 103.8198, value: '城市中心' },
          { id: 'london', name: '伦敦', lat: 51.5074, lng: -0.1278, value: '城市中心' },
        ],
      },
      arcsJson: {
        kind: 'rows',
        label: '连接（id、from、to）',
        value: [
          { id: 'shanghai-tokyo', from: 'shanghai', to: 'tokyo', altitude: 0.12, animated: true },
          {
            id: 'shanghai-singapore',
            from: 'shanghai',
            to: 'singapore',
            altitude: 0.18,
            animated: true,
          },
          {
            id: 'singapore-london',
            from: 'singapore',
            to: 'london',
            altitude: 0.3,
            animated: true,
          },
        ],
      },
      categoriesJson: {
        kind: 'rows',
        label: '分类（id、name、color）',
        value: [],
      },
      legend: flag('显示分类图例（配置分类后生效）', true),
      pointLabels: choice('点位标签', ['none', 'selected', 'auto'], 'none'),
      maxLabels: number('自动标签数量上限', 12, 1, 40),
      valueScale: flag('按数字 value 映射点位面积'),
      searchable: flag('允许列表搜索（不筛选地图）'),
      defaultSearchValue: text('初始列表搜索'),
      showArcList: flag('显示路径列表'),
      defaultArcValue: text('默认选中路径 id'),
      transitionDuration: number('聚焦过渡时间 ms（减少动态效果时立即完成）', 0, 0, 10000),
      defaultValue: text('默认选中点位 id', 'shanghai'),
      latitude: number('初始视角纬度', 20, -90, 90),
      longitude: number('初始视角经度', 105, -180, 180),
      zoom: number('初始缩放', 1, 0.75, 2),
      renderMode: choice('渲染模式', ['2d', 'auto'], '2d'),
      height: number('地球高度 px', 360, 160, 1200),
      autoRotate: flag('自动旋转', true),
      rotationSpeed: number('转速 °/s', 6, -60, 60),
      animateArcs: flag('WebGL 连线动画（二维保持静态）', true),
      interactive: flag('允许交互', true),
      controls: flag('显示控件', true),
      wheelZoom: flag('滚轮缩放（默认保留页面滚动）'),
      showPointList: flag('显示城市列表', true),
      disabled,
    }
  ),
  Table: entry('Table 表格', 'content', '编辑列定义和真实行数据，可搜索与排序。', {
    caption: text('表格标题', '项目列表'),
    columns: items('列（value 对应数据字段）', [
      { value: 'name', label: '项目' },
      { value: 'owner', label: '负责人' },
      { value: 'status', label: '状态' },
    ]),
    rows: {
      kind: 'rows',
      label: '行数据 JSON',
      value: [
        { name: '品牌设计系统', owner: '设计团队', status: '进行中' },
        { name: '工作台改版', owner: '研发团队', status: '待评审' },
      ],
    },
    searchable: flag('允许搜索', true),
    striped: flag('斑马纹'),
    size: sizes,
  }),
  VirtualTable: entry('VirtualTable 虚拟表格', 'content', '大量行数据仅渲染可见部分。', {
    columns: items('列定义', [
      { value: 'name', label: '项目', width: 240 },
      { value: 'status', label: '状态', width: 160 },
    ]),
    rows: {
      kind: 'rows',
      label: '行数据 JSON',
      value: Array.from({ length: 30 }, (_, index) => ({
        id: `row-${index}`,
        name: `项目 ${index + 1}`,
        status: index % 2 ? '进行中' : '已完成',
      })),
    },
    height: number('可视高度', 280, 120, 1200),
    rowHeight: number('行高', 44, 24, 100),
  }),
  DataGrid: entry('DataGrid 数据网格', 'content', '可排序、可选择的大数据量虚拟网格。', {
    columns: items('列定义', [
      { value: 'name', label: '项目', width: 200 },
      { value: 'status', label: '状态', width: 120 },
    ]),
    rows: {
      kind: 'rows',
      label: '行数据 JSON',
      value: Array.from({ length: 30 }, (_, index) => ({
        id: `row-${index}`,
        name: `项目 ${index + 1}`,
        status: index % 2 ? '进行中' : '已完成',
      })),
    },
    height: number('可视高度', 320, 120, 1200),
    rowHeight: number('行高', 40, 24, 100),
  }),
  Tree: entry('Tree 树形控件', 'content', '可展开和勾选的层级数据。', {
    items: items('树形数据', tree),
    checkable: flag('显示复选框', true),
    defaultExpandedKeys: text('默认展开值（逗号分隔）', 'product'),
  }),
  Collapse: entry('Collapse 折叠面板', 'content', '配置标题与正文，支持手风琴模式。', {
    items: items('面板内容', [
      { value: 'faq-1', label: '如何开始？', content: '从左侧拖入组件，再在右侧配置内容和样式。' },
      {
        value: 'faq-2',
        label: '如何保存？',
        content: '页面自动保存到本机，也可以导出 JSON 和 HTML。',
      },
    ]),
    accordion: flag('手风琴模式'),
    defaultActiveKeys: text('默认展开值（逗号分隔）', 'faq-1'),
  }),
  List: entry('List 列表', 'content', '自定义标题、描述、页眉与页脚。', {
    title: text('页眉', '最近更新'),
    footer: text('页脚'),
    items: items(
      '列表数据',
      options.map((item) => ({ ...item, description: '查看团队的最新动态与工作进展' }))
    ),
    bordered: flag('显示边框', true),
    size: choice('尺寸', ['md', 'sm']),
  }),
  Calendar: entry('Calendar 日历', 'content', '可切换月份和选择日期的完整日历。', {
    defaultValue: text('初始日期 YYYY-MM-DD'),
    fullscreen: flag('全尺寸', true),
  }),
  QRCode: entry('QRCode 二维码', 'content', '根据真实内容生成二维码。', {
    value: text('二维码内容', 'https://example.com'),
    size: number('尺寸 px', 160, 64, 512),
    color: text('前景颜色', '#111827'),
    bgColor: text('背景颜色', '#ffffff'),
    level: choice('纠错等级', ['L', 'M', 'Q', 'H'], 'M'),
  }),

  Modal: entry('Modal 对话框', 'feedback', '点击打开真实弹窗，可拖入任意子组件。', {
    label: text('触发按钮', '打开对话框'),
    title: text('对话框标题', '确认信息'),
    text: area('说明内容', '可以在此容器中继续搭建表单和其他组件。'),
    content: slot,
  }),
  Drawer: entry('Drawer 抽屉', 'feedback', '侧边弹出自定义内容，可选择方向与宽度。', {
    label: text('触发按钮', '打开抽屉'),
    title: text('抽屉标题', '详细信息'),
    text: area('说明内容', '在右侧继续配置内容。'),
    placement: choice('打开方向', ['right', 'left', 'top', 'bottom']),
    size: number('宽度 / 高度 px', 420, 240, 1200),
    content: slot,
  }),
  Tooltip: entry('Tooltip 文字提示', 'feedback', '悬停与键盘聚焦显示提示。', {
    label: text('触发文本', '了解更多'),
    text: area('提示内容', '这是一条帮助提示。'),
    placement: choice('提示位置', ['top', 'bottom', 'left', 'right']),
    delay: number('延迟 ms', 200, 0, 2000),
  }),
  Popover: entry('Popover 气泡卡片', 'feedback', '点击打开包含自定义子组件的浮层。', {
    label: text('触发按钮', '查看详情'),
    title: text('标题', '详细说明'),
    text: area('正文', '可以在这里放入更多内容。'),
    side: choice('位置', ['bottom', 'top']),
    content: slot,
  }),
  DropdownMenu: entry('DropdownMenu 下拉菜单', 'feedback', '可配置禁用项与目标链接。', {
    label: text('触发按钮', '更多操作'),
    items: items('菜单项', [
      { value: 'intro', label: '查看介绍', href: '#intro' },
      { value: 'contact', label: '联系我们', href: '#contact' },
    ]),
  }),
  Popconfirm: entry('Popconfirm 气泡确认', 'feedback', '确认后执行跳转或显示完成消息。', {
    label: text('触发按钮', '删除项目'),
    title: text('确认标题', '确认执行此操作？'),
    description: text('说明', '请核对信息后继续。'),
    confirmText: text('确认按钮', '确认'),
    cancelText: text('取消按钮', '取消'),
    successMessage: text('完成提示', '操作已确认'),
    href: text('确认后跳转（可选）'),
  }),
  Message: entry('Message 全局提示', 'feedback', '点击触发真实 ZUVI 消息。', {
    label: text('触发按钮', '显示提示'),
    text: text('提示内容', '操作成功，所有更改已保存。'),
    variant: choice('类型', ['success', 'info', 'warning', 'error']),
    duration: number('显示时间 ms（0 为常驻）', 3000, 0, 60000),
  }),
  Notification: entry('Notification 通知', 'feedback', '点击触发带标题和描述的通知。', {
    label: text('触发按钮', '打开通知'),
    title: text('标题', '你有一条新消息'),
    text: area('通知内容', '团队成员更新了项目资料。'),
    variant: choice('类型', ['info', 'success', 'warning', 'error']),
    placement: choice('位置', ['topRight', 'topLeft', 'bottomRight', 'bottomLeft']),
    duration: number('显示时间 ms', 4500, 0, 60000),
  }),
  Tour: entry('Tour 漫游引导', 'feedback', '按步骤引导用户，可定位到页面锚点。', {
    label: text('触发按钮', '开始引导'),
    items: items('引导步骤（href 可填 #锚点）', [
      { value: 'intro', label: '欢迎使用', content: '先浏览页面内容。', href: '#intro' },
      { value: 'contact', label: '保持联系', content: '在这里提交你的需求。', href: '#contact' },
    ]),
  }),
  Empty: entry('Empty 空状态', 'feedback', '自定义空数据说明。', {
    description: text('空状态说明', '暂无内容，开始创建你的第一个项目。'),
  }),
  Skeleton: entry('Skeleton 骨架屏', 'feedback', '配置头像、段落和动画的加载占位。', {
    active: flag('开启动画', true),
    avatar: flag('显示头像', true),
    rows: number('段落行数', 3, 1, 12),
  }),
  Spin: entry('Spin 加载指示', 'feedback', '在自定义内容上显示真实加载状态。', {
    spinning: flag('正在加载', true),
    tip: text('提示文字', '正在加载…'),
    size: choice('尺寸', ['sm', 'md', 'lg'], 'md'),
    content: slot,
  }),
  Result: entry('Result 结果页', 'feedback', '展示成功、错误与状态结果。', {
    status: choice('状态', ['success', 'error', 'info', 'warning', '403', '404', '500']),
    title: text('标题', '操作成功'),
    subTitle: area('说明', '你的信息已经准备就绪。'),
    content: slot,
  }),
  BackTop: entry('BackTop 回到顶部', 'feedback', '滚动超过阈值后显示返回顶部按钮。', {
    visibilityHeight: number('显示阈值 px', 200, 0, 4000),
    text: text('按钮文字', '↑'),
  }),
  FloatButton: entry('FloatButton 悬浮按钮', 'feedback', '页面浮动入口，支持链接跳转。', {
    description: text('描述', '联系我们'),
    text: text('图标文字', '?'),
    href: text('目标链接', '#contact'),
    shape: choice('形状', ['circle', 'square']),
    type: choice('样式', ['default', 'primary'], 'primary'),
  }),
};

export const catalogGroupTitles: Record<string, string> = {
  layout: '布局与容器',
  form: '表单与输入',
  content: '内容与数据展示',
  navigation: '导航与流程',
  feedback: '反馈与浮层',
};

export const catalogContainerTypes = Object.entries(catalogDefinitions)
  .filter(([, definition]) => definition.fields.content?.kind === 'slot')
  .map(([type]) => type);

/** Validate real structured data instead of storing an unchecked JSON string. */
export function validateCatalogJson(value: unknown, kind: 'items' | 'rows'): unknown[] {
  let count = 0;
  const validate = (input: unknown, depth: number): unknown[] => {
    if (!Array.isArray(input) || input.length > (kind === 'rows' ? 2000 : 100) || depth > 6)
      throw new Error('数据应为数组；最多 100 个选项或 2000 行数据，嵌套不超过 6 层。');
    const values = new Set<string>();
    return input.map((item) => {
      if (++count > 4000 || !item || typeof item !== 'object' || Array.isArray(item))
        throw new Error('每一项应为对象，且总数不超过 4000。');
      const clean: Record<string, unknown> = {};
      for (const [key, entry] of Object.entries(item)) {
        if (
          !/^[\w\u4e00-\u9fff-]{1,80}$/.test(key) ||
          ['__proto__', 'prototype', 'constructor'].includes(key)
        )
          throw new Error(`不支持的数据字段：${key}`);
        if (
          kind === 'items' &&
          ![
            'value',
            'label',
            'description',
            'content',
            'href',
            'disabled',
            'children',
            'width',
            'span',
          ].includes(key)
        )
          throw new Error(`不支持的选项字段：${key}`);
        if (kind === 'items' && key === 'children') clean[key] = validate(entry, depth + 1);
        else if (typeof entry === 'string' && entry.length <= 10000) clean[key] = entry;
        else if (
          (typeof entry === 'number' && Number.isFinite(entry)) ||
          typeof entry === 'boolean' ||
          entry === null
        )
          clean[key] = entry;
        else throw new Error(`${key}应为文字、数字、布尔值或空值。`);
      }
      if (kind === 'items') {
        if (typeof clean.value !== 'string' || !clean.value || typeof clean.label !== 'string')
          throw new Error('选项需要唯一的 value 和文字 label。');
        if (values.has(clean.value)) throw new Error(`重复的选项值：${clean.value}`);
        values.add(clean.value);
        for (const key of ['description', 'content', 'href'])
          if (clean[key] !== undefined && typeof clean[key] !== 'string')
            throw new Error(`${key}需要文字。`);
        if (clean.disabled !== undefined && typeof clean.disabled !== 'boolean')
          throw new Error('disabled 需要布尔值。');
        for (const key of ['width', 'span'])
          if (
            clean[key] !== undefined &&
            (typeof clean[key] !== 'number' ||
              (clean[key] as number) < 1 ||
              (clean[key] as number) > 2000)
          )
            throw new Error(`${key}应在 1 到 2000 之间。`);
      }
      return clean;
    });
  };
  return validate(value, 0);
}

export interface CatalogChartData {
  props: ChartProps;
  issues: string[];
}

/** Map only supported flat scalar fields into a fresh, discriminated Chart data model. */
export function resolveCatalogChartData(
  typeInput: unknown,
  rowsInput: unknown,
  seriesInput: unknown,
  options: { min?: unknown; max?: unknown } = {}
): CatalogChartData {
  const issues: string[] = [];
  let omittedIssues = 0;
  const issue = (message: string) => {
    if (issues.length < 12) issues.push(message);
    else omittedIssues++;
  };
  const finish = (props: ChartProps): CatalogChartData => {
    if (omittedIssues)
      issues.push(`另有 ${omittedIssues} 项同类数据问题，请检查行数据和系列定义。`);
    return { props, issues };
  };
  const types: readonly ChartType[] = [
    'line',
    'area',
    'bar',
    'pie',
    'donut',
    'scatter',
    'radar',
    'heatmap',
    'treemap',
    'funnel',
    'gauge',
    'waterfall',
    'sparkline',
  ];
  if (typeInput !== undefined && !types.includes(typeInput as ChartType)) {
    issue(`图表类型无效：请使用 ${types.join('、')}。`);
    return finish({ type: 'line', categories: [], series: [] });
  }
  const type = (typeInput ?? 'line') as ChartType;
  const rows = (input: unknown, label: string): unknown[] => {
    if (!Array.isArray(input)) {
      issue(`${label}应为扁平对象数组，当前数据未绘制。`);
      return [];
    }
    if (input.length > 2000) issue(`${label}超过 2000 行，仅处理前 2000 行。`);
    return input.slice(0, 2000);
  };
  const record = (input: unknown): Record<string, unknown> | null => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
    const prototype = Object.getPrototypeOf(input);
    return prototype === Object.prototype || prototype === null
      ? (input as Record<string, unknown>)
      : null;
  };
  const own = (row: Record<string, unknown>, key: string): unknown =>
    Object.getOwnPropertyDescriptor(row, key)?.value;
  const readable = (value: unknown, max: number): value is string =>
    typeof value === 'string' &&
    value.length <= max &&
    ![...value].some(
      (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127
    ) &&
    // encodeURIComponent is part of the public datum ID contract; reject lone surrogates.
    !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value);
  const id = (row: Record<string, unknown>, key: string): string | null => {
    const value = own(row, key);
    return readable(value, 150) && value.trim() ? value.trim() : null;
  };
  const name = (row: Record<string, unknown>, key: string): string | null => {
    const value = own(row, key);
    return readable(value, 10000) && value.trim() ? value.trim() : null;
  };
  const finite = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value);
  const color = (row: Record<string, unknown>, context: string): string | undefined => {
    const value = own(row, 'color');
    if (value === undefined || value === '') return undefined;
    if (
      readable(value, 240) &&
      value.trim() &&
      !/[;{}<>\\]|\/\*|(?:url|image-set|expression)\s*\(|@import|javascript:/i.test(value)
    )
      return value.trim();
    issue(`${context}颜色无效，改用默认令牌颜色。`);
    return undefined;
  };
  const inputRows = rows(rowsInput, '行数据');

  if (type === 'heatmap') {
    const data: ChartHeatmapCell[] = [];
    const ids = new Set<string>();
    const coordinates = new Map<string, Set<string>>();
    for (const [index, input] of inputRows.entries()) {
      const row = record(input);
      const cellId = row ? id(row, 'id') : null;
      const rowName = row ? name(row, 'row') : null;
      const colName = row ? name(row, 'col') : null;
      const value = row ? own(row, 'value') : undefined;
      if (
        !row ||
        !cellId ||
        ids.has(cellId) ||
        !rowName ||
        !colName ||
        coordinates.get(rowName)?.has(colName) ||
        !finite(value)
      ) {
        issue(
          `热力第 ${index + 1} 行已忽略：需要唯一 id、不重复的 row / col 坐标和有限数值 value（可为负值）。`
        );
        continue;
      }
      ids.add(cellId);
      const columns = coordinates.get(rowName) ?? new Set<string>();
      columns.add(colName);
      coordinates.set(rowName, columns);
      const cell: ChartHeatmapCell = { id: cellId, row: rowName, col: colName, value };
      const cellColor = color(row, `热力第 ${index + 1} 行`);
      if (cellColor) cell.color = cellColor;
      data.push(cell);
    }
    return finish({ type, data });
  }

  if (
    type === 'pie' ||
    type === 'donut' ||
    type === 'treemap' ||
    type === 'funnel' ||
    type === 'gauge' ||
    type === 'waterfall'
  ) {
    const data: ChartSlice[] | ChartWaterfallStep[] = [];
    const signed = type === 'waterfall' || type === 'gauge';
    const ids = new Set<string>();
    for (const [index, input] of inputRows.entries()) {
      const row = record(input);
      const sliceId = row ? id(row, 'id') : null;
      const label = row ? name(row, 'label') : null;
      const value = row ? own(row, 'value') : undefined;
      if (
        !row ||
        !sliceId ||
        ids.has(sliceId) ||
        !label ||
        !finite(value) ||
        (!signed && value < 0)
      ) {
        issue(
          `切片第 ${index + 1} 行已忽略：需要唯一 id、非空 label 和${signed ? '有限数值 value（可为负值）' : '非负有限数值 value'}。`
        );
        continue;
      }
      ids.add(sliceId);
      const slice: ChartSlice = { id: sliceId, label, value };
      const sliceColor = color(row, `切片第 ${index + 1} 行`);
      if (sliceColor) slice.color = sliceColor;
      data.push(slice);
    }
    if (type === 'gauge') {
      const minInput = Object.getOwnPropertyDescriptor(options, 'min')?.value;
      const maxInput = Object.getOwnPropertyDescriptor(options, 'max')?.value;
      const min = minInput === undefined ? 0 : minInput;
      const max = maxInput === undefined ? Math.max(100, data[0]?.value ?? 0) : maxInput;
      const validBounds = finite(min) && finite(max) && min < max;
      const singleValue = inputRows.length === 1 && data.length === 1;
      if (!validBounds) issue('仪表 min / max 需要有限数值且 min < max；当前仪表未绘制。');
      if (!singleValue) issue('仪表需要且仅接受一行有限数值；当前仪表未绘制。');
      if (validBounds && singleValue && (data[0].value < min || data[0].value > max))
        issue('仪表 value 必须位于 min / max 范围内；当前仪表未绘制。');
      return finish({
        type,
        data:
          validBounds && singleValue && data[0].value >= min && data[0].value <= max ? data : [],
        ...(validBounds ? { min, max } : {}),
      });
    }
    return finish({ type, data });
  }

  const definitions = rows(seriesInput, '系列定义');
  const seriesIds = new Set<string>();
  if (type === 'scatter') {
    const series: ChartScatterSeries[] = [];
    const pointsBySeries = new Map<string, ChartScatterPoint[]>();
    const pointIds = new Map<string, Set<string>>();
    for (const [index, input] of definitions.entries()) {
      const row = record(input);
      const seriesId = row ? id(row, 'id') : null;
      const seriesName = row ? name(row, 'name') : null;
      if (!row || !seriesId || seriesIds.has(seriesId) || !seriesName) {
        issue(`系列第 ${index + 1} 行已忽略：需要唯一 id 和非空 name。`);
        continue;
      }
      seriesIds.add(seriesId);
      const points: ChartScatterPoint[] = [];
      const definition: ChartScatterSeries = { id: seriesId, name: seriesName, points };
      const seriesColor = color(row, `系列第 ${index + 1} 行`);
      if (seriesColor) definition.color = seriesColor;
      series.push(definition);
      pointsBySeries.set(seriesId, points);
      pointIds.set(seriesId, new Set());
    }
    for (const [index, input] of inputRows.entries()) {
      const row = record(input);
      const pointId = row ? id(row, 'id') : null;
      const seriesId = row ? id(row, 'seriesId') : null;
      const x = row ? own(row, 'x') : undefined;
      const y = row ? own(row, 'y') : undefined;
      const value = row ? own(row, 'value') : undefined;
      if (
        !row ||
        !pointId ||
        !seriesId ||
        !pointsBySeries.has(seriesId) ||
        pointIds.get(seriesId)!.has(pointId) ||
        !finite(x) ||
        !finite(y) ||
        (value !== undefined && (!finite(value) || value < 0))
      ) {
        issue(
          `散点第 ${index + 1} 行已忽略：需要系列内唯一 id、有效 seriesId 和有限数值 x、y；可选 value 必须为非负有限数值。`
        );
        continue;
      }
      pointIds.get(seriesId)!.add(pointId);
      const point: ChartScatterPoint = { id: pointId, x, y };
      if (value !== undefined) point.value = value as number;
      const label = own(row, 'label');
      if (readable(label, 10000)) point.label = label;
      else if (label !== undefined) issue(`散点第 ${index + 1} 行 label 无效，改用点位 id。`);
      pointsBySeries.get(seriesId)!.push(point);
    }
    return finish({ type, series });
  }

  const series: ChartSeries[] = [];
  const keys: string[] = [];
  const values: (number | null)[][] = [];
  for (const [index, input] of definitions.entries()) {
    const row = record(input);
    const seriesId = row ? id(row, 'id') : null;
    const seriesName = row ? name(row, 'name') : null;
    const valueKey = row ? id(row, 'valueKey') : null;
    if (
      !row ||
      !seriesId ||
      seriesIds.has(seriesId) ||
      !seriesName ||
      !valueKey ||
      !/^[\w\u4e00-\u9fff-]{1,80}$/.test(valueKey) ||
      ['__proto__', 'prototype', 'constructor'].includes(valueKey)
    ) {
      issue(`系列第 ${index + 1} 行已忽略：需要唯一 id、非空 name 和有效的数值列 valueKey。`);
      continue;
    }
    seriesIds.add(seriesId);
    const seriesValues: (number | null)[] = [];
    const definition: ChartSeries = { id: seriesId, name: seriesName, values: seriesValues };
    const seriesColor = color(row, `系列第 ${index + 1} 行`);
    if (seriesColor) definition.color = seriesColor;
    keys.push(valueKey);
    values.push(seriesValues);
    series.push(definition);
  }
  const categories: string[] = [];
  for (const [index, input] of inputRows.entries()) {
    const row = record(input);
    const category = row ? name(row, 'category') : null;
    if (!row || !category) {
      issue(`行数据第 ${index + 1} 行已忽略：需要非空文字 category。`);
      continue;
    }
    if (
      type === 'radar' &&
      keys.some((key) => !finite(own(row, key)) || (own(row, key) as number) < 0)
    ) {
      issue(`雷达第 ${index + 1} 行已忽略：所有系列需要非负有限数值，不接受 null 缺口。`);
      continue;
    }
    categories.push(category);
    for (const [seriesIndex, valueKey] of keys.entries()) {
      const value = own(row, valueKey);
      values[seriesIndex].push(finite(value) ? value : null);
      if (value !== null && !finite(value))
        issue(`行数据第 ${index + 1} 行的 ${valueKey} 不是有限数值，按缺口显示（不转换为 0）。`);
    }
  }
  if (type === 'radar' && categories.length < 3)
    issue('雷达需要至少三个有效分类轴；当前雷达未绘制。');
  return finish({ type, categories, series });
}

/** Convert flat serializable rows without passing unchecked objects to the renderer. */
export function resolveCatalogGlobeData(
  pointsInput: unknown,
  arcsInput: unknown,
  categoriesInput: unknown = []
): { points: GlobePoint[]; arcs: GlobeArc[]; categories: GlobeCategory[]; issues: string[] } {
  const issues: string[] = [];
  let omittedIssues = 0;
  const issue = (message: string) => {
    if (issues.length < 12) issues.push(message);
    else omittedIssues++;
  };
  const rows = (input: unknown, label: string): unknown[] => {
    if (!Array.isArray(input)) {
      issue(`${label}应为扁平对象数组，当前数据未绘制。`);
      return [];
    }
    if (input.length > 2000) issue(`${label}超过 2000 行，仅处理前 2000 行。`);
    return input.slice(0, 2000);
  };
  const record = (input: unknown): Record<string, unknown> | null =>
    input && typeof input === 'object' && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : null;
  const id = (row: Record<string, unknown>, key: string) =>
    typeof row[key] === 'string' && row[key].trim() && row[key].length <= 150
      ? row[key].trim()
      : null;
  const finite = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value);
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  const color = (value: unknown) =>
    typeof value === 'string' &&
    value.trim() &&
    value.length <= 240 &&
    ![...value].some(
      (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127
    ) &&
    !/[;{}<>]|(?:url|image-set|expression)\s*\(|@import|javascript:/i.test(value)
      ? value.trim()
      : undefined;
  const categories: GlobeCategory[] = [];
  const categoryIds = new Set<string>();
  for (const [index, input] of rows(categoriesInput, '分类').entries()) {
    const row = record(input);
    const categoryId = row ? id(row, 'id') : null;
    if (
      !row ||
      !categoryId ||
      categoryIds.has(categoryId) ||
      typeof row.name !== 'string' ||
      !row.name.trim() ||
      row.name.length > 10000
    ) {
      issue(`分类第 ${index + 1} 行已忽略：需要唯一 id 和非空文字 name。`);
      continue;
    }
    categoryIds.add(categoryId);
    const category: GlobeCategory = { id: categoryId, name: row.name.trim() };
    const categoryColor = color(row.color);
    if (categoryColor) category.color = categoryColor;
    else if (row.color !== undefined && row.color !== '')
      issue(`分类第 ${index + 1} 行颜色无效，改用默认令牌颜色。`);
    categories.push(category);
  }
  const points: GlobePoint[] = [];
  const pointIds = new Set<string>();
  for (const [index, input] of rows(pointsInput, '点位').entries()) {
    const row = record(input);
    const pointId = row ? id(row, 'id') : null;
    if (
      !row ||
      !pointId ||
      !finite(row.lat) ||
      row.lat < -90 ||
      row.lat > 90 ||
      !finite(row.lng) ||
      row.lng < -180 ||
      row.lng > 180 ||
      pointIds.has(pointId)
    ) {
      issue(`点位第 ${index + 1} 行已忽略：需要唯一 id、数值 lat（−90…90）和 lng（−180…180）。`);
      continue;
    }
    pointIds.add(pointId);
    const point: GlobePoint = { id: pointId, latitude: row.lat, longitude: row.lng };
    if (typeof row.name === 'string') point.name = row.name.slice(0, 10000);
    if (typeof row.value === 'string') point.value = row.value.slice(0, 10000);
    else if (finite(row.value)) point.value = row.value;
    const pointCategory = id(row, 'category');
    if (pointCategory) point.category = pointCategory;
    else if (row.category !== undefined && row.category !== '' && row.category !== null)
      issue(`点位第 ${index + 1} 行分类无效，按未分类点位显示。`);
    if (finite(row.size)) point.size = clamp(row.size, 0.008, 0.06);
    const pointColor = color(row.color);
    if (pointColor) point.color = pointColor;
    else if (row.color !== undefined && row.color !== '')
      issue(`点位第 ${index + 1} 行颜色无效，改用默认令牌颜色。`);
    points.push(point);
  }
  const arcs: GlobeArc[] = [];
  const arcIds = new Set<string>();
  for (const [index, input] of rows(arcsInput, '连接').entries()) {
    const row = record(input);
    const arcId = row ? id(row, 'id') : null;
    const from = row ? id(row, 'from') : null;
    const to = row ? id(row, 'to') : null;
    if (
      !row ||
      !arcId ||
      arcIds.has(arcId) ||
      !from ||
      !to ||
      from === to ||
      !pointIds.has(from) ||
      !pointIds.has(to)
    ) {
      issue(`连接第 ${index + 1} 行已忽略：需要唯一 id，from / to 引用两个不同的有效点位 id。`);
      continue;
    }
    arcIds.add(arcId);
    const arc: GlobeArc = { id: arcId, from, to };
    if (typeof row.name === 'string') arc.name = row.name.slice(0, 10000);
    if (typeof row.value === 'string') arc.value = row.value.slice(0, 10000);
    else if (finite(row.value)) arc.value = row.value;
    if (finite(row.width)) arc.width = clamp(row.width, 0.001, 0.02);
    if (finite(row.altitude)) arc.altitude = clamp(row.altitude, 0.02, 0.8);
    if (typeof row.animated === 'boolean') arc.animated = row.animated;
    const arcColor = color(row.color);
    if (arcColor) arc.color = arcColor;
    else if (row.color !== undefined && row.color !== '')
      issue(`连接第 ${index + 1} 行颜色无效，改用默认令牌颜色。`);
    arcs.push(arc);
  }
  if (omittedIssues)
    issues.push(`另有 ${omittedIssues} 项同类数据问题，请检查点位、连接与分类字段。`);
  return { points, arcs, categories, issues };
}
