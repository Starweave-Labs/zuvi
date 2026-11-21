/**
 * zuvi_generate_code —— 组件名 + props → 可用 JSX 代码片段。
 */

import type { Catalog, CatalogEntry } from './search.js';
import { resolveEntry, suggestComponents } from './search.js';

/* --------------------------------- 类型 --------------------------------- */

export interface GenerateResult {
  ok: true;
  /** 解析后的规范组件名。 */
  name: string;
  /** 完整可用片段：import + Example 组件。 */
  code: string;
  /** 未在 meta.json 中登记的 props 提示（仅当 meta 存在时给出）。 */
  warnings: string[];
}

export interface GenerateError {
  ok: false;
  error: string;
  suggestions: string[];
}

/* ------------------------------ JSX 值格式化 ------------------------------ */

const SIMPLE_STRING = /^[^"'<>&{}\n]*$/;

/** 常见透传 props：meta 未登记也不告警。 */
const PASSTHROUGH_PROPS =
  /^(className|style|id|title|ref|key|children|dangerouslySetInnerHTML)$|^(aria|data)-/;

/** 把单个 prop 值格式化为 JSX 属性片段（含前导空格）；null/undefined 省略，false 保留。 */
export function formatAttribute(name: string, value: unknown): string {
  if (value === undefined || value === null) return '';
  if (value === false) return ` ${name}={false}`;
  if (value === true) return ` ${name}`;
  if (typeof value === 'number') return ` ${name}={${value}}`;
  if (typeof value === 'string') {
    // "{表达式}" 形式 → 原样输出为 JSX 表达式（如 "{() => alert('hi')}"）。
    if (value.length >= 2 && value.startsWith('{') && value.endsWith('}')) {
      return ` ${name}=${value}`;
    }
    if (SIMPLE_STRING.test(value)) return ` ${name}="${value}"`;
    return ` ${name}={${JSON.stringify(value)}}`;
  }
  // 对象/数组 → JSON 作为对象/数组字面量，如 style={{"color":"red"}}。
  return ` ${name}={${JSON.stringify(value)}}`;
}

function formatOpenTag(name: string, props: Record<string, unknown>): string {
  let tag = `<${name}`;
  for (const [key, value] of Object.entries(props)) {
    // Preserve caller Chart null literals, especially controlled selection/ranges.
    const jsxValue = name === 'Chart' && value === null ? '{null}' : value;
    tag += formatAttribute(key, jsxValue);
  }
  return `${tag}`;
}

/* -------------------------------- 生成 -------------------------------- */

/**
 * 生成可用 JSX 代码片段（import + 带示例的组件函数）。
 * 未知名组件返回 GenerateError（含相近建议）。
 */
export function generateCode(
  catalog: Catalog,
  component: string,
  props: Record<string, unknown> = {},
  children?: string
): GenerateResult | GenerateError {
  const entry = resolveEntry(catalog, component);
  if (!entry) {
    return {
      ok: false,
      error: `未找到组件 "${component}"。可用组件见 zuvi_search_components。`,
      suggestions: suggestComponents(catalog, component),
    };
  }

  const warnings: string[] = [];
  if (entry.sources.meta && entry.props) {
    for (const key of Object.keys(props)) {
      if (PASSTHROUGH_PROPS.test(key)) continue;
      if (!(key in entry.props)) {
        warnings.push(`props.${key} 不在 ${entry.name} 的 meta.json props 中，请确认拼写`);
      }
    }
  }

  const example = exampleFor(entry.name, props);
  const jsx = renderJsx(
    example.tag ?? entry.name,
    { ...example.props, ...props },
    children ?? example.children
  );
  const imports = example.imports ?? entry.name;
  const helper = example.helper ?? '';
  const parameters = example.parameters ?? '';
  const code = `import { ${imports} } from '@zuvi/react';\nimport '@zuvi/react/styles.css';\n\n${helper}export function ${entry.name}Example(${parameters}) {\n  return (\n    ${indent(jsx, 4)}\n  );\n}\n`;

  return { ok: true, name: entry.name, code, warnings };
}

/** 渲染 `<Name ...>children</Name>` 或 `<Name ... />`。 */
function renderJsx(name: string, props: Record<string, unknown>, children?: string): string {
  const open = formatOpenTag(name, props);
  if (children === undefined || children === '') return `${open} />`;
  if (children.includes('\n')) {
    const body = children
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n');
    return `${open}>\n${body}\n</${name}>`;
  }
  return `${open}>${children}</${name}>`;
}

function indent(text: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line === '' ? line : pad + line))
    .join('\n')
    .trimStart();
}

/* --------------------------- 用法示例（供 api 用） --------------------------- */

