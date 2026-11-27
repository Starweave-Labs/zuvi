/** ZUVI 文案（locale）契约 —— 见 CONTRACTS-V2 §3 / CONTRACTS-V3 §6 */

/* ---------------------------------- 类型 ---------------------------------- */

/** 递归局部覆盖类型：数组保持数组类型，文案段可只覆盖单个键。 */
export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

/** 全量文案表（默认 zh-CN） */
export interface ZuviLocale {
  /** 语言标识（BCP 47，如 'zh-CN'），供数字 / 日期等 Intl 格式化使用 */
  code?: string;
  accessibility: {
    loading: string;
    removeTag: string;
    breadcrumb: string;
    colorPicker: string;
    colorPanel: string;
    saturationBrightness: string;
    colorValue: string;
    hue: string;
    hex: string;
    searchResults: string;
    noMatch: string;
    searchCascader: string;
    anchor: string;
    copy: string;
    copied: string;
    column: string;
    increase: string;
    decrease: string;
    mentions: string;
    imagePreview: string;
    closePreview: string;
    backTop: string;
    slider: string;
    rating: string;
    ratingValue: string;
    floatAction: string;
    removeItem: string;
    qrCode: string;
    sourceList: string;
    targetList: string;
    selectAllSource: string;
    selectAllTarget: string;
    searchSource: string;
    searchTarget: string;
  };
  form: {
    required: string;
    minNumber: string;
    maxNumber: string;
    minLength: string;
    maxLength: string;
    pattern: string;
    validator: string;
  };
  result: {
    success: string;
    error: string;
    warning: string;
    info: string;
    '403': string;
    '404': string;
    '500': string;
  };

  select: { placeholder: string; empty: string }; // '请选择' / '暂无选项'
  sideNav: {
    navigation: string;
    collapse: string;
    expand: string;
    expandGroup: string; // 支持 {label}
    collapseGroup: string; // 支持 {label}
  };
  splitter: {
    panelLabel: string; // 支持 {index}
    resizeHandle: string;
    expandPanel: string;
    collapsePanel: string;
  };
  commandPalette: {
    title: string;
    search: string;
    placeholder: string;
    loading: string;
    empty: string;
    results: string;
  };
  statistic: { countdown: string }; // '倒计时'
  /** 图表文案，与 ChartLabels 保持一致。 */
  chart: {
    chart: string;
    loading: string;
    error: string;
    retry: string;
    empty: string;
    noVisible: string;
    showAll: string;
    legend: string;
    dataTable: string;
    category: string;
    series: string;
    value: string;
    x: string;
    y: string;
    percent: string;
    instructions: string;
    invalidData: string;
    zoomHint: string;
    brushHint: string;
    resetZoom: string;
    downloadCsv: string;
  };
  /** 地球可视化文案，与 GlobeLabels 保持一致。 */
  globe: {
    label: string;
    loading: string;
    rotate: string;
    pause: string;
    zoomIn: string;
    zoomOut: string;
    reset: string;
    points: string;
    noPoints: string;
    instructions: string;
    fallback: string;
    error: string;
    retry: string;
    latitude: string;
    longitude: string;
    value: string;
    search: string;
    searchPlaceholder: string;
    clearSearch: string;
    searchResults: string; // 支持 {count}
    noResults: string;
    legend: string;
    showAll: string;
    hiddenSelection: string;
    focusPoint: string; // 支持 {name}
    arcs: string;
    noArcs: string;
    selectedArc: string;
  };
  /** 数据网格文案，与 DataGridLabels 保持一致。 */
  dataGrid: {
    grid: string;
    loading: string;
    error: string;
    retry: string;
    empty: string;
    selectAll: string;
    selectRow: string; // 支持 {label}
    sortLabel: string; // 支持 {label}
    resizeColumn: string; // 支持 {label}，v1.1 起使用
    filterLabel: string; // 支持 {label}，v1.2 起使用
    filterEmpty: string; // v1.2 起使用
  };
  combobox: {
    placeholder: string;
    clear: string;
    showOptions: string;
    hideOptions: string;
    loading: string;
    empty: string;
    results: string;
  };
  input: { clear: string; showPassword: string; hidePassword: string; search: string }; // '清除' / '显示密码' / '隐藏密码' / '搜索'
  modal: { close: string }; // '关闭'
  drawer: { close: string }; // '关闭'
  message: { close: string }; // '关闭'
  pagination: {
    prev: string; // '上一页'
    next: string; // '下一页'
    jumper: string; // '跳至'
    label: string; // '分页'（nav aria-label）
    jumperLabel: string; // '跳至页码'（跳页输入框 aria-label）
    unit: string; // '页'（"跳至 N 页"的单位后缀）
  };
  empty: { description: string }; // '暂无数据'
  /** 日期类组件（DatePicker / Calendar 等） */
  date: {
    today: string; // '今天'
    previousMonth: string; // '上一月'
    nextMonth: string; // '下一月'
    previousYear: string; // '上一年'
    nextYear: string; // '下一年'
    /** 月份标题模板：'{year}年{month}月'（{month} 为 1 起始数字） */
    monthFormat: string;
    placeholder: string; // '请选择日期'
    inputLabel: string; // '日期'（输入框 aria-label）
    panelLabel: string; // '选择日期'（弹出面板 aria-label）
    /** 星期列表头 aria-label 模板：'星期{name}'（{name} 取 weekdays 对应项） */
    weekdayFormat: string;
    /** 星期列表头文案（周一为首日） */
    weekdays: string[]; // ['一','二','三','四','五','六','日']
  };
  /** 穿梭框（Transfer） */
  transfer: {
    search: string; // '搜索'
    itemUnit: string; // '项'
    moveRight: string; // '移动到目标列表'（右移按钮 aria-label）
    moveLeft: string; // '移动到源列表'（左移按钮 aria-label）
  };
  /** 时间选择（TimePicker） */
  timePicker: {
    ok: string; // '确定'
    cancel: string; // '取消'
    placeholder: string; // '请选择时间'
    hour: string; // '时'（时列 aria-label）
    minute: string; // '分'（分列 aria-label）
    second: string; // '秒'（秒列 aria-label）
  };
  /** 气泡确认（Popconfirm） */
  popconfirm: {
    ok: string; // '确定'
    cancel: string; // '取消'
  };
  app: { confirm: string };
  /** 漫游引导（Tour） */
  tour: {
    prev: string; // '上一步'
    next: string; // '下一步'
    finish: string; // '完成'
  };
  /** 上传（Upload） */
  upload: {
    text: string; // '点击上传'
    dragText: string; // '点击或拖拽文件到此处'
    remove: string; // '删除文件'（移除按钮 aria-label）
  };
  /** 步骤条（Steps） */
  steps: {
    label: string; // '步骤条'（nav aria-label）
  };
  /** 日期范围（DateRangePicker） */
  dateRange: {
    startPlaceholder: string; // '开始日期'
    endPlaceholder: string; // '结束日期'
    separator: string; // '至'（两个日期间的分隔符）
    panelLabel: string; // '选择日期范围'（弹出面板 aria-label）
  };
}

/* -------------------------------- 语言包 -------------------------------- */

// Shared ordering keeps the chart-only tables compact without changing locale object shapes.
const chartLocaleKeys = [
  'chart',
  'loading',
  'error',
  'retry',
  'empty',
  'noVisible',
  'showAll',
  'legend',
  'dataTable',
  'category',
  'series',
  'value',
  'x',
  'y',
  'percent',
  'instructions',
  'invalidData',
  'zoomHint',
  'brushHint',
  'resetZoom',
  'downloadCsv',
] as const satisfies readonly (keyof ZuviLocale['chart'])[];

function createChartLocale(
  values: readonly string[] & { length: typeof chartLocaleKeys.length }
): ZuviLocale['chart'] {
  return Object.fromEntries(
    chartLocaleKeys.map((key, index) => [key, values[index]])
  ) as ZuviLocale['chart'];
}

// Shared ordering keeps the data-grid-only tables compact without changing locale object shapes.
const dataGridLocaleKeys = [
  'grid',
  'loading',
  'error',
  'retry',
  'empty',
  'selectAll',
  'selectRow',
  'sortLabel',
  'resizeColumn',
  'filterLabel',
  'filterEmpty',
] as const satisfies readonly (keyof ZuviLocale['dataGrid'])[];

function createDataGridLocale(
  values: readonly string[] & { length: typeof dataGridLocaleKeys.length }
): ZuviLocale['dataGrid'] {
  return Object.fromEntries(
    dataGridLocaleKeys.map((key, index) => [key, values[index]])
  ) as ZuviLocale['dataGrid'];
}

// Locale section tables share key order while keeping every value and object independent.
const accessibilityLocaleKeys = [
  'loading',
  'removeTag',
  'breadcrumb',
  'colorPicker',
  'colorPanel',
  'saturationBrightness',
  'colorValue',
  'hue',
  'hex',
  'searchResults',
  'noMatch',
  'searchCascader',
  'column',
  'increase',
  'decrease',
  'mentions',
  'imagePreview',
  'closePreview',
  'backTop',
  'slider',
  'rating',
  'ratingValue',
  'floatAction',
  'removeItem',
  'qrCode',
  'anchor',
  'copy',
  'copied',
  'sourceList',
  'targetList',
  'selectAllSource',
  'selectAllTarget',
  'searchSource',
  'searchTarget',
] as const satisfies readonly (keyof ZuviLocale['accessibility'])[];

const formLocaleKeys = [
  'required',
  'minNumber',
  'maxNumber',
  'minLength',
  'maxLength',
  'pattern',
  'validator',
] as const satisfies readonly (keyof ZuviLocale['form'])[];

const resultLocaleKeys = [
  'success',
  'error',
  'warning',
  'info',
  '403',
  '404',
  '500',
] as const satisfies readonly (keyof ZuviLocale['result'])[];

const selectLocaleKeys = [
  'placeholder',
  'empty',
] as const satisfies readonly (keyof ZuviLocale['select'])[];

const sideNavLocaleKeys = [
  'navigation',
  'collapse',
  'expand',
  'expandGroup',
  'collapseGroup',
] as const satisfies readonly (keyof ZuviLocale['sideNav'])[];

const splitterLocaleKeys = [
  'panelLabel',
  'resizeHandle',
  'expandPanel',
  'collapsePanel',
] as const satisfies readonly (keyof ZuviLocale['splitter'])[];

const commandPaletteLocaleKeys = [
  'title',
  'search',
  'placeholder',
  'loading',
  'empty',
  'results',
] as const satisfies readonly (keyof ZuviLocale['commandPalette'])[];

