import type { StudioRichNode } from './studio-types';
import { wordTabStops, type StudioWordTabStop } from './studio-word-tabs';

export type WordNumberFormat =
  'decimal' | 'upperRoman' | 'lowerRoman' | 'upperLetter' | 'lowerLetter' | 'bullet';
export type StudioWordNumberingTabStop = Omit<StudioWordTabStop, 'alignment'> & {
  alignment: StudioWordTabStop['alignment'] | 'num';
};
export function wordNumberingTabStops(value: unknown): StudioWordNumberingTabStop[] {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error('编号制表位无效。');
  const numPositions = new Set(
    value.filter((entry) => entry?.alignment === 'num').map((entry) => entry.position)
  );
  return wordTabStops(
    value.map((entry) => (entry?.alignment === 'num' ? { ...entry, alignment: 'left' } : entry))
  ).map((entry) => ({
    ...entry,
    alignment: numPositions.has(entry.position) ? 'num' : entry.alignment,
  }));
}
export interface StudioWordNumberingLevel {
  format: WordNumberFormat;
  text: string;
  start: number;
  /** null never restarts; omitted restarts after the previous level. */
  restartAfter?: number | null;
  legal?: boolean;
  suffix?: 'tab' | 'space' | 'nothing';
  paragraphStyle?: string;
  indentLeft?: number;
  indentFirstLine?: number;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  alignment?: 'left' | 'center' | 'right';
  tabStops?: StudioWordNumberingTabStop[];
}
export interface StudioWordNumberingDefinition {
  id: string;
  name: string;
  levels: StudioWordNumberingLevel[];
}
export interface StudioWordNumberingInstance {
  id: string;
  definitionId: string;
  startOverrides?: Record<string, number>;
}
export interface StudioWordNumberingRef {
  instanceId: string;
  level: number;
}
export interface WordNumberingCatalog {
  definitions: StudioWordNumberingDefinition[];
  instances: StudioWordNumberingInstance[];
}
const formats: readonly WordNumberFormat[] = [
  'decimal',
  'upperRoman',
  'lowerRoman',
  'upperLetter',
  'lowerLetter',
  'bullet',
];
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const id = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z][\w-]{0,95}$/.test(value);
const integer = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
const text = (value: unknown, max: number): value is string =>
  typeof value === 'string' &&
  value.length <= max &&
  Array.from(value).every((character) => {
    const point = character.codePointAt(0)!;
    return (
      point >= 32 &&
      point !== 127 &&
      point !== 0xfffe &&
      point !== 0xffff &&
      !(point >= 0xd800 && point <= 0xdfff)
    );
  });
const points = (value: unknown, min = -1584, max = 1584) =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max &&
  Math.abs(value * 20 - Math.round(value * 20)) < 1e-6;

export function wordDefaultNumbering(
  format: WordNumberFormat = 'decimal'
): StudioWordNumberingLevel[] {
  return Array.from({ length: 9 }, (_, level) => ({
    format,
    text: format === 'bullet' ? '•' : `%${level + 1}.`,
    start: 1,
    indentLeft: (level + 1) * 36,
    indentFirstLine: -18,
    suffix: 'tab',
  }));
}

