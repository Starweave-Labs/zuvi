import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { ConfigProvider } from './ConfigProvider';
import { useZuviConfig } from './useZuviConfig';
import { Input } from '../components/Input';
import { zhCN, enUS, zhTW, jaJP, koKR, frFR, deDE, esES, ruRU, ptBR, mergeLocale } from './locale';
import type { ZuviLocale } from './locale';
import type { GlobeLabels } from '../components/Globe/globe-types';
import type { ChartLabels } from '../components/Chart/chart-types';
import type { DataGridLabels } from '../components/DataGrid/data-grid-types';
import type { TranslateConfig } from '@zuvi/i18n';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function Copy() {
  const { locale } = useZuviConfig();
  return (
    <>
      <span data-testid="copy">{locale.input.clear}</span>
      <span data-testid="close">{locale.modal.close}</span>
    </>
  );
}

describe('DataGrid locale', () => {
  it('十套语言包的 dataGrid 文案与 DataGridLabels 的 11 个字段一致', () => {
    expectTypeOf<ZuviLocale['dataGrid']>().toEqualTypeOf<DataGridLabels>();
    const keys: readonly (keyof ZuviLocale['dataGrid'])[] = [
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
    ];
    expect(keys).toHaveLength(11);
    for (const locale of [zhCN, enUS, zhTW, jaJP, koKR, frFR, deDE, esES, ruRU, ptBR]) {
      expect(Object.keys(locale.dataGrid).sort(), locale.code).toEqual([...keys].sort());
      expect(
        Object.values(locale.dataGrid).every((text) => text.trim().length > 0),
        locale.code
      ).toBe(true);
      for (const key of ['selectRow', 'sortLabel', 'resizeColumn'] as const) {
        expect(locale.dataGrid[key], locale.code).toContain('{label}');
      }
    }
  });

  it('局部 dataGrid 覆盖保留其余文案且不修改语言包', () => {
    const original = { ...enUS.dataGrid };
    const custom = mergeLocale(enUS, { dataGrid: { selectAll: 'Select every row' } });
    expect(custom.dataGrid).toEqual({ ...original, selectAll: 'Select every row' });
    expect(custom.dataGrid).not.toBe(enUS.dataGrid);
    expect(enUS.dataGrid).toEqual(original);
  });
});