const globeLocaleKeys = [
  'label',
  'loading',
  'rotate',
  'pause',
  'zoomIn',
  'zoomOut',
  'reset',
  'points',
  'noPoints',
  'instructions',
  'fallback',
  'error',
  'retry',
  'latitude',
  'longitude',
  'value',
  'search',
  'searchPlaceholder',
  'clearSearch',
  'searchResults',
  'noResults',
  'legend',
  'showAll',
  'hiddenSelection',
  'focusPoint',
  'arcs',
  'noArcs',
  'selectedArc',
] as const satisfies readonly (keyof ZuviLocale['globe'])[];

const comboboxLocaleKeys = [
  'placeholder',
  'clear',
  'showOptions',
  'hideOptions',
  'loading',
  'empty',
  'results',
] as const satisfies readonly (keyof ZuviLocale['combobox'])[];

const inputLocaleKeys = [
  'clear',
  'showPassword',
  'hidePassword',
  'search',
] as const satisfies readonly (keyof ZuviLocale['input'])[];

const paginationLocaleKeys = [
  'prev',
  'next',
  'jumper',
  'label',
  'jumperLabel',
  'unit',
] as const satisfies readonly (keyof ZuviLocale['pagination'])[];

const transferLocaleKeys = [
  'search',
  'itemUnit',
  'moveRight',
  'moveLeft',
] as const satisfies readonly (keyof ZuviLocale['transfer'])[];

const timePickerLocaleKeys = [
  'ok',
  'cancel',
  'placeholder',
  'hour',
  'minute',
  'second',
] as const satisfies readonly (keyof ZuviLocale['timePicker'])[];

const popconfirmLocaleKeys = [
  'ok',
  'cancel',
] as const satisfies readonly (keyof ZuviLocale['popconfirm'])[];

const tourLocaleKeys = [
  'prev',
  'next',
  'finish',
] as const satisfies readonly (keyof ZuviLocale['tour'])[];

const uploadLocaleKeys = [
  'text',
  'dragText',
  'remove',
] as const satisfies readonly (keyof ZuviLocale['upload'])[];

const dateRangeLocaleKeys = [
  'startPlaceholder',
  'endPlaceholder',
  'separator',
  'panelLabel',
] as const satisfies readonly (keyof ZuviLocale['dateRange'])[];

function createLocaleSection<const Keys extends readonly string[]>(
  keys: Keys,
  values: readonly string[] & { length: Keys['length'] }
): Record<Keys[number], string> {
  return Object.fromEntries(keys.map((key, index) => [key, values[index]])) as Record<
    Keys[number],
    string
  >;
}

/** 默认 zh-CN 简体中文 */
export const zhCN: ZuviLocale = {
  code: 'zh-CN',
  accessibility: /* @__PURE__ */ createLocaleSection(accessibilityLocaleKeys, [
    '加载中',
    '移除标签',
    '面包屑',
    '颜色选择器',
    '颜色选择面板',
    '饱和度与亮度',
    '饱和度 {s}%，亮度 {v}%',
    '色相',
    '十六进制颜色值',
    '搜索结果',
    '暂无匹配',
    '搜索级联选项',
    '第 {index} 列',
    '增加',
    '减少',
    '提及建议',
    '图片预览',
    '关闭预览',
    '返回顶部',
    '滑块',
    '评分',
    '{index} 分',
    '悬浮操作',
    '移除 {item}',
    '二维码：{value}',
    '锚点导航',
    '复制',
    '已复制',
    '源列表',
    '目标列表',
    '全选源列表',
    '全选目标列表',
    '搜索源列表',
    '搜索目标列表',
  ]),
  form: /* @__PURE__ */ createLocaleSection(formLocaleKeys, [
    '该项为必填',
    '数值不能小于 {min}',
    '数值不能大于 {max}',
    '长度不能少于 {min}',
    '长度不能超过 {max}',
    '格式不正确',
    '校验不通过',
  ]),
  result: /* @__PURE__ */ createLocaleSection(resultLocaleKeys, [
    '操作成功',
    '操作失败',
    '警告',
    '提示',
    '403',
    '404',
    '500',
  ]),

  select: /* @__PURE__ */ createLocaleSection(selectLocaleKeys, [ '请选择', '暂无选项' ]),
  sideNav: /* @__PURE__ */ createLocaleSection(sideNavLocaleKeys, [
    '导航',
    '收窄导航',
    '展开导航',
    '展开分组 {label}',
    '收起分组 {label}',
  ]),
  splitter: /* @__PURE__ */ createLocaleSection(splitterLocaleKeys, [
    '面板 {index}',
    '调整面板大小',
    '展开面板',
    '折叠面板',
  ]),
  commandPalette: /* @__PURE__ */ createLocaleSection(commandPaletteLocaleKeys, [
    '命令面板',
    '搜索命令',
    '搜索命令…',
    '正在加载命令',
    '没有匹配的命令',
    '找到 {count} 条命令',
  ]),
  statistic: { countdown: '倒计时' },
  chart: createChartLocale([
    '数据图表',
    '正在加载图表…',
    '图表加载失败',
    '重试',
    '暂无图表数据',
    '所有数据系列已隐藏',
    '显示全部系列',
    '图表图例',
    '查看图表数据',
    '分类',
    '系列',
    '数值',
    'X 轴',
    'Y 轴',
    '占比',
    '方向键浏览，Home/End 首尾，Enter/Space 选择，Esc 关闭提示。',
    '图表数据格式不正确',
    '滚轮/双指/+/- 缩放；双击/Esc 重置',
    '拖拽框选范围',
    '重置范围',
    '导出 CSV',
  ]),
  dataGrid: createDataGridLocale([
    '数据网格',
    '正在加载数据…',
    '数据网格加载失败',
    '重试',
    '暂无数据',
    '全选',
    '选择 {label}',
    '按 {label} 排序',
    '调整 {label} 列宽',
    '筛选 {label}',
    '无匹配的筛选项',
  ]),
  globe: /* @__PURE__ */ createLocaleSection(globeLocaleKeys, [
    '3D 地球可视化',
    '正在加载地球…',
    '开始旋转',
    '暂停旋转',
    '放大',
    '缩小',
    '重置视角',
    '点位列表',
    '暂无点位',
    '使用方向键旋转，+ / - 缩放，Home 重置视角。',
    '已切换为 2D 地球，点位数据仍可查看',
    '地球加载失败',
    '重试 3D',
    '纬度',
    '经度',
    '数值',
    '搜索点位',
    '搜索点位名称、分类或数值…',
    '清除搜索',
    '找到 {count} 个点位',
    '没有匹配的点位',
    '点位分类',
    '显示全部分类',
    '所选点位已被当前筛选隐藏',
    '定位到 {name}',
    '连接列表',
    '暂无连接',
    '所选连接',
  ]),
  combobox: /* @__PURE__ */ createLocaleSection(comboboxLocaleKeys, [
    '请输入或选择',
    '清除选择',
    '展开选项',
    '收起选项',
    '加载中',
    '暂无匹配选项',
    '找到 {count} 项',
  ]),
  input: /* @__PURE__ */ createLocaleSection(inputLocaleKeys, [ '清除', '显示密码', '隐藏密码', '搜索' ]),
  modal: { close: '关闭' },
  drawer: { close: '关闭' },
  message: { close: '关闭' },
  pagination: /* @__PURE__ */ createLocaleSection(paginationLocaleKeys, [
    '上一页',
    '下一页',
    '跳至',
    '分页',
    '跳至页码',
    '页',
  ]),
  empty: { description: '暂无数据' },
  date: {
    today: '今天',
    previousMonth: '上一月',
    nextMonth: '下一月',
    previousYear: '上一年',
    nextYear: '下一年',
    monthFormat: '{year}年{month}月',
    placeholder: '请选择日期',
    inputLabel: '日期',
    panelLabel: '选择日期',
    weekdayFormat: '星期{name}',
    weekdays: ['一', '二', '三', '四', '五', '六', '日'],
  },
  transfer: /* @__PURE__ */ createLocaleSection(transferLocaleKeys, [
    '搜索',
    '项',
    '移动到目标列表',
    '移动到源列表',
  ]),
  timePicker: /* @__PURE__ */ createLocaleSection(timePickerLocaleKeys, [
    '确定',
    '取消',
    '请选择时间',
    '时',
    '分',
    '秒',
  ]),
  popconfirm: /* @__PURE__ */ createLocaleSection(popconfirmLocaleKeys, [ '确定', '取消' ]),
  app: { confirm: '确认' },
  tour: /* @__PURE__ */ createLocaleSection(tourLocaleKeys, [ '上一步', '下一步', '完成' ]),
  upload: /* @__PURE__ */ createLocaleSection(uploadLocaleKeys, [ '点击上传', '点击或拖拽文件到此处', '删除文件' ]),
  steps: { label: '步骤条' },
  dateRange: /* @__PURE__ */ createLocaleSection(dateRangeLocaleKeys, [
    '开始日期',
    '结束日期',
    '至',
    '选择日期范围',
  ]),
};

