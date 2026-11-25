import type { NumberingDefinition, ILevelsOptions } from 'docx';
import {
  wordNumberingCatalog,
  wordNumberRef,
  wordNumberingTabStops,
  type WordNumberingCatalog,
  type StudioWordNumberingLevel,
} from '../../../../../packages/ui/src/components/OfficeStudio/studio-word-numbering';
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const MC = 'http://schemas.openxmlformats.org/markup-compatibility/2006';
const Z = 'urn:zuvi:word-numbering:1';
const children = (node?: Element) =>
  node ? Array.from(node.children).filter((child) => child.namespaceURI === W) : [];
const child = (node: Element | undefined, name: string) =>
  children(node).find((entry) => entry.localName === name);
const attr = (node: Element | undefined, name = 'val') => node?.getAttributeNS(W, name) ?? '';
const value = (node: Element | undefined, name: string, fallback = '') =>
  attr(child(node, name)) || fallback;
function numeric(raw: string, label: string, min = 0, max = 100000) {
  if (
    !/^-?\d+$/.test(raw) ||
    !Number.isSafeInteger(Number(raw)) ||
    Number(raw) < min ||
    Number(raw) > max
  )
    throw new Error(`原生编号的${label}无效。`);
  return Number(raw);
}
const enabled = (node?: Element) => !!node && !['0', 'false', 'off'].includes(attr(node));
function readLevel(
  node: Element,
  index: number,
  mapStyle: (native: string) => string | undefined
): StudioWordNumberingLevel {
  const font = child(node, 'rPr'),
    paragraph = child(node, 'pPr'),
    indent = child(paragraph, 'ind');
  for (const entry of children(node))
    if (
      ![
        'start',
        'numFmt',
        'lvlText',
        'lvlRestart',
        'isLgl',
        'suff',
        'pStyle',
        'lvlJc',
        'pPr',
        'rPr',
        'tentative',
      ].includes(entry.localName)
    )
      throw new Error(`尚未支持编号层级的 ${entry.localName}。`);
  for (const entry of children(font))
    if (!['rFonts', 'sz', 'szCs', 'b', 'bCs', 'i', 'iCs', 'color'].includes(entry.localName))
      throw new Error(`尚未支持编号字符属性 ${entry.localName}。`);
  for (const [normal, complex] of [
    ['b', 'bCs'],
    ['i', 'iCs'],
  ])
    if (child(font, complex) && enabled(child(font, normal)) !== enabled(child(font, complex)))
      throw new Error('尚未支持编号的独立复杂文字格式。');
  for (const entry of children(paragraph))
    if (!['ind', 'tabs'].includes(entry.localName))
      throw new Error(`尚未支持编号段落属性 ${entry.localName}。`);
  const format = value(node, 'numFmt');
  const restart = child(node, 'lvlRestart'),
    linked = value(node, 'pStyle');
  const linkedStyle = linked ? mapStyle(linked) : undefined;
  if (linked && !linkedStyle) throw new Error(`编号关联的样式 ${linked} 不存在。`);
  const fontName =
    attr(child(font, 'rFonts'), 'ascii') ||
    attr(child(font, 'rFonts'), 'hAnsi') ||
    attr(child(font, 'rFonts'), 'eastAsia');
  const left = attr(indent, 'start') || attr(indent, 'left'),
    first = attr(indent, 'firstLine'),
    hanging = attr(indent, 'hanging');
  const color = value(font, 'color');
  const alignment = value(node, 'lvlJc');
  const tabs = child(paragraph, 'tabs');
  const result = {
    format,
    text: value(node, 'lvlText'),
    start: numeric(value(node, 'start', '1'), '起始值', 1),
    ...(restart
      ? {
          restartAfter:
            attr(restart) === '0' ? null : numeric(attr(restart), '重启层级', 1, index) - 1,
        }
      : {}),
    ...(child(node, 'isLgl') ? { legal: enabled(child(node, 'isLgl')) } : {}),
    ...(child(node, 'suff') ? { suffix: value(node, 'suff') } : {}),
    ...(linkedStyle ? { paragraphStyle: linkedStyle } : {}),
    ...(alignment
      ? {
          alignment:
            ({ start: 'left', end: 'right' } as Record<string, string>)[alignment] || alignment,
        }
      : {}),
    ...(tabs
      ? {
          tabStops: wordNumberingTabStops(
            children(tabs).map((tab) => ({
              position: numeric(attr(tab, 'pos'), '制表位', 0, 31680) / 20,
              alignment: attr(tab),
              ...(attr(tab, 'leader') ? { leader: attr(tab, 'leader') } : {}),
            }))
          ),
        }
      : {}),
    ...(left ? { indentLeft: numeric(left, '左缩进', -31680, 31680) / 20 } : {}),
    ...(hanging
      ? { indentFirstLine: -numeric(hanging, '悬挂缩进', 0, 31680) / 20 }
      : first
        ? { indentFirstLine: numeric(first, '首行缩进', -31680, 31680) / 20 }
        : {}),
    ...(fontName ? { fontFamily: fontName } : {}),
    ...(child(font, 'sz') ? { fontSize: numeric(value(font, 'sz'), '字号', 2, 818) / 2 } : {}),
    ...(child(font, 'b') ? { bold: enabled(child(font, 'b')) } : {}),
    ...(child(font, 'i') ? { italic: enabled(child(font, 'i')) } : {}),
    ...(color && color !== 'auto' ? { color: `#${color}` } : {}),
  } as StudioWordNumberingLevel;
  return result;
}

