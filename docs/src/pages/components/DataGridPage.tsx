import { useState } from 'react';
import ApiTable from '../../components/ApiTable';
import CodeBlock from '../../components/CodeBlock';
import Demo from '../../components/Demo';
import { usePageTitle } from '../../components/usePageTitle';
import { DataGrid, type DataGridColumn, type DataGridFilters, type DataGridSortState } from '@zuvi/react';

interface OrderRow {
  id: string;
  order: string;
  region: string;
  amount: number;
  status: 'paid' | 'pending';
}

/** 教学示例 · 非实时：确定性伪随机，保证每次加载一致。 */
function makeRows(count: number): OrderRow[] {
  const rows: OrderRow[] = [];
  let seed = 7;
  const next = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let index = 0; index < count; index += 1) {
    rows.push({
      id: `row-${index}`,
      order: `SO-${1000 + index}`,
      region: ['华东', '华北', '华南', '西南'][Math.floor(next() * 4)],
      amount: Math.floor(next() * 90000) / 10,
      status: next() > 0.4 ? 'paid' : 'pending',
    });
  }
  return rows;
}

const ORDERS = makeRows(10000);

const COLUMNS: readonly DataGridColumn<OrderRow>[] = [
  {
    key: 'order',
    dataIndex: 'order',
    header: '订单号',
    textValue: '订单号',
    sortable: true,
    width: 140,
    minWidth: 60,
    maxWidth: 400,
    sticky: true,
  },
  {
    key: 'region',
    dataIndex: 'region',
    header: '区域',
    textValue: '区域',
    sortable: true,
    filterable: true,
    filterValues: ['华东', '华北', '华南', '西南'],
    width: 110,
  },
  {
    key: 'amount',
    dataIndex: 'amount',
    header: '金额',
    textValue: '金额',
    sortable: true,
    align: 'end',
    width: 120,
    render: (row) => `¥${row.amount.toLocaleString('zh-CN')}`,
  },
  {
    key: 'status',
    dataIndex: 'status',
    header: '状态',
    textValue: '状态',
    width: 100,
    render: (row) => (row.status === 'paid' ? '已支付' : '待支付'),
  },
];

const BASIC_CODE = `const columns: DataGridColumn<Order>[] = [
  { key: 'order', dataIndex: 'order', header: '订单号', textValue: '订单号', sortable: true, width: 140 },
  { key: 'amount', dataIndex: 'amount', header: '金额', textValue: '金额', sortable: true, align: 'end',
    render: (row) => \`¥\${row.amount.toLocaleString('zh-CN')}\` },
];

<DataGrid columns={columns} rows={orders} height={320} rowHeight={40} />`;

const SORT_CODE = `const [sort, setSort] = useState<DataGridSortState | null>(null);

// 点击表头三态循环：asc → desc → 清除。
// 受控时组件不乐观更新，等待你的状态回写。
<DataGrid
  columns={columns}
  rows={orders}
  sort={sort}
  onSortChange={setSort}
  height={320}
/>`;

const SELECT_CODE = `const [selected, setSelected] = useState<string[]>([]);

// reason 区分单行勾选与全选切换；isRowSelectable 过滤不可选行。
<DataGrid
  columns={columns}
  rows={orders}
  selectedKeys={selected}
  onSelectedKeysChange={(keys, reason) => setSelected(keys)}
  isRowSelectable={(row) => row.status === 'paid'}
  height={320}
/>`;

const FILTER_CODE = `const [filters, setFilters] = useState<DataGridFilters | null>(null);

// region 列声明 filterable + filterValues 后，表头出现筛选 disclosure。
// 面板是原生 checkbox；Esc 关闭并把焦点还给触发钮；全不选回到未过滤。
// aria-rowcount 始终是过滤后的真实总行数；全选只覆盖过滤后的行。
<DataGrid
  columns={columns}
  rows={orders}
  filters={filters}
  onFiltersChange={setFilters}
  height={320}
/>`;