/** Validate the whole catalog before a command or native writer changes anything. */
export function wordNumberingCatalog(
  definitions: unknown,
  instances: unknown
): WordNumberingCatalog {
  if (definitions == null) definitions = [];
  if (instances == null) instances = [];
  if (
    !Array.isArray(definitions) ||
    definitions.length > 100 ||
    !Array.isArray(instances) ||
    instances.length > 1000
  )
    throw new Error('编号最多支持 100 个定义、1000 个实例。');
  const definitionIds = new Set<string>(),
    names = new Set<string>();
  const checked: StudioWordNumberingDefinition[] = definitions.map((definition) => {
    if (
      !record(definition) ||
      !id(definition.id) ||
      definitionIds.has(definition.id) ||
      !text(definition.name, 80) ||
      !definition.name.trim() ||
      names.has(definition.name.trim().toLowerCase()) ||
      !Array.isArray(definition.levels) ||
      definition.levels.length < 1 ||
      definition.levels.length > 9 ||
      Object.keys(definition).some((key) => !['id', 'name', 'levels'].includes(key))
    )
      throw new Error('编号定义的标识、名称或层级无效/重复。');
    definitionIds.add(definition.id);
    names.add(definition.name.trim().toLowerCase());
    const levels = definition.levels.map((level, index) => {
      if (
        !record(level) ||
        !formats.includes(level.format as WordNumberFormat) ||
        !integer(level.start, 1, 100000) ||
        !text(level.text, 120) ||
        !level.text ||
        Object.keys(level).some(
          (key) =>
            ![
              'format',
              'text',
              'start',
              'restartAfter',
              'legal',
              'suffix',
              'paragraphStyle',
              'indentLeft',
              'indentFirstLine',
              'fontFamily',
              'fontSize',
              'color',
              'bold',
              'italic',
              'alignment',
              'tabStops',
            ].includes(key)
        )
      )
        throw new Error('编号层级的格式、模板或起始值无效。');
      const tokens = [...level.text.matchAll(/%(\d+)/g)];
      if (
        tokens.some((token) => Number(token[1]) < 1 || Number(token[1]) > index + 1) ||
        (level.format !== 'bullet' && !tokens.some((token) => Number(token[1]) === index + 1))
      )
        throw new Error(`第 ${index + 1} 级模板必须包含 %${index + 1}，且不能引用更低层级。`);
      if (
        level.restartAfter !== undefined &&
        level.restartAfter !== null &&
        !integer(level.restartAfter, 0, index - 1)
      )
        throw new Error('编号重启依赖必须是更高层级。');
      if (
        level.suffix !== undefined &&
        !['tab', 'space', 'nothing'].includes(level.suffix as string)
      )
        throw new Error('编号后缀无效。');
      if (level.paragraphStyle !== undefined && !id(level.paragraphStyle))
        throw new Error('编号关联样式无效。');
      if (
        level.alignment !== undefined &&
        !['left', 'center', 'right'].includes(level.alignment as string)
      )
        throw new Error('编号对齐方式无效。');
      if (level.tabStops !== undefined) wordNumberingTabStops(level.tabStops);
      for (const key of ['indentLeft', 'indentFirstLine'])
        if (level[key] !== undefined && !points(level[key]))
          throw new Error('编号缩进须为 ±1584pt，步长 0.05pt。');
      if (
        level.fontFamily !== undefined &&
        (!text(level.fontFamily, 255) || !level.fontFamily.trim())
      )
        throw new Error('编号字体名称无效。');
      if (
        level.fontSize !== undefined &&
        (!points(level.fontSize, 1, 409) || !Number.isInteger(Number(level.fontSize) * 2))
      )
        throw new Error('编号字号无效。');
      if (
        level.color !== undefined &&
        (typeof level.color !== 'string' || !/^#[\da-f]{6}$/i.test(level.color))
      )
        throw new Error('编号颜色无效。');
      for (const key of ['legal', 'bold', 'italic'])
        if (level[key] !== undefined && typeof level[key] !== 'boolean')
          throw new Error('编号格式标记无效。');
      return { ...level } as unknown as StudioWordNumberingLevel;
    });
    return { id: definition.id, name: definition.name.trim(), levels };
  });
  const instanceIds = new Set<string>();
  const linked = instances.map((instance) => {
    if (
      !record(instance) ||
      !id(instance.id) ||
      instanceIds.has(instance.id) ||
      !definitionIds.has(String(instance.definitionId)) ||
      typeof instance.definitionId !== 'string' ||
      Object.keys(instance).some((key) => !['id', 'definitionId', 'startOverrides'].includes(key))
    )
      throw new Error('编号实例标识重复或引用的定义不存在。');
    instanceIds.add(instance.id);
    const definition = checked.find((entry) => entry.id === instance.definitionId)!;
    if (
      instance.startOverrides !== undefined &&
      (!record(instance.startOverrides) ||
        Object.entries(instance.startOverrides).some(
          ([key, value]) =>
            !/^[0-8]$/.test(key) ||
            Number(key) >= definition.levels.length ||
            !integer(value, 1, 100000)
        ))
    )
      throw new Error('编号起始值覆盖无效。');
    return {
      id: instance.id,
      definitionId: instance.definitionId,
      ...(instance.startOverrides !== undefined
        ? { startOverrides: { ...(instance.startOverrides as Record<string, number>) } }
        : {}),
    };
  });
  return { definitions: checked, instances: linked };
}

export function wordNumberRef(
  value: unknown,
  catalog: WordNumberingCatalog
): StudioWordNumberingRef | null {
  if (value == null) return null;
  if (
    !record(value) ||
    typeof value.instanceId !== 'string' ||
    !integer(value.level, 0, 8) ||
    Object.keys(value).some((key) => !['instanceId', 'level'].includes(key))
  )
    throw new Error('段落编号引用无效。');
  const instance = catalog.instances.find((entry) => entry.id === value.instanceId);
  const definition = catalog.definitions.find((entry) => entry.id === instance?.definitionId);
  if (!definition || value.level >= definition.levels.length)
    throw new Error('段落引用的编号实例或层级不存在。');
  return { instanceId: value.instanceId, level: value.level };
}

export function wordFormatNumber(value: number, format: WordNumberFormat) {
  if (!integer(value, 1, 100000)) throw new Error('编号值超出 1–100000。');
  if (format === 'decimal' || format === 'bullet') return String(value);
  if (format === 'upperLetter' || format === 'lowerLetter') {
    let result = '';
    while (value > 0) {
      value--;
      result = String.fromCharCode(65 + (value % 26)) + result;
      value = Math.floor(value / 26);
    }
    return format === 'lowerLetter' ? result.toLowerCase() : result;
  }
  const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const symbols = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let result = '';
  values.forEach((amount, index) => {
    while (value >= amount) {
      result += symbols[index];
      value -= amount;
    }
  });
  return format === 'lowerRoman' ? result.toLowerCase() : result;
}

export interface WordNumberingLabel {
  node: StudioRichNode;
  position: number;
  ref: StudioWordNumberingRef;
  definition: StudioWordNumberingDefinition;
  text: string;
  value: number;
  level: StudioWordNumberingLevel;
}

export function wordNodeNumbering(
  node: StudioRichNode,
  catalog: WordNumberingCatalog
): StudioWordNumberingRef | null {
  if (node.attrs?.numberingDisabled === true) return null;
  if (node.attrs?.numbering != null) return wordNumberRef(node.attrs.numbering, catalog);
  const style =
    typeof node.attrs?.paragraphStyle === 'string'
      ? node.attrs.paragraphStyle
      : node.type === 'heading'
        ? `heading-${node.attrs?.level ?? 1}`
        : 'paragraph';
  const matches = catalog.definitions
    .flatMap((definition) =>
      definition.levels.map((level, index) => ({ definition, level, index }))
    )
    .filter((entry) => entry.level.paragraphStyle === style);
  if (matches.length > 1) throw new Error('同一个段落样式不能关联多个编号层级。');
  if (!matches.length) return null;
  const { definition, index } = matches[0];
  const instance = catalog.instances.find((entry) => entry.definitionId === definition.id);
  return instance ? { instanceId: instance.id, level: index } : null;
}

/** Count by instance, not by contiguous DOM list, so interrupted lists continue natively. */
export function wordNumberingLabels(
  root: StudioRichNode,
  catalog: WordNumberingCatalog
): WordNumberingLabel[] {
  const counters = new Map<string, (number | undefined)[]>(),
    result: WordNumberingLabel[] = [];
  const walk = (node: StudioRichNode, position: number) => {
    if (node.type === 'paragraph' || node.type === 'heading') {
      const ref = wordNodeNumbering(node, catalog);
      if (ref) {
        const instance = catalog.instances.find((entry) => entry.id === ref.instanceId)!;
        const definition = catalog.definitions.find((entry) => entry.id === instance.definitionId)!;
        const values = counters.get(instance.id) ?? [];
        const level = definition.levels[ref.level];
        const start = (index: number) =>
          instance.startOverrides?.[index] ?? definition.levels[index].start;
        const value = values[ref.level] === undefined ? start(ref.level) : values[ref.level]! + 1;
        if (value > 100000) throw new Error('编号计数超过 100000。');
        values[ref.level] = value;
        for (let deeper = ref.level + 1; deeper < definition.levels.length; deeper++) {
          const restart =
            definition.levels[deeper].restartAfter === undefined
              ? deeper - 1
              : definition.levels[deeper].restartAfter;
          if (restart !== null && restart !== undefined && ref.level <= restart)
            values[deeper] = undefined;
        }
        counters.set(instance.id, values);
        const label = level.text.replace(/%([1-9])/g, (_, key: string) => {
          const index = Number(key) - 1;
          return wordFormatNumber(
            values[index] ?? start(index),
            level.legal ? 'decimal' : definition.levels[index].format
          );
        });
        result.push({ node, position, ref, definition, text: label, value, level });
      }
    }
    let offset = node.type === 'doc' ? 0 : position + 1;
    for (const child of node.content ?? []) {
      walk(child, offset);
      offset += wordNodeSize(child);
    }
  };
  walk(root, -1);
  return result;
}

export function wordNodeSize(node: StudioRichNode): number {
  return node.type === 'text'
    ? (node.text?.length ?? 0)
    : node.content
      ? 2 + node.content.reduce((sum, child) => sum + wordNodeSize(child), 0)
      : node.type === 'paragraph' || node.type === 'heading'
        ? 2
        : 1;
}

/** Keep legacy list trees, but attach stable native references before they enter an editor. */
export function materializeWordNumbering(
  root: StudioRichNode,
  shared?: WordNumberingCatalog
): StudioRichNode {
  const catalog = wordNumberingCatalog(
    shared?.definitions ?? root.attrs?.numberingDefinitions,
    shared?.instances ?? root.attrs?.numberingInstances
  );
  const used = new Set([
    ...catalog.definitions.map((entry) => entry.id),
    ...catalog.instances.map((entry) => entry.id),
  ]);
  let next = 1;
  const fresh = (prefix: string) => {
    while (used.has(`${prefix}-${next}`)) next++;
    const value = `${prefix}-${next++}`;
    used.add(value);
    return value;
  };
  const walk = (
    node: StudioRichNode,
    list?: { instance: StudioWordNumberingInstance; depth: number; values: (number | undefined)[] }
  ) => {
    let result = node;
    let current = list;
    if (node.type === 'orderedList' || node.type === 'bulletList') {
      if (node.attrs?.numberingInstanceId != null) {
        const instance = catalog.instances.find(
          (entry) => entry.id === node.attrs?.numberingInstanceId
        );
        if (!instance) throw new Error('列表编号实例不存在。');
        const depth = (list?.depth ?? -1) + 1;
        if (depth > 8) throw new Error('编号最多支持 9 级。');
        current = {
          instance,
          depth,
          values: [...(list?.values ?? [])],
        };
      } else {
        const format =
          node.type === 'bulletList'
            ? 'bullet'
            : (
                {
                  a: 'lowerLetter',
                  A: 'upperLetter',
                  i: 'lowerRoman',
                  I: 'upperRoman',
                  '1': 'decimal',
                } as Record<string, WordNumberFormat>
              )[String(node.attrs?.type ?? '1')];
        if (!format) throw new Error('列表格式无效。');
        const depth = (list?.depth ?? -1) + 1;
        if (depth > 8) throw new Error('编号最多支持 9 级。');
        const parent = catalog.definitions.find(
          (entry) => entry.id === list?.instance.definitionId
        );
        if (
          parent &&
          parent.levels[depth]?.format === format &&
          Number(node.attrs?.start ?? 1) === 1
        ) {
          current = { instance: list!.instance, depth, values: [...list!.values] };
          result = { ...node, attrs: { ...node.attrs, numberingInstanceId: current.instance.id } };
        } else {
          const definitionId = fresh('legacy-numbering');
          const levels = parent
            ? parent.levels.map((level) => ({ ...level }))
            : wordDefaultNumbering(format);
          if (!parent && node.type === 'orderedList')
            levels.forEach((level, index) => {
              level.text =
                Array.from({ length: index + 1 }, (_, token) => `%${token + 1}`).join('.') + '.';
            });
          levels[depth].format = format;
          levels[depth].text =
            format === 'bullet'
              ? '•'
              : Array.from({ length: depth + 1 }, (_, index) => `%${index + 1}`)
                  .filter((_, index) => levels[index].format !== 'bullet')
                  .join('.') + '.';
          levels[depth].start = Number(node.attrs?.start ?? 1);
          const existing = catalog.definitions.find(
            (entry) => JSON.stringify(entry.levels) === JSON.stringify(levels)
          );
          const definition: StudioWordNumberingDefinition = existing ?? {
            id: definitionId,
            name: `导入列表 ${definitionId}`,
            levels,
          };
          const inherited = Object.fromEntries(
            (list?.values ?? [])
              .slice(0, depth)
              .flatMap((value, index) => (value === undefined ? [] : [[String(index), value]]))
          );
          const instance: StudioWordNumberingInstance = {
            id: fresh('legacy-instance'),
            definitionId: definition.id,
            ...(Object.keys(inherited).length ? { startOverrides: inherited } : {}),
          };
          if (!existing) catalog.definitions.push(definition);
          catalog.instances.push(instance);
          current = { instance, depth, values: [...(list?.values ?? [])] };
          result = { ...node, attrs: { ...node.attrs, numberingInstanceId: instance.id } };
        }
      }
    }
    if (node.type === 'listItem' && current) {
      const definition = catalog.definitions.find(
        (entry) => entry.id === current!.instance.definitionId
      )!;
      current.values[current.depth] =
        current.values[current.depth] === undefined
          ? (current.instance.startOverrides?.[current.depth] ??
            definition.levels[current.depth].start)
          : current.values[current.depth]! + 1;
    }
    if (
      (node.type === 'paragraph' || node.type === 'heading') &&
      current &&
      (node.attrs?.numbering == null ||
        (node.attrs.numbering as StudioWordNumberingRef).instanceId === current.instance.id) &&
      node.attrs?.numberingDisabled !== true
    )
      result = {
        ...result,
        attrs: {
          ...result.attrs,
          numbering: { instanceId: current.instance.id, level: current.depth },
        },
      };
    if (result.content)
      result = {
        ...result,
        content: result.content.map((child, index) =>
          walk(
            child,
            result.type === 'listItem' &&
              index > 0 &&
              !['orderedList', 'bulletList'].includes(child.type)
              ? undefined
              : result.type === 'table'
                ? undefined
                : current
          )
        ),
      };
    return result;
  };
  const result = walk(root);
  wordNumberingCatalog(catalog.definitions, catalog.instances);
  wordNumberingLabels(result, catalog);
  if (!catalog.definitions.length && !catalog.instances.length) return result;
  return {
    ...result,
    attrs: {
      ...result.attrs,
      numberingDefinitions: catalog.definitions,
      numberingInstances: catalog.instances,
    },
  };
}