/** en-US English */
export const enUS: ZuviLocale = {
  code: 'en-US',
  accessibility: /* @__PURE__ */ createLocaleSection(accessibilityLocaleKeys, [
    'Loading',
    'Remove tag',
    'Breadcrumb',
    'Color picker',
    'Color selection',
    'Saturation and brightness',
    'Saturation {s}%, brightness {v}%',
    'Hue',
    'Hex color',
    'Search results',
    'No matches',
    'Search cascader options',
    'Column {index}',
    'Increase',
    'Decrease',
    'Mention suggestions',
    'Image preview',
    'Close preview',
    'Back to top',
    'Slider',
    'Rating',
    '{index} stars',
    'Floating action',
    'Remove {item}',
    'QR code: {value}',
    'Anchor navigation',
    'Copy',
    'Copied',
    'Source list',
    'Target list',
    'Select all source items',
    'Select all target items',
    'Search source list',
    'Search target list',
  ]),
  form: /* @__PURE__ */ createLocaleSection(formLocaleKeys, [
    'This field is required',
    'Value must be at least {min}',
    'Value must be at most {max}',
    'Use at least {min} characters',
    'Use at most {max} characters',
    'Invalid format',
    'Validation failed',
  ]),
  result: /* @__PURE__ */ createLocaleSection(resultLocaleKeys, [
    'Success',
    'Operation failed',
    'Warning',
    'Information',
    '403',
    '404',
    '500',
  ]),

  select: /* @__PURE__ */ createLocaleSection(selectLocaleKeys, [ 'Select...', 'No options' ]),
  sideNav: /* @__PURE__ */ createLocaleSection(sideNavLocaleKeys, [
    'Navigation',
    'Collapse navigation',
    'Expand navigation',
    'Expand group {label}',
    'Collapse group {label}',
  ]),
  splitter: /* @__PURE__ */ createLocaleSection(splitterLocaleKeys, [
    'Panel {index}',
    'Resize panel',
    'Expand panel',
    'Collapse panel',
  ]),
  commandPalette: /* @__PURE__ */ createLocaleSection(commandPaletteLocaleKeys, [
    'Command palette',
    'Search commands',
    'Type a command…',
    'Loading commands',
    'No matching commands',
    '{count} commands found',
  ]),
  statistic: { countdown: 'Countdown' },
  chart: createChartLocale([
    'Data chart',
    'Loading chart…',
    'Unable to load the chart',
    'Retry',
    'No chart data',
    'All data series are hidden',
    'Show all series',
    'Chart legend',
    'View chart data',
    'Category',
    'Series',
    'Value',
    'X axis',
    'Y axis',
    'Percentage',
    'Arrows: browse; Home/End: first/last; Enter/Space: select; Esc: close tooltip.',
    'Invalid chart data',
    'Wheel/pinch/+/-: zoom; double-click/Esc: reset',
    'Drag to zoom a range',
    'Reset range',
    'Export CSV',
  ]),
  dataGrid: createDataGridLocale([
    'Data grid',
    'Loading data…',
    'Unable to load the data grid',
    'Retry',
    'No data',
    'Select all',
    'Select {label}',
    'Sort by {label}',
    'Resize {label} column',
    'Filter {label}',
    'No matching filter options',
  ]),
  globe: /* @__PURE__ */ createLocaleSection(globeLocaleKeys, [
    '3D globe visualization',
    'Loading globe…',
    'Start rotation',
    'Pause rotation',
    'Zoom in',
    'Zoom out',
    'Reset view',
    'Point list',
    'No points',
    'Use arrow keys to rotate, + / - to zoom, and Home to reset the view.',
    'Switched to a 2D globe; point data is still available',
    'Unable to load the globe',
    'Retry 3D',
    'Latitude',
    'Longitude',
    'Value',
    'Search points',
    'Search point names, categories or values…',
    'Clear search',
    '{count} points found',
    'No matching points',
    'Point categories',
    'Show all categories',
    'The selected point is hidden by the current filters',
    'Focus on {name}',
    'Connection list',
    'No connections',
    'Selected connection',
  ]),
  combobox: /* @__PURE__ */ createLocaleSection(comboboxLocaleKeys, [
    'Type or select...',
    'Clear selection',
    'Show options',
    'Hide options',
    'Loading',
    'No matching options',
    '{count} results',
  ]),
  input: /* @__PURE__ */ createLocaleSection(inputLocaleKeys, [
    'Clear',
    'Show password',
    'Hide password',
    'Search',
  ]),
  modal: { close: 'Close' },
  drawer: { close: 'Close' },
  message: { close: 'Close' },
  pagination: /* @__PURE__ */ createLocaleSection(paginationLocaleKeys, [
    'Previous',
    'Next',
    'Go to',
    'Pagination',
    'Go to page',
    '',
  ]),
  empty: { description: 'No data' },
  date: {
    today: 'Today',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    previousYear: 'Previous year',
    nextYear: 'Next year',
    monthFormat: '{year}-{month}',
    placeholder: 'Select date',
    inputLabel: 'Date',
    panelLabel: 'Select date',
    weekdayFormat: '{name}',
    weekdays: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  },
  transfer: /* @__PURE__ */ createLocaleSection(transferLocaleKeys, [
    'Search',
    'items',
    'Move to target',
    'Move to source',
  ]),
  timePicker: /* @__PURE__ */ createLocaleSection(timePickerLocaleKeys, [
    'OK',
    'Cancel',
    'Select time',
    'Hour',
    'Minute',
    'Second',
  ]),
  popconfirm: /* @__PURE__ */ createLocaleSection(popconfirmLocaleKeys, [ 'OK', 'Cancel' ]),
  app: { confirm: 'Confirm' },
  tour: /* @__PURE__ */ createLocaleSection(tourLocaleKeys, [ 'Previous', 'Next', 'Finish' ]),
  upload: /* @__PURE__ */ createLocaleSection(uploadLocaleKeys, [ 'Click to upload', 'Click or drag files here', 'Remove file' ]),
  steps: { label: 'Steps' },
  dateRange: /* @__PURE__ */ createLocaleSection(dateRangeLocaleKeys, [
    'Start date',
    'End date',
    'to',
    'Select date range',
  ]),
};

/** zh-TW 繁體中文 */
export const zhTW: ZuviLocale = {
  code: 'zh-TW',
  accessibility: /* @__PURE__ */ createLocaleSection(accessibilityLocaleKeys, [
    '載入中',
    '移除標籤',
    '麵包屑',
    '顏色選擇器',
    '顏色選擇面板',
    '飽和度與亮度',
    '飽和度 {s}%，亮度 {v}%',
    '色相',
    '十六進位顏色值',
    '搜尋結果',
    '暫無符合項目',
    '搜尋級聯選項',
    '第 {index} 欄',
    '增加',
    '減少',
    '提及建議',
    '圖片預覽',
    '關閉預覽',
    '返回頂部',
    '滑桿',
    '評分',
    '{index} 分',
    '懸浮操作',
    '移除 {item}',
    'QR 碼：{value}',
    '錨點導航',
    '複製',
    '已複製',
    '來源列表',
    '目標列表',
    '全選來源列表',
    '全選目標列表',
    '搜尋來源列表',
    '搜尋目標列表',
  ]),
  form: /* @__PURE__ */ createLocaleSection(formLocaleKeys, [
    '此項為必填',
    '數值不能小於 {min}',
    '數值不能大於 {max}',
    '長度不能少於 {min}',
    '長度不能超過 {max}',
    '格式不正確',
    '驗證未通過',
  ]),
  result: /* @__PURE__ */ createLocaleSection(resultLocaleKeys, [
    '操作成功',
    '操作失敗',
    '警告',
    '提示',
    '403',
    '404',
    '500',
  ]),

  select: /* @__PURE__ */ createLocaleSection(selectLocaleKeys, [ '請選擇', '暫無選項' ]),
  sideNav: /* @__PURE__ */ createLocaleSection(sideNavLocaleKeys, [
    '導覽',
    '收窄導覽',
    '展開導覽',
    '展開分組 {label}',
    '收起分組 {label}',
  ]),
  splitter: /* @__PURE__ */ createLocaleSection(splitterLocaleKeys, [
    '面板 {index}',
    '調整面板大小',
    '展開面板',
    '摺疊面板',
  ]),
  commandPalette: /* @__PURE__ */ createLocaleSection(commandPaletteLocaleKeys, [
    '命令面板',
    '搜尋命令',
    '搜尋命令…',
    '正在載入命令',
    '沒有符合的命令',
    '找到 {count} 個命令',
  ]),
  statistic: { countdown: '倒數計時' },
  chart: createChartLocale([
    '資料圖表',
    '載入中…',
    '載入失敗',
    '重試',
    '暫無資料',
    '系列已隱藏',
    '顯示全部',
    '圖例',
    '查看資料',
    '分類',
    '系列',
    '數值',
    'X 軸',
    'Y 軸',
    '占比',
    '方向鍵瀏覽；Home/End 首尾；Enter/Space 選取；Esc 關閉提示',
    '資料格式錯誤',
    '滾輪/雙指/+/- 縮放；雙擊/Esc 重置',
    '拖曳框選範圍',
    '重置範圍',
    '匯出 CSV',
  ]),
  dataGrid: createDataGridLocale([
    '資料網格',
    '正在載入資料…',
    '資料網格載入失敗',
    '重試',
    '暫無資料',
    '全選',
    '選擇 {label}',
    '依 {label} 排序',
    '調整 {label} 欄寬',
    '篩選 {label}',
    '沒有符合的篩選項目',
  ]),
  globe: /* @__PURE__ */ createLocaleSection(globeLocaleKeys, [
    '3D 地球視覺化',
    '正在載入地球…',
    '開始旋轉',
    '暫停旋轉',
    '放大',
    '縮小',
    '重設視角',
    '點位列表',
    '暫無點位',
    '使用方向鍵旋轉，+ / - 縮放，Home 重設視角。',
    '已切換為 2D 地球，仍可查看點位資料',
    '地球載入失敗',
    '重試 3D',
    '緯度',
    '經度',
    '數值',
    '搜尋點位',
    '搜尋點位名稱、分類或數值…',
    '清除搜尋',
    '找到 {count} 個點位',
    '沒有符合的點位',
    '點位分類',
    '顯示全部分類',
    '所選點位已被目前的篩選隱藏',
    '定位至 {name}',
    '連線列表',
    '暫無連線',
    '所選連線',
  ]),
  combobox: /* @__PURE__ */ createLocaleSection(comboboxLocaleKeys, [
    '請輸入或選擇',
    '清除選擇',
    '展開選項',
    '收起選項',
    '載入中',
    '暫無符合的選項',
    '找到 {count} 項',
  ]),
  input: /* @__PURE__ */ createLocaleSection(inputLocaleKeys, [ '清除', '顯示密碼', '隱藏密碼', '搜尋' ]),
  modal: { close: '關閉' },
  drawer: { close: '關閉' },
  message: { close: '關閉' },
  pagination: /* @__PURE__ */ createLocaleSection(paginationLocaleKeys, [
    '上一頁',
    '下一頁',
    '跳至',
    '分頁',
    '跳至頁碼',
    '頁',
  ]),
  empty: { description: '暫無資料' },
  date: {
    today: '今天',
    previousMonth: '上個月',
    nextMonth: '下個月',
    previousYear: '前一年',
    nextYear: '後一年',
    monthFormat: '{year}年{month}月',
    placeholder: '請選擇日期',
    inputLabel: '日期',
    panelLabel: '選擇日期',
    weekdayFormat: '星期{name}',
    weekdays: ['一', '二', '三', '四', '五', '六', '日'],
  },
  transfer: /* @__PURE__ */ createLocaleSection(transferLocaleKeys, [ '搜尋', '項', '移至目標列表', '移至來源列表' ]),
  timePicker: /* @__PURE__ */ createLocaleSection(timePickerLocaleKeys, [
    '確定',
    '取消',
    '請選擇時間',
    '時',
    '分',
    '秒',
  ]),
  popconfirm: /* @__PURE__ */ createLocaleSection(popconfirmLocaleKeys, [ '確定', '取消' ]),
  app: { confirm: '確認' },
  tour: /* @__PURE__ */ createLocaleSection(tourLocaleKeys, [ '上一步', '下一步', '完成' ]),
  upload: /* @__PURE__ */ createLocaleSection(uploadLocaleKeys, [ '點擊上傳', '點擊或拖曳檔案到此處', '刪除檔案' ]),
  steps: { label: '步驟條' },
  dateRange: /* @__PURE__ */ createLocaleSection(dateRangeLocaleKeys, [
    '開始日期',
    '結束日期',
    '至',
    '選擇日期範圍',
  ]),
};

