import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigProvider } from '../../config';
import { DataGrid } from './DataGrid';
import type { DataGridColumn, DataGridProps } from './data-grid-types';

interface Row {
  id: string;
  name: string;
  amount: number | null;
}

const rows: Row[] = [
  { id: 'a', name: '工单甲', amount: 3 },
  { id: 'b', name: '工单乙', amount: 1 },
  { id: 'c', name: '工单丙', amount: 2 },
];

const columns: readonly DataGridColumn<Row>[] = [
  { key: 'name', dataIndex: 'name', header: '名称', textValue: '名称', sortable: true },
  { key: 'amount', dataIndex: 'amount', header: '金额', textValue: '金额', sortable: true },
];

const baseProps: DataGridProps<Row> = { columns, rows, height: 200, rowHeight: 40, overscan: 0 };

let frames: Map<number, FrameRequestCallback>;
let nextId: number;

function grid(container: HTMLElement) {
  return container.querySelector<HTMLDivElement>('[role="grid"]')!;
}
function viewport(container: HTMLElement) {
  return container.querySelector<HTMLDivElement>('[data-part="viewport"]')!;
}
function row(container: HTMLElement, rowIndex: number) {
  return container.querySelector<HTMLElement>(`[role="row"][aria-rowindex="${rowIndex}"]`)!;
}
function firstCellText(container: HTMLElement, rowIndex: number) {
  return row(container, rowIndex)!.querySelector<HTMLElement>('[aria-colindex="2"]')!.textContent;
}
function rowCheckbox(container: HTMLElement, rowIndex: number) {
  return row(container, rowIndex)!.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
}
function selectAll(container: HTMLElement) {
  return container.querySelector<HTMLInputElement>('[data-part="select-all"]')!;
}
async function ready(container: HTMLElement) {
  await waitFor(() => expect(container.querySelector('[role="grid"]')).toBeInTheDocument(), {
    timeout: 3000,
  });
}
async function flushFrame() {
  await act(async () => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(16));
  });
}