/** 解析 meta.json 中的默认值字面量：`'primary'` / `true` / `42`。 */
export function parseDefaultLiteral(raw: string): string | number | boolean | undefined {
  const s = raw.trim();
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (/^-?\d+(?:\.\d+)?$/.test(s)) return Number(s);
  const quoted = /^'([^']*)'$/.exec(s) ?? /^"([^"]*)"$/.exec(s);
  if (quoted) return quoted[1];
  return undefined;
}

/** 由 meta.json 的 props 默认值构造一段可运行的用法示例。 */
export function buildExampleCode(entry: CatalogEntry): string {
  const example = exampleFor(entry.name);
  return renderJsx(example.tag ?? entry.name, example.props ?? {}, example.children);
}

interface Example {
  tag?: string;
  props?: Record<string, unknown>;
  children?: string;
  imports?: string;
  helper?: string;
  parameters?: string;
}

/** Required props and compound children come from the public component API. */
function exampleFor(name: string, props: Record<string, unknown> = {}): Example {
  if (name === 'Chart') {
    const type = props.type ?? 'line';
    const common = {
      title: 'Synthetic sample chart',
      'aria-label': 'Synthetic sample chart',
    };
    // Pick only the compatible data family; caller literals still win at the merge.
    let dataProps: Record<string, unknown>;
    if (['pie', 'donut', 'treemap', 'funnel'].includes(type as string)) {
      dataProps = {
        type,
        data: [
          { id: 'sample-a', label: 'Sample A', value: 60 },
          { id: 'sample-b', label: 'Sample B', value: 40 },
        ],
      };
    } else if (type === 'gauge') {
      dataProps = { type, data: [{ id: 'sample-value', label: 'Sample value', value: 60 }] };
    } else if (type === 'heatmap') {
      dataProps = {
        type,
        data: [
          { id: 'sample-a', row: 'Row A', col: 'Jan', value: -4 },
          { id: 'sample-b', row: 'Row A', col: 'Feb', value: 0 },
          { id: 'sample-c', row: 'Row B', col: 'Jan', value: 12 },
        ],
      };
    } else if (type === 'waterfall') {
      dataProps = {
        type,
        data: [
          { id: 'sample-start', label: 'Start', value: 40 },
          { id: 'sample-cost', label: 'Cost', value: -12 },
          { id: 'sample-growth', label: 'Growth', value: 8 },
        ],
      };
    } else if (type === 'scatter') {
      dataProps = {
        type,
        series: [
          {
            id: 'sample-a',
            name: 'Sample A',
            points: [
              { id: 'a-1', x: -2.5, y: 8, ...(props.bubble === true ? { value: 4 } : {}) },
              { id: 'a-2', x: 0.75, y: 12, ...(props.bubble === true ? { value: 12 } : {}) },
              { id: 'a-3', x: 3, y: 15, ...(props.bubble === true ? { value: 20 } : {}) },
            ],
          },
          {
            id: 'sample-b',
            name: 'Sample B',
            points: [
              { id: 'b-1', x: -1, y: 6, ...(props.bubble === true ? { value: 8 } : {}) },
              { id: 'b-2', x: 2.25, y: 10, ...(props.bubble === true ? { value: 16 } : {}) },
            ],
          },
        ],
      };
    } else {
      dataProps = {
        type: ['area', 'bar', 'radar', 'sparkline'].includes(type as string) ? type : 'line',
        categories: type === 'radar' ? ['Quality', 'Speed', 'Coverage'] : ['Jan', 'Feb', 'Mar'],
        series: [
          { id: 'sample-a', name: 'Sample A', values: [12, 18, 15] },
          { id: 'sample-b', name: 'Sample B', values: [8, 12, 20] },
        ],
      };
    }
    return {
      helper:
        '// Synthetic sample data; not live metrics. Keep values numeric (null marks Cartesian gaps).\n' +
        '// 13 types / 17 forms: stack area/bar, horizontal bar, bubble scatter; new interactions are opt-in.\n' +
        '// Radar/slices are nonnegative; heatmap/waterfall are signed; gauge uses one value inside min/max.\n',
      props: { ...common, ...dataProps },
    };
  }
  const examples: Record<string, Example> = {
    Button: { children: 'Submit' },
    Input: { props: { placeholder: 'Enter text', 'aria-label': 'Name' } },
    Checkbox: { props: { label: 'Remember me' } },
    Radio: { props: { value: 'a', label: 'Option A' } },
    Switch: { props: { label: 'Enable notifications' } },
    Select: {
      props: { options: [{ value: 'a', label: 'Option A' }], 'aria-label': 'Choose option' },
    },
    Combobox: {
      props: { options: [{ value: 'a', label: 'Option A' }], 'aria-label': 'Search options' },
    },
    MultiCombobox: {
      props: {
        options: [{ value: 'a', label: 'Option A' }],
        'aria-label': 'Search multiple options',
      },
    },
    SideNav: {
      props: {
        sections: [
          { key: 'main', label: 'Main', items: [{ key: 'home', label: 'Home', href: '/home' }] },
        ],
        'aria-label': 'Main navigation',
      },
    },
    Splitter: {
      children:
        '<Splitter.Panel key="left" label="Left">Left</Splitter.Panel>\n<Splitter.Panel key="right" label="Right">Right</Splitter.Panel>',
      props: { 'aria-label': 'Resizable workspace' },
    },
    CommandPalette: {
      props: {
        commands: [{ key: 'home', label: 'Home', onSelect: () => {} }],
        'aria-label': 'Command palette',
      },
    },
    OfficeEditor: {
      imports: 'OfficeEditor, type OfficeEditorConfig',
      parameters:
        '{ documentServerUrl, config }: { documentServerUrl: string; config: OfficeEditorConfig }',
      helper:
        '// Supply your Docs server URL and the signed configuration returned by your backend.\n',
      props: {
        documentServerUrl: '{documentServerUrl}',
        config: '{config}',
        height: 760,
      },
    },
    OfficeStudio: {
      imports: 'OfficeStudio, createOfficeStudioDocument',
      helper: '// Connect onSave, onImport and onExport to your persistence and file codecs.\n',
      props: {
        defaultValue: "{createOfficeStudioDocument('word')}",
        height: 780,
      },
    },
    Modal: {
      children:
        '<Modal.Trigger>Open</Modal.Trigger>\n<Modal.Content><Modal.Title>Title</Modal.Title><Modal.Body>Content</Modal.Body><Modal.Close /></Modal.Content>',
    },
    Drawer: {
      children:
        '<Drawer.Trigger>Open</Drawer.Trigger>\n<Drawer.Content><Drawer.Title>Title</Drawer.Title><Drawer.Body>Content</Drawer.Body><Drawer.Close /></Drawer.Content>',
    },
    Tabs: {
      props: { defaultValue: 'a' },
      children:
        '<Tabs.List aria-label="Sections"><Tabs.Trigger value="a">Overview</Tabs.Trigger></Tabs.List>\n<Tabs.Panel value="a">Content</Tabs.Panel>',
    },
    Table: {
      children:
        '<Table.Head><Table.Row><Table.HeaderCell>Name</Table.HeaderCell></Table.Row></Table.Head>\n<Table.Body><Table.Row><Table.Cell>Alice</Table.Cell></Table.Row></Table.Body>',
    },
    Tooltip: { props: { content: 'Help' }, children: '<button type="button">Help</button>' },
    Popover: {
      children:
        '<Popover.Trigger>Open</Popover.Trigger>\n<Popover.Content aria-label="Details">Content</Popover.Content>',
    },
    DropdownMenu: {
      children:
        '<DropdownMenu.Trigger>Actions</DropdownMenu.Trigger>\n<DropdownMenu.Content><DropdownMenu.Item onSelect={() => {}}>Edit</DropdownMenu.Item></DropdownMenu.Content>',
    },
    Alert: { props: { title: 'Information' }, children: 'Details' },
    Badge: { props: { count: 3 }, children: '<span>Messages</span>' },
    Tag: { children: 'Active' },
    Pagination: { props: { total: 100 } },
    Breadcrumb: {
      children:
        '<Breadcrumb.Item href="/">Home</Breadcrumb.Item><Breadcrumb.Item>Current</Breadcrumb.Item>',
    },
    Avatar: { props: { alt: 'Alice' }, children: 'A' },
    Card: { props: { title: 'Title' }, children: 'Content' },
    Divider: {},
    Empty: {},
    Skeleton: {},
    Spin: {},
    Progress: { props: { percent: 60, 'aria-label': 'Task progress' } },
    Form: {
      imports: 'Form, Input, Button',
      children:
        '<Form.Item name="name" label="Name" required><Input /></Form.Item>\n<Button type="submit">Submit</Button>',
    },
    Slider: { props: { defaultValue: 30, 'aria-label': 'Volume' } },
    Rate: { props: { defaultValue: 3, 'aria-label': 'Rating' } },
    InputNumber: { props: { defaultValue: 1, 'aria-label': 'Quantity' } },
    ColorPicker: { props: { defaultValue: '#6366f1' } },
    DatePicker: {},
    Calendar: {},
    Descriptions: { children: '<Descriptions.Item label="Name">Alice</Descriptions.Item>' },
    Statistic: { props: { title: 'Visitors', value: 12345 } },
    Globe: {
      helper:
        '// Synthetic sample locations and connection; not live telemetry.\n' +
        '// Keep point values numeric for valueScale; format display values in renderTooltip.\n' +
        '// value selects a point without moving the camera; focus requests only the camera.\n',
      props: {
        'aria-label': 'Sample locations',
        points: [
          {
            id: 'sample-a',
            name: 'Sample A',
            latitude: 35,
            longitude: 105,
            category: 'sample-hub',
            value: 120,
          },
          {
            id: 'sample-b',
            name: 'Sample B',
            latitude: -15,
            longitude: -40,
            category: 'sample-region',
            value: 45,
          },
        ],
        arcs: [
          {
            id: 'sample-arc',
            from: 'sample-a',
            to: 'sample-b',
            name: 'Sample connection',
            value: 30,
          },
        ],
        categories: [
          { id: 'sample-hub', name: 'Sample hub', color: '#6366f1' },
          { id: 'sample-region', name: 'Sample region', color: '#06b6d4' },
        ],
        pointLabels: 'auto',
        searchable: true,
        valueScale: { domain: [0, 120], range: [0.012, 0.036] },
        transitionDuration: 700,
        showArcList: true,
      },
    },
    Timeline: { props: { items: [{ key: 'a', children: 'Created' }] } },
    DataGrid: {
      helper:
        '// Synthetic sample rows; not live telemetry.\n' +
        '// rowKey backs the selection registry; duplicate or missing keys are skipped with a warning.\n' +
        '// sort/selectedKeys are controlled or uncontrolled; rowHeight must stay fixed for virtualization.\n',
      props: {
        'aria-label': 'Sample orders',
        height: 320,
        rowHeight: 40,
        columns: [
          {
            key: 'name',
            dataIndex: 'name',
            header: 'Name',
            textValue: 'Name',
            sortable: true,
            width: 200,
          },
          {
            key: 'amount',
            dataIndex: 'amount',
            header: 'Amount',
            textValue: 'Amount',
            sortable: true,
            align: 'end',
            width: 120,
          },
        ],
        rows: [
          { id: 'row-1', name: 'Sample order A', amount: 120 },
          { id: 'row-2', name: 'Sample order B', amount: 45 },
          { id: 'row-3', name: 'Sample order C', amount: 78.5 },
        ],
      },
    },
    VirtualTable: {
      props: { height: 320, columns: [{ key: 'name', title: 'Name' }], data: [{ name: 'Alice' }] },
    },
    Tree: { props: { data: [{ key: 'a', title: 'Root' }] } },
    TreeSelect: { props: { data: [{ key: 'a', title: 'Option A' }] } },
    Collapse: { props: { items: [{ key: 'a', label: 'Title', children: 'Content' }] } },
    List: { props: { items: [{ key: 'a', title: 'Alice', description: 'Designer' }] } },
    Transfer: { props: { dataSource: [{ key: 'a', title: 'Option A' }] } },
    Cascader: { props: { options: [{ value: 'a', label: 'Option A' }] } },
    TimePicker: {},
    Mentions: { props: { options: [{ value: 'alice', label: 'Alice' }], 'aria-label': 'Message' } },
    Popconfirm: {
      props: { title: 'Continue?' },
      children: '<button type="button">Continue</button>',
    },
    Image: { props: { src: '/image.png', alt: 'Landscape' } },
    Tour: { props: { steps: [{ title: 'Welcome', target: '#tour-target' }] } },
    Segmented: { props: { options: [{ value: 'a', label: 'Overview' }] } },
    QRCode: { props: { value: 'https://example.com' } },
    Watermark: {
      props: { content: 'Confidential' },
      children: '<div style={{ height: 240 }}>Content</div>',
    },
    Affix: { children: '<button type="button">Pinned action</button>' },
    BackTop: {},
    FloatButton: { props: { 'aria-label': 'Help' } },
    Result: { props: { status: 'success' } },
    App: { children: '<div>Application content</div>' },
    Upload: {
      props: {
        customRequest: '{({ file, onSuccess }) => { setTimeout(() => onSuccess(), 600); }}',
      },
    },
    Steps: {
      props: {
        items: [{ title: 'Fill in information' }, { title: 'Confirm order' }, { title: 'Payment' }],
      },
    },
    DateRangePicker: {},
    Anchor: { children: '<Anchor.Link href="#intro" title="Introduction" />' },
    // Typography 根是纯命名空间（Title/Paragraph/Text），不能直接作 JSX 标签
    Typography: { tag: 'Typography.Text', props: { strong: true }, children: 'Content' },
  };
  if (name === 'Message' || name === 'Notification') {
    const hook = `use${name}`;
    const message = name === 'Message' ? "'Saved'" : "{ title: 'Saved' }";
    return {
      tag: `${name}Provider`,
      imports: `${name}Provider, ${hook}`,
      children: '<FeedbackAction />',
      helper: `function FeedbackAction() {\n  const api = ${hook}();\n  return <button type="button" onClick={() => api.success(${message})}>Show feedback</button>;\n}\n\n`,
    };
  }
  return examples[name] ?? {};
}