/** ja-JP 日本語 */
export const jaJP: ZuviLocale = {
  code: 'ja-JP',
  accessibility: /* @__PURE__ */ createLocaleSection(accessibilityLocaleKeys, [
    '読み込み中',
    'タグを削除',
    'パンくずリスト',
    'カラーピッカー',
    '色の選択',
    '彩度と明度',
    '彩度 {s}%、明度 {v}%',
    '色相',
    '16進数カラー',
    '検索結果',
    '一致する項目なし',
    'カスケードを検索',
    '列 {index}',
    '増やす',
    '減らす',
    'メンション候補',
    '画像プレビュー',
    'プレビューを閉じる',
    '先頭に戻る',
    'スライダー',
    '評価',
    '{index} つ星',
    'フローティング操作',
    '{item} を削除',
    'QR コード：{value}',
    'アンカー',
    'コピー',
    'コピーしました',
    '元のリスト',
    '選択済みリスト',
    '元の項目をすべて選択',
    '選択済み項目をすべて選択',
    '元のリストを検索',
    '選択済みリストを検索',
  ]),
  form: /* @__PURE__ */ createLocaleSection(formLocaleKeys, [
    '必須項目です',
    '値は {min} 以上にしてください',
    '値は {max} 以下にしてください',
    '{min} 文字以上にしてください',
    '{max} 文字以下にしてください',
    '形式が正しくありません',
    '検証に失敗しました',
  ]),
  result: /* @__PURE__ */ createLocaleSection(resultLocaleKeys, [
    '完了',
    '操作に失敗しました',
    '警告',
    '情報',
    '403',
    '404',
    '500',
  ]),

  select: /* @__PURE__ */ createLocaleSection(selectLocaleKeys, [ '選択してください', 'データがありません' ]),
  sideNav: /* @__PURE__ */ createLocaleSection(sideNavLocaleKeys, [
    'ナビゲーション',
    'ナビゲーションを折りたたむ',
    'ナビゲーションを展開',
    'グループを展開 {label}',
    'グループを折りたたむ {label}',
  ]),
  splitter: /* @__PURE__ */ createLocaleSection(splitterLocaleKeys, [
    'パネル {index}',
    'ペインのサイズを変更',
    'ペインを展開',
    'ペインを折りたたむ',
  ]),
  commandPalette: /* @__PURE__ */ createLocaleSection(commandPaletteLocaleKeys, [
    'コマンドパレット',
    'コマンドを検索',
    'コマンドを検索…',
    'コマンドを読み込み中',
    '一致するコマンドがありません',
    '{count} 件のコマンド',
  ]),
  statistic: { countdown: 'カウントダウン' },
  chart: createChartLocale([
    'チャート',
    '読み込み中…',
    '読み込み失敗',
    '再試行',
    'データなし',
    '系列は非表示',
    'すべて表示',
    '凡例',
    'データを見る',
    '分類',
    '系列',
    '値',
    'X 軸',
    'Y 軸',
    '割合',
    '矢印: 移動; Home/End: 先頭/末尾; Enter/Space: 選択; Esc: ヒントを閉じる',
    'データ形式エラー',
    'ホイール/ピンチ/+/-: 拡大; ダブルクリック/Esc: 解除',
    'ドラッグで範囲拡大',
    '範囲解除',
    'CSV 出力',
  ]),
  dataGrid: createDataGridLocale([
    'データグリッド',
    'データを読み込み中…',
    'データグリッドの読み込みに失敗しました',
    '再試行',
    'データがありません',
    'すべて選択',
    '{label} を選択',
    '{label} を並べ替え',
    '{label} の列幅を変更',
    '{label} を絞り込み',
    '一致する絞り込み項目がありません',
  ]),
  globe: /* @__PURE__ */ createLocaleSection(globeLocaleKeys, [
    '3D 地球の可視化',
    '地球を読み込み中…',
    '回転を開始',
    '回転を一時停止',
    '拡大',
    '縮小',
    '視点をリセット',
    '地点一覧',
    '地点がありません',
    '矢印キーで回転、+ / - で拡大・縮小、Home で視点をリセットします。',
    '2D 地球に切り替えました。地点データは引き続き確認できます',
    '地球を読み込めませんでした',
    '3D を再試行',
    '緯度',
    '経度',
    '値',
    '地点を検索',
    '地点名、カテゴリ、値を検索…',
    '検索をクリア',
    '{count} 件の地点が見つかりました',
    '一致する地点がありません',
    '地点のカテゴリ',
    'すべてのカテゴリを表示',
    '選択した地点は現在のフィルターで非表示になっています',
    '{name} に移動',
    '接続一覧',
    '接続がありません',
    '選択した接続',
  ]),
  combobox: /* @__PURE__ */ createLocaleSection(comboboxLocaleKeys, [
    '入力または選択してください',
    '選択をクリア',
    '選択肢を表示',
    '選択肢を非表示',
    '読み込み中',
    '一致する選択肢がありません',
    '{count} 件の結果',
  ]),
  input: /* @__PURE__ */ createLocaleSection(inputLocaleKeys, [
    'クリア',
    'パスワードを表示',
    'パスワードを隠す',
    '検索',
  ]),
  modal: { close: '閉じる' },
  drawer: { close: '閉じる' },
  message: { close: '閉じる' },
  pagination: /* @__PURE__ */ createLocaleSection(paginationLocaleKeys, [
    '前へ',
    '次へ',
    '移動',
    'ページネーション',
    'ページ移動',
    'ページ',
  ]),
  empty: { description: 'データなし' },
  date: {
    today: '今日',
    previousMonth: '前月',
    nextMonth: '翌月',
    previousYear: '前年',
    nextYear: '翌年',
    monthFormat: '{year}年{month}月',
    placeholder: '日付を選択',
    inputLabel: '日付',
    panelLabel: '日付選択',
    weekdayFormat: '{name}曜日',
    weekdays: ['月', '火', '水', '木', '金', '土', '日'],
  },
  transfer: /* @__PURE__ */ createLocaleSection(transferLocaleKeys, [ '検索', '件', '右へ移動', '左へ移動' ]),
  timePicker: /* @__PURE__ */ createLocaleSection(timePickerLocaleKeys, [
    '決定',
    'キャンセル',
    '時間を選択',
    '時',
    '分',
    '秒',
  ]),
  popconfirm: /* @__PURE__ */ createLocaleSection(popconfirmLocaleKeys, [ '決定', 'キャンセル' ]),
  app: { confirm: '確認' },
  tour: /* @__PURE__ */ createLocaleSection(tourLocaleKeys, [ '前へ', '次へ', '完了' ]),
  upload: /* @__PURE__ */ createLocaleSection(uploadLocaleKeys, [
    'クリックしてアップロード',
    'クリックまたはファイルをドラッグ',
    'ファイルを削除',
  ]),
  steps: { label: 'ステップ' },
  dateRange: /* @__PURE__ */ createLocaleSection(dateRangeLocaleKeys, [
    '開始日',
    '終了日',
    '〜',
    '期間を選択',
  ]),
};

/** ko-KR 한국어 */
export const koKR: ZuviLocale = {
  code: 'ko-KR',
  accessibility: /* @__PURE__ */ createLocaleSection(accessibilityLocaleKeys, [
    '로딩 중',
    '태그 제거',
    '탐색 경로',
    '색상 선택기',
    '색상 선택 패널',
    '채도 및 밝기',
    '채도 {s}%, 밝기 {v}%',
    '색조',
    '16진수 색상',
    '검색 결과',
    '일치하는 항목 없음',
    '계층 옵션 검색',
    '열 {index}',
    '증가',
    '감소',
    '멘션 제안',
    '이미지 미리보기',
    '미리보기 닫기',
    '맨 위로',
    '슬라이더',
    '평점',
    '별 {index}개',
    '플로팅 작업',
    '{item} 제거',
    'QR 코드: {value}',
    '앵커 탐색',
    '복사',
    '복사됨',
    '원본 목록',
    '대상 목록',
    '원본 전체 선택',
    '대상 전체 선택',
    '원본 검색',
    '대상 검색',
  ]),
  form: /* @__PURE__ */ createLocaleSection(formLocaleKeys, [
    '필수 항목입니다',
    '값은 {min} 이상이어야 합니다',
    '값은 {max} 이하여야 합니다',
    '{min}자 이상 입력하세요',
    '{max}자 이하로 입력하세요',
    '잘못된 형식입니다',
    '검증 실패',
  ]),
  result: /* @__PURE__ */ createLocaleSection(resultLocaleKeys, [
    '성공',
    '작업 실패',
    '경고',
    '안내',
    '403',
    '404',
    '500',
  ]),

  select: /* @__PURE__ */ createLocaleSection(selectLocaleKeys, [ '선택하세요', '옵션 없음' ]),
  sideNav: /* @__PURE__ */ createLocaleSection(sideNavLocaleKeys, [
    '탐색',
    '탐색 축소',
    '탐색 펼치기',
    '그룹 펼치기 {label}',
    '그룹 접기 {label}',
  ]),
  splitter: /* @__PURE__ */ createLocaleSection(splitterLocaleKeys, [
    '패널 {index}',
    '패널 크기 조정',
    '패널 펼치기',
    '패널 접기',
  ]),
  commandPalette: /* @__PURE__ */ createLocaleSection(commandPaletteLocaleKeys, [
    '명령 팔레트',
    '명령 검색',
    '명령 검색…',
    '명령을 불러오는 중',
    '일치하는 명령이 없습니다',
    '명령 {count}개',
  ]),
  statistic: { countdown: '카운트다운' },
  chart: createChartLocale([
    '차트',
    '불러오는 중…',
    '불러오기 실패',
    '재시도',
    '데이터 없음',
    '계열 숨김',
    '전체 표시',
    '범례',
    '데이터 보기',
    '분류',
    '계열',
    '값',
    'X 축',
    'Y 축',
    '비율',
    '방향키: 탐색; Home/End: 처음/끝; Enter/Space: 선택; Esc: 설명 닫기',
    '잘못된 데이터',
    '휠/두 손가락/+/-: 확대; 두 번 클릭/Esc: 초기화',
    '드래그로 범위 확대',
    '범위 초기화',
    'CSV 내보내기',
  ]),
  dataGrid: createDataGridLocale([
    '데이터 그리드',
    '데이터를 불러오는 중…',
    '데이터 그리드를 불러오지 못했습니다',
    '재시도',
    '데이터가 없습니다',
    '모두 선택',
    '{label} 선택',
    '{label} 기준 정렬',
    '{label} 열 너비 조정',
    '{label} 필터링',
    '일치하는 필터 항목이 없습니다',
  ]),
  globe: /* @__PURE__ */ createLocaleSection(globeLocaleKeys, [
    '3D 지구 시각화',
    '지구를 불러오는 중…',
    '회전 시작',
    '회전 일시 정지',
    '확대',
    '축소',
    '시점 초기화',
    '지점 목록',
    '지점 없음',
    '방향키로 회전하고 + / -로 확대·축소하며 Home으로 시점을 초기화합니다.',
    '2D 지구로 전환했습니다. 지점 데이터는 계속 확인할 수 있습니다',
    '지구를 불러오지 못했습니다',
    '3D 다시 시도',
    '위도',
    '경도',
    '값',
    '지점 검색',
    '지점 이름, 분류 또는 값 검색…',
    '검색 지우기',
    '지점 {count}개를 찾았습니다',
    '일치하는 지점이 없습니다',
    '지점 분류',
    '모든 분류 표시',
    '선택한 지점이 현재 필터에 의해 숨겨져 있습니다',
    '{name}(으)로 이동',
    '연결 목록',
    '연결 없음',
    '선택한 연결',
  ]),
  combobox: /* @__PURE__ */ createLocaleSection(comboboxLocaleKeys, [
    '입력하거나 선택하세요',
    '선택 지우기',
    '옵션 표시',
    '옵션 숨기기',
    '불러오는 중',
    '일치하는 옵션 없음',
    '{count}개 결과',
  ]),
  input: /* @__PURE__ */ createLocaleSection(inputLocaleKeys, [
    '지우기',
    '비밀번호 표시',
    '비밀번호 숨기기',
    '검색',
  ]),
  modal: { close: '닫기' },
  drawer: { close: '닫기' },
  message: { close: '닫기' },
  pagination: /* @__PURE__ */ createLocaleSection(paginationLocaleKeys, [
    '이전',
    '다음',
    '이동',
    '페이지네이션',
    '페이지 이동',
    '페이지',
  ]),
  empty: { description: '데이터 없음' },
  date: {
    today: '오늘',
    previousMonth: '이전 달',
    nextMonth: '다음 달',
    previousYear: '이전 해',
    nextYear: '다음 해',
    monthFormat: '{year}년 {month}월',
    placeholder: '날짜 선택',
    inputLabel: '날짜',
    panelLabel: '날짜 선택',
    weekdayFormat: '{name}요일',
    weekdays: ['월', '화', '수', '목', '금', '토', '일'],
  },
  transfer: /* @__PURE__ */ createLocaleSection(transferLocaleKeys, [
    '검색',
    '개',
    '오른쪽으로 이동',
    '왼쪽으로 이동',
  ]),
  timePicker: /* @__PURE__ */ createLocaleSection(timePickerLocaleKeys, [
    '확인',
    '취소',
    '시간 선택',
    '시',
    '분',
    '초',
  ]),
  popconfirm: /* @__PURE__ */ createLocaleSection(popconfirmLocaleKeys, [ '확인', '취소' ]),
  app: { confirm: '확인' },
  tour: /* @__PURE__ */ createLocaleSection(tourLocaleKeys, [ '이전', '다음', '완료' ]),
  upload: /* @__PURE__ */ createLocaleSection(uploadLocaleKeys, [
    '클릭하여 업로드',
    '클릭 또는 파일을 끌어다 놓기',
    '파일 삭제',
  ]),
  steps: { label: '단계' },
  dateRange: /* @__PURE__ */ createLocaleSection(dateRangeLocaleKeys, [
    '시작 날짜',
    '종료 날짜',
    '부터',
    '기간 선택',
  ]),
};