beforeEach(() => {
  frames = new Map();
  nextId = 0;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++nextId, callback);
    return nextId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('DataGrid', () => {
  it('keeps SSR stable with the loading shell before the lazy grid mounts', () => {
    const markup = renderToString(<DataGrid {...baseProps} aria-label="订单网格" />);
    expect(markup).toContain('data-status="loading"');
    expect(markup).toContain('订单网格');
    expect(markup).not.toContain('role="grid"');
  });

  it('renders the real grid with virtual windows, original row indexes and cell text', async () => {
    const { container } = render(<DataGrid {...baseProps} />);
    await ready(container);
    expect(grid(container)).toHaveAttribute('aria-rowcount', '3');
    expect(container.querySelectorAll('[role="row"][aria-rowindex]')).toHaveLength(3);
    expect(firstCellText(container, 1)).toBe('工单甲');
    expect(row(container, 3)).toHaveAttribute('data-part', 'row');
    expect(container.querySelector('[data-part="header-row"]')).toHaveTextContent('名称');
    expect(container.querySelectorAll('[role="gridcell"]').length).toBe(9);
  });

  it('cycles sort asc → desc → clear through the real rows and aria-sort', async () => {
    const { container } = render(<DataGrid {...baseProps} />);
    await ready(container);
    const headerButton = container.querySelector<HTMLButtonElement>(
      '[aria-colindex="3"] [data-part="sort"]'
    )!;
    fireEvent.click(headerButton);
    expect(firstCellText(container, 1)).toBe('工单乙');
    expect(container.querySelector('[aria-colindex="3"]')).toHaveAttribute(
      'aria-sort',
      'ascending'
    );
    expect(container.querySelector('[aria-colindex="2"]')).not.toHaveAttribute('aria-sort');
    fireEvent.click(headerButton);
    expect(firstCellText(container, 1)).toBe('工单甲');
    expect(container.querySelector('[aria-colindex="3"]')).toHaveAttribute(
      'aria-sort',
      'descending'
    );
    fireEvent.click(headerButton);
    expect(firstCellText(container, 1)).toBe('工单甲');
    expect(container.querySelector('[aria-colindex="3"]')).not.toHaveAttribute('aria-sort');
  });

  it('keeps controlled sort free of optimistic updates while reporting requests', async () => {
    const onSortChange = vi.fn();
    const { container } = render(
      <DataGrid {...baseProps} sort={null} onSortChange={onSortChange} />
    );
    await ready(container);
    fireEvent.click(container.querySelector('[aria-colindex="3"] [data-part="sort"]')!);
    expect(onSortChange).toHaveBeenCalledWith({ key: 'amount', dir: 'asc' });
    expect(firstCellText(container, 1)).toBe('工单甲');
    expect(container.querySelector('[aria-colindex="3"]')).not.toHaveAttribute('aria-sort');
  });

  it('toggles rows and select-all with reasons, mixed state and aria-selected', async () => {
    const onSelectedKeysChange = vi.fn();
    const { container } = render(
      <DataGrid {...baseProps} onSelectedKeysChange={onSelectedKeysChange} />
    );
    await ready(container);
    fireEvent.click(rowCheckbox(container, 2));
    expect(onSelectedKeysChange).toHaveBeenLastCalledWith(['b'], 'row');
    expect(row(container, 2)).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(rowCheckbox(container, 1));
    expect(onSelectedKeysChange).toHaveBeenLastCalledWith(['b', 'a'], 'row');
    expect(selectAll(container)).toHaveAttribute('aria-checked', 'mixed');
    expect(selectAll(container).indeterminate).toBe(true);
    fireEvent.click(selectAll(container));
    expect(onSelectedKeysChange).toHaveBeenLastCalledWith(['a', 'b', 'c'], 'all');
    expect(selectAll(container)).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(selectAll(container));
    expect(onSelectedKeysChange).toHaveBeenLastCalledWith([], 'all');
    expect(row(container, 1)).not.toHaveAttribute('aria-selected');
  });

  it('resizes columns by keyboard across the full contract; coordinate-less moves never emit', async () => {
    const onColumnWidthsChange = vi.fn();
    const { container } = render(
      <DataGrid
        {...baseProps}
        columns={[
          {
            key: 'name',
            dataIndex: 'name',
            header: '名称',
            textValue: '名称',
            sortable: true,
            width: 120,
            minWidth: 80,
            maxWidth: 300,
          },
          {
            key: 'amount',
            dataIndex: 'amount',
            header: '金额',
            textValue: '金额',
            sortable: true,
            align: 'end',
            width: 100,
          },
        ]}
        onColumnWidthsChange={onColumnWidthsChange}
      />
    );
    await ready(container);
    const handle = container.querySelector<HTMLDivElement>('[data-part="resize-handle"]')!;
    expect(handle).toHaveAttribute('role', 'separator');
    expect(handle).toHaveAttribute('aria-valuenow', '120');
    expect(handle).toHaveAttribute('aria-label', '调整 名称 列宽');

    // Pointer drag is verified with real coordinates in the browser e2e; jsdom
    // omits clientX, and a coordinate-less move must never emit a width.
    fireEvent.pointerDown(handle, { button: 0, pointerId: 1 });
    fireEvent.pointerMove(handle, { pointerId: 1 });
    expect(onColumnWidthsChange).not.toHaveBeenCalled();
    fireEvent.pointerUp(handle, { pointerId: 1 });
    expect(document.documentElement.dataset.zDatagridResizing).toBeUndefined();

    // Keyboard: ±16 steps and min/max clamp.
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(onColumnWidthsChange).toHaveBeenLastCalledWith(expect.objectContaining({ name: 136 }));
    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    expect(onColumnWidthsChange).toHaveBeenLastCalledWith(expect.objectContaining({ name: 120 }));
    fireEvent.keyDown(handle, { key: 'Home' });
    expect(onColumnWidthsChange).toHaveBeenLastCalledWith(expect.objectContaining({ name: 80 }));
    fireEvent.keyDown(handle, { key: 'End' });
    expect(onColumnWidthsChange).toHaveBeenLastCalledWith(expect.objectContaining({ name: 300 }));
    expect(handle).toHaveAttribute('aria-valuenow', '300');

    // Controlled widths never adopt the request locally.
    const controlled = render(
      <DataGrid
        {...baseProps}
        columnWidths={{ name: 120 }}
        onColumnWidthsChange={onColumnWidthsChange}
      />
    );
    await ready(controlled.container);
    const controlledHandle = controlled.container.querySelector('[data-part="resize-handle"]')!;
    fireEvent.keyDown(controlledHandle, { key: 'ArrowRight' });
    expect(onColumnWidthsChange).toHaveBeenLastCalledWith(expect.objectContaining({ name: 136 }));
    expect(controlledHandle).toHaveAttribute('aria-valuenow', '120');
  });

  it('renders sticky columns with cumulative offsets in header and body rows', async () => {
    const { container } = render(
      <DataGrid
        {...baseProps}
        columns={[
          {
            key: 'name',
            dataIndex: 'name',
            header: '名称',
            textValue: '名称',
            sticky: true,
            width: 120,
          },
          { key: 'amount', dataIndex: 'amount', header: '金额', textValue: '金额', width: 100 },
        ]}
      />
    );
    await ready(container);
    const headerCell = container.querySelector('[role="columnheader"][data-sticky]')!;
    expect(headerCell).toHaveStyle({ left: '44px' });
    const bodyCell = container.querySelector('[role="gridcell"][data-sticky]')!;
    expect(bodyCell).toHaveStyle({ left: '44px' });
    expect(container.querySelectorAll('[role="columnheader"][data-sticky]')).toHaveLength(1);
    expect(container.querySelectorAll('[role="gridcell"][data-sticky]').length).toBeGreaterThan(0);
  });

  it('warns and caps when more than two sticky columns are declared', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(
      <DataGrid
        {...baseProps}
        columns={[
          { key: 'a', dataIndex: 'id', header: 'A', sticky: true, width: 60 },
          { key: 'b', dataIndex: 'name', header: 'B', sticky: true, width: 60 },
          { key: 'c', dataIndex: 'amount', header: 'C', sticky: true, width: 60 },
        ]}
      />
    );
    await ready(container);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('仅前两列'));
    expect(container.querySelectorAll('[role="columnheader"][data-sticky]')).toHaveLength(2);
    warn.mockRestore();
  });

  it('keeps controlled column widths free of optimistic updates', async () => {
    const onColumnWidthsChange = vi.fn();
    const { container } = render(
      <DataGrid {...baseProps} columnWidths={{}} onColumnWidthsChange={onColumnWidthsChange} />
    );
    await ready(container);
    const handle = container.querySelector<HTMLDivElement>('[data-part="resize-handle"]')!;
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(onColumnWidthsChange).toHaveBeenCalledWith(expect.objectContaining({ name: 136 }));
    expect(handle).toHaveAttribute('aria-valuenow', '120');
  });

  it('keeps controlled selection free of optimistic updates', async () => {
    const onSelectedKeysChange = vi.fn();
    const { container } = render(
      <DataGrid {...baseProps} selectedKeys={[]} onSelectedKeysChange={onSelectedKeysChange} />
    );
    await ready(container);
    fireEvent.click(rowCheckbox(container, 1));
    expect(onSelectedKeysChange).toHaveBeenCalledWith(['a'], 'row');
    expect(rowCheckbox(container, 1).checked).toBe(false);
    expect(row(container, 1)).not.toHaveAttribute('aria-selected');
  });

  it('filters unselectable rows out of checkboxes and select-all', async () => {
    const onSelectedKeysChange = vi.fn();
    const { container } = render(
      <DataGrid
        {...baseProps}
        isRowSelectable={(row) => (row.amount ?? 0) > 1}
        onSelectedKeysChange={onSelectedKeysChange}
      />
    );
    await ready(container);
    expect(rowCheckbox(container, 2)).toBeNull();
    fireEvent.click(selectAll(container));
    expect(onSelectedKeysChange).toHaveBeenLastCalledWith(['a', 'c'], 'all');
    expect(selectAll(container)).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(rowCheckbox(container, 1));
    expect(selectAll(container)).toHaveAttribute('aria-checked', 'mixed');
  });

  it('warns and skips selection for duplicate or missing rowKey rows', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const broken = [
      ...rows,
      { id: 'a', name: '重复行', amount: 9 },
      { name: '无身份', amount: 0 } as Row,
    ];
    const { container } = render(
      <DataGrid columns={columns} rows={broken} height={400} rowHeight={40} overscan={0} />
    );
    await ready(container);
    await waitFor(() => expect(warn).toHaveBeenCalledWith(expect.stringContaining('DataGrid:')));
    expect(container.querySelectorAll('[role="row"][aria-rowindex]')).toHaveLength(5);
    expect(rowCheckbox(container, 4)).toBeNull();
    expect(rowCheckbox(container, 5)).toBeNull();
    warn.mockRestore();
  });

  it('moves aria-activedescendant with arrows, keeps the column, jumps pages and toggles with Space', async () => {
    const onSelectedKeysChange = vi.fn();
    const { container } = render(
      <DataGrid {...baseProps} onSelectedKeysChange={onSelectedKeysChange} />
    );
    await ready(container);
    const element = grid(container);
    fireEvent.focus(element);
    expect(element).toHaveAttribute('aria-activedescendant', expect.stringMatching(/-c0-0$/));
    fireEvent.keyDown(element, { key: 'ArrowDown' });
    expect(element.getAttribute('aria-activedescendant')).toMatch(/-c1-0$/);
    fireEvent.keyDown(element, { key: 'ArrowRight' });
    expect(element.getAttribute('aria-activedescendant')).toMatch(/-c1-1$/);
    fireEvent.keyDown(element, { key: ' ' });
    expect(onSelectedKeysChange).toHaveBeenLastCalledWith(['b'], 'row');
    fireEvent.keyDown(element, { key: 'Home' });
    expect(element.getAttribute('aria-activedescendant')).toMatch(/-c1-0$/);
    fireEvent.keyDown(element, { key: 'End' });
    expect(element.getAttribute('aria-activedescendant')).toMatch(/-c1-2$/);
    fireEvent.keyDown(element, { key: 'PageDown' });
    expect(element.getAttribute('aria-activedescendant')).toMatch(/-c2-2$/);
    fireEvent.keyDown(element, { key: 'ArrowUp' });
    expect(element.getAttribute('aria-activedescendant')).toMatch(/-c1-2$/);
  });

  it('jumps to the virtual first and last cell with Ctrl+Home/End and syncs scrollTop', async () => {
    const many = Array.from({ length: 300 }, (_, index) => ({
      id: `row-${index}`,
      name: `行 ${index}`,
      amount: index,
    }));
    const { container } = render(
      <DataGrid columns={columns} rows={many} height={200} rowHeight={40} overscan={0} />
    );
    await ready(container);
    const element = grid(container);
    const body = viewport(container);
    fireEvent.focus(element);
    fireEvent.keyDown(element, { key: 'End', ctrlKey: true });
    expect(body.scrollTop).toBe(300 * 40 - 200);
    expect(element.getAttribute('aria-activedescendant')).toMatch(/-c299-2$/);
    fireEvent.keyDown(element, { key: 'Home', ctrlKey: true });
    expect(body.scrollTop).toBe(0);
    expect(element.getAttribute('aria-activedescendant')).toMatch(/-c0-0$/);
  });

  it('keeps a small DOM window at 10k rows and renders only the scrolled range', async () => {
    const many = Array.from({ length: 10_000 }, (_, index) => ({
      id: `row-${index}`,
      name: `行 ${index}`,
      amount: index,
    }));
    const { container } = render(
      <DataGrid columns={columns} rows={many} height={200} rowHeight={40} overscan={6} />
    );
    await ready(container);
    const body = viewport(container);
    expect(container.querySelectorAll('[role="row"][aria-rowindex]')).toHaveLength(17);
    expect(container.querySelectorAll('[role="gridcell"]').length).toBeLessThan(1200);
    act(() => {
      body.scrollTop = 8000;
      fireEvent.scroll(body);
    });
    await flushFrame();
    expect(container.querySelectorAll('[role="row"][aria-rowindex]')).toHaveLength(17);
    expect(row(container, 201)).not.toBeNull();
    expect(firstCellText(container, 201)).toBe('行 200');
    expect(container.querySelector('[data-part="spacer"]')).toHaveAttribute(
      'style',
      expect.stringContaining('height: 400000px')
    );
  });

  it('drops aria-activedescendant when the focused row scrolls out of the window', async () => {
    const many = Array.from({ length: 300 }, (_, index) => ({
      id: `row-${index}`,
      name: `行 ${index}`,
      amount: index,
    }));
    const { container } = render(
      <DataGrid columns={columns} rows={many} height={200} rowHeight={40} overscan={0} />
    );
    await ready(container);
    const element = grid(container);
    const body = viewport(container);
    fireEvent.focus(element);
    fireEvent.keyDown(element, { key: 'ArrowDown' });
    expect(element).toHaveAttribute('aria-activedescendant');
    act(() => {
      body.scrollTop = 400;
      fireEvent.scroll(body);
    });
    await flushFrame();
    expect(element).not.toHaveAttribute('aria-activedescendant');
    expect(element.getAttribute('aria-activedescendant')).toBeNull();
  });

  it('ignores grid keys during IME composition', async () => {
    const onSelectedKeysChange = vi.fn();
    const { container } = render(
      <DataGrid {...baseProps} onSelectedKeysChange={onSelectedKeysChange} />
    );
    await ready(container);
    const element = grid(container);
    fireEvent.focus(element);
    fireEvent.keyDown(element, { key: ' ', keyCode: 229 });
    expect(onSelectedKeysChange).not.toHaveBeenCalled();
  });

  it('renders honest loading and empty states with overrides and disabled inputs', async () => {
    const { container, rerender } = render(<DataGrid {...baseProps} loading />);
    await ready(container);
    expect(container.querySelector('[data-part="loading"]')).toHaveTextContent('正在加载数据…');
    // Server mode keeps sort usable while the body shows the loading state.
    expect(container.querySelector('[data-part="sort"]')).not.toBeDisabled();
    rerender(<DataGrid {...baseProps} rows={[]} />);
    await waitFor(() => expect(container.querySelector('[data-part="empty"]')).toBeInTheDocument());
    expect(container.querySelector('[data-part="empty"]')).toHaveTextContent('暂无数据');
    rerender(
      <DataGrid
        {...baseProps}
        rows={[]}
        loadingContent={<span>自定义加载</span>}
        emptyContent={<span>自定义空态</span>}
      />
    );
    expect(container.querySelector('[data-part="empty"]')).toHaveTextContent('自定义空态');
    rerender(<DataGrid {...baseProps} loading loadingContent={<span>自定义加载</span>} />);
    expect(container.querySelector('[data-part="loading"]')).toHaveTextContent('自定义加载');
    rerender(<DataGrid {...baseProps} />);
    await ready(container);
  });

  it('forwards native props, ref and classNames to the shell root and reports status', async () => {
    const ref = React.createRef<HTMLDivElement>();
    const onStatusChange = vi.fn();
    const onReady = vi.fn();
    const { container } = render(
      <DataGrid
        {...baseProps}
        ref={ref}
        data-host="yes"
        className="host-grid"
        classNames={{ root: 'extra-root', viewport: 'extra-viewport' }}
        onStatusChange={onStatusChange}
        onReady={onReady}
      />
    );
    await ready(container);
    expect(ref.current).toBe(container.querySelector('.zuvi-datagrid'));
    expect(ref.current).toHaveAttribute('data-host', 'yes');
    expect(ref.current).toHaveClass('host-grid', 'extra-root');
    expect(container.querySelector('[data-part="viewport"]')).toHaveClass('extra-viewport');
    await waitFor(() => expect(onStatusChange).toHaveBeenCalledWith('ready'));
    expect(onReady).toHaveBeenCalled();
  });

  it('overrides labels per instance and honors ConfigProvider locales', async () => {
    const { container } = render(
      <ConfigProvider locale={{ code: 'en-US' }}>
        <DataGrid {...baseProps} rows={[]} labels={{ empty: 'Nothing here' }} />
      </ConfigProvider>
    );
    await waitFor(() => expect(container.querySelector('[data-part="empty"]')).toBeInTheDocument());
    expect(container.querySelector('[data-part="empty"]')).toHaveTextContent('Nothing here');
  });

  describe('filters', () => {
    interface RegionRow {
      id: string;
      name: string;
      region: string;
      amount: number;
    }
    const filterRows: RegionRow[] = [
      { id: 'a', name: '甲', region: '华东', amount: 3 },
      { id: 'b', name: '乙', region: '华北', amount: 1 },
      { id: 'c', name: '丙', region: '华东', amount: 2 },
    ];
    const filterColumns: readonly DataGridColumn<RegionRow>[] = [
      { key: 'name', dataIndex: 'name', header: '名称', textValue: '名称' },
      {
        key: 'region',
        dataIndex: 'region',
        header: '区域',
        textValue: '区域',
        filterable: true,
        filterValues: ['华东', '华北'],
      },
    ];
    const filterBase: DataGridProps<RegionRow> = {
      columns: filterColumns,
      rows: filterRows,
      height: 200,
      rowHeight: 40,
      overscan: 0,
    };
    const trigger = (container: HTMLElement) =>
      container.querySelector<HTMLButtonElement>('[data-part="filter-trigger"]')!;
    const panel = (container: HTMLElement) =>
      container.querySelector<HTMLDivElement>('[data-part="filter-panel"]')!;
    const optionBoxes = (container: HTMLElement) =>
      [...panel(container).querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];

    it('opens the disclosure panel, filters rows and closes with Escape back on the trigger', async () => {
      const { container } = render(<DataGrid {...filterBase} />);
      await ready(container);
      expect(trigger(container)).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(trigger(container));
      expect(panel(container)).toBeInTheDocument();
      expect(trigger(container)).toHaveAttribute('aria-expanded', 'true');
      expect(document.activeElement).toBe(optionBoxes(container)[0]);
      expect(optionBoxes(container)).toHaveLength(2);

      fireEvent.click(optionBoxes(container)[0]);
      expect(grid(container)).toHaveAttribute('aria-rowcount', '2');
      expect(firstCellText(container, 1)).toBe('甲');
      expect(firstCellText(container, 2)).toBe('丙');

      fireEvent.keyDown(panel(container), { key: 'Escape' });
      expect(container.querySelector('[data-part="filter-panel"]')).not.toBeInTheDocument();
      expect(trigger(container)).toHaveAttribute('aria-expanded', 'false');
      expect(document.activeElement).toBe(trigger(container));
      // Filters persist after the panel closes.
      expect(grid(container)).toHaveAttribute('aria-rowcount', '2');
    });

    it('removes the constraint when every option is unchecked and reports null', async () => {
      const onFiltersChange = vi.fn();
      const { container, rerender } = render(
        <DataGrid {...filterBase} onFiltersChange={onFiltersChange} />
      );
      await ready(container);
      fireEvent.click(trigger(container));
      fireEvent.click(optionBoxes(container)[0]);
      rerender(<DataGrid {...filterBase} onFiltersChange={onFiltersChange} />);
      expect(grid(container)).toHaveAttribute('aria-rowcount', '2');
      fireEvent.click(optionBoxes(container)[0]);
      expect(onFiltersChange).toHaveBeenLastCalledWith(null);
      rerender(<DataGrid {...filterBase} onFiltersChange={onFiltersChange} />);
      expect(grid(container)).toHaveAttribute('aria-rowcount', '3');
    });

    it('keeps controlled filters authoritative without optimistic updates', async () => {
      const onFiltersChange = vi.fn();
      const { container, rerender } = render(
        <DataGrid {...filterBase} filters={{ region: ['华北'] }} onFiltersChange={onFiltersChange} />
      );
      await ready(container);
      expect(grid(container)).toHaveAttribute('aria-rowcount', '1');
      fireEvent.click(trigger(container));
      fireEvent.click(optionBoxes(container)[0]);
      expect(grid(container)).toHaveAttribute('aria-rowcount', '1');
      expect(onFiltersChange).toHaveBeenLastCalledWith({ region: ['华北', '华东'] });
      rerender(
        <DataGrid
          {...filterBase}
          filters={{ region: ['华北', '华东'] }}
          onFiltersChange={onFiltersChange}
        />
      );
      expect(grid(container)).toHaveAttribute('aria-rowcount', '3');
    });

    it('shows the filtered-empty message when filters match nothing', async () => {
      const { container } = render(<DataGrid {...filterBase} defaultFilters={{ region: ['华南'] }} />);
      await ready(container);
      const empty = container.querySelector('[data-part="empty"]')!;
      expect(empty).toHaveAttribute('data-filtered-empty', 'true');
      expect(empty).toHaveTextContent('无匹配的筛选项');
    });

    it('scopes select-all to the filtered rows', async () => {
      const onSelectedKeysChange = vi.fn();
      const { container } = render(
        <DataGrid {...filterBase} defaultFilters={{ region: ['华东'] }} onSelectedKeysChange={onSelectedKeysChange} />
      );
      await ready(container);
      expect(grid(container)).toHaveAttribute('aria-rowcount', '2');
      fireEvent.click(selectAll(container));
      expect(onSelectedKeysChange).toHaveBeenLastCalledWith(['a', 'c'], 'all');
    });

    it('warns when filters reference unknown or non-filterable columns', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { container } = render(
        <DataGrid {...filterBase} defaultFilters={{ ghost: ['x'] }} />
      );
      await ready(container);
      expect(grid(container)).toHaveAttribute('aria-rowcount', '3');
      await waitFor(() => expect(warn).toHaveBeenCalledWith(expect.stringContaining('ghost')));
    });
  });
});