export default function DataGridPage(): React.ReactNode {
  usePageTitle('DataGrid 数据网格');
  const [sort, setSort] = useState<DataGridSortState | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [filters, setFilters] = useState<DataGridFilters | null>(null);
  const selectedCount = selected.length;

  return (
    <div className="doc-page">
      <h1 className="doc-h1">DataGrid 数据网格</h1>
      <p className="doc-lead">
        交互式虚拟化数据网格：10,000 行固定行高虚拟滚动、单列排序、枚举筛选、行选择与全选，完整
        role=&quot;grid&quot; 键盘模型与焦点恢复。列宽拖拽与固定列已随 v1.1 交付，枚举筛选与服务端模式接口已随
        v1.2 交付。
      </p>

      <h2 className="doc-h2">10,000 行虚拟滚动</h2>
      <Demo
        title="10,000 行虚拟滚动"
        description="仅渲染视口窗口行；行高固定 40px 是虚拟化的硬性要求。教学示例 · 非实时。"
        code={BASIC_CODE}
      >
        <DataGrid
          columns={COLUMNS}
          rows={ORDERS}
          height={320}
          rowHeight={40}
          aria-label="订单数据网格示例"
        />
      </Demo>

      <h2 className="doc-h2">排序、筛选与选择</h2>
      <Demo
        title="单列排序、枚举筛选与选择"
        description="受控 sort 三态循环（asc → desc → 清除）；region 列筛选为表头 disclosure 面板，过滤后 aria-rowcount 同步收缩；选择 reason 区分单行与全选，isRowSelectable 过滤后全选只覆盖可选行。"
        code={SORT_CODE}
        stack
      >
        <DataGrid
          columns={COLUMNS}
          rows={ORDERS.slice(0, 200)}
          height={260}
          rowHeight={40}
          sort={sort}
          onSortChange={setSort}
          filters={filters}
          onFiltersChange={setFilters}
          selectedKeys={selected}
          onSelectedKeysChange={(keys) => setSelected(keys)}
          isRowSelectable={(row) => row.status === 'paid'}
          aria-label="排序与选择示例网格"
        />
        <p className="doc-note" role="status">
          已选 {selectedCount} 行；当前排序{' '}
          {sort ? `${sort.key} ${sort.dir === 'asc' ? '升序' : '降序'}` : '未排序'}；筛选{' '}
          {filters && Object.keys(filters).length > 0
            ? Object.entries(filters)
                .map(([key, values]) => `${key}∈{${values.join('/')}}`)
                .join(' 且 ')
            : '未启用'}
          。
        </p>
        <CodeBlock code={FILTER_CODE} language="tsx" />
        <CodeBlock code={SELECT_CODE} language="tsx" />
      </Demo>

      <h2 className="doc-h2">键盘模型</h2>
      <p className="doc-lead">
        Tab 进入网格后：<code>方向键</code> 在单元格间移动（跨行保持列），<code>Home / End</code>
        到行首尾，<code>Ctrl+Home / Ctrl+End</code> 虚拟跳转到首末单元格并同步滚动，
        <code>PageUp / PageDown</code> 按可见行数翻页，<code>Space</code>{' '}
        勾选当前行。筛选面板内是原生控件，<code>Esc</code> 关闭面板并把焦点还给表头触发钮。输入法组合期间不拦截确认键。
      </p>

      <h2 className="doc-h2">与 Table / VirtualTable 的关系</h2>
      <p className="doc-lead">
        小型静态语义表格用 <a href="#/components/table">Table</a>；只读的万行级滚动用{' '}
        <a href="#/components/virtual-table">VirtualTable</a>；需要排序、选择等交互的大数据网格用
        DataGrid。 DataGrid 的排序词表是 <code>dir: 'asc' | 'desc'</code>，与 Table 的{' '}
        <code>ascend / descend</code> 相互独立。
      </p>

      <ApiTable
        rows={[
          {
            name: 'columns',
            type: 'readonly DataGridColumn<T>[]',
            description:
              '列定义；key 唯一，dataIndex 供排序与默认单元格文本，width 钳制到 [minWidth, maxWidth]（默认 120/60）',
          },
          {
            name: 'rows',
            type: 'readonly T[]',
            description: '源数据行；排序不修改原数组，nullish 值始终排末尾',
          },
          {
            name: 'rowKey',
            type: 'keyof T | ((row, index) => string)',
            defaultValue: "'id'",
            description: '行身份；重复或缺失的行保留渲染但跳过选择注册并告警',
          },
          {
            name: 'height',
            type: 'number',
            defaultValue: '320',
            description: '正文视口高度（px）',
          },
          {
            name: 'rowHeight',
            type: 'number',
            defaultValue: '40',
            description: '固定行高（px），虚拟化硬性要求',
          },
          {
            name: 'overscan',
            type: 'number',
            defaultValue: '6',
            description: '视口上下额外渲染行数',
          },
          {
            name: 'sort / defaultSort / onSortChange',
            type: 'DataGridSortState | null',
            description: "受控排序 { key, dir: 'asc' | 'desc' }；无效列忽略并告警",
          },
          {
            name: 'selectedKeys / defaultSelectedKeys / onSelectedKeysChange',
            type: 'readonly string[] 等',
            description: "受控选中集合；回调携带 reason: 'row' | 'all'",
          },
          {
            name: 'isRowSelectable',
            type: '(row: T) => boolean',
            description: '行级可选过滤；不可选行不渲染复选框且不参与全选',
          },
          {
            name: 'filters / defaultFilters / onFiltersChange',
            type: 'DataGridFilters | null',
            description:
              '受控枚举筛选（columnKey → 选中值）；空选择=无约束，全部清空回调 null；过滤后 aria-rowcount 与全选范围随之收缩，过滤到 0 行显示筛选空态文案',
          },
          {
            name: 'loading',
            type: 'boolean',
            defaultValue: 'false',
            description:
              '加载态（服务端模式）：正文显示 loadingContent，排序与筛选保持可用，选择输入禁用',
          },
          {
            name: 'emptyContent / loadingContent',
            type: 'React.ReactNode',
            description: '空态 / 加载态正文自定义',
          },
          {
            name: 'labels',
            type: 'Partial<DataGridLabels>',
            description: '局部覆盖 11 个文案，默认取 ConfigProvider locale.dataGrid',
          },
          {
            name: 'onReady / onStatusChange / onError',
            type: '回调',
            description: "状态回调；onError 报告 code: 'load' 的实现模块加载失败",
          },
          {
            name: 'classNames',
            type: 'Partial<Record<DataGridPart, string>>',
            description: 'slot 级类名追加',
          },
        ]}
      />
    </div>
  );
}