/** fr-FR Français */
export const frFR: ZuviLocale = {
  code: 'fr-FR',
  accessibility: /* @__PURE__ */ createLocaleSection(accessibilityLocaleKeys, [
    'Chargement',
    'Supprimer le tag',
    "Fil d'Ariane",
    'Sélecteur de couleurs',
    'Sélection de couleur',
    'Saturation et luminosité',
    'Saturation {s} %, luminosité {v} %',
    'Teinte',
    'Couleur hexadécimale',
    'Résultats de recherche',
    'Aucun résultat',
    'Rechercher dans les options en cascade',
    'Colonne {index}',
    'Augmenter',
    'Diminuer',
    'Suggestions de mention',
    "Aperçu de l'image",
    "Fermer l'aperçu",
    'Retour en haut',
    'Curseur',
    'Note',
    '{index} étoiles',
    'Action flottante',
    'Supprimer {item}',
    'Code QR : {value}',
    'Navigation par ancres',
    'Copier',
    'Copié',
    'Liste source',
    'Liste cible',
    'Tout sélectionner dans la liste source',
    'Tout sélectionner dans la liste cible',
    'Rechercher dans la liste source',
    'Rechercher dans la liste cible',
  ]),
  form: /* @__PURE__ */ createLocaleSection(formLocaleKeys, [
    'Ce champ est obligatoire',
    'La valeur doit être au moins {min}',
    'La valeur doit être au plus {max}',
    'Utilisez au moins {min} caractères',
    'Utilisez au plus {max} caractères',
    'Format invalide',
    'Échec de la validation',
  ]),
  result: /* @__PURE__ */ createLocaleSection(resultLocaleKeys, [
    'Opération réussie',
    "Échec de l'opération",
    'Avertissement',
    'Information',
    '403',
    '404',
    '500',
  ]),

  select: /* @__PURE__ */ createLocaleSection(selectLocaleKeys, [ 'Sélectionner...', 'Aucune option' ]),
  sideNav: /* @__PURE__ */ createLocaleSection(sideNavLocaleKeys, [
    'Navigation',
    'Réduire la navigation',
    'Développer la navigation',
    'Développer le groupe {label}',
    'Réduire le groupe {label}',
  ]),
  splitter: /* @__PURE__ */ createLocaleSection(splitterLocaleKeys, [
    'Panneau {index}',
    'Redimensionner le panneau',
    'Développer le panneau',
    'Réduire le panneau',
  ]),
  commandPalette: /* @__PURE__ */ createLocaleSection(commandPaletteLocaleKeys, [
    'Palette de commandes',
    'Rechercher des commandes',
    'Rechercher une commande…',
    'Chargement des commandes',
    'Aucune commande correspondante',
    '{count} commandes trouvées',
  ]),
  statistic: { countdown: 'Compte à rebours' },
  chart: createChartLocale([
    'Graphique',
    'Chargement…',
    'Échec du chargement',
    'Réessayer',
    'Aucune donnée',
    'Séries masquées',
    'Tout afficher',
    'Légende',
    'Voir les données',
    'Catégorie',
    'Série',
    'Valeur',
    'Axe X',
    'Axe Y',
    'Part',
    'Flèches: parcourir; Home/End: début/fin; Enter/Space: sélectionner; Esc: fermer',
    'Données invalides',
    'Molette/pincement/+/-: zoom; double-clic/Esc: reset',
    'Glisser pour zoomer',
    'Réinitialiser',
    'Exporter CSV',
  ]),
  dataGrid: createDataGridLocale([
    'Grille de données',
    'Chargement des données…',
    'Impossible de charger la grille',
    'Réessayer',
    'Aucune donnée',
    'Tout sélectionner',
    'Sélectionner {label}',
    'Trier par {label}',
    'Redimensionner la colonne {label}',
    'Filtrer {label}',
    'Aucune option de filtre correspondante',
  ]),
  globe: /* @__PURE__ */ createLocaleSection(globeLocaleKeys, [
    'Visualisation du globe en 3D',
    'Chargement du globe…',
    'Démarrer la rotation',
    'Suspendre la rotation',
    'Zoom avant',
    'Zoom arrière',
    'Réinitialiser la vue',
    'Liste des points',
    'Aucun point',
    'Utilisez les flèches pour tourner, + / - pour zoomer et Home pour réinitialiser la vue.',
    'Passage au globe en 2D ; les données des points restent disponibles',
    'Impossible de charger le globe',
    'Réessayer la 3D',
    'Latitude',
    'Longitude',
    'Valeur',
    'Rechercher des points',
    'Rechercher des noms, catégories ou valeurs…',
    'Effacer la recherche',
    '{count} points trouvés',
    'Aucun point correspondant',
    'Catégories de points',
    'Afficher toutes les catégories',
    'Le point sélectionné est masqué par les filtres actuels',
    'Centrer sur {name}',
    'Liste des connexions',
    'Aucune connexion',
    'Connexion sélectionnée',
  ]),
  combobox: /* @__PURE__ */ createLocaleSection(comboboxLocaleKeys, [
    'Saisir ou sélectionner...',
    'Effacer la sélection',
    'Afficher les options',
    'Masquer les options',
    'Chargement',
    'Aucune option correspondante',
    '{count} résultats',
  ]),
  input: /* @__PURE__ */ createLocaleSection(inputLocaleKeys, [
    'Effacer',
    'Afficher le mot de passe',
    'Masquer le mot de passe',
    'Rechercher',
  ]),
  modal: { close: 'Fermer' },
  drawer: { close: 'Fermer' },
  message: { close: 'Fermer' },
  pagination: /* @__PURE__ */ createLocaleSection(paginationLocaleKeys, [
    'Précédent',
    'Suivant',
    'Aller à',
    'Pagination',
    'Aller à la page',
    '',
  ]),
  empty: { description: 'Aucune donnée' },
  date: {
    today: "Aujourd'hui",
    previousMonth: 'Mois précédent',
    nextMonth: 'Mois suivant',
    previousYear: 'Année précédente',
    nextYear: 'Année suivante',
    monthFormat: '{month}/{year}',
    placeholder: 'Sélectionner une date',
    inputLabel: 'Date',
    panelLabel: 'Sélectionner une date',
    weekdayFormat: '{name}',
    weekdays: ['lu', 'ma', 'me', 'je', 've', 'sa', 'di'],
  },
  transfer: /* @__PURE__ */ createLocaleSection(transferLocaleKeys, [
    'Rechercher',
    'éléments',
    'Déplacer vers la cible',
    'Déplacer vers la source',
  ]),
  timePicker: /* @__PURE__ */ createLocaleSection(timePickerLocaleKeys, [
    'OK',
    'Annuler',
    "Sélectionner l'heure",
    'Heure',
    'Minute',
    'Seconde',
  ]),
  popconfirm: /* @__PURE__ */ createLocaleSection(popconfirmLocaleKeys, [ 'OK', 'Annuler' ]),
  app: { confirm: 'Confirmer' },
  tour: /* @__PURE__ */ createLocaleSection(tourLocaleKeys, [ 'Précédent', 'Suivant', 'Terminer' ]),
  upload: /* @__PURE__ */ createLocaleSection(uploadLocaleKeys, [
    'Cliquez pour importer',
    'Cliquez ou déposez des fichiers ici',
    'Supprimer le fichier',
  ]),
  steps: { label: 'Étapes' },
  dateRange: /* @__PURE__ */ createLocaleSection(dateRangeLocaleKeys, [
    'Date de début',
    'Date de fin',
    'au',
    'Sélectionner une période',
  ]),
};

