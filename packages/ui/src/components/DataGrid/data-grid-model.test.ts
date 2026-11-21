import { describe, expect, it } from 'vitest';
import {
  applyFilters,
  buildRowRegistry,
  computeSelectAllState,
  computeStickyOffsets,
  cycleSort,
  normalizeColumns,
  resolveColumnWidths,
  resolveFilters,
  resolveRowKey,
  resolveSort,
  resolveStickyColumns,
  sortRowIndices,
  toggleAllSelection,
  toggleRowSelection,
} from './data-grid-model';

interface Row {
  id: string;
  name: string;
  amount: number;
}

const rows: Row[] = [
  { id: 'a', name: '甲', amount: 3 },
  { id: 'b', name: '乙', amount: 1 },
  { id: 'c', name: '丙', amount: 2 },
];

describe('normalizeColumns', () => {
  it('keeps the first duplicate column and reports it', () => {
    const result = normalizeColumns<Row>([
      { key: 'name', header: '名称' },
      { key: 'name', header: '重复' },
      { key: 'amount', header: '金额' },
    ]);
    expect(result.columns.map((column) => column.header)).toEqual(['名称', '金额']);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toContain('重复');
  });

  it('defaults widths to 120 and clamps into [minWidth, maxWidth]', () => {
    const result = normalizeColumns<Row>([
      { key: 'a', header: 'A' },
      { key: 'b', header: 'B', width: 10 },
      { key: 'c', header: 'C', width: 999, maxWidth: 300 },
      { key: 'd', header: 'D', width: 200, minWidth: 260 },
    ]);
    expect(result.columns.map((column) => column.width)).toEqual([120, 60, 300, 260]);
    expect(result.issues.some((issue) => issue.includes('钳制'))).toBe(true);
  });

  it('reports sortable columns without a usable sort source', () => {
    const result = normalizeColumns<Row>([{ key: 'ghost', header: '虚列', sortable: true }]);
    expect(result.issues[0]).toContain('排序将被忽略');
  });
});

describe('resolveColumnWidths', () => {
  const columns = normalizeColumns<Row>([
    { key: 'name', header: '名称', width: 120, minWidth: 80, maxWidth: 400 },
    { key: 'amount', header: '金额', width: 100 },
  ]).columns;

  it('merges per-key widths and keeps undeclared column defaults', () => {
    const result = resolveColumnWidths({ name: 200 }, columns);
    expect(result.widths).toEqual({ name: 200, amount: 100 });
    expect(result.issues).toEqual([]);
  });

  it('re-clamps controlled values into the column contract with a warning', () => {
    const result = resolveColumnWidths({ name: 9999 }, columns);
    expect(result.widths.name).toBe(400);
    expect(result.issues.some((issue) => issue.includes('钳制'))).toBe(true);
  });

  it('ignores unknown keys with a warning', () => {
    const result = resolveColumnWidths({ ghost: 50 }, columns);
    expect(result.widths.ghost).toBeUndefined();
    expect(result.issues.some((issue) => issue.includes('未声明'))).toBe(true);
  });

  it('treats non-finite values as the column default', () => {
    const result = resolveColumnWidths({ name: Number.NaN }, columns);
    expect(result.widths.name).toBe(120);
  });
});

describe('resolveStickyColumns and computeStickyOffsets', () => {
  const stickyThree = normalizeColumns<Row>([
    { key: 'a', header: 'A', sticky: true },
    { key: 'b', header: 'B', sticky: true },
    { key: 'c', header: 'C', sticky: true },
  ]).columns;
  const stickyOne = normalizeColumns<Row>([
    { key: 'name', header: '名称', sticky: true, width: 120 },
    { key: 'amount', header: '金额', width: 100 },
  ]).columns;

  it('collects sticky keys and caps at two with a warning', () => {
    const capped = resolveStickyColumns(stickyThree);
    expect([...capped.stickyKeys]).toEqual(['a', 'b']);
    expect(capped.issue).toContain('仅前两列');
    const single = resolveStickyColumns(stickyOne);
    expect([...single.stickyKeys]).toEqual(['name']);
    expect(single.issue).toBeNull();
  });

  it('computes cumulative offsets after the select column', () => {
    const offsets = computeStickyOffsets(44, stickyOne, new Set(['name']));
    expect(offsets.name).toBe(44);
    expect(offsets.amount).toBeUndefined();
  });
});