export interface NativeWordNumbering {
  catalog: WordNumberingCatalog;
  references: Map<string, { instanceId: string; definitionId: string }>;
}
export function readNativeWordNumbering(
  xml: XMLDocument | undefined,
  mapStyle: (native: string) => string | undefined,
  usedNumbers?: ReadonlySet<string>
): NativeWordNumbering {
  const catalog: WordNumberingCatalog = { definitions: [], instances: [] },
    references = new Map<string, { instanceId: string; definitionId: string }>();
  if (!xml) return { catalog, references };
  const root = xml.documentElement;
  const nums = children(root).filter(
    (entry) =>
      entry.localName === 'num' &&
      (!usedNumbers || usedNumbers.has(attr(entry, 'numId')) || entry.hasAttributeNS(Z, 'id'))
  );
  const required = new Set(nums.map((entry) => value(entry, 'abstractNumId')));
  const definitions = new Map<string, string>(),
    names = new Set<string>();
  for (const node of children(root).filter(
    (entry) =>
      entry.localName === 'abstractNum' &&
      (required.has(attr(entry, 'abstractNumId')) || entry.hasAttributeNS(Z, 'id'))
  )) {
    const nativeId = attr(node, 'abstractNumId'),
      id = node.getAttributeNS(Z, 'id') || `native-numbering-${nativeId}`;
    const rawLevels = children(node)
      .filter((entry) => entry.localName === 'lvl')
      .sort((a, b) => Number(attr(a, 'ilvl')) - Number(attr(b, 'ilvl')));
    if (
      !rawLevels.length ||
      rawLevels.some((entry, index) => attr(entry, 'ilvl') !== String(index))
    )
      throw new Error('原生编号层级必须从第 1 级连续定义。');
    let name = node.getAttributeNS(Z, 'name') || value(node, 'name', `编号 ${nativeId}`);
    const initial = name;
    let suffix = 2;
    while (names.has(name.toLowerCase())) name = `${initial} (${suffix++})`;
    names.add(name.toLowerCase());
    catalog.definitions.push({
      id,
      name,
      levels: rawLevels.map((entry, index) => readLevel(entry, index, mapStyle)),
    });
    definitions.set(nativeId, id);
  }
  for (const node of nums) {
    const nativeId = attr(node, 'numId'),
      id = node.getAttributeNS(Z, 'id') || `native-instance-${nativeId}`;
    let definitionId = definitions.get(value(node, 'abstractNumId'));
    if (!definitionId) throw new Error('原生编号实例引用的定义不存在。');
    const overrides: Record<string, number> = {};
    for (const override of children(node).filter((entry) => entry.localName === 'lvlOverride')) {
      const index = numeric(attr(override, 'ilvl'), '覆盖层级', 0, 8),
        level = child(override, 'lvl');
      if (level) {
        const base = catalog.definitions.find((entry) => entry.id === definitionId)!;
        if (index >= base.levels.length) throw new Error('原生编号覆盖层级不存在。');
        const copy = {
          ...base,
          id: `${base.id}-override-${nativeId}`,
          name: `${base.name} (${nativeId})`,
          levels: base.levels.map((entry) => ({ ...entry })),
        };
        copy.levels[index] = readLevel(level, index, mapStyle);
        catalog.definitions.push(copy);
        definitionId = copy.id;
      }
      if (child(override, 'startOverride'))
        overrides[index] = numeric(value(override, 'startOverride'), '覆盖起始值', 1);
    }
    catalog.instances.push({
      id,
      definitionId,
      ...(Object.keys(overrides).length ? { startOverrides: overrides } : {}),
    });
    references.set(nativeId, { instanceId: id, definitionId });
  }
  return { catalog: wordNumberingCatalog(catalog.definitions, catalog.instances), references };
}