/** de-DE Deutsch */
export const deDE: ZuviLocale = {
  code: 'de-DE',
  accessibility: /* @__PURE__ */ createLocaleSection(accessibilityLocaleKeys, [
    'Wird geladen',
    'Tag entfernen',
    'Breadcrumb-Navigation',
    'Farbwähler',
    'Farbauswahl',
    'Sättigung und Helligkeit',
    'Sättigung {s} %, Helligkeit {v} %',
    'Farbton',
    'Hexadezimaler Farbwert',
    'Suchergebnisse',
    'Keine Treffer',
    'Kaskadenoptionen durchsuchen',
    'Spalte {index}',
    'Erhöhen',
    'Verringern',
    'Erwähnungsvorschläge',
    'Bildvorschau',
    'Vorschau schließen',
    'Nach oben',
    'Schieberegler',
    'Bewertung',
    '{index} Sterne',
    'Schwebende Aktion',
    '{item} entfernen',
    'QR-Code: {value}',
    'Anker-Navigation',
    'Kopieren',
    'Kopiert',
    'Quellliste',
    'Zielliste',
    'Alle Quellelemente auswählen',
    'Alle Zielelemente auswählen',
    'Quellliste durchsuchen',
    'Zielliste durchsuchen',
  ]),
  form: /* @__PURE__ */ createLocaleSection(formLocaleKeys, [
    'Dieses Feld ist erforderlich',
    'Der Wert muss mindestens {min} sein',
    'Der Wert darf höchstens {max} sein',
    'Verwenden Sie mindestens {min} Zeichen',
    'Verwenden Sie höchstens {max} Zeichen',
    'Ungültiges Format',
    'Validierung fehlgeschlagen',
  ]),
  result: /* @__PURE__ */ createLocaleSection(resultLocaleKeys, [
    'Erfolg',
    'Vorgang fehlgeschlagen',
    'Warnung',
    'Information',
    '403',
    '404',
    '500',
  ]),

  select: /* @__PURE__ */ createLocaleSection(selectLocaleKeys, [ 'Auswählen...', 'Keine Optionen' ]),
  sideNav: /* @__PURE__ */ createLocaleSection(sideNavLocaleKeys, [
    'Navigation',
    'Navigation einklappen',
    'Navigation ausklappen',
    'Gruppe aufklappen {label}',
    'Gruppe zuklappen {label}',
  ]),
  splitter: /* @__PURE__ */ createLocaleSection(splitterLocaleKeys, [
    'Bereich {index}',
    'Panelgröße ändern',
    'Panel ausklappen',
    'Panel einklappen',
  ]),
  commandPalette: /* @__PURE__ */ createLocaleSection(commandPaletteLocaleKeys, [
    'Befehlspalette',
    'Befehle suchen',
    'Befehl suchen…',
    'Befehle werden geladen',
    'Keine passenden Befehle',
    '{count} Befehle gefunden',
  ]),
  statistic: { countdown: 'Countdown' },
  chart: createChartLocale([
    'Diagramm',
    'Laden…',
    'Laden fehlgeschlagen',
    'Erneut versuchen',
    'Keine Daten',
    'Reihen ausgeblendet',
    'Alle anzeigen',
    'Legende',
    'Daten anzeigen',
    'Kategorie',
    'Reihe',
    'Wert',
    'X-Achse',
    'Y-Achse',
    'Anteil',
    'Pfeile: Daten; Home/End: Anfang/Ende; Enter/Space: Auswahl; Esc: Tooltip schließen',
    'Ungültige Daten',
    'Rad/Pinch/+/-: Zoom; Doppelklick/Esc: Reset',
    'Bereich ziehen',
    'Zurücksetzen',
    'CSV exportieren',
  ]),
  dataGrid: createDataGridLocale([
    'Datentabelle',
    'Daten werden geladen…',
    'Datentabelle konnte nicht geladen werden',
    'Wiederholen',
    'Keine Daten',
    'Alle auswählen',
    '{label} auswählen',
    'Nach {label} sortieren',
    'Spaltenbreite von {label} ändern',
    '{label} filtern',
    'Keine passenden Filteroptionen',
  ]),
  globe: /* @__PURE__ */ createLocaleSection(globeLocaleKeys, [
    '3D-Globusvisualisierung',
    'Globus wird geladen…',
    'Drehung starten',
    'Drehung pausieren',
    'Vergrößern',
    'Verkleinern',
    'Ansicht zurücksetzen',
    'Punkteliste',
    'Keine Punkte',
    'Mit den Pfeiltasten drehen, mit + / - zoomen und mit Home die Ansicht zurücksetzen.',
    'Zum 2D-Globus gewechselt; Punktdaten sind weiterhin verfügbar',
    'Globus konnte nicht geladen werden',
    '3D erneut versuchen',
    'Breitengrad',
    'Längengrad',
    'Wert',
    'Punkte suchen',
    'Punktnamen, Kategorien oder Werte suchen…',
    'Suche löschen',
    '{count} Punkte gefunden',
    'Keine passenden Punkte',
    'Punktkategorien',
    'Alle Kategorien anzeigen',
    'Der ausgewählte Punkt ist durch die aktuellen Filter ausgeblendet',
    'Auf {name} zentrieren',
    'Verbindungsliste',
    'Keine Verbindungen',
    'Ausgewählte Verbindung',
  ]),
  combobox: /* @__PURE__ */ createLocaleSection(comboboxLocaleKeys, [
    'Eingeben oder auswählen...',
    'Auswahl löschen',
    'Optionen anzeigen',
    'Optionen ausblenden',
    'Laden',
    'Keine passenden Optionen',
    '{count} Ergebnisse',
  ]),
  input: /* @__PURE__ */ createLocaleSection(inputLocaleKeys, [
    'Löschen',
    'Passwort anzeigen',
    'Passwort verbergen',
    'Suchen',
  ]),
  modal: { close: 'Schließen' },
  drawer: { close: 'Schließen' },
  message: { close: 'Schließen' },
  pagination: /* @__PURE__ */ createLocaleSection(paginationLocaleKeys, [
    'Zurück',
    'Weiter',
    'Gehe zu',
    'Paginierung',
    'Gehe zu Seite',
    '',
  ]),
  empty: { description: 'Keine Daten' },
  date: {
    today: 'Heute',
    previousMonth: 'Voriger Monat',
    nextMonth: 'Nächster Monat',
    previousYear: 'Voriges Jahr',
    nextYear: 'Nächstes Jahr',
    monthFormat: '{month}/{year}',
    placeholder: 'Datum auswählen',
    inputLabel: 'Datum',
    panelLabel: 'Datum auswählen',
    weekdayFormat: '{name}',
    weekdays: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
  },
  transfer: /* @__PURE__ */ createLocaleSection(transferLocaleKeys, [
    'Suchen',
    'Elemente',
    'Zur Zielliste verschieben',
    'Zur Quellliste verschieben',
  ]),
  timePicker: /* @__PURE__ */ createLocaleSection(timePickerLocaleKeys, [
    'OK',
    'Abbrechen',
    'Uhrzeit auswählen',
    'Stunde',
    'Minute',
    'Sekunde',
  ]),
  popconfirm: /* @__PURE__ */ createLocaleSection(popconfirmLocaleKeys, [ 'OK', 'Abbrechen' ]),
  app: { confirm: 'Bestätigen' },
  tour: /* @__PURE__ */ createLocaleSection(tourLocaleKeys, [ 'Zurück', 'Weiter', 'Fertigstellen' ]),
  upload: /* @__PURE__ */ createLocaleSection(uploadLocaleKeys, [
    'Zum Hochladen klicken',
    'Klicken oder Dateien hierher ziehen',
    'Datei entfernen',
  ]),
  steps: { label: 'Schritte' },
  dateRange: /* @__PURE__ */ createLocaleSection(dateRangeLocaleKeys, [
    'Startdatum',
    'Enddatum',
    'bis',
    'Zeitraum auswählen',
  ]),
};