describe('resolveRowKey', () => {
  it('supports field names, functions and the id default', () => {
    const row = rows[0];
    expect(resolveRowKey(row, 0, undefined)).toBe('a');
    expect(resolveRowKey(row, 0, 'name')).toBe('甲');
    expect(resolveRowKey(row, 0, (current) => `row-${current.id}`)).toBe('row-a');
  });

  it('returns null for missing identities', () => {
    expect(resolveRowKey({ id: '', name: '', amount: 0 }, 0, undefined)).toBeNull();
    expect(resolveRowKey({ name: '无', amount: 1 } as Row, 0, undefined)).toBeNull();
  });
});

describe('buildRowRegistry', () => {
  it('skips duplicate and missing keys from selection with warnings', () => {
    const registry = buildRowRegistry<Row>(
      [...rows, { id: 'a', name: '重复', amount: 9 }, { name: '无身份', amount: 0 } as Row],
      undefined
    );
    expect(registry.keys).toEqual(['a', 'b', 'c', null, null]);
    expect(registry.selectable).toEqual([true, true, true, false, false]);
    expect(registry.issues).toHaveLength(2);
    expect(registry.issues.some((issue) => issue.includes('重复'))).toBe(true);
    expect(registry.issues.some((issue) => issue.includes('rowKey'))).toBe(true);
  });

  it('honors isRowSelectable', () => {
    const registry = buildRowRegistry(rows, undefined, (row) => row.amount > 1);
    expect(registry.selectable).toEqual([true, false, true]);
  });
});

describe('selection state helpers', () => {
  const registry = buildRowRegistry(rows, undefined);

  it('computes none/all/mixed against selectable rows only', () => {
    expect(computeSelectAllState([], registry)).toBe('none');
    expect(computeSelectAllState(['a', 'b', 'c'], registry)).toBe('all');
    expect(computeSelectAllState(['a', 'ghost'], registry)).toBe('mixed');
    expect(computeSelectAllState([], { keys: [null], selectable: [false], issues: [] })).toBe(
      'none'
    );
  });

  it('toggles all selection to selectable keys only', () => {
    expect(toggleAllSelection([], registry)).toEqual(['a', 'b', 'c']);
    expect(toggleAllSelection(['a', 'b', 'c'], registry)).toEqual([]);
    const partial = buildRowRegistry(rows, undefined, (row) => row.amount > 1);
    expect(toggleAllSelection([], partial)).toEqual(['a', 'c']);
  });

  it('toggles a single row key', () => {
    expect(toggleRowSelection(['b'], 'a')).toEqual(['b', 'a']);
    expect(toggleRowSelection(['a', 'b'], 'a')).toEqual(['b']);
  });
});