describe('Chart locale', () => {
  it('十套语言包的 chart 文案与 ChartLabels 的 21 个字段一致', () => {
    expectTypeOf<ZuviLocale['chart']>().toEqualTypeOf<ChartLabels>();
    const keys = [
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
    ].sort();
    expect(keys).toHaveLength(21);
    for (const locale of [zhCN, enUS, zhTW, jaJP, koKR, frFR, deDE, esES, ruRU, ptBR]) {
      expect(Object.keys(locale.chart).sort(), locale.code).toEqual(keys);
      expect(
        Object.values(locale.chart).every((text) => text.trim().length > 0),
        locale.code
      ).toBe(true);
      for (const key of ['Home', 'End', 'Enter', 'Space', 'Esc']) {
        expect(locale.chart.instructions, locale.code).toContain(key);
      }
    }
  });

  it('局部与嵌套 chart 覆盖保留其余文案且不修改语言包', () => {
    function ChartCopy() {
      const { locale } = useZuviConfig();
      return <output data-testid="chart-copy">{JSON.stringify(locale.chart)}</output>;
    }
    const original = { ...enUS.chart };
    const override = { chart: { chart: 'Revenue chart', dataTable: 'View revenue data' } };
    const custom = mergeLocale(enUS, override);
    expect(custom.chart).toEqual({
      ...original,
      chart: 'Revenue chart',
      dataTable: 'View revenue data',
    });
    expect(custom.chart).not.toBe(enUS.chart);
    render(
      <ConfigProvider locale={custom}>
        <ConfigProvider locale={{ chart: { legend: 'Revenue series', showAll: 'Restore series' } }}>
          <ChartCopy />
        </ConfigProvider>
      </ConfigProvider>
    );
    expect(JSON.parse(screen.getByTestId('chart-copy').textContent!)).toEqual({
      ...original,
      chart: 'Revenue chart',
      dataTable: 'View revenue data',
      legend: 'Revenue series',
      showAll: 'Restore series',
    });
    expect(enUS.chart).toEqual(original);
    expect(override).toEqual({ chart: { chart: 'Revenue chart', dataTable: 'View revenue data' } });
    expect(custom.globe).toEqual(enUS.globe);
  });

  it('仅按需翻译 chart 文案段并支持内层局部覆盖', async () => {
    const translateFn = vi.fn(async ({ texts }: { texts: string[] }) =>
      texts.map((text) => {
        if (text === zhCN.chart.loading) return enUS.chart.loading;
        if (text === '查看营收数据') return 'View revenue data';
        if (text === zhCN.chart.invalidData) return enUS.chart.invalidData;
        return text;
      })
    );
    function ChartCopy() {
      const { locale } = useZuviConfig();
      return (
        <>
          <span data-testid="chart-loading">{locale.chart.loading}</span>
          <span data-testid="chart-table">{locale.chart.dataTable}</span>
          <span data-testid="chart-invalid">{locale.chart.invalidData}</span>
        </>
      );
    }
    render(
      <ConfigProvider
        translate={{ provider: 'custom', targetLang: 'en', cache: false, translateFn }}
      >
        <ConfigProvider locale={{ chart: { dataTable: '查看营收数据' } }}>
          <ChartCopy />
        </ConfigProvider>
      </ConfigProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId('chart-loading')).toHaveTextContent(enUS.chart.loading)
    );
    expect(screen.getByTestId('chart-table')).toHaveTextContent('View revenue data');
    expect(screen.getByTestId('chart-invalid')).toHaveTextContent(enUS.chart.invalidData);
    const requested = translateFn.mock.calls.flatMap(([request]) => request.texts);
    expect(requested).toContain(zhCN.chart.loading);
    expect(requested).toContain('查看营收数据');
    expect(requested).toContain(zhCN.chart.invalidData);
    expect(requested).not.toContain(zhCN.globe.label);
    expect(requested).not.toContain(zhCN.input.showPassword);
  });
});

