import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

async function openChart(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/components/chart');
  await expect(page.getByRole('heading', { name: 'Chart 数据图表', exact: true })).toBeVisible();
  const demo = page.locator('[data-chart-demo="trend"]');
  const chart = demo.locator('.zuvi-chart');
  await expect(chart).toHaveAttribute('data-type', 'line');
  await expect(chart).toHaveAttribute('data-status', 'ready');
  await expect(chart.locator('[data-part="plot"] svg')).toBeVisible();
  return { demo, chart, plot: chart.locator('[data-part="plot"]') };
}
async function expandTable(chart: Locator) {
  const table = chart.locator('details[data-part="data-table"]');
  if ((await table.getAttribute('open')) === null) await table.locator('summary').click();
  await expect(table.locator('table')).toBeVisible();
  return table;
}
async function exportHtml(page: Page) {
  await page.locator('.studio-file-menu > summary').click();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出 HTML', exact: true }).click();
  const path = await (await downloaded).path();
  expect(path).not.toBeNull();
  return readFileSync(path!, 'utf8');
}
async function assertFiniteGeometry(chart: Locator) {
  const invalid = await chart.locator('svg[data-part="svg"]').evaluate((svg) =>
    [...svg.querySelectorAll('[data-part="mark"]')].flatMap((mark) =>
      ['d', 'cx', 'cy', 'x', 'y', 'width', 'height'].flatMap((key) => {
        const value = mark.getAttribute(key);
        return value && /NaN|Infinity|undefined/.test(value) ? [`${key}: ${value}`] : [];
      })
    )
  );
  expect(invalid).toEqual([]);
}