describe('sort helpers', () => {
  it('cycles asc → desc → clear and restarts at asc for a new column', () => {
    expect(cycleSort(null, 'amount')).toEqual({ key: 'amount', dir: 'asc' });
    expect(cycleSort({ key: 'amount', dir: 'asc' }, 'amount')).toEqual({
      key: 'amount',
      dir: 'desc',
    });
    expect(cycleSort({ key: 'amount', dir: 'desc' }, 'amount')).toBeNull();
    expect(cycleSort({ key: 'amount', dir: 'desc' }, 'name')).toEqual({ key: 'name', dir: 'asc' });
  });

  it('resolves invalid sort targets to null with an issue', () => {
    const { columns } = normalizeColumns<Row>([
      { key: 'name', header: '名称', sortable: true, dataIndex: 'name' },
      { key: 'amount', header: '金额', dataIndex: 'amount' },
    ]);
    expect(resolveSort(null, columns).sort).toBeNull();
    expect(resolveSort({ key: 'ghost', dir: 'asc' }, columns).issue).toContain('已声明的列');
    expect(resolveSort({ key: 'amount', dir: 'asc' }, columns).issue).toContain('sortable');
    expect(resolveSort({ key: 'name', dir: 'sideways' as never }, columns).issue).toContain('无效');
    expect(resolveSort({ key: 'name', dir: 'desc' }, columns)).toEqual({
      sort: { key: 'name', dir: 'desc' },
      issue: null,
    });
  });

  it('sorts numerically and lexically without mutating rows', () => {
    const { columns } = normalizeColumns<Row>([
      { key: 'amount', header: '金额', sortable: true, dataIndex: 'amount' },
    ]);
    expect(sortRowIndices(rows, columns, { key: 'amount', dir: 'asc' })).toEqual([1, 2, 0]);
    expect(sortRowIndices(rows, columns, { key: 'amount', dir: 'desc' })).toEqual([0, 2, 1]);
    expect(rows.map((row) => row.amount)).toEqual([3, 1, 2]);
  });

  it('groups nullish values last regardless of direction', () => {
    const gapped = [...rows, { id: 'd', name: '丁', amount: null as unknown as number }];
    const { columns } = normalizeColumns<Row>([
      { key: 'amount', header: '金额', sortable: true, dataIndex: 'amount' },
    ]);
    expect(sortRowIndices(gapped, columns, { key: 'amount', dir: 'asc' })).toEqual([1, 2, 0, 3]);
    expect(sortRowIndices(gapped, columns, { key: 'amount', dir: 'desc' })).toEqual([0, 2, 1, 3]);
  });

  it('keeps source order for null or unknown sorts', () => {
    const { columns } = normalizeColumns<Row>([]);
    expect(sortRowIndices(rows, columns, null)).toEqual([0, 1, 2]);
    expect(sortRowIndices(rows, columns, { key: 'ghost', dir: 'asc' })).toEqual([0, 1, 2]);
  });
});

describe('resolveFilters', () => {
  const columns = normalizeColumns<Row>([
    { key: 'name', header: '名称', filterable: true },
    { key: 'amount', header: '金额' },
  ]).columns;

  it('passes through filterable column selections', () => {
    const result = resolveFilters({ name: ['甲', '乙'] }, columns);
    expect(result.filters).toEqual({ name: ['甲', '乙'] });
    expect(result.issues).toEqual([]);
  });

  it('drops unknown and non-filterable keys with warnings', () => {
    const result = resolveFilters({ ghost: ['x'], amount: ['1'] }, columns);
    expect(result.filters).toEqual({});
    expect(result.issues).toHaveLength(2);
    expect(result.issues[0]).toContain('未声明');
    expect(result.issues[1]).toContain('filterable');
  });

  it('treats empty selections as no constraint', () => {
    expect(resolveFilters({ name: [] }, columns).filters).toEqual({});
    expect(resolveFilters(null, columns).filters).toEqual({});
    expect(resolveFilters(undefined, columns).filters).toEqual({});
  });
});

describe('applyFilters', () => {
  const columns = normalizeColumns<Row>([
    { key: 'name', header: '名称', filterable: true, dataIndex: 'name' },
    { key: 'amount', header: '金额', filterable: true, dataIndex: 'amount' },
  ]).columns;

  it('keeps every row when no constraint is active', () => {
    expect(applyFilters(rows, columns, {})).toEqual(rows);
    expect(applyFilters(rows, columns, { name: [] })).toEqual(rows);
  });

  it('intersects constraints across columns', () => {
    expect(applyFilters(rows, columns, { name: ['甲', '乙'], amount: ['1'] })).toEqual([
      { id: 'b', name: '乙', amount: 1 },
    ]);
  });

  it('stringifies numeric values and excludes nullish gaps', () => {
    expect(applyFilters(rows, columns, { amount: ['3'] })).toEqual([
      { id: 'a', name: '甲', amount: 3 },
    ]);
    const gapped = [
      ...rows,
      { id: 'd', name: '丁', amount: null as unknown as number },
    ];
    expect(applyFilters(gapped, columns, { amount: ['3'] })).toEqual([
      { id: 'a', name: '甲', amount: 3 },
    ]);
  });

  it('never mutates the source rows', () => {
    applyFilters(rows, columns, { name: ['甲'] });
    expect(rows.map((row) => row.id)).toEqual(['a', 'b', 'c']);
  });
});
