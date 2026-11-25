import { describe, expect, it } from 'vitest';
import {
  wordNumberingCatalog,
  wordDefaultNumbering,
  wordNumberingLabels,
  wordFormatNumber,
  materializeWordNumbering,
  wordNodeSize,
} from './studio-word-numbering';
import type { WordNumberingCatalog, StudioWordNumberingRef } from './studio-word-numbering';
import type { StudioRichNode } from './studio-types';
const paragraph = (ref: StudioWordNumberingRef | null, text = 'Text'): StudioRichNode => ({
  type: 'paragraph',
  ...(ref ? { attrs: { numbering: ref } } : {}),
  content: [{ type: 'text', text }],
});
const catalog = (): WordNumberingCatalog => ({
  definitions: [{ id: 'outline', name: 'Outline', levels: wordDefaultNumbering() }],
  instances: [
    { id: 'first', definitionId: 'outline' },
    { id: 'second', definitionId: 'outline' },
  ],
});
const ref = (level: number, instanceId = 'first') => ({ instanceId, level });

describe('Word numbering definitions and instances', () => {
  it('does not count an unordered ancestor as part of a nested ordered label', () => {
    const root: StudioRichNode = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                paragraph(null, 'Bullet'),
                {
                  type: 'orderedList',
                  content: [{ type: 'listItem', content: [paragraph(null, 'Number')] }],
                },
              ],
            },
          ],
        },
      ],
    };
    const ready = materializeWordNumbering(root);
    expect(
      wordNumberingLabels(
        ready,
        wordNumberingCatalog(ready.attrs?.numberingDefinitions, ready.attrs?.numberingInstances)
      ).map((label) => label.text)
    ).toEqual(['•', '1.']);
  });
  it('does not invent another list item for a continuation paragraph or an embedded table', () => {
    const root: StudioRichNode = {
      type: 'doc',
      content: [
        {
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [
                paragraph(null, 'First'),
                paragraph(null, 'Continuation'),
                {
                  type: 'table',
                  content: [
                    {
                      type: 'tableRow',
                      content: [{ type: 'tableCell', content: [paragraph(null, 'Cell')] }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const ready = materializeWordNumbering(root),
      data = wordNumberingCatalog(
        ready.attrs?.numberingDefinitions,
        ready.attrs?.numberingInstances
      );
    expect(wordNumberingLabels(ready, data).map((label) => label.node.content?.[0].text)).toEqual([
      'First',
    ]);
  });
  it('counts interrupted lists by identity while keeping other instances independent', () => {
    const root: StudioRichNode = {
      type: 'doc',
      content: [
        paragraph(ref(0)),
        paragraph(null, 'Gap'),
        paragraph(ref(0)),
        paragraph(ref(0, 'second')),
        paragraph(ref(0)),
      ],
    };
    const before = structuredClone(root);
    expect(wordNumberingLabels(root, catalog()).map((label) => label.text)).toEqual([
      '1.',
      '2.',
      '1.',
      '3.',
    ]);
    expect(root).toEqual(before);
  });
  it('uses each referenced level format, restarts children after parents and retains explicit start overrides', () => {
    const data = catalog();
    data.definitions[0].levels[0].format = 'upperRoman';
    data.definitions[0].levels[0].start = 3;
    data.definitions[0].levels[1] = {
      ...data.definitions[0].levels[1],
      format: 'lowerLetter',
      text: '%1.%2)',
    };
    data.instances[0].startOverrides = { '1': 5 };
    const root: StudioRichNode = {
      type: 'doc',
      content: [0, 1, 1, 0, 1].map((level) => paragraph(ref(level))),
    };
    expect(wordNumberingLabels(root, data).map((label) => label.text)).toEqual([
      'III.',
      'III.e)',
      'III.f)',
      'IV.',
      'IV.e)',
    ]);
    data.definitions[0].levels[1].legal = true;
    expect(wordNumberingLabels(root, data).map((label) => label.text)).toEqual([
      'III.',
      '3.5)',
      '3.6)',
      'IV.',
      '4.5)',
    ]);
  });
  it('supports no automatic restart and missing higher levels without changing their counters', () => {
    const data = catalog();
    data.definitions[0].levels[1].restartAfter = null;
    data.definitions[0].levels[1].text = '%1.%2';
    expect(
      wordNumberingLabels(
        { type: 'doc', content: [1, 0, 1, 0, 1].map((level) => paragraph(ref(level))) },
        data
      ).map((label) => label.text)
    ).toEqual(['1.1', '1.', '1.2', '2.', '2.3']);
  });
  it('formats alphabetic rollover and roman subtraction rather than substituting decimals', () => {
    expect([1, 26, 27, 52, 53].map((value) => wordFormatNumber(value, 'upperLetter'))).toEqual([
      'A',
      'Z',
      'AA',
      'AZ',
      'BA',
    ]);
    expect([4, 9, 40, 49, 90, 3999].map((value) => wordFormatNumber(value, 'lowerRoman'))).toEqual([
      'iv',
      'ix',
      'xl',
      'xlix',
      'xc',
      'mmmcmxcix',
    ]);
  });
  it('links heading styles while explicit numbering and explicit suppression take precedence', () => {
    const data = catalog();
    data.definitions[0].levels[0].paragraphStyle = 'heading-1';
    const root: StudioRichNode = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Chapter' }] },
        {
          type: 'heading',
          attrs: { level: 1, numberingDisabled: true },
          content: [{ type: 'text', text: 'Unnumbered' }],
        },
        {
          type: 'heading',
          attrs: { level: 1, numbering: ref(0, 'second') },
          content: [{ type: 'text', text: 'Separate' }],
        },
      ],
    };
    expect(
      wordNumberingLabels(root, data).map((label) => [label.ref.instanceId, label.text])
    ).toEqual([
      ['first', '1.'],
      ['second', '1.'],
    ]);
  });
  it('rejects malformed graphs and invalid templates before producing labels', () => {
    for (const change of [
      (data: WordNumberingCatalog) => {
        data.definitions.push({ ...data.definitions[0] });
      },
      (data: WordNumberingCatalog) => {
        data.instances[0].definitionId = 'missing';
      },
      (data: WordNumberingCatalog) => {
        data.definitions[0].levels[0].text = '%2.';
      },
      (data: WordNumberingCatalog) => {
        data.definitions[0].levels[1].restartAfter = 1;
      },
      (data: WordNumberingCatalog) => {
        data.instances[0].startOverrides = { '9': 1 };
      },
      (data: WordNumberingCatalog) => {
        data.definitions[0].levels[0].start = 1.5;
      },
    ]) {
      const data = catalog();
      change(data);
      expect(() => wordNumberingCatalog(data.definitions, data.instances)).toThrow();
    }
    const data = catalog();
    data.instances[0].startOverrides = { '0': 100000 };
    expect(() =>
      wordNumberingLabels({ type: 'doc', content: [paragraph(ref(0)), paragraph(ref(0))] }, data)
    ).toThrow();
  });
  it('materializes legacy lists once, keeps tree structure and preserves starts in a shared nested instance', () => {
    const item = (text: string, nested?: StudioRichNode): StudioRichNode => ({
      type: 'listItem',
      content: [paragraph(null, text), ...(nested ? [nested] : [])],
    });
    const nested = (text: string): StudioRichNode => ({
      type: 'orderedList',
      content: [item(text)],
    });
    const root: StudioRichNode = {
      type: 'doc',
      content: [
        {
          type: 'orderedList',
          attrs: { start: 5 },
          content: [item('Five', nested('First child')), item('Six', nested('Second child'))],
        },
      ],
    };
    const before = structuredClone(root),
      ready = materializeWordNumbering(root);
    const data = wordNumberingCatalog(
      ready.attrs?.numberingDefinitions,
      ready.attrs?.numberingInstances
    );
    expect(wordNumberingLabels(ready, data).map((label) => label.text)).toEqual([
      '5.',
      '5.1.',
      '6.',
      '6.1.',
    ]);
    expect(ready.content![0].type).toBe('orderedList');
    expect(ready.content![0].content![0].type).toBe('listItem');
    expect(materializeWordNumbering(ready)).toEqual(ready);
    expect(root).toEqual(before);
  });
  it('shares equivalent definitions across many independent lists without merging their identities', () => {
    const root: StudioRichNode = {
      type: 'doc',
      content: Array.from({ length: 120 }, () => ({
        type: 'orderedList',
        content: [{ type: 'listItem', content: [paragraph(null)] }],
      })),
    };
    const ready = materializeWordNumbering(root),
      data = wordNumberingCatalog(
        ready.attrs?.numberingDefinitions,
        ready.attrs?.numberingInstances
      );
    expect(data.definitions).toHaveLength(1);
    expect(data.instances).toHaveLength(120);
    expect(wordNumberingLabels(ready, data).every((label) => label.text === '1.')).toBe(true);
  });
  it('uses native node positions including empty paragraphs, breaks and astral text', () => {
    const root: StudioRichNode = {
      type: 'doc',
      content: [
        { type: 'paragraph' },
        paragraph(ref(0), '😀'),
        { type: 'paragraph', content: [{ type: 'hardBreak' }] },
        paragraph(ref(0), 'After'),
      ],
    };
    expect(wordNumberingLabels(root, catalog()).map((label) => label.position)).toEqual([2, 9]);
    expect(wordNodeSize(root.content![1])).toBe(4);
  });
});