describe('Globe locale', () => {
  it('十套语言包的 globe 文案与 GlobeLabels 字段一致', () => {
    expectTypeOf<ZuviLocale['globe']>().toEqualTypeOf<GlobeLabels>();
    const keys = [
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
    ].sort();
    for (const locale of [zhCN, enUS, zhTW, jaJP, koKR, frFR, deDE, esES, ruRU, ptBR]) {
      expect(Object.keys(locale.globe).sort(), locale.code).toEqual(keys);
      expect(Object.values(locale.globe).every((text) => text.trim().length > 0)).toBe(true);
      expect(locale.globe.instructions).toContain('Home');
      expect(locale.globe.instructions).toContain('+ / -');
      expect(locale.globe.fallback).toContain('2D');
      expect(locale.globe.searchResults.match(/\{[^}]+\}/g), locale.code).toEqual(['{count}']);
      expect(locale.globe.focusPoint.match(/\{[^}]+\}/g), locale.code).toEqual(['{name}']);
    }
  });

  it('局部与嵌套 globe 覆盖保留其余文案且不修改语言包', () => {
    function GlobeCopy() {
      const { locale } = useZuviConfig();
      return <output data-testid="globe-copy">{JSON.stringify(locale.globe)}</output>;
    }
    const original = { ...enUS.globe };
    const custom = mergeLocale(enUS, {
      globe: {
        label: 'Sample locations',
        search: 'Find locations',
        searchResults: '{count} matches',
      },
    });
    expect(custom.globe).toEqual({
      ...original,
      label: 'Sample locations',
      search: 'Find locations',
      searchResults: '{count} matches',
    });
    expect(custom.globe).not.toBe(enUS.globe);
    render(
      <ConfigProvider locale={custom}>
        <ConfigProvider
          locale={{
            globe: {
              zoomIn: 'Magnify globe',
              focusPoint: 'Center {name}',
              selectedArc: 'Active route',
            },
          }}
        >
          <GlobeCopy />
        </ConfigProvider>
      </ConfigProvider>
    );
    expect(JSON.parse(screen.getByTestId('globe-copy').textContent!)).toEqual({
      ...original,
      label: 'Sample locations',
      search: 'Find locations',
      searchResults: '{count} matches',
      zoomIn: 'Magnify globe',
      focusPoint: 'Center {name}',
      selectedArc: 'Active route',
    });
    expect(enUS.globe).toEqual(original);
  });

  it('globe 搜索和定位模板可翻译，变量损坏时回退原文', async () => {
    const translateFn = vi.fn(async ({ texts }: { texts: string[] }) =>
      texts.map((text) => {
        if (text === zhCN.globe.searchResults) return '{count} locations found';
        if (text === zhCN.globe.focusPoint) return 'Focus on {location}';
        return text;
      })
    );
    function GlobeTemplates() {
      const { locale } = useZuviConfig();
      return (
        <>
          <span data-testid="globe-results">
            {locale.globe.searchResults.replace('{count}', '2')}
          </span>
          <span data-testid="globe-focus">
            {locale.globe.focusPoint.replace('{name}', 'Sample A')}
          </span>
        </>
      );
    }
    render(
      <ConfigProvider
        translate={{ provider: 'custom', targetLang: 'en', cache: false, translateFn }}
      >
        <GlobeTemplates />
      </ConfigProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId('globe-results')).toHaveTextContent('2 locations found')
    );
    expect(screen.getByTestId('globe-focus')).toHaveTextContent('定位到 Sample A');
    const requested = translateFn.mock.calls.flatMap(([request]) => request.texts);
    expect(requested).toContain(zhCN.globe.searchResults);
    expect(requested).toContain(zhCN.globe.focusPoint);
  });
});