/** es-ES Español */
export const esES: ZuviLocale = {
  code: 'es-ES',
  accessibility: /* @__PURE__ */ createLocaleSection(accessibilityLocaleKeys, [
    'Cargando',
    'Eliminar etiqueta',
    'Migas de pan',
    'Selector de color',
    'Selección de color',
    'Saturación y brillo',
    'Saturación {s} %, brillo {v} %',
    'Tono',
    'Color hexadecimal',
    'Resultados de búsqueda',
    'Sin coincidencias',
    'Buscar opciones en cascada',
    'Columna {index}',
    'Aumentar',
    'Disminuir',
    'Sugerencias de mención',
    'Vista previa de imagen',
    'Cerrar vista previa',
    'Volver arriba',
    'Deslizador',
    'Valoración',
    '{index} estrellas',
    'Acción flotante',
    'Eliminar {item}',
    'Código QR: {value}',
    'Navegación por anclas',
    'Copiar',
    'Copiado',
    'Lista de origen',
    'Lista de destino',
    'Seleccionar todos los elementos de origen',
    'Seleccionar todos los elementos de destino',
    'Buscar en la lista de origen',
    'Buscar en la lista de destino',
  ]),
  form: /* @__PURE__ */ createLocaleSection(formLocaleKeys, [
    'Este campo es obligatorio',
    'El valor debe ser al menos {min}',
    'El valor debe ser como máximo {max}',
    'Utilice al menos {min} caracteres',
    'Utilice como máximo {max} caracteres',
    'Formato no válido',
    'Error de validación',
  ]),
  result: /* @__PURE__ */ createLocaleSection(resultLocaleKeys, [
    'Éxito',
    'La operación ha fallado',
    'Advertencia',
    'Información',
    '403',
    '404',
    '500',
  ]),

  select: /* @__PURE__ */ createLocaleSection(selectLocaleKeys, [ 'Seleccionar...', 'Sin opciones' ]),
  sideNav: /* @__PURE__ */ createLocaleSection(sideNavLocaleKeys, [
    'Navegación',
    'Contraer navegación',
    'Expandir navegación',
    'Expandir grupo {label}',
    'Contraer grupo {label}',
  ]),
  splitter: /* @__PURE__ */ createLocaleSection(splitterLocaleKeys, [
    'Panel {index}',
    'Cambiar tamaño del panel',
    'Expandir panel',
    'Contraer panel',
  ]),
  commandPalette: /* @__PURE__ */ createLocaleSection(commandPaletteLocaleKeys, [
    'Paleta de comandos',
    'Buscar comandos',
    'Buscar comandos…',
    'Cargando comandos',
    'No hay comandos que coincidan',
    '{count} comandos encontrados',
  ]),
  statistic: { countdown: 'Cuenta regresiva' },
  chart: createChartLocale([
    'Gráfico',
    'Cargando…',
    'Error de carga',
    'Reintentar',
    'Sin datos',
    'Series ocultas',
    'Mostrar todo',
    'Leyenda',
    'Ver datos',
    'Categoría',
    'Serie',
    'Valor',
    'Eje X',
    'Eje Y',
    'Porcentaje',
    'Flechas: recorrer; Home/End: inicio/fin; Enter/Space: seleccionar; Esc: cerrar ayuda',
    'Datos no válidos',
    'Rueda/pinza/+/-: zoom; doble clic/Esc: reset',
    'Arrastrar para ampliar',
    'Restablecer',
    'Exportar CSV',
  ]),
  dataGrid: createDataGridLocale([
    'Cuadrícula de datos',
    'Cargando datos…',
    'No se pudo cargar la cuadrícula',
    'Reintentar',
    'Sin datos',
    'Seleccionar todo',
    'Seleccionar {label}',
    'Ordenar por {label}',
    'Cambiar ancho de {label}',
    'Filtrar {label}',
    'No hay opciones de filtro coincidentes',
  ]),
  globe: /* @__PURE__ */ createLocaleSection(globeLocaleKeys, [
    'Visualización del globo en 3D',
    'Cargando el globo…',
    'Iniciar rotación',
    'Pausar rotación',
    'Acercar',
    'Alejar',
    'Restablecer vista',
    'Lista de puntos',
    'Sin puntos',
    'Usa las flechas para girar, + / - para acercar o alejar y Home para restablecer la vista.',
    'Se ha cambiado al globo en 2D; los datos de los puntos siguen disponibles',
    'No se pudo cargar el globo',
    'Reintentar 3D',
    'Latitud',
    'Longitud',
    'Valor',
    'Buscar puntos',
    'Buscar nombres, categorías o valores…',
    'Borrar búsqueda',
    '{count} puntos encontrados',
    'No hay puntos coincidentes',
    'Categorías de puntos',
    'Mostrar todas las categorías',
    'El punto seleccionado está oculto por los filtros actuales',
    'Centrar en {name}',
    'Lista de conexiones',
    'Sin conexiones',
    'Conexión seleccionada',
  ]),
  combobox: /* @__PURE__ */ createLocaleSection(comboboxLocaleKeys, [
    'Escriba o seleccione...',
    'Borrar selección',
    'Mostrar opciones',
    'Ocultar opciones',
    'Cargando',
    'No hay opciones coincidentes',
    '{count} resultados',
  ]),
  input: /* @__PURE__ */ createLocaleSection(inputLocaleKeys, [
    'Borrar',
    'Mostrar contraseña',
    'Ocultar contraseña',
    'Buscar',
  ]),
  modal: { close: 'Cerrar' },
  drawer: { close: 'Cerrar' },
  message: { close: 'Cerrar' },
  pagination: /* @__PURE__ */ createLocaleSection(paginationLocaleKeys, [
    'Anterior',
    'Siguiente',
    'Ir a',
    'Paginación',
    'Ir a la página',
    '',
  ]),
  empty: { description: 'Sin datos' },
  date: {
    today: 'Hoy',
    previousMonth: 'Mes anterior',
    nextMonth: 'Mes siguiente',
    previousYear: 'Año anterior',
    nextYear: 'Año siguiente',
    monthFormat: '{month}/{year}',
    placeholder: 'Seleccionar fecha',
    inputLabel: 'Fecha',
    panelLabel: 'Seleccionar fecha',
    weekdayFormat: '{name}',
    weekdays: ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'],
  },
  transfer: /* @__PURE__ */ createLocaleSection(transferLocaleKeys, [
    'Buscar',
    'elementos',
    'Mover al destino',
    'Mover al origen',
  ]),
  timePicker: /* @__PURE__ */ createLocaleSection(timePickerLocaleKeys, [
    'Aceptar',
    'Cancelar',
    'Seleccionar hora',
    'Hora',
    'Minuto',
    'Segundo',
  ]),
  popconfirm: /* @__PURE__ */ createLocaleSection(popconfirmLocaleKeys, [ 'Aceptar', 'Cancelar' ]),
  app: { confirm: 'Confirmar' },
  tour: /* @__PURE__ */ createLocaleSection(tourLocaleKeys, [ 'Anterior', 'Siguiente', 'Finalizar' ]),
  upload: /* @__PURE__ */ createLocaleSection(uploadLocaleKeys, [
    'Haz clic para subir',
    'Haz clic o arrastra los archivos aquí',
    'Eliminar archivo',
  ]),
  steps: { label: 'Pasos' },
  dateRange: /* @__PURE__ */ createLocaleSection(dateRangeLocaleKeys, [
    'Fecha de inicio',
    'Fecha de fin',
    'a',
    'Seleccionar rango de fechas',
  ]),
};

/** ru-RU Русский */
export const ruRU: ZuviLocale = {
  code: 'ru-RU',
  accessibility: /* @__PURE__ */ createLocaleSection(accessibilityLocaleKeys, [
    'Загрузка',
    'Удалить тег',
    'Навигационная цепочка',
    'Выбор цвета',
    'Панель выбора цвета',
    'Насыщенность и яркость',
    'Насыщенность {s}%, яркость {v}%',
    'Тон',
    'Шестнадцатеричный цвет',
    'Результаты поиска',
    'Совпадений нет',
    'Поиск по каскадным опциям',
    'Столбец {index}',
    'Увеличить',
    'Уменьшить',
    'Подсказки упоминаний',
    'Просмотр изображения',
    'Закрыть просмотр',
    'Наверх',
    'Ползунок',
    'Оценка',
    '{index} звёзд',
    'Плавающее действие',
    'Удалить {item}',
    'QR-код: {value}',
    'Якорная навигация',
    'Копировать',
    'Скопировано',
    'Исходный список',
    'Целевой список',
    'Выбрать все элементы источника',
    'Выбрать все элементы цели',
    'Поиск в исходном списке',
    'Поиск в целевом списке',
  ]),
  form: /* @__PURE__ */ createLocaleSection(formLocaleKeys, [
    'Обязательное поле',
    'Значение должно быть не меньше {min}',
    'Значение должно быть не больше {max}',
    'Используйте не менее {min} символов',
    'Используйте не более {max} символов',
    'Неверный формат',
    'Ошибка проверки',
  ]),
  result: /* @__PURE__ */ createLocaleSection(resultLocaleKeys, [
    'Успешно',
    'Не удалось выполнить операцию',
    'Предупреждение',
    'Информация',
    '403',
    '404',
    '500',
  ]),

  select: /* @__PURE__ */ createLocaleSection(selectLocaleKeys, [ 'Выберите...', 'Нет вариантов' ]),
  sideNav: /* @__PURE__ */ createLocaleSection(sideNavLocaleKeys, [
    'Навигация',
    'Свернуть навигацию',
    'Развернуть навигацию',
    'Развернуть группу {label}',
    'Свернуть группу {label}',
  ]),
  splitter: /* @__PURE__ */ createLocaleSection(splitterLocaleKeys, [
    'Панель {index}',
    'Изменить размер панели',
    'Развернуть панель',
    'Свернуть панель',
  ]),
  commandPalette: /* @__PURE__ */ createLocaleSection(commandPaletteLocaleKeys, [
    'Палитра команд',
    'Поиск команд',
    'Поиск команды…',
    'Загрузка команд',
    'Нет подходящих команд',
    'Найдено команд: {count}',
  ]),
  statistic: { countdown: 'Обратный отсчёт' },
  chart: createChartLocale([
    'Диаграмма',
    'Загрузка…',
    'Ошибка загрузки',
    'Повторить',
    'Нет данных',
    'Ряды скрыты',
    'Показать все',
    'Легенда',
    'Данные',
    'Категория',
    'Ряд',
    'Значение',
    'Ось X',
    'Ось Y',
    'Доля',
    'Стрелки: данные; Home/End: начало/конец; Enter/Space: выбор; Esc: закрыть подсказку',
    'Неверные данные',
    'Колесо/жест/+/-: масштаб; двойной щелчок/Esc: сброс',
    'Выберите диапазон',
    'Сброс диапазона',
    'Экспорт CSV',
  ]),
  dataGrid: createDataGridLocale([
    'Таблица данных',
    'Загрузка данных…',
    'Не удалось загрузить таблицу',
    'Повторить',
    'Нет данных',
    'Выбрать все',
    'Выбрать {label}',
    'Сортировать по {label}',
    'Изменить ширину столбца {label}',
    'Фильтровать {label}',
    'Нет подходящих вариантов фильтра',
  ]),
  globe: /* @__PURE__ */ createLocaleSection(globeLocaleKeys, [
    '3D-визуализация глобуса',
    'Загрузка глобуса…',
    'Начать вращение',
    'Приостановить вращение',
    'Увеличить',
    'Уменьшить',
    'Сбросить вид',
    'Список точек',
    'Нет точек',
    'Вращайте стрелками, меняйте масштаб с помощью + / - и сбрасывайте вид клавишей Home.',
    'Включён 2D-глобус; данные точек по-прежнему доступны',
    'Не удалось загрузить глобус',
    'Повторить 3D',
    'Широта',
    'Долгота',
    'Значение',
    'Поиск точек',
    'Поиск по названиям, категориям или значениям…',
    'Очистить поиск',
    'Найдено точек: {count}',
    'Нет подходящих точек',
    'Категории точек',
    'Показать все категории',
    'Выбранная точка скрыта текущими фильтрами',
    'Перейти к {name}',
    'Список соединений',
    'Нет соединений',
    'Выбранное соединение',
  ]),
  combobox: /* @__PURE__ */ createLocaleSection(comboboxLocaleKeys, [
    'Введите или выберите...',
    'Очистить выбор',
    'Показать варианты',
    'Скрыть варианты',
    'Загрузка',
    'Нет подходящих вариантов',
    'Результатов: {count}',
  ]),
  input: /* @__PURE__ */ createLocaleSection(inputLocaleKeys, [
    'Очистить',
    'Показать пароль',
    'Скрыть пароль',
    'Найти',
  ]),
  modal: { close: 'Закрыть' },
  drawer: { close: 'Закрыть' },
  message: { close: 'Закрыть' },
  pagination: /* @__PURE__ */ createLocaleSection(paginationLocaleKeys, [
    'Назад',
    'Вперёд',
    'Перейти к',
    'Пагинация',
    'Перейти к странице',
    '',
  ]),
  empty: { description: 'Нет данных' },
  date: {
    today: 'Сегодня',
    previousMonth: 'Прошлый месяц',
    nextMonth: 'Следующий месяц',
    previousYear: 'Прошлый год',
    nextYear: 'Следующий год',
    monthFormat: '{month}/{year}',
    placeholder: 'Выберите дату',
    inputLabel: 'Дата',
    panelLabel: 'Выбор даты',
    weekdayFormat: '{name}',
    weekdays: ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'],
  },
  transfer: /* @__PURE__ */ createLocaleSection(transferLocaleKeys, [
    'Поиск',
    'элементов',
    'Переместить в целевой список',
    'Переместить в исходный список',
  ]),
  timePicker: /* @__PURE__ */ createLocaleSection(timePickerLocaleKeys, [
    'ОК',
    'Отмена',
    'Выберите время',
    'Часы',
    'Минуты',
    'Секунды',
  ]),
  popconfirm: /* @__PURE__ */ createLocaleSection(popconfirmLocaleKeys, [ 'ОК', 'Отмена' ]),
  app: { confirm: 'Подтвердить' },
  tour: /* @__PURE__ */ createLocaleSection(tourLocaleKeys, [ 'Назад', 'Далее', 'Завершить' ]),
  upload: /* @__PURE__ */ createLocaleSection(uploadLocaleKeys, [
    'Нажмите для загрузки',
    'Нажмите или перетащите файлы сюда',
    'Удалить файл',
  ]),
  steps: { label: 'Шаги' },
  dateRange: /* @__PURE__ */ createLocaleSection(dateRangeLocaleKeys, [
    'Дата начала',
    'Дата окончания',
    'по',
    'Выбор диапазона дат',
  ]),
};