export function nativeWordNumberingConfig(
  catalog: WordNumberingCatalog,
  mapStyle: (id: string) => string
): NumberingDefinition[] {
  const checked = wordNumberingCatalog(catalog.definitions, catalog.instances);
  return checked.definitions.map((definition) => ({
    reference: `zuvi-numbering-${definition.id}`,
    levels: definition.levels.map(
      (level, index) =>
        ({
          level: index,
          format: level.format,
          text: level.text,
          start: level.start,
          suffix: level.suffix,
          isLegalNumberingStyle: level.legal,
          alignment: level.alignment,
          style: {
            style: level.paragraphStyle ? mapStyle(level.paragraphStyle) : undefined,
            paragraph: {
              tabStops: level.tabStops?.map((stop) => ({
                position: Math.round(stop.position * 20),
                type: stop.alignment,
                leader: stop.leader,
              })),
              indent: {
                left:
                  level.indentLeft === undefined ? undefined : Math.round(level.indentLeft * 20),
                ...(level.indentFirstLine === undefined
                  ? {}
                  : level.indentFirstLine < 0
                    ? { hanging: Math.round(-level.indentFirstLine * 20) }
                    : { firstLine: Math.round(level.indentFirstLine * 20) }),
              },
            },
            run: {
              font: level.fontFamily,
              size: level.fontSize === undefined ? undefined : level.fontSize * 2,
              color: level.color?.slice(1),
              bold: level.bold,
              italics: level.italic,
            },
          },
        }) as ILevelsOptions
    ),
  }));
}
export function nativeWordParagraphNumbering(value: unknown, catalog: WordNumberingCatalog) {
  const ref = wordNumberRef(value, catalog);
  if (!ref) return undefined;
  const index = catalog.instances.findIndex((entry) => entry.id === ref.instanceId),
    instance = catalog.instances[index];
  return {
    reference: `zuvi-numbering-${instance.definitionId}`,
    level: ref.level,
    instance: index,
  };
}

/** Native fields carry the behavior; ignorable attributes retain model IDs and direct ownership. */
export function patchNativeWordNumbering(
  xmlText: string,
  catalog: WordNumberingCatalog,
  concrete: readonly { numId: number; reference: string; instance: number }[]
) {
  const xml = new DOMParser().parseFromString(xmlText, 'application/xml'),
    root = xml.documentElement;
  if (root.localName === 'parsererror') throw new Error('生成的编号 XML 无效。');
  root.setAttribute('xmlns:zuvi', Z);
  root.setAttribute('xmlns:mc', MC);
  root.setAttributeNS(
    MC,
    'mc:Ignorable',
    [root.getAttributeNS(MC, 'Ignorable'), 'zuvi'].filter(Boolean).join(' ')
  );
  const abstracts = children(root)
    .filter((entry) => entry.localName === 'abstractNum')
    .slice(1);
  if (abstracts.length < catalog.definitions.length) throw new Error('生成的编号定义缺失。');
  catalog.definitions.forEach((definition, index) => {
    const abstract = abstracts[index];
    abstract.setAttributeNS(Z, 'zuvi:id', definition.id);
    abstract.setAttributeNS(Z, 'zuvi:name', definition.name);
    definition.levels.forEach((level, levelIndex) => {
      const nativeLevel = children(abstract).find(
        (entry) => entry.localName === 'lvl' && attr(entry, 'ilvl') === String(levelIndex)
      )!;
      if (level.restartAfter !== undefined) {
        let restart = child(nativeLevel, 'lvlRestart');
        if (!restart) {
          restart = xml.createElementNS(W, 'w:lvlRestart');
          nativeLevel.append(restart);
        }
        restart.setAttributeNS(
          W,
          'w:val',
          String(level.restartAfter === null ? 0 : level.restartAfter + 1)
        );
      }
    });
  });
  for (const instance of catalog.instances) {
    const index = catalog.instances.findIndex((entry) => entry.id === instance.id),
      native = concrete.find(
        (entry) =>
          entry.reference === `zuvi-numbering-${instance.definitionId}` && entry.instance === index
      );
    if (!native) throw new Error('生成的编号实例缺失。');
    const num = children(root).find(
      (entry) => entry.localName === 'num' && attr(entry, 'numId') === String(native.numId)
    )!;
    num.setAttributeNS(Z, 'zuvi:id', instance.id);
    for (const override of children(num).filter((entry) => entry.localName === 'lvlOverride'))
      if (
        !Object.hasOwn(instance.startOverrides ?? {}, attr(override, 'ilvl')) &&
        !child(override, 'lvl')
      )
        override.remove();
    const abstract = children(root).find(
      (entry) =>
        entry.localName === 'abstractNum' &&
        attr(entry, 'abstractNumId') === value(num, 'abstractNumId')
    )!;
    const definition = catalog.definitions.find((entry) => entry.id === instance.definitionId)!;
    abstract.setAttributeNS(Z, 'zuvi:id', definition.id);
    abstract.setAttributeNS(Z, 'zuvi:name', definition.name);
    for (const [level, start] of Object.entries(instance.startOverrides ?? {})) {
      let override = children(num).find(
        (entry) => entry.localName === 'lvlOverride' && attr(entry, 'ilvl') === level
      );
      if (!override) {
        override = xml.createElementNS(W, 'w:lvlOverride');
        override.setAttributeNS(W, 'w:ilvl', level);
        num.append(override);
      }
      let amount = child(override, 'startOverride');
      if (!amount) {
        amount = xml.createElementNS(W, 'w:startOverride');
        override.append(amount);
      }
      amount.setAttributeNS(W, 'w:val', String(start));
    }
  }
  return new XMLSerializer().serializeToString(xml);
}
