export { studioCellFontIssue } from './studio-cell-font';
import type { OfficeStudioDocument, OfficeStudioKind, StudioRichNode } from './studio-types';
import { studioIsSheetHyperlink } from './studio-sheet-hyperlinks';
import { studioCellStyleValid, sheetTextFormatError } from './studio-cell-format-core';
import { wordImageLayoutValid } from './studio-word-image-contract';

function newId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `studio-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function plainParagraph(text: string): StudioRichNode {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}

/** Creates editable content without an Office server. PDF bytes are supplied by the host. */
export function createOfficeStudioDocument(kind: OfficeStudioKind = 'word'): OfficeStudioDocument {
  const id = newId();
  if (kind === 'word') {
    return {
      version: 1,
      id,
      name: '项目提案.docx',
      kind,
      page: { size: 'A4', orientation: 'portrait', margin: 20 },
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'ZUVI STUDIO  /  项目工作文档',
                marks: [{ type: 'textStyle', attrs: { color: '#59746b' } }],
              },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: '让想法，成为下一步。' }],
          },
          plainParagraph(
            '在页面中直接编辑正文，用清晰的结构记录目标、计划与成果。选中文字后，可以调整字体、颜色和段落样式。'
          ),
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: '01  项目目标' }],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: '建立一个顺手的文档空间，让预览、编辑和交付保持连贯。',
                marks: [{ type: 'bold' }],
              },
            ],
          },
          {
            type: 'bulletList',
            content: [
              '把重要内容写在前面，让每次沟通都有明确结论。',
              '在同一张画布完成排版、表格和内容修改。',
              '保存进度，并导出可继续编辑的 DOCX 文件。',
            ].map((text) => ({ type: 'listItem', content: [plainParagraph(text)] })),
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: '02  交付计划' }],
          },
          {
            type: 'table',
            content: [
              ['阶段', '交付内容', '状态'],
              ['本周', '完成项目提案与预算', '进行中'],
              ['下周', '评审并确认实施计划', '待开始'],
            ].map((values, index) => ({
              type: 'tableRow',
              content: values.map((text) => ({
                type: index === 0 ? 'tableHeader' : 'tableCell',
                content: [plainParagraph(text)],
              })),
            })),
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: '从这里开始，写下你的下一步。', marks: [{ type: 'italic' }] },
            ],
          },
        ],
      },
    };
  }
  if (kind === 'excel') {
    const sheetId = newId();
    const summaryId = newId();
    return {
      version: 1,
      id,
      name: '项目预算.xlsx',
      kind,
      defaultFont: { family: 'Calibri', sizePt: 11, bold: false, italic: false },
      activeSheetId: sheetId,
      sheets: [
        {
          id: sheetId,
          name: '预算',
          rowCount: 60,
          columnCount: 16,
          rowHeightModes: {},
          hyperlinks: [],
          columnWidths: { A: 200, B: 120, C: 120, D: 140 },
          cells: {
            A1: { input: '项目预算', bold: true, color: '#2f684e' },
            ...Object.fromEntries(
              ['交付项目', '单价', '数量', '小计'].map((input, index) => [
                `${String.fromCharCode(65 + index)}3`,
                { input, bold: true, background: '#e8f0ea' },
              ])
            ),
            ...Object.fromEntries(
              [
                ['产品设计', '1800', '3'],
                ['组件开发', '2400', '5'],
                ['质量验证', '1600', '2'],
              ].flatMap(([name, price, count], index) => {
                const row = index + 4;
                return [
                  [`A${row}`, { input: name }],
                  [`B${row}`, { input: price, numberFormat: '0.00' }],
                  [`C${row}`, { input: count }],
                  [`D${row}`, { input: `=B${row}*C${row}`, numberFormat: '0.00' }],
                ];
              })
            ),
            A8: { input: '预算合计', bold: true },
            D8: { input: '=SUM(D4:D6)', bold: true, numberFormat: '0.00' },
            A10: { input: '双击单元格编辑，支持从表格复制并粘贴。', color: '#59746b' },
          },
        },
        {
          id: summaryId,
          name: '汇总',
          rowCount: 60,
          columnCount: 16,
          rowHeightModes: {},
          columnWidths: { A: 200, B: 160 },
          cells: {
            A1: { input: '预算总览', bold: true },
            A3: { input: '预算总额' },
            B3: { input: "='预算'!D8", bold: true, numberFormat: '0.00' },
          },
        },
      ],
    };
  }
  return {
    version: 1,
    id,
    name: '新建文档.pdf',
    kind,
    pageCount: 1,
    marks: [],
    rotations: {},
    fields: [],
  };
}

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const finite = (value: unknown): value is number => Number.isFinite(value);

const integer = (value: unknown): value is number => Number.isInteger(value);
const integerRange = (value: unknown, min: number, max: number): value is number =>
  integer(value) && value >= min && value <= max;
const finiteRange = (value: unknown, min: number, max: number): value is number =>
  finite(value) && value >= min && value <= max;
const positive = (value: unknown, max: number): value is number =>
  finite(value) && value > 0 && value <= max;
const nonempty = (value: unknown): value is string => typeof value === 'string' && !!value;
const arrayOf = (
  value: unknown,
  max: number,
  accept: (item: unknown) => boolean
): value is unknown[] => Array.isArray(value) && value.length <= max && value.every(accept);

const optionalText = (value: unknown, limit = 32767) =>
  value === undefined || (typeof value === 'string' && value.length <= limit);
const optionalBoolean = (value: unknown) => value === undefined || typeof value === 'boolean';
const optionalPositive = (value: unknown, max = 100000) =>
  value === undefined || positive(value, max);
function cellPosition(address: unknown) {
  if (typeof address !== 'string') return null;
  const match = /^([A-Z]{1,3})([1-9]\d*)$/.exec(address);
  if (!match) return null;
  return {
    row: Number(match[2]),
    column: [...match[1]].reduce((total, char) => total * 26 + char.charCodeAt(0) - 64, 0),
  };
}

type CellRange = NonNullable<ReturnType<typeof cellRange>>;
const rangesOverlap = (left: CellRange, right: CellRange) =>
  left.firstRow <= right.lastRow &&
  left.lastRow >= right.firstRow &&
  left.firstColumn <= right.lastColumn &&
  left.lastColumn >= right.firstColumn;
function cellRange(input: unknown, rows: number, columns: number) {
  if (typeof input !== 'string') return null;
  const parts = input.split(':');
  if (parts.length !== 2) return null;
  const start = cellPosition(parts[0]);
  const end = cellPosition(parts[1]);
  return start &&
    end &&
    end.row >= start.row &&
    end.column >= start.column &&
    end.row <= rows &&
    end.column <= columns
    ? { firstRow: start.row, lastRow: end.row, firstColumn: start.column, lastColumn: end.column }
    : null;
}

const comparisonOperators = new Set([
  'equal',
  'notEqual',
  'greaterThan',
  'greaterThanOrEqual',
  'lessThan',
  'lessThanOrEqual',
  'between',
  'notBetween',
]);
const ruleColor = (value: unknown) => typeof value === 'string' && /^#[\da-f]{6}$/i.test(value);
const ruleId = (value: unknown): value is string => nonempty(value) && value.length <= 128;
function ruleText(value: unknown, max: number): boolean {
  if (!optionalText(value, max)) return false;
  return (
    typeof value !== 'string' ||
    // eslint-disable-next-line no-control-regex -- XML text explicitly excludes these control code points.
    !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\p{Cs}\ufffe\uffff]/u.test(value)
  );
}

/** @internal Shared validation for persisted cells and direct formatting edits. */
/** Rule formulas share the editor's A1 subset and never trigger external reads. */
function ruleFormula(value: unknown, numeric = false): boolean {
  if (typeof value !== 'string' || !value.trim() || !ruleText(value, 4096)) return false;
  if (numeric && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim()))
    return Number.isFinite(Number(value));
  if (!value.startsWith('=') || !value.slice(1).trim()) return false;
  let structure = '';
  for (let index = 1; index < value.length; index++) {
    if (value[index] === "'") {
      const start = index;
      let closed = false;
      while (++index < value.length) {
        if (value[index] !== "'") continue;
        if (value[index + 1] === "'") index++;
        else {
          closed = true;
          break;
        }
      }
      if (!closed) return false;
      structure += value.slice(start, index + 1);
      continue;
    }
    if (value[index] !== '"') {
      structure += value[index];
      continue;
    }
    let closed = false;
    while (++index < value.length) {
      if (value[index] !== '"') continue;
      if (value[index + 1] === '"') index++;
      else {
        closed = true;
        break;
      }
    }
    if (!closed) return false;
  }
  if (
    /[[\]]|\b(?:INDIRECT|OFFSET|WEBSERVICE)\s*\(/i.test(structure) ||
    /(?:^|[^\p{L}\p{N}_])(?:\$?[A-Z]{1,3}\s*:\s*\$?[A-Z]{1,3}|\$?[1-9]\d*\s*:\s*\$?[1-9]\d*)(?:[^\p{L}\p{N}_]|$)/iu.test(
      structure
    ) ||
    /:\s*(?:'(?:[^']|'')+'|[\p{L}_][\p{L}\p{N}_.]*)!/u.test(structure) ||
    [...structure.matchAll(/('(?:[^']|'')+'|[\p{L}_][\p{L}\p{N}_.]*)!/gu)].some((match) =>
      match[1].includes(':')
    )
  )
    return false;
  const expression = structure
    .replace(/#(?:REF!|DIV\/0!|VALUE!|NAME\?|N\/A|NUM!|NULL!|ERROR!)/gi, '')
    .replace(/('(?:[^']|'')+'|[\p{L}_][\p{L}\p{N}_.]*)!/gu, '')
    .replace(/(?<![\p{L}\p{N}_.])\$?[A-Z]{1,3}\$?[1-9]\d*(?![\p{L}\p{N}_.])/giu, '0')
    .replace(/(?<![\p{L}\p{N}_.])(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?(?![\p{L}\p{N}_.])/giu, '0');
  if (/[#'!@$]/.test(expression)) return false;
  for (const match of expression.matchAll(/[\p{L}_][\p{L}\p{N}_.]*/gu)) {
    if (/^(?:TRUE|FALSE)$/i.test(match[0])) continue;
    if (!/^\s*\(/.test(expression.slice(match.index + match[0].length))) return false;
  }
  let depth = 0;
  for (const character of expression) {
    if (character === '(') depth++;
    if (character === ')' && --depth < 0) return false;
  }
  return depth === 0;
}

function validationSource(value: unknown) {
  if (typeof value !== 'string' || !ruleText(value, 4096)) return null;
  if (value === '=#REF!') return { broken: true as const };
  const match =
    /^=?(?:('(?:[^']|'')+'|[\p{L}_][\p{L}\p{N}_.]*)!)?(\$?[A-Z]{1,3}\$?[1-9]\d*)(?::(\$?[A-Z]{1,3}\$?[1-9]\d*))?$/iu.exec(
      value
    );
  if (!match) return null;
  const range = cellRange(
    `${match[2]}:${match[3] ?? match[2]}`.replace(/\$/g, '').toUpperCase(),
    10000,
    256
  );
  if (
    !range ||
    (range.firstRow !== range.lastRow && range.firstColumn !== range.lastColumn) ||
    (range.lastRow - range.firstRow + 1) * (range.lastColumn - range.firstColumn + 1) > 1000
  )
    return null;
  const rawName = match[1];
  const name = rawName?.startsWith("'") ? rawName.slice(1, -1).replace(/''/g, "'") : rawName;
  return { broken: false as const, name, range };
}

function sheetRules(sheet: Record<string, unknown>, rows: number, columns: number): boolean {
  for (const field of ['conditionalFormats', 'dataValidations'] as const) {
    const rules = sheet[field];
    if (rules === undefined) continue;
    if (!Array.isArray(rules) || rules.length > 100) return false;
    const ids = new Set<string>();
    const ranges: NonNullable<ReturnType<typeof cellRange>>[] = [];
    let covered = 0;
    for (const rule of rules) {
      if (!record(rule) || !ruleId(rule.id) || ids.has(rule.id)) return false;
      ids.add(rule.id);
      const range = cellRange(rule.range, rows, columns);
      if (!range) return false;
      covered += (range.lastRow - range.firstRow + 1) * (range.lastColumn - range.firstColumn + 1);
      if (covered > 100000) return false;
      if (field === 'conditionalFormats') {
        if (!integer(rule.priority) || rule.priority < 1 || !optionalBoolean(rule.stopIfTrue))
          return false;
        const base = ['id', 'range', 'priority', 'stopIfTrue', 'style', 'type'];
        let fields: string[];
        switch (rule.type) {
          case 'cellIs':
            fields = ['operator', 'formulae'];
            if (
              !comparisonOperators.has(String(rule.operator)) ||
              !Array.isArray(rule.formulae) ||
              rule.formulae.length !==
                (['between', 'notBetween'].includes(String(rule.operator)) ? 2 : 1) ||
              !rule.formulae.every((formula) => ruleFormula(formula, true))
            )
              return false;
            break;
          case 'expression':
            fields = ['formula'];
            if (!ruleFormula(rule.formula)) return false;
            break;
          case 'containsText':
            fields = ['text'];
            if (!nonempty(rule.text) || !ruleText(rule.text, 255)) return false;
            break;
          case 'duplicateValues':
          case 'uniqueValues':
            fields = [];
            break;
          case 'top10':
            fields = ['rank', 'percent', 'bottom'];
            if (
              !integerRange(rule.rank, 1, rule.percent === true ? 100 : 1000) ||
              !optionalBoolean(rule.percent) ||
              !optionalBoolean(rule.bottom)
            )
              return false;
            break;
          case 'aboveAverage':
            fields = ['aboveAverage'];
            if (!optionalBoolean(rule.aboveAverage)) return false;
            break;
          case 'colorScale':
            fields = ['colors'];
            if (
              !Array.isArray(rule.colors) ||
              ![2, 3].includes(rule.colors.length) ||
              !rule.colors.every(ruleColor) ||
              rule.style !== undefined
            )
              return false;
            break;
          default:
            return false;
        }
        if (!Object.keys(rule).every((key) => [...base, ...fields].includes(key))) return false;
        if (rule.style !== undefined) {
          const style = rule.style;
          if (
            !record(style) ||
            !Object.keys(style).every((key) =>
              ['bold', 'italic', 'underline', 'color', 'background', 'numberFormat'].includes(key)
            ) ||
            ![style.bold, style.italic, style.underline].every(optionalBoolean) ||
            ![style.color, style.background].every(
              (color) => color === undefined || ruleColor(color)
            ) ||
            !ruleText(style.numberFormat, 256)
          )
            return false;
        }
      } else {
        if (
          ranges.some((other) => rangesOverlap(other, range)) ||
          ![rule.allowBlank, rule.showInputMessage, rule.showErrorMessage].every(optionalBoolean) ||
          ![rule.inputTitle, rule.errorTitle].every((text) => ruleText(text, 32)) ||
          ![rule.inputMessage, rule.errorMessage].every((text) => ruleText(text, 255)) ||
          (rule.errorStyle !== undefined &&
            !['stop', 'warning', 'information'].includes(String(rule.errorStyle)))
        )
          return false;
        ranges.push(range);
        const base = [
          'id',
          'range',
          'type',
          'allowBlank',
          'showInputMessage',
          'inputTitle',
          'inputMessage',
          'showErrorMessage',
          'errorStyle',
          'errorTitle',
          'errorMessage',
        ];
        let fields: string[];
        if (rule.type === 'list') {
          fields = ['values', 'source'];
          if ((rule.values === undefined) === (rule.source === undefined)) return false;
          if (rule.values !== undefined) {
            if (
              !Array.isArray(rule.values) ||
              !rule.values.length ||
              rule.values.length > 100 ||
              !rule.values.every(
                (item) =>
                  nonempty(item) &&
                  ruleText(item, 255) &&
                  // eslint-disable-next-line no-control-regex -- Inline XLSX lists reject control characters and delimiters.
                  !/[\u0000-\u001f\u007f",]/.test(item)
              ) ||
              rule.values.join(',').length > 255
            )
              return false;
          } else if (!validationSource(rule.source)) return false;
        } else if (rule.type === 'custom') {
          fields = ['formula'];
          if (!ruleFormula(rule.formula)) return false;
        } else {
          fields = ['operator', 'formula1', 'formula2'];
          const between = ['between', 'notBetween'].includes(String(rule.operator));
          if (
            !['whole', 'decimal', 'date', 'time', 'textLength'].includes(String(rule.type)) ||
            !comparisonOperators.has(String(rule.operator)) ||
            !ruleFormula(rule.formula1, true) ||
            (between ? !ruleFormula(rule.formula2, true) : rule.formula2 !== undefined)
          )
            return false;
        }
        if (!Object.keys(rule).every((key) => [...base, ...fields].includes(key))) return false;
      }
    }
  }
  return true;
}

function sheetValidationSources(sheets: unknown[]): boolean {
  return sheets.every((sheet) => {
    if (!record(sheet) || !Array.isArray(sheet.dataValidations)) return true;
    return sheet.dataValidations.every((rule) => {
      if (!record(rule) || rule.type !== 'list' || rule.source === undefined) return true;
      const source = validationSource(rule.source);
      if (!source) return false;
      if (source.broken) return true;
      const target = source.name
        ? sheets.find(
            (candidate) =>
              record(candidate) &&
              typeof candidate.name === 'string' &&
              candidate.name.toLocaleLowerCase() === source.name?.toLocaleLowerCase()
          )
        : sheet;
      return (
        record(target) &&
        finite(target.rowCount) &&
        finite(target.columnCount) &&
        source.range.lastRow <= target.rowCount &&
        source.range.lastColumn <= target.columnCount
      );
    });
  });
}

function sheetFeatures(sheet: Record<string, unknown>, rows: number, columns: number) {
  if (!sheetRules(sheet, rows, columns)) return false;
  if (
    sheet.protectedRanges !== undefined &&
    !arrayOf(
      sheet.protectedRanges,
      100,
      (range) => typeof range === 'string' && !!cellRange(range, rows, columns)
    )
  )
    return false;
  if (sheet.structureEdits !== undefined) {
    if (!Array.isArray(sheet.structureEdits) || sheet.structureEdits.length > 500) return false;
    const dimensions = { row: rows, column: columns };
    for (const edit of [...sheet.structureEdits].reverse()) {
      if (
        !record(edit) ||
        (edit.axis !== 'row' && edit.axis !== 'column') ||
        (edit.type !== 'insert' && edit.type !== 'delete') ||
        !integer(edit.index) ||
        edit.index < 1 ||
        !integer(edit.count) ||
        edit.count < 1
      )
        return false;
      const limit = edit.axis === 'row' ? 10000 : 256;
      const current = dimensions[edit.axis];
      const previous = current + (edit.type === 'insert' ? -edit.count : edit.count);
      if (
        previous < 1 ||
        previous > limit ||
        (edit.type === 'insert'
          ? edit.index > previous + 1
          : edit.index + edit.count - 1 > previous)
      )
        return false;
      dimensions[edit.axis] = previous;
    }
  }
  if (sheet.columnWidths !== undefined) {
    if (
      !record(sheet.columnWidths) ||
      !Object.entries(sheet.columnWidths).every(([label, width]) => {
        const position = cellPosition(`${label}1`);
        return position && position.column <= columns && finiteRange(width, 12, 4000);
      })
    )
      return false;
  }
  if (sheet.defaultRowHeight !== undefined && !positive(sheet.defaultRowHeight, 409.5))
    return false;
  if (
    sheet.rowHeights !== undefined &&
    (!record(sheet.rowHeights) ||
      !Object.entries(sheet.rowHeights).every(
        ([row, height]) => /^[1-9]\d*$/.test(row) && Number(row) <= rows && positive(height, 409.5)
      ))
  )
    return false;
  if (
    sheet.rowHeightModes !== undefined &&
    (!record(sheet.rowHeightModes) ||
      !Object.entries(sheet.rowHeightModes).every(
        ([row, mode]) =>
          /^[1-9]\d*$/.test(row) &&
          Number(row) <= rows &&
          (mode === 'auto' || mode === 'fixed')
      ))
  )
    return false;
  if (
    sheet.hiddenRows !== undefined &&
    (!Array.isArray(sheet.hiddenRows) ||
      sheet.hiddenRows.length > rows ||
      new Set(sheet.hiddenRows).size !== sheet.hiddenRows.length ||
      !sheet.hiddenRows.every((row) => integerRange(row, 1, rows)))
  )
    return false;
  if (
    sheet.hiddenColumns !== undefined &&
    (!Array.isArray(sheet.hiddenColumns) ||
      sheet.hiddenColumns.length > columns ||
      new Set(sheet.hiddenColumns).size !== sheet.hiddenColumns.length ||
      !sheet.hiddenColumns.every((label) => {
        if (typeof label !== 'string') return false;
        const position = cellPosition(`${label}1`);
        return !!position && position.column <= columns;
      }))
  )
    return false;
  const ranges: NonNullable<ReturnType<typeof cellRange>>[] = [];
  if (sheet.merges !== undefined) {
    if (!Array.isArray(sheet.merges) || sheet.merges.length > 1000) return false;
    for (const merge of sheet.merges) {
      const range = cellRange(merge, rows, columns);
      if (!range || (range.firstRow === range.lastRow && range.firstColumn === range.lastColumn))
        return false;
      if (ranges.some((other) => rangesOverlap(other, range))) return false;
      ranges.push(range);
    }
  }
  if (sheet.freeze !== undefined) {
    const freeze = sheet.freeze;
    if (
      !record(freeze) ||
      !integerRange(freeze.rows, 0, Math.min(100, rows - 1)) ||
      !integerRange(freeze.columns, 0, Math.min(20, columns - 1))
    )
      return false;
    const frozenRows = freeze.rows;
    const frozenColumns = freeze.columns;
    if (
      ranges.some(
        (range) =>
          (range.firstRow <= frozenRows && range.lastRow > frozenRows) ||
          (range.firstColumn <= frozenColumns && range.lastColumn > frozenColumns)
      )
    )
      return false;
  }
  if (sheet.filter !== undefined) {
    const filter = sheet.filter;
    if (!record(filter) || !record(filter.columns)) return false;
    const range = cellRange(filter.range, rows, columns);
    if (
      !range ||
      !Object.entries(filter.columns).every(([label, rule]) => {
        const position = cellPosition(`${label}1`);
        return (
          position &&
          position.column >= range.firstColumn &&
          position.column <= range.lastColumn &&
          record(rule) &&
          ['contains', 'equals', 'greater', 'less', 'fontColor', 'fillColor', 'values'].includes(
            String(rule.operator)
          ) &&
          typeof rule.value === 'string' &&
          rule.value.length <= 32767 &&
          (String(rule.operator) !== 'values' ||
            (rule.value === '' &&
              Array.isArray(rule.values) &&
              rule.values.length > 0 &&
              rule.values.length <= 200 &&
              new Set(rule.values as string[]).size === rule.values.length &&
              (rule.values as unknown[]).every(
                (entry) => typeof entry === 'string' && entry.length <= 1000
              ))) &&
          (String(rule.operator) === 'values' || rule.values === undefined) &&
          (!['fontColor', 'fillColor'].includes(String(rule.operator)) ||
            /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(rule.value)) &&
          (!['greater', 'less'].includes(String(rule.operator)) ||
            (rule.value.trim() !== '' && Number.isFinite(Number(rule.value))))
        );
      })
    )
      return false;
  }
  if (sheet.charts !== undefined) {
    if (!Array.isArray(sheet.charts) || sheet.charts.length > 20) return false;
    const ids = new Set<string>();
    if (
      !sheet.charts.every((chart) => {
        if (
          !record(chart) ||
          !nonempty(chart.id) ||
          ids.has(chart.id) ||
          !['bar', 'line'].includes(String(chart.type)) ||
          typeof chart.title !== 'string' ||
          chart.title.length > 256
        )
          return false;
        ids.add(chart.id);
        const range = cellRange(chart.range, rows, columns);
        return (
          !!range &&
          range.firstRow < range.lastRow &&
          range.firstColumn < range.lastColumn &&
          range.lastRow - range.firstRow <= 300 &&
          range.lastColumn - range.firstColumn <= 8
        );
      })
    )
      return false;
  }
  return true;
}

/** Checks persisted JSON before passing it to an editor. No HTML is evaluated. */
/** Source authority is re-read by the host; this validates the serializable operation contract. */
function nativePdfRecipe(value: unknown, sourceCount: number): boolean {
  if (!record(value) || value.version !== 1 || typeof value.sourceHash !== 'string' || !/^[a-f0-9]{64}$/.test(value.sourceHash) ||
    !arrayOf(value.bindings, 200, binding => record(binding) && integerRange(binding.sourcePage, 0, sourceCount - 1) && nonempty(binding.nativePageId) && nonempty(binding.uiPageId))) return false;
  const bindings = value.bindings as Record<string, unknown>[];
  if (bindings.length !== sourceCount || !bindings.every((binding, index) => binding.sourcePage === index) ||
    new Set(bindings.map(binding => binding.nativePageId)).size !== sourceCount || new Set(bindings.map(binding => binding.uiPageId)).size !== sourceCount) return false;
  const kinds = ['freeText', 'note', 'highlight', 'underline', 'strikeOut', 'squiggly', 'square', 'circle', 'line', 'polygon', 'polyLine', 'ink'];
  return arrayOf(value.commands, 100000, entry => {
    if (!record(entry)) return false;
    if (entry.type === 'layout') return Array.isArray(entry.targets) && entry.targets.length > 0 &&
      arrayOf(entry.targets, 200, target => record(target) && nonempty(target.id) && optionalText(target.fromPageId) && optionalText(target.copyGroup) &&
        (target.size === undefined || record(target.size) && [target.size.width, target.size.height].every(size => finiteRange(size, 1, 14400))) &&
        (target.fromPageId !== undefined || target.size !== undefined)) && new Set(entry.targets.map(target => (target as Record<string, unknown>).id)).size === entry.targets.length;
    if (entry.type !== 'mark' || !record(entry.command)) return false;
    const command = entry.command;
    if (command.type === 'remove') return nonempty(command.id);
    if (typeof command.now !== 'string' || !Number.isFinite(Date.parse(command.now))) return false;
    if (command.type === 'create') return record(command.annotation) && nonempty(command.annotation.id) && nonempty(command.annotation.pageId) && kinds.includes(String(command.annotation.kind)) &&
      Array.isArray(command.annotation.rect) && command.annotation.rect.length === 4 && command.annotation.rect.every(finite);
    if (command.type === 'update') return nonempty(command.id) && record(command.patch) && kinds.includes(String(command.patch.kind));
    if (command.type === 'reply') return nonempty(command.parentId) && record(command.reply) && nonempty(command.reply.id) && typeof command.reply.contents === 'string' && command.reply.contents.length <= 10000 && typeof command.reply.author === 'string' && optionalText(command.reply.pageId);
    return command.type === 'review' && nonempty(command.parentId) && nonempty(command.id) && ['resolved', 'open'].includes(String(command.status)) && typeof command.author === 'string';
  });
}

export function isOfficeStudioDocument(value: unknown): value is OfficeStudioDocument {
  if (
    !record(value) ||
    value.version !== 1 ||
    !nonempty(value.id) ||
    typeof value.name !== 'string'
  )
    return false;
  if (value.kind === 'word') {
    const page = value.page;
    const tab = value.defaultTabStop as number | undefined;
    if (
      !record(page) ||
      (page.size !== 'A4' && page.size !== 'Letter') ||
      (page.orientation !== 'portrait' && page.orientation !== 'landscape') ||
      page.margin === undefined ||
      (tab !== undefined && (!positive(tab, 1584) || !integer(tab * 20))) ||
      ![page.margin, page.headerDistance, page.footerDistance].every(
        (distance) => distance === undefined || finiteRange(distance, 0, 80)
      )
    )
      return false;
    let count = 0;
    const richNode = (node: unknown, depth: number): node is StudioRichNode => {
      if (!record(node) || depth > 64 || ++count > 50000 || typeof node.type !== 'string')
        return false;
      if (node.text !== undefined && typeof node.text !== 'string') return false;
      if (node.attrs !== undefined && !record(node.attrs)) return false;
      if (node.type === 'image') {
        if (
          !record(node.attrs) ||
          typeof node.attrs.src !== 'string' ||
          node.attrs.src.length > 8 * 1024 * 1024 ||
          !/^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(node.attrs.src) ||
          !optionalPositive(node.attrs.width, 10000) ||
          !optionalPositive(node.attrs.height, 10000) ||
          !optionalText(node.attrs.alt, 1000) ||
          !wordImageLayoutValid(node.attrs.layout)
        )
          return false;
      }
      if (
        node.marks !== undefined &&
        !arrayOf(
          node.marks,
          Infinity,
          (mark) =>
            record(mark) &&
            typeof mark.type === 'string' &&
            (mark.attrs === undefined || record(mark.attrs))
        )
      )
        return false;
      return (
        node.content === undefined ||
        arrayOf(node.content, Infinity, (child) => richNode(child, depth + 1))
      );
    };
    return (
      value.content !== undefined &&
      optionalBoolean(value.pageNumbers) &&
      [value.content, value.header, value.footer].every(
        (body) => body === undefined || (richNode(body, 0) && body.type === 'doc')
      )
    );
  }
  if (value.kind === 'excel') {
    const defaultFont = value.defaultFont;
    if (
      (defaultFont !== undefined &&
        (!record(defaultFont) ||
          typeof defaultFont.family !== 'string' ||
          typeof defaultFont.sizePt !== 'number' ||
          typeof defaultFont.bold !== 'boolean' ||
          typeof defaultFont.italic !== 'boolean' ||
          sheetTextFormatError({ fontFamily: defaultFont.family, fontSize: defaultFont.sizePt }) !== 0)) ||
      !Array.isArray(value.sheets) ||
      value.sheets.length < 1 ||
      value.sheets.length > 32 ||
      typeof value.activeSheetId !== 'string'
    )
      return false;
    const ids = new Set<string>();
    const names = new Set<string>();
    let storedCells = 0;
    let storedHyperlinks = 0;
    return (
      value.sheets.every((sheet) => {
        if (
          !record(sheet) ||
          typeof sheet.id !== 'string' ||
          ids.has(sheet.id) ||
          !nonempty(sheet.name) ||
          sheet.name.length > 31 ||
          /[\\/*?:[\]]/.test(sheet.name) ||
          names.has(sheet.name.toLocaleLowerCase()) ||
          !integerRange(sheet.rowCount, 1, 10000) ||
          !integerRange(sheet.columnCount, 1, 256) ||
          !record(sheet.cells)
        )
          return false;
        ids.add(sheet.id);
        names.add(sheet.name.toLocaleLowerCase());
        if (sheet.view !== undefined &&
          (!record(sheet.view) || !integerRange(sheet.view.zoom, 10, 400) ||
            typeof sheet.view.showGridLines !== 'boolean' || typeof sheet.view.showRowColHeaders !== 'boolean'))
          return false;
        if (sheet.hyperlinks !== undefined) {
          if (!Array.isArray(sheet.hyperlinks) || !sheet.hyperlinks.every(studioIsSheetHyperlink))
            return false;
          const linkIds = new Set(sheet.hyperlinks.map((link) => link.id));
          storedHyperlinks += sheet.hyperlinks.length;
          if (linkIds.size !== sheet.hyperlinks.length || storedHyperlinks > 100000) return false;
        }
        const entries = Object.entries(sheet.cells);
        const rows = sheet.rowCount;
        const columns = sheet.columnCount;
        storedCells += entries.length;
        return (
          storedCells <= 100000 &&
          sheetFeatures(sheet, rows, columns) &&
          entries.every(([address, cell]) => {
            const position = cellPosition(address);
            if (!position || !record(cell)) return false;
            const valueType = cell.valueType;
            return (
              position.row <= rows &&
              position.column <= columns &&
              typeof cell.input === 'string' &&
              cell.input.length <= 32767 &&
              (valueType === undefined ||
                valueType === 'number' ||
                valueType === 'boolean' ||
                valueType === 'text') &&
              (cell.array === undefined ||
                (record(cell.array) &&
                  cell.input.startsWith('=') &&
                  (cell.array.type === 'dynamic'
                    ? Object.keys(cell.array).every((key) => key === 'type')
                    : cell.array.type === 'fixed' &&
                      typeof cell.array.range === 'string' &&
                      !!cellRange(cell.array.range, rows, columns) &&
                      cell.array.range.split(':')[0] === address))) &&
              optionalBoolean(cell.underline) &&
              studioCellStyleValid(cell) &&
              [cell.color, cell.background, cell.numberFormat].every((item) =>
                optionalText(item, 256)
              )
            );
          })
        );
      }) &&
      ids.has(value.activeSheetId) &&
      sheetValidationSources(value.sheets)
    );
  }
  if (value.kind !== 'pdf' || !integerRange(value.pageCount, 1, 200) || !record(value.rotations))
    return false;
  const pageCount = value.pageCount;
  if (value.sourcePageCount !== undefined && !integerRange(value.sourcePageCount, 1, 200))
    return false;
  if (value.nativeAnnotations !== undefined && !nativePdfRecipe(value.nativeAnnotations, Number(value.sourcePageCount ?? pageCount))) return false;
  if (value.pages !== undefined) {
    if (!Array.isArray(value.pages) || value.pages.length !== pageCount) return false;
    const pageIds = new Set<string>(),
      sourceCount = value.sourcePageCount ?? pageCount;
    for (const page of value.pages) {
      if (!record(page) || !nonempty(page.id) || pageIds.has(page.id)) return false;
      pageIds.add(page.id);
      if (page.copyGroup !== undefined && !nonempty(page.copyGroup)) return false;
      if (page.originPageId !== undefined && !nonempty(page.originPageId)) return false;
      if (
        page.sourcePage !== undefined &&
        !integerRange(page.sourcePage, 0, (sourceCount as number) - 1)
      )
        return false;
      if (page.size !== undefined || page.sourcePage === undefined) {
        if (
          !record(page.size) ||
          ![page.size.width, page.size.height].every((size) => finiteRange(size, 1, 14400))
        )
          return false;
      }
      if (
        page.bounds !== undefined &&
        (!record(page.bounds) ||
          ![page.bounds.left, page.bounds.bottom, page.bounds.right, page.bounds.top].every(
            finite
          ) ||
          (page.bounds.right as number) <= (page.bounds.left as number) ||
          (page.bounds.top as number) <= (page.bounds.bottom as number))
      )
        return false;
    }
  }
  const markIds = new Set<string>();
  const fieldNames = new Set<string>();
  let storedPoints = 0;
  return (
    arrayOf(value.marks, value.nativeAnnotations === undefined ? 2000 : 10000, (mark) => {
      if (!(
        record(mark) &&
        nonempty(mark.id) &&
        (mark.nativeId === undefined || value.nativeAnnotations !== undefined && nonempty(mark.nativeId)) &&
        !markIds.has(mark.id) &&
        integerRange(mark.page, 0, pageCount - 1) &&
        ['text', 'highlight', 'rectangle', 'ink'].includes(String(mark.type)) &&
        [mark.x, mark.y].every(finite) &&
        positive(mark.size, 240) &&
        typeof mark.text === 'string' &&
        mark.text.length <= 10000 &&
        optionalPositive(mark.width) &&
        optionalPositive(mark.height) &&
        (mark.nativeId === undefined ? optionalPositive(mark.lineWidth, 40) &&
          (mark.lineWidth === undefined || (mark.lineWidth as number) >= 0.5)
          : mark.lineWidth === undefined || finiteRange(mark.lineWidth, 0, 72)) &&
        optionalText(mark.color, 256)
      ))
        return false;
      markIds.add(mark.id);
      if (mark.type === 'rectangle' && (!finite(mark.width) || !finite(mark.height))) return false;
      if (mark.points !== undefined || mark.type === 'ink') {
        if (!Array.isArray(mark.points) || mark.points.length < 2 || mark.points.length > 10000)
          return false;
        storedPoints += mark.points.length;
        if (
          storedPoints > 100000 ||
          !mark.points.every(
            (point) => Array.isArray(point) && point.length === 2 && point.every(finite)
          )
        )
          return false;
      }
      return true;
    }) &&
    arrayOf(value.fields, 2000, (field) => {
      if (!(
        record(field) &&
        nonempty(field.name) &&
        !fieldNames.has(field.name) &&
        ['text', 'checkbox', 'choice', 'image', 'opaque'].includes(String(field.type)) &&
        (typeof field.value === 'string' || typeof field.value === 'boolean') &&
        typeof field.readOnly === 'boolean'
      ))
        return false;
      fieldNames.add(field.name);
      if (field.type === 'opaque') {
        if (field.readOnly !== true || field.value !== '' ||
          [field.design, field.options, field.multiline, field.selectedValues, field.optionLabels, field.multiSelect].some((entry) => entry !== undefined) ||
          ![field.nativeType, field.passiveReason].every(nonempty) ||
          typeof field.nativeValueHash !== 'string' || !/^[a-f0-9]{64}$/.test(field.nativeValueHash)) return false;
      } else if ([field.nativeType, field.passiveReason, field.nativeValueHash].some((entry) => entry !== undefined)) return false;
      if (
        field.options !== undefined &&
        !arrayOf(field.options, 10000, (option) => typeof option === 'string')
      )
        return false;
      if (!optionalBoolean(field.multiline)) return false;
      if (!optionalBoolean(field.multiSelect)) return false;
      if (
        field.optionLabels !== undefined &&
        (!record(field.optionLabels) ||
          Object.entries(field.optionLabels).some(
            ([key, label]) =>
              typeof label !== 'string' ||
              label.length > 1000 ||
              !(field.options as string[] | undefined)?.includes(key)
          ))
      )
        return false;
      if (
        field.design !== undefined &&
        (!record(field.design) ||
          !['text', 'date', 'image', 'checkbox', 'radio', 'dropdown', 'list'].includes(
            String(field.design.kind)
          ))
      )
        return false;
      if (
        field.selectedValues !== undefined &&
        !arrayOf(
          field.selectedValues,
          Infinity,
          (entry) =>
            typeof entry === 'string' && !!(field.options as string[] | undefined)?.includes(entry)
        )
      )
        return false;
      return [field.widgets, field.hiddenWidgets].every(
        (widgets, hidden) =>
          widgets === undefined ||
          arrayOf(
            widgets,
            2000,
            (widget) =>
              record(widget) &&
              integerRange(widget.page, 0, pageCount - 1) &&
              [widget.x, widget.y].every(finite) &&
              [widget.width, widget.height].every(
                (size) => finite(size) && (hidden ? size >= 0 : size > 0)
              ) &&
              (widget.rotation === undefined ||
                (finite(widget.rotation) && widget.rotation % 90 === 0)) &&
              optionalText(widget.option) &&
              (widget.flags === undefined ||
                (integerRange(widget.flags, 0, 4294967295) &&
                  (!!(widget.flags & (1 | 2 | 32)) || widget.width === 0 || widget.height === 0) === !!hidden))
          )
      );
    }) &&
    (value.removedFields === undefined || arrayOf(value.removedFields, 2000, nonempty)) &&
    Object.entries(value.rotations).every(
      ([page, rotation]) =>
        /^\d+$/.test(page) && Number(page) < pageCount && finite(rotation) && rotation % 90 === 0
    )
  );
}