test('standalone Chart CDN exposes interactive radial SVG shapes and keyboard data with no network', async ({
  page,
}) => {
  const script = readFileSync(
    new URL('../packages/ui/dist/browser/zuvi.global.js', import.meta.url),
    'utf8'
  );
  const css = readFileSync(
    new URL('../packages/ui/dist/browser/zuvi.css', import.meta.url),
    'utf8'
  );
  const errors: string[] = [];
  const requests: string[] = [];
  page.on('pageerror', (failure) => errors.push(failure.message));
  page.on('request', (request) => requests.push(request.url()));
  await page.route('**/*', (route) => route.abort());
  await page.setContent(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>Chart CDN</title><style>${css}</style></head><body><main id="root"></main><script>${script.replace(/<\/script/gi, '<\\/script')}</script><script>
    ZUVI.createRoot(document.getElementById('root')).render(ZUVI.React.createElement(ZUVI.Chart, {
      type:'pie',title:'独立 CDN 图表', data:[{id:'all',label:'完整扇区',value:10}],
      onDataClick:(datum)=>{window.lastChartDatum=datum}
    }));
  </script></body></html>`);
  const chart = page.locator('.zuvi-chart');
  await expect(chart).toHaveAttribute('data-status', 'ready');
  const svg = chart.locator('svg');
  const box = (await svg.boundingBox())!;
  const shape = chart.locator('path[data-part="mark"]');
  await shape.click({ position: { x: box.height * 0.65, y: box.height * 0.45 } });
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as Window & { lastChartDatum?: { id: string } }).lastChartDatum?.id
      )
    )
    .toBe('all');
  await expect(chart.locator('button[data-part="datum"]')).toHaveAttribute('aria-pressed', 'true');
  await expandTable(chart);
  await expect(chart.getByRole('rowheader', { name: '完整扇区' })).toBeVisible();
  expect(errors).toEqual([]);
  expect(requests).toEqual([]);
});

test('six chart themes pass axe without dropping tooltip or data-table semantics', async ({
  page,
}) => {
  await openChart(page);
  const axeSource = readFileSync(
    new URL('../packages/ui/node_modules/axe-core/axe.min.js', import.meta.url),
    'utf8'
  );
  await page.addScriptTag({ content: axeSource });
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') await page.getByRole('button', { name: '切换暗色', exact: true }).click();
    const violations = await page.evaluate(async () => {
      const axe = (
        window as unknown as {
          axe: {
            run: (
              node: Element
            ) => Promise<{ violations: { id: string; nodes: { target: unknown }[] }[] }>;
          };
        }
      ).axe;
      const results = await axe.run(document.querySelector('.doc-page')!);
      return results.violations.map((issue) => ({
        id: issue.id,
        targets: issue.nodes.map((node) => node.target),
      }));
    });
    expect(violations).toEqual([]);
  }
});

test('Chart plotting module stays lazy until a chart is mounted; its header survives a load failure and retry', async ({
  page,
}) => {
  const plotRequests: string[] = [];
  const blocked: string[] = [];
  let allowView = false;
  await page.route(/\/(?:ChartView|chart-view)[^/]*\.(?:js|mjs)(?:\?.*)?$/i, async (route) => {
    const url = route.request().url();
    plotRequests.push(url);
    if (!allowView) {
      blocked.push(url);
      await route.abort();
    } else await route.continue();
  });
  await page.goto('/#/components/button');
  await expect(page.getByRole('heading', { name: 'Button 按钮', exact: true })).toBeVisible();
  expect(plotRequests).toEqual([]);
  await page.goto('/#/components/chart');
  await expect(page.getByRole('heading', { name: 'Chart 数据图表', exact: true })).toBeVisible();
  const chart = page.locator('[data-chart-demo="trend"] .zuvi-chart');
  await expect(chart.locator('[data-part="title"]')).toContainText('半年项目趋势（示例）');
  await expect(chart).toHaveAttribute('data-status', 'error');
  expect(blocked.length).toBeGreaterThan(0);
  await expect(chart.locator('details[data-part="data-table"]')).toHaveCount(0);
  allowView = true;
  await chart.locator('[data-part="error"]').getByRole('button').click();
  await expect(chart).toHaveAttribute('data-status', 'ready');
  await expect(chart.locator('svg [data-part="mark"]')).toHaveCount(12);
});

test('trend toolbar retypes the real SVG chart, changes instance style and reports actual datum clicks', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const { demo, chart } = await openChart(page);
  await expect(page).toHaveTitle('Chart 数据图表 · ZUVI 文档');
  await expect(demo).toContainText('合成示例 · 非实时');
  await expect(chart.locator('svg [data-part="mark"]')).toHaveCount(12);
  const firstLine = chart.locator('svg g[data-series-id="design"] > path[fill="none"]');
  const beforeWidth = await firstLine.evaluate((element) => getComputedStyle(element).strokeWidth);
  await demo.getByRole('radio', { name: '强调', exact: true }).click();
  await expect(demo).toHaveAttribute('data-chart-style', 'bold');
  await expect
    .poll(() => firstLine.evaluate((element) => getComputedStyle(element).strokeWidth))
    .not.toBe(beforeWidth);
  await demo.getByRole('radio', { name: '面积', exact: true }).click();
  await expect(chart).toHaveAttribute('data-type', 'area');
  await expect(
    chart.locator('svg g[data-series-id="design"] > path[opacity="0.12"]')
  ).toBeVisible();
  await demo.getByRole('radio', { name: '柱状', exact: true }).click();
  await expect(chart).toHaveAttribute('data-type', 'bar');
  await expect(chart.locator('svg rect[data-part="mark"]')).toHaveCount(12);
  await chart.locator('button[data-part="datum"][data-datum-id="development:2"]').click();
  await expect(demo.getByRole('region', { name: '所选数据详情' })).toContainText('研发项目 · 3 月');
  await expect(demo.locator('[data-chart-event]')).toContainText('"value": 38');
  await expect(demo.locator('[data-chart-event]')).toContainText('"type": "bar"');
  await expect(chart.locator('button[data-datum-id="development:2"]')).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await demo.getByRole('radio', { name: '折线', exact: true }).click();
  await expect(chart).toHaveAttribute('data-type', 'line');
  await expect(chart.locator('svg circle[data-part="mark"]')).toHaveCount(12);
  await expect(chart.locator('button[data-datum-id="development:2"]')).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await assertFiniteGeometry(chart);
  expect(errors).toEqual([]);
});

test('legend visibility is controlled separately from selected datum and the table preserves complete source data', async ({
  page,
}) => {
  const { demo, chart } = await openChart(page);
  const design = chart.locator('button[data-part="legend-item"][data-series-id="design"]');
  await expect(design).toHaveAttribute('aria-pressed', 'true');
  await design.click();
  await expect(design).toHaveAttribute('aria-pressed', 'false');
  await expect(chart.locator('svg [data-part="mark"]')).toHaveCount(6);
  await expect(chart.locator('button[data-datum-id^="design:"]')).toHaveCount(0);
  await expect(demo.getByRole('region', { name: '所选数据详情' })).toContainText('设计项目 · 6 月');
  await expect(demo.getByRole('region', { name: '所选数据详情' })).toContainText('所选系列已隐藏');
  const table = await expandTable(chart);
  await expect(table.getByRole('columnheader', { name: '设计项目', exact: true })).toBeVisible();
  await expect(table.locator('tbody tr')).toHaveCount(6);
  await expect(table.locator('tbody tr').last()).toContainText('64');
  await design.click();
  await expect(chart.locator('button[data-datum-id="design:5"]')).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await design.click();
  await chart.locator('button[data-part="legend-item"][data-series-id="development"]').click();
  await expect(chart).toHaveAttribute('data-status', 'empty');
  await expect(table.locator('tbody tr')).toHaveCount(6);
  await chart.locator('[data-part="empty"]').getByRole('button').click();
  await expect(chart).toHaveAttribute('data-status', 'ready');
  await expect(chart.locator('button[data-part="legend-item"][aria-pressed="true"]')).toHaveCount(
    2
  );
});

test('native datum buttons support keyboard details and tooltip/settings toggles without fake event output', async ({
  page,
}) => {
  const { demo, chart } = await openChart(page);
  const datum = chart.locator('button[data-part="datum"][data-datum-id="design:0"]');
  await datum.focus();
  await datum.press('Enter');
  await expect(demo.locator('[data-chart-event]')).toContainText('"id": "design:0"');
  await expect(demo.locator('[data-chart-event]')).toContainText('"value": 28');
  await expect(page.getByRole('tooltip')).toContainText('设计项目');
  await datum.press('ArrowRight');
  await expect(chart.locator('button[data-datum-id="design:1"]')).toBeFocused();
  await chart.locator('button[data-datum-id="design:1"]').press('Escape');
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await demo.locator('.chart-settings > summary').click();
  await demo.getByRole('switch', { name: '显示提示', exact: true }).uncheck();
  await datum.hover();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await demo.getByRole('switch', { name: '显示网格', exact: true }).uncheck();
  await expect(chart.locator('svg [data-part="grid"]')).toHaveCount(0);
  await demo.getByRole('switch', { name: '显示图例', exact: true }).uncheck();
  await expect(chart.locator('[data-part="legend"]')).toHaveCount(0);
  await demo.getByRole('switch', { name: '显示数据表', exact: true }).uncheck();
  await expect(chart.locator('details[data-part="data-table"]')).toHaveCount(0);
  await demo.getByRole('switch', { name: '禁用交互', exact: true }).check();
  await expect(chart).toHaveAttribute('aria-disabled', 'true');
  await expect(chart.locator('button[data-part="datum"]')).toHaveCount(0);
  await expect(chart.locator('svg [data-part="mark"]')).toHaveCount(12);
  await demo.getByRole('switch', { name: '禁用交互', exact: true }).uncheck();
  await expect(chart.locator('button[data-part="datum"]')).toHaveCount(12);
});

test('compact donut/pie and scatter demos render and return applicable percentages or x/y values', async ({
  page,
}) => {
  await openChart(page);
  const radialDemo = page.locator('[data-chart-demo="radial"]');
  const radial = radialDemo.locator('.zuvi-chart');
  await expect(radial).toHaveAttribute('data-type', 'donut');
  await expect(radial.locator('svg path[data-part="mark"]')).toHaveCount(4);
  await radialDemo.getByRole('radio', { name: '饼图', exact: true }).click();
  await expect(radial).toHaveAttribute('data-type', 'pie');
  await radial.locator('button[data-part="datum"][data-datum-id="design"]').click();
  await expect(radialDemo.locator('output')).toContainText('42.0%');
  await radial.locator('button[data-part="legend-item"][data-series-id="other"]').click();
  await expect(radial.locator('svg [data-part="mark"]')).toHaveCount(3);
  await radial.locator('button[data-part="datum"][data-datum-id="development"]').click();
  await expect(radialDemo.locator('output')).toContainText('31.8%');
  const scatterDemo = page.locator('[data-chart-demo="scatter"]');
  const scatter = scatterDemo.locator('.zuvi-chart');
  await expect(scatter).toHaveAttribute('data-type', 'scatter');
  await expect(scatter.locator('svg circle[data-part="mark"]')).toHaveCount(8);
  await scatter.locator('button[data-part="datum"][data-datum-id="group-a:a2"]').click();
  await expect(scatterDemo.locator('output')).toContainText('x = 4 / y = 24');
  const table = await expandTable(scatter);
  await expect(table.locator('tbody tr')).toHaveCount(8);
  await expect(
    table.getByRole('columnheader', { name: '投入（人日）', exact: true })
  ).toBeVisible();
  await assertFiniteGeometry(radial);
  await assertFiniteGeometry(scatter);
});

test('closed secondary examples are unmounted; signed/gap and host loading/error/empty states retain honest data', async ({
  page,
}) => {
  await openChart(page);
  await expect(page.locator('.zuvi-chart')).toHaveCount(3);
  await page.getByRole('button', { name: '正负值与数据缺口', exact: true }).click();
  const signed = page.locator('.zuvi-chart[aria-label="正负值与数据缺口图"]');
  await expect(signed).toHaveAttribute('data-status', 'ready');
  await expect(signed.locator('svg [data-part="mark"]')).toHaveCount(9);
  await expect(signed.locator('button[data-datum-id="change:2"]')).toHaveCount(0);
  const gapTable = await expandTable(signed);
  await expect(gapTable.locator('tbody tr').nth(1)).toContainText('-8');
  await expect(gapTable.locator('tbody tr').nth(2)).toContainText('—');
  await expect(gapTable.locator('tbody tr').nth(3)).toContainText('0');
  await page.getByRole('button', { name: '正负值与数据缺口', exact: true }).click();
  await expect(signed).toHaveCount(0);
  await page.getByRole('button', { name: '加载、空数据与错误', exact: true }).click();
  const states = page.locator('.zuvi-chart[aria-label="应用数据状态图"]');
  await expect(states).toHaveAttribute('data-status', 'loading');
  const stateTable = await expandTable(states);
  await expect(stateTable.locator('tbody tr')).toHaveCount(6);
  await page.getByRole('radio', { name: '错误', exact: true }).click();
  await expect(states).toHaveAttribute('data-status', 'error');
  await expect(states.locator('[data-part="error"]')).toContainText('示例数据请求失败');
  await expect(stateTable.locator('tbody tr')).toHaveCount(6);
  await page.getByRole('button', { name: '重试示例', exact: true }).click();
  await expect(states).toHaveAttribute('data-status', 'ready');
  await page.getByRole('radio', { name: '空数据', exact: true }).click();
  await expect(states).toHaveAttribute('data-status', 'empty');
  await expect(states.locator('[data-part="empty"]')).toContainText('还没有示例记录');
  await page.getByRole('button', { name: '加载、空数据与错误', exact: true }).click();
  await expect(states).toHaveCount(0);
  await expect(page.locator('.zuvi-chart')).toHaveCount(3);
});

for (const theme of ['light', 'dark'] as const) {
  test(`320px ${theme} docs keep every chart responsive and its data table locally scrollable`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 760 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    const { demo, chart } = await openChart(page);
    const desiredThemeButton = page.getByRole('button', {
      name: theme === 'dark' ? '切换浅色' : '切换暗色',
      exact: true,
    });
    if (!(await desiredThemeButton.isVisible())) {
      await page
        .getByRole('button', {
          name: theme === 'dark' ? '切换暗色' : '切换浅色',
          exact: true,
        })
        .click();
    }
    await expect(desiredThemeButton).toBeVisible();
    for (const name of ['面积', '柱状', '折线']) {
      await demo.getByRole('radio', { name, exact: true }).click();
      await assertFiniteGeometry(chart);
    }
    for (const current of [
      chart,
      page.locator('[data-chart-demo="radial"] .zuvi-chart'),
      page.locator('[data-chart-demo="scatter"] .zuvi-chart'),
    ]) {
      await expect(current).toHaveAttribute('data-status', 'ready');
      const box = await current.locator('[data-part="plot"]').boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(140);
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(320);
      await assertFiniteGeometry(current);
      await expandTable(current);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320
    );
    const overflow = await page
      .locator('.doc-main')
      .evaluate((element) => element.scrollWidth - element.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test('Chart catalog validates, previews and exports all seventeen forms into interactive HTML with every request blocked', async ({
  page,
  context,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto('/#/builder');
  await expect(page.locator('#preview-frame')).toBeVisible();
  const data = await page.evaluate(async () => {
    const catalogPath = '/src/pages/builder/builder-catalog-data.ts';
    const modelPath = '/src/pages/builder/builder-model.ts';
    const { catalogDefinitions, resolveCatalogChartData } = await import(catalogPath);
    const { validateBuilderData } = await import(modelPath);
    const defaults = Object.fromEntries(
      Object.entries(catalogDefinitions.Chart.fields).map(([key, field]) => [
        key,
        (field as { value: unknown }).value,
      ])
    );
    const forms = [
      ...[
        'line',
        'area',
        'bar',
        'pie',
        'donut',
        'scatter',
        'radar',
        'heatmap',
        'treemap',
        'funnel',
        'gauge',
        'waterfall',
        'sparkline',
      ].map((type) => ({ name: type, type })),
      { name: 'stacked-area', type: 'area', stack: true },
      { name: 'stacked-bar', type: 'bar', stack: true },
      { name: 'horizontal-bar', type: 'bar', orientation: 'horizontal' },
      { name: 'bubble', type: 'scatter', bubble: true },
    ];
    const content = forms.map(({ name, ...form }) => {
      const type = form.type;
      const rowsJson = ['pie', 'donut', 'treemap', 'funnel'].includes(type)
        ? [
            { id: 'a', label: 'A', value: 3 },
            { id: 'b', label: 'B', value: 2 },
            { id: 'zero', label: '零值', value: 0 },
          ]
        : type === 'scatter'
          ? [
              { id: 'p1', seriesId: 'a', x: 0, y: -2, value: 4 },
              { id: 'p2', seriesId: 'a', x: 4, y: 6, value: 20 },
            ]
          : type === 'heatmap'
            ? [
                { id: 'c1', row: 'R1', col: 'C1', value: -2 },
                { id: 'c2', row: 'R2', col: 'C2', value: 6 },
              ]
            : type === 'gauge'
              ? [{ id: 'g', label: 'Gauge', value: 60 }]
              : type === 'waterfall'
                ? [
                    { id: 'a', label: 'A', value: 10 },
                    { id: 'b', label: 'B', value: -4 },
                    { id: 'c', label: 'C', value: 2 },
                  ]
                : type === 'radar'
                  ? [
                      { category: 'A', value: 1 },
                      { category: 'B', value: 3 },
                      { category: 'C', value: 2 },
                      { category: 'D', value: 4 },
                    ]
                  : [
                      { category: '一月', value: 0 },
                      { category: '二月', value: -2 },
                      { category: '三月', value: null },
                      { category: '四月', value: 4 },
                    ];
      return {
        type: 'Chart',
        props: {
          ...defaults,
          ...form,
          id: `offline-${name}`,
          type,
          title: `${name} 示例`,
          label: `${name} 离线图表`,
          height: 240,
          rowsJson,
          seriesJson: ['line', 'area', 'bar', 'radar', 'sparkline', 'scatter'].includes(type)
            ? [{ id: 'a', name: 'A', valueKey: 'value', color: 'var(--zuvi-color-primary)' }]
            : [],
          min: 0,
          max: 100,
          csv: true,
          zoom: type === 'line',
          brush: type === 'line',
          dataTableLabel: '查看离线数据',
        },
      };
    });
    const input = {
      root: { props: { title: '离线十七类图表', theme: 'light', padding: 16, maxWidth: 1000 } },
      content,
    };
    const validated = validateBuilderData(input);
    const resolved = content.map(({ props }) =>
      resolveCatalogChartData(props.type, props.rowsJson, props.seriesJson, props)
    );
    return { validated, issues: resolved.flatMap((result) => result.issues) };
  });
  expect(data.issues).toEqual([]);
  await page.getByLabel('导入页面或工作区 JSON', { exact: true }).setInputFiles({
    name: 'charts.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(data.validated)),
  });
  await expect(page.locator('.doc-builder-notice')).toContainText('已导入 1 个页面');
  await expect(page.frameLocator('#preview-frame').locator('.zuvi-chart')).toHaveCount(17);
  const exported = await exportHtml(page);
  expect(exported).not.toMatch(/<script[^>]+src=/i);
  expect(exported).not.toMatch(/<link[^>]+href=/i);
  const offline = await context.newPage();
  const errors: string[] = [];
  const requests: string[] = [];
  offline.on('pageerror', (error) => errors.push(error.message));
  await offline.route('**/*', async (route) => {
    requests.push(route.request().url());
    await route.abort();
  });
  await offline.setContent(exported);
  await expect(offline.locator('.zuvi-chart')).toHaveCount(17);
  const forms = [
    'line',
    'area',
    'bar',
    'pie',
    'donut',
    'scatter',
    'radar',
    'heatmap',
    'treemap',
    'funnel',
    'gauge',
    'waterfall',
    'sparkline',
    'stacked-area',
    'stacked-bar',
    'horizontal-bar',
    'bubble',
  ];
  for (const form of forms) {
    const chart = offline.locator(`.zuvi-chart[aria-label="${form} 离线图表"]`);
    await expect(chart).toHaveAttribute('data-status', 'ready');
    await expect(chart.locator('svg[data-part="svg"]')).toBeVisible();
    await assertFiniteGeometry(chart);
    const table = await expandTable(chart);
    await expect(table.locator('summary')).toHaveText('查看离线数据');
    await expect(table.locator('tbody tr')).toHaveCount(
      ['scatter', 'bubble', 'heatmap'].includes(form)
        ? 2
        : form === 'gauge'
          ? 1
          : ['pie', 'donut', 'treemap', 'funnel', 'waterfall'].includes(form)
            ? 3
            : 4
    );
  }
  const line = offline.locator('.zuvi-chart[aria-label="line 离线图表"]');
  await line.locator('button[data-part="datum"][data-datum-id="a:1"]').click();
  await expect(line.locator('button[data-datum-id="a:1"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(offline.locator('[data-builder-chart-selection]').first()).toContainText(
    'A · 二月 · -2'
  );
  const plot = line.locator('[data-part="plot"]');
  await plot.focus();
  await plot.press('+');
  await expect(plot).toHaveAttribute('data-zoomed');
  await plot.press('Escape');
  await expect(plot).not.toHaveAttribute('data-zoomed');
  const csvDownload = offline.waitForEvent('download');
  await line.locator('[data-part="actions"]').getByRole('button', { name: /CSV/ }).click();
  const csvPath = await (await csvDownload).path();
  expect(readFileSync(csvPath!, 'utf8')).toContain('三月');
  await line.locator('button[data-part="legend-item"][data-series-id="a"]').click();
  await expect(line).toHaveAttribute('data-status', 'empty');
  await expect(line.locator('table tbody tr')).toHaveCount(4);
  await line.locator('[data-part="empty"]').getByRole('button').click();
  await expect(line).toHaveAttribute('data-status', 'ready');
  await expect(line.locator('button[data-datum-id="a:1"]')).toHaveAttribute('aria-pressed', 'true');
  await offline.setViewportSize({ width: 320, height: 760 });
  expect(await offline.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    320
  );
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});