describe('ConfigProvider 翻译集成', () => {
  it('日期与表单模板可翻译并继续替换变量，损坏变量的译文回退原文', async () => {
    const translateFn = vi.fn(async ({ texts }: { texts: string[] }) =>
      texts.map((text) => {
        if (text === '{year}年{month}月') return '{month}/{year}';
        if (text === '数值不能小于 {min}') return 'At least {minimum}';
        return text;
      })
    );
    function TemplateCopy() {
      const { locale } = useZuviConfig();
      return (
        <>
          <span data-testid="month">
            {locale.date.monthFormat.replace('{year}', '2026').replace('{month}', '11')}
          </span>
          <span data-testid="minimum">{locale.form.minNumber.replace('{min}', '3')}</span>
        </>
      );
    }
    render(
      <ConfigProvider
        translate={{ provider: 'custom', targetLang: 'en', cache: false, translateFn }}
      >
        <TemplateCopy />
      </ConfigProvider>
    );
    await waitFor(() => expect(screen.getByTestId('month')).toHaveTextContent('11/2026'));
    expect(screen.getByTestId('minimum')).toHaveTextContent('数值不能小于 3');
    expect(translateFn.mock.calls.flatMap(([request]) => request.texts)).toContain(
      '数值不能小于 {min}'
    );
  });

  it('只请求实际读取的文案段，不翻译未使用的占位模板', async () => {
    const translateFn = vi.fn(async ({ texts }: { texts: string[] }) =>
      texts.map((text) => `en:${text}`)
    );
    render(
      <ConfigProvider
        translate={{ provider: 'custom', targetLang: 'en', cache: false, translateFn }}
      >
        <Copy />
      </ConfigProvider>
    );
    await waitFor(() => expect(screen.getByTestId('copy')).toHaveTextContent('en:清除'));
    const requested = translateFn.mock.calls.flatMap(([request]) => request.texts);
    expect(requested).toContain('清除');
    expect(requested).toContain('关闭');
    expect(requested).not.toContain('请输入用户名');
    expect(requested).not.toContain('暂无选项');
    expect(requested).not.toContain('暂无数据');
    expect(requested).not.toContain('{year}');
  });

  it('嵌套覆盖合并原始文案，翻译内置文案并保留用户内容', async () => {
    const translateFn = vi.fn(async ({ texts }: { texts: string[] }) =>
      texts.map((text) => `en:${text}`)
    );
    const config: TranslateConfig = {
      provider: 'custom',
      targetLang: 'en',
      cache: false,
      translateFn,
    };
    render(
      <ConfigProvider locale={{ modal: { close: '外层关闭' } }} translate={config}>
        <ConfigProvider locale={{ input: { clear: '内层清除' } }}>
          <Copy />
          <Input value="用户文本" readOnly />
        </ConfigProvider>
      </ConfigProvider>
    );
    await waitFor(() => expect(screen.getByTestId('copy')).toHaveTextContent('en:内层清除'));
    expect(screen.getByTestId('close')).toHaveTextContent('en:外层关闭');
    expect(screen.getByRole('textbox')).toHaveValue('用户文本');
    expect(translateFn.mock.calls.flatMap(([request]) => request.texts)).not.toContain('用户文本');
    expect(
      translateFn.mock.calls
        .flatMap(([request]) => request.texts)
        .some((text) => text.startsWith('en:'))
    ).toBe(false);
  });

  it('切换目标语言与停用翻译后不残留上一语言', async () => {
    const translateFn = vi.fn(
      async ({ texts, targetLang }: { texts: string[]; targetLang: string }) =>
        texts.map((text) => `${targetLang}:${text}`)
    );
    const config: TranslateConfig = {
      provider: 'custom',
      targetLang: 'en',
      cache: false,
      translateFn,
    };
    const { rerender } = render(
      <ConfigProvider translate={config}>
        <Copy />
      </ConfigProvider>
    );
    await waitFor(() => expect(screen.getByTestId('copy')).toHaveTextContent('en:清除'));
    rerender(
      <ConfigProvider translate={{ ...config, targetLang: 'ja' }}>
        <Copy />
      </ConfigProvider>
    );
    await waitFor(() => expect(screen.getByTestId('copy')).toHaveTextContent('ja:清除'));
    rerender(
      <ConfigProvider>
        <Copy />
      </ConfigProvider>
    );
    expect(screen.getByTestId('copy')).toHaveTextContent(/^清除$/);
  });

  it('缺少凭据时不请求，允许无浏览器密钥的代理端点', async () => {
    const fetch = vi.fn(async (_url: string, _init?: RequestInit) => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Translated' } }] }),
    }));
    vi.stubGlobal('fetch', fetch);
    const { rerender } = render(
      <ConfigProvider translate={{ provider: 'openai', targetLang: 'en', cache: false }}>
        <Copy />
      </ConfigProvider>
    );
    expect(fetch).not.toHaveBeenCalled();
    rerender(
      <ConfigProvider
        translate={{
          provider: 'openai',
          targetLang: 'en',
          cache: false,
          endpoint: '/api/translate',
        }}
      >
        <Copy />
      </ConfigProvider>
    );
    await waitFor(() => expect(screen.getByTestId('copy')).toHaveTextContent('Translated'));
    expect(fetch.mock.calls[0][0]).toBe('/api/translate');
  });

  it('使用 OpenAI 兼容协议的 baseURL、key、model 三项', async () => {
    const fetch = vi.fn(async (_url: string, _init?: RequestInit) => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Clear' } }] }),
    }));
    vi.stubGlobal('fetch', fetch);
    render(
      <ConfigProvider
        translate={{
          provider: 'openai',
          targetLang: 'en',
          baseURL: 'https://example.com/v1',
          key: 'test-key',
          model: 'compatible-model',
          cache: false,
        }}
      >
        <Copy />
      </ConfigProvider>
    );
    await waitFor(() => expect(screen.getByTestId('copy')).toHaveTextContent('Clear'));
    expect(fetch.mock.calls[0][0]).toBe('https://example.com/v1/chat/completions');
    const init = fetch.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-key');
    expect(JSON.parse(init.body as string).model).toBe('compatible-model');
  });
});