/** pt-BR Português (Brasil) */
export const ptBR: ZuviLocale = {
  code: 'pt-BR',
  accessibility: /* @__PURE__ */ createLocaleSection(accessibilityLocaleKeys, [
    'Carregando',
    'Remover tag',
    'Trilha de navegação',
    'Seletor de cores',
    'Seleção de cor',
    'Saturação e brilho',
    'Saturação {s}%, brilho {v}%',
    'Matiz',
    'Cor hexadecimal',
    'Resultados da busca',
    'Nenhum resultado',
    'Pesquisar opções em cascata',
    'Coluna {index}',
    'Aumentar',
    'Diminuir',
    'Sugestões de menção',
    'Pré-visualização da imagem',
    'Fechar pré-visualização',
    'Voltar ao topo',
    'Controle deslizante',
    'Avaliação',
    '{index} estrelas',
    'Ação flutuante',
    'Remover {item}',
    'Código QR: {value}',
    'Navegação por âncoras',
    'Copiar',
    'Copiado',
    'Lista de origem',
    'Lista de destino',
    'Selecionar todos os itens de origem',
    'Selecionar todos os itens de destino',
    'Pesquisar na lista de origem',
    'Pesquisar na lista de destino',
  ]),
  form: /* @__PURE__ */ createLocaleSection(formLocaleKeys, [
    'Este campo é obrigatório',
    'O valor deve ser no mínimo {min}',
    'O valor deve ser no máximo {max}',
    'Use pelo menos {min} caracteres',
    'Use no máximo {max} caracteres',
    'Formato inválido',
    'Falha na validação',
  ]),
  result: /* @__PURE__ */ createLocaleSection(resultLocaleKeys, [
    'Sucesso',
    'Falha na operação',
    'Aviso',
    'Informação',
    '403',
    '404',
    '500',
  ]),

  select: /* @__PURE__ */ createLocaleSection(selectLocaleKeys, [ 'Selecione...', 'Sem opções' ]),
  sideNav: /* @__PURE__ */ createLocaleSection(sideNavLocaleKeys, [
    'Navegação',
    'Recolher navegação',
    'Expandir navegação',
    'Expandir grupo {label}',
    'Recolher grupo {label}',
  ]),
  splitter: /* @__PURE__ */ createLocaleSection(splitterLocaleKeys, [
    'Painel {index}',
    'Redimensionar painel',
    'Expandir painel',
    'Recolher painel',
  ]),
  commandPalette: /* @__PURE__ */ createLocaleSection(commandPaletteLocaleKeys, [
    'Paleta de comandos',
    'Pesquisar comandos',
    'Pesquisar comandos…',
    'Carregando comandos',
    'Nenhum comando correspondente',
    '{count} comandos encontrados',
  ]),
  statistic: { countdown: 'Contagem regressiva' },
  chart: createChartLocale([
    'Gráfico',
    'Carregando…',
    'Falha ao carregar',
    'Tentar novamente',
    'Sem dados',
    'Séries ocultas',
    'Mostrar todas',
    'Legenda',
    'Ver dados',
    'Categoria',
    'Série',
    'Valor',
    'Eixo X',
    'Eixo Y',
    'Porcentagem',
    'Setas: percorrer; Home/End: início/fim; Enter/Space: selecionar; Esc: fechar dica',
    'Dados inválidos',
    'Roda/pinça/+/-: zoom; duplo clique/Esc: reset',
    'Arraste para ampliar',
    'Redefinir',
    'Exportar CSV',
  ]),
  dataGrid: createDataGridLocale([
    'Grade de dados',
    'Carregando dados…',
    'Não foi possível carregar a grade',
    'Tentar novamente',
    'Sem dados',
    'Selecionar tudo',
    'Selecionar {label}',
    'Ordenar por {label}',
    'Redimensionar coluna {label}',
    'Filtrar {label}',
    'Nenhuma opção de filtro correspondente',
  ]),
  globe: /* @__PURE__ */ createLocaleSection(globeLocaleKeys, [
    'Visualização do globo em 3D',
    'Carregando o globo…',
    'Iniciar rotação',
    'Pausar rotação',
    'Ampliar',
    'Reduzir',
    'Redefinir visualização',
    'Lista de pontos',
    'Nenhum ponto',
    'Use as setas para girar, + / - para ampliar ou reduzir e Home para redefinir a visualização.',
    'Globo alterado para 2D; os dados dos pontos continuam disponíveis',
    'Não foi possível carregar o globo',
    'Tentar 3D novamente',
    'Latitude',
    'Longitude',
    'Valor',
    'Pesquisar pontos',
    'Pesquisar nomes, categorias ou valores…',
    'Limpar pesquisa',
    '{count} pontos encontrados',
    'Nenhum ponto correspondente',
    'Categorias de pontos',
    'Mostrar todas as categorias',
    'O ponto selecionado está oculto pelos filtros atuais',
    'Centralizar em {name}',
    'Lista de conexões',
    'Nenhuma conexão',
    'Conexão selecionada',
  ]),
  combobox: /* @__PURE__ */ createLocaleSection(comboboxLocaleKeys, [
    'Digite ou selecione...',
    'Limpar seleção',
    'Mostrar opções',
    'Ocultar opções',
    'Carregando',
    'Nenhuma opção correspondente',
    '{count} resultados',
  ]),
  input: /* @__PURE__ */ createLocaleSection(inputLocaleKeys, [
    'Limpar',
    'Mostrar senha',
    'Ocultar senha',
    'Pesquisar',
  ]),
  modal: { close: 'Fechar' },
  drawer: { close: 'Fechar' },
  message: { close: 'Fechar' },
  pagination: /* @__PURE__ */ createLocaleSection(paginationLocaleKeys, [
    'Anterior',
    'Próximo',
    'Ir para',
    'Paginação',
    'Ir para a página',
    '',
  ]),
  empty: { description: 'Sem dados' },
  date: {
    today: 'Hoje',
    previousMonth: 'Mês anterior',
    nextMonth: 'Próximo mês',
    previousYear: 'Ano anterior',
    nextYear: 'Próximo ano',
    monthFormat: '{month}/{year}',
    placeholder: 'Selecione a data',
    inputLabel: 'Data',
    panelLabel: 'Selecionar data',
    weekdayFormat: '{name}',
    weekdays: ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'],
  },
  transfer: /* @__PURE__ */ createLocaleSection(transferLocaleKeys, [
    'Pesquisar',
    'itens',
    'Mover para o destino',
    'Mover para a origem',
  ]),
  timePicker: /* @__PURE__ */ createLocaleSection(timePickerLocaleKeys, [
    'OK',
    'Cancelar',
    'Selecione o horário',
    'Hora',
    'Minuto',
    'Segundo',
  ]),
  popconfirm: /* @__PURE__ */ createLocaleSection(popconfirmLocaleKeys, [ 'OK', 'Cancelar' ]),
  app: { confirm: 'Confirmar' },
  tour: /* @__PURE__ */ createLocaleSection(tourLocaleKeys, [ 'Anterior', 'Próximo', 'Concluir' ]),
  upload: /* @__PURE__ */ createLocaleSection(uploadLocaleKeys, [
    'Clique para enviar',
    'Clique ou arraste arquivos aqui',
    'Remover arquivo',
  ]),
  steps: { label: 'Etapas' },
  dateRange: /* @__PURE__ */ createLocaleSection(dateRangeLocaleKeys, [
    'Data de início',
    'Data de término',
    'a',
    'Selecionar período de datas',
  ]),
};

/* --------------------------------- 深合并 --------------------------------- */

/**
 * 逐段深合并：override 中提供的段与 base 对应段合并，未提供的段沿用 base。
 * 不修改入参，返回新对象。
 */
export function mergeLocale(base: ZuviLocale, override?: DeepPartial<ZuviLocale>): ZuviLocale {
  if (!override) return base;
  return {
    code: override.code ?? base.code,
    accessibility: { ...base.accessibility, ...override.accessibility },
    form: { ...base.form, ...override.form },
    result: { ...base.result, ...override.result },
    select: { ...base.select, ...override.select },
    sideNav: { ...base.sideNav, ...override.sideNav },
    splitter: { ...base.splitter, ...override.splitter },
    commandPalette: { ...base.commandPalette, ...override.commandPalette },
    statistic: { ...base.statistic, ...override.statistic },
    chart: { ...base.chart, ...override.chart },
    globe: { ...base.globe, ...override.globe },
    dataGrid: { ...base.dataGrid, ...override.dataGrid },
    combobox: { ...base.combobox, ...override.combobox },
    input: { ...base.input, ...override.input },
    modal: { ...base.modal, ...override.modal },
    drawer: { ...base.drawer, ...override.drawer },
    message: { ...base.message, ...override.message },
    pagination: { ...base.pagination, ...override.pagination },
    empty: { ...base.empty, ...override.empty },
    date: {
      ...base.date,
      ...override.date,
      weekdays: override.date?.weekdays ? [...override.date.weekdays] : [...base.date.weekdays],
    },
    transfer: { ...base.transfer, ...override.transfer },
    timePicker: { ...base.timePicker, ...override.timePicker },
    popconfirm: { ...base.popconfirm, ...override.popconfirm },
    app: { ...base.app, ...override.app },
    tour: { ...base.tour, ...override.tour },
    upload: { ...base.upload, ...override.upload },
    steps: { ...base.steps, ...override.steps },
    dateRange: { ...base.dateRange, ...override.dateRange },
  };
}
