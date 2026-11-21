import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';

async function finiteGeometry(chart: Locator) {
  const problems = await chart
    .locator('svg[data-part="svg"]')
    .evaluate((svg) =>
      [...svg.querySelectorAll('[data-part="mark"]')].flatMap((mark) =>
        ['x', 'y', 'width', 'height', 'cx', 'cy', 'd']
          .map((name) => mark.getAttribute(name))
          .filter((value) => value && /NaN|Infinity|undefined/.test(value))
      )
    );
  expect(problems).toEqual([]);
}
const forms = [
  'line',
  'area',
  'stacked-area',
  'bar',
  'stacked-bar',
  'horizontal-bar',
  'pie',
  'donut',
  'scatter',
  'bubble',
  'radar',
  'heatmap',
  'treemap',
  'funnel',
  'gauge',
  'waterfall',
  'sparkline',
];

test('independent gallery covers seventeen real forms with filterable selection and canonical data', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/charts');
  await expect(page.getByRole('heading', { name: '图表画廊', exact: true })).toBeVisible();
  const nav = page.getByRole('navigation', { name: '文档导航', exact: true });
  await expect(nav.getByRole('group', { name: '数据可视化', exact: true })).toBeVisible();
  await expect(page.locator('[data-chart-form]')).toHaveCount(17);
  const detail = page.locator('#viz-gallery-detail');
  for (const form of forms) {
    await page.getByRole('combobox', { name: '按形式定位', exact: true }).selectOption(form);
    if (form === 'line')
      await page.getByRole('button', { name: '查看完整示例', exact: true }).click();
    await expect(detail).toHaveAttribute('data-chart-detail', form);
    const chart = detail.locator('.zuvi-chart');
    await expect(chart).toHaveAttribute('data-status', 'ready');
    await expect(chart.locator('svg [data-part="mark"]')).not.toHaveCount(0);
    await finiteGeometry(chart);
    if (form !== 'sparkline') {
      await chart.locator('[data-part="data-table"] summary').click();
      await expect(chart.getByRole('table')).toBeVisible();
    }
    if (form === 'bubble') {
      const bounds = (await chart.locator('[data-part="plot"]').boundingBox())!;
      const circles = await chart.locator('circle[data-part="mark"]').evaluateAll((elements) =>
        elements.map((element) => ({
          x: Number(element.getAttribute('cx')),
          y: Number(element.getAttribute('cy')),
          r: parseFloat(getComputedStyle(element).r),
        }))
      );
      for (const point of circles) {
        expect(point.x - point.r).toBeGreaterThanOrEqual(0);
        expect(point.y - point.r).toBeGreaterThanOrEqual(0);
        expect(point.x + point.r).toBeLessThanOrEqual(bounds.width + 1);
        expect(point.y + point.r).toBeLessThanOrEqual(bounds.height + 1);
      }
    }
  }
  await page.getByLabel('搜索图表', { exact: true }).fill('漏斗');
  await expect(page.locator('[data-chart-form]')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('crosshair linkage, gesture ranges, independent Shift emphasis and CSV are genuine interactions', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/charts/interactions');
  await expect(page.getByRole('heading', { name: '交互与联动', exact: true })).toBeVisible();
  const linked = page.locator('[data-chart-interaction="linked"]');
  const line = linked.locator('.zuvi-chart[data-type="line"]');
  const datum = line.locator('[data-part="datum"][data-datum-id="sin:2"]');
  await datum.hover();
  await expect(page.getByRole('tooltip')).toContainText('正弦 × 10');
  await expect(page.getByRole('tooltip')).toContainText('余弦 × 10');
  await datum.click();
  await expect(
    linked.locator('.zuvi-chart[data-type="bar"] [data-part="datum"][data-datum-id="sin:2"]')
  ).toHaveAttribute('aria-pressed', 'true');
  const rangeChart = page.locator('.zuvi-chart[aria-label="支持缩放与框选的函数图（示例）"]');
  const plot = rangeChart.locator('[data-part="plot"]');
  await plot.scrollIntoViewIfNeeded();
  const box = (await plot.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + 100);
  await page.mouse.wheel(0, -220);
  await expect(plot).toHaveAttribute('data-zoomed');
  await plot.focus();
  await plot.press('Escape');
  await expect(plot).not.toHaveAttribute('data-zoomed');
  await page.mouse.move(box.x + 70, box.y + 65);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 80, box.y + 170, { steps: 6 });
  await expect(plot.locator('[data-part="brush"]')).toBeVisible();
  await page.mouse.up();
  await expect(plot).toHaveAttribute('data-zoomed');
  await rangeChart.getByRole('button', { name: '恢复完整图表范围', exact: true }).click();
  await expect(plot).not.toHaveAttribute('data-zoomed');
  const download = page.waitForEvent('download');
  await rangeChart.getByRole('button', { name: '下载完整示例 CSV', exact: true }).click();
  const path = await (await download).path();
  const csv = readFileSync(path!, 'utf8');
  expect(csv.startsWith('\uFEFF')).toBe(true);
  expect(csv).toContain('正弦 × 10');
  expect(csv).toContain('180°');
  await expect(rangeChart.locator('[data-part="datum"][data-datum-id="sin:2"]')).toHaveAttribute(
    'aria-pressed',
    'false'
  );
  await rangeChart.locator('[data-part="datum"][data-datum-id="sin:2"]').click();
  await expect(rangeChart.locator('[data-part="datum"][data-datum-id="sin:2"]')).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  const solo = page.locator('.zuvi-chart[aria-label="图例隐藏与 Shift 高亮示例图"]');
  await solo
    .getByRole('button', { name: '正弦 × 10', exact: true })
    .click({ modifiers: ['Shift'] });
  await expect(solo.locator('[data-part="legend-item"][data-series-id="sin"]')).toHaveAttribute(
    'data-solo'
  );
  await expect(solo.locator('[data-part="mark"]')).toHaveCount(14);
  await expect(solo.locator('[data-part="legend-item"][aria-pressed="true"]')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('single-instance laboratory validates JSON transactionally and can apply all seventeen forms', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/charts/playground');
  await expect(page.getByRole('heading', { name: '可视化实验室', exact: true })).toBeVisible();
  const chart = page.locator('.viz-lab-preview .zuvi-chart');
  await expect(chart).toHaveAttribute('data-status', 'ready');
  for (const form of forms) {
    await page.getByRole('combobox', { name: '图表形式', exact: true }).selectOption(form);
    await page.getByRole('button', { name: '校验并应用', exact: true }).click();
    await expect(page.locator('[data-chart-applied-form]')).toHaveAttribute(
      'data-chart-applied-form',
      form
    );
    await expect(chart).toHaveAttribute('data-status', 'ready');
    await expect(page.locator('.zuvi-chart')).toHaveCount(1);
    await finiteGeometry(chart);
  }
  const before = await page
    .locator('[data-chart-applied-revision]')
    .getAttribute('data-chart-applied-revision');
  await page.locator('textarea').fill('{"__proto__":{"polluted":true}}');
  await page.getByRole('button', { name: '校验并应用', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.locator('[data-chart-applied-revision]')).toHaveAttribute(
    'data-chart-applied-revision',
    before!
  );
  await expect(chart).toHaveAttribute('data-status', 'ready');
});

test('workbench tabs preserve drafts and the single preview while styles and committed code stay independent', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/charts/playground');
  const chart = page.locator('.viz-lab-preview .zuvi-chart');
  await expect(chart).toHaveAttribute('data-status', 'ready');
  await expect(page.locator('.doc-main')).toHaveClass(/doc-main--wide/);
  await expect(page.getByRole('navigation', { name: '页内导航', exact: true })).not.toBeVisible();
  const editor = page.getByRole('textbox', { name: '数据 JSON · 折线图', exact: true });
  const before = await page
    .locator('[data-chart-applied-revision]')
    .getAttribute('data-chart-applied-revision');
  const next = JSON.stringify(
    {
      categories: ['Edited A', 'Edited B'],
      series: [{ id: 'edited', name: 'Edited', values: [2, 8] }],
    },
    null,
    2
  );
  await editor.fill(next);
  await expect(page.locator('[data-dirty]')).toHaveAttribute('data-dirty', 'true');
  await chart.evaluate((element) => element.setAttribute('data-lifetime-probe', 'kept'));
  const dataTab = page.getByRole('tab', { name: /^数据/ });
  await dataTab.focus();
  await dataTab.press('ArrowRight');
  await expect(page.getByRole('tab', { name: '外观', exact: true })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  await page.getByRole('button', { name: '强调', exact: true }).click();
  await page.getByRole('button', { name: '清凉色序', exact: true }).click();
  await page
    .getByRole('combobox', { name: '预览主题（仅此实例）', exact: true })
    .selectOption('dark');
  await expect(page.locator('[data-chart-local-theme]')).toHaveAttribute(
    'data-chart-local-theme',
    'dark'
  );
  expect(
    await chart.evaluate((element) => element.style.getPropertyValue('--zuvi-chart-line-width'))
  ).toBe('4');
  await expect(chart).toHaveAttribute('data-lifetime-probe', 'kept');
  await expect(page.locator('[data-chart-applied-revision]')).toHaveAttribute(
    'data-chart-applied-revision',
    before!
  );
  await page.getByRole('tab', { name: '代码', exact: true }).click();
  const code = page.getByRole('tabpanel', { name: '代码', exact: true });
  await expect(code).toContainText('正弦 × 10');
  await expect(code).not.toContainText('Edited A');
  await expect(code).toContainText('"--zuvi-chart-line-width": "4"');
  await page.getByRole('tab', { name: /^数据/ }).click();
  await expect(editor).toHaveValue(next);
  await editor.press('Control+Enter');
  await expect(chart).toHaveAttribute('data-status', 'ready');
  await expect(chart.locator('[data-part="datum"]')).toHaveCount(2);
  await expect(page.locator('[data-dirty]')).toHaveAttribute('data-dirty', 'false');
  await page.getByRole('tab', { name: '代码', exact: true }).click();
  await expect(code).toContainText('Edited A');
  await expect(code).not.toContainText('正弦 × 10');
  await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);
  await code.getByRole('button', { name: '复制代码', exact: true }).click();
  await expect(code.getByRole('status')).toContainText('代码已复制');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('Edited A');
  const download = page.waitForEvent('download');
  await chart.getByRole('button', { name: '下载已应用数据 CSV', exact: true }).click();
  expect(readFileSync((await (await download).path())!, 'utf8')).toContain('Edited A');
  await expect(page.locator('.zuvi-chart')).toHaveCount(1);
});

for (const width of [1280, 1440, 768, 320]) {
  test(`preview-first workbench uses available space and keeps configuration local at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#/charts/playground');
    await expect(page.locator('.zuvi-chart')).toHaveAttribute('data-status', 'ready');
    const preview = (await page.locator('.viz-lab-preview').boundingBox())!;
    const inspector = (await page.locator('.viz-lab-inspector').boundingBox())!;
    const plot = (await page.locator('.viz-lab-preview [data-part="plot"]').boundingBox())!;
    const apply = (await page
      .getByRole('button', { name: '校验并应用', exact: true })
      .boundingBox())!;
    if (width >= 1280) {
      expect(preview.y).toBeCloseTo(inspector.y, 0);
      expect(preview.x + preview.width).toBeLessThanOrEqual(inspector.x + 1);
      expect(preview.width / inspector.width).toBeGreaterThan(1.7);
      expect(plot.y + plot.height).toBeLessThan(790);
    } else {
      expect(preview.y + preview.height).toBeLessThanOrEqual(inspector.y + 1);
      expect(plot.y).toBeLessThan(inspector.y);
      expect(plot.y + plot.height).toBeLessThan(900);
    }
    expect(apply.y + apply.height).toBeLessThan(400);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    for (const name of ['外观', '代码', '数据']) {
      await page.getByRole('tab', { name: new RegExp(`^${name}`) }).click();
      await expect(page.locator('.zuvi-chart')).toHaveCount(1);
      if (width >= 1280) {
        const current = (await page.locator('.viz-lab-preview').boundingBox())!;
        expect(current.y).toBeCloseTo(preview.y, 0);
        expect(current.height).toBeCloseTo(preview.height, 0);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      );
    }
  });
}

test('workbench transitions default on, preserve same-type updates and respect opt-out and reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/#/charts/playground');
  const workbench = page.locator('[data-chart-workbench]');
  const chart = page.locator('.viz-lab-preview .zuvi-chart');
  const plot = chart.locator('[data-part="plot"]');
  await expect(chart).toHaveAttribute('data-status', 'ready');
  await expect(workbench).toHaveAttribute('data-motion', 'on');
  await expect(workbench).toHaveCSS('animation-name', 'viz-workbench-enter');
  await expect(chart).toHaveCSS('animation-name', 'viz-workbench-chart-enter');
  await expect(plot).toHaveAttribute('data-animated');
  await expect(plot.locator('svg[data-part="svg"]')).toHaveCSS(
    'animation-name',
    'zuvi-chart-enter'
  );
  await page.getByRole('tab', { name: '外观', exact: true }).click();
  const appearance = page.getByRole('tabpanel', { name: '外观', exact: true });
  await expect(appearance).toHaveCSS('animation-name', 'viz-workbench-panel-enter');
  await expect(page.getByRole('checkbox', { name: '启用平滑过渡', exact: true })).toBeChecked();
  await page.getByRole('tab', { name: '数据', exact: true }).click();
  await chart.evaluate((element) => element.setAttribute('data-lifetime-probe', 'animated-update'));
  const editor = page.getByRole('textbox', { name: '数据 JSON · 折线图', exact: true });
  const data = JSON.parse(await editor.inputValue()) as { series: { values: number[] }[] };
  data.series[0].values[2] = 3;
  await editor.fill(JSON.stringify(data, null, 2));
  await page.getByRole('button', { name: '校验并应用', exact: true }).click();
  await expect(chart).toHaveAttribute('data-lifetime-probe', 'animated-update');
  await expect(chart).toHaveAttribute('data-status', 'ready');
  await expect(chart.locator('[data-part="datum"][data-datum-id="sin:2"]')).toHaveAttribute(
    'aria-label',
    /3/
  );
  await finiteGeometry(chart);
  await page.getByRole('tab', { name: '外观', exact: true }).click();
  await page.getByRole('checkbox', { name: '启用平滑过渡', exact: true }).uncheck();
  await expect(workbench).toHaveAttribute('data-motion', 'off');
  await expect(workbench).toHaveCSS('animation-name', 'none');
  await expect(plot).not.toHaveAttribute('data-animated');
  await page.getByRole('tab', { name: '代码', exact: true }).click();
  await expect(page.getByRole('tabpanel', { name: '代码', exact: true })).toHaveCSS(
    'animation-name',
    'none'
  );
  await page.getByRole('tab', { name: '外观', exact: true }).click();
  await page.getByRole('checkbox', { name: '启用平滑过渡', exact: true }).check();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(workbench).toHaveCSS('animation-name', 'none');
  await expect(chart).toHaveCSS('animation-name', 'none');
  await expect(plot.locator('svg[data-part="svg"]')).toHaveCSS('animation-name', 'none');
  await expect(appearance).toHaveCSS('animation-name', 'none');
  await expect(plot.locator('[data-part="mark"]').first()).toHaveCSS('transition-duration', '0s');
});

test('standalone CDN renders all seventeen forms without making external requests', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const bundle = readFileSync(
    new URL('../packages/ui/dist/browser/zuvi.global.js', import.meta.url),
    'utf8'
  );
  const styles = readFileSync(
    new URL('../packages/ui/dist/browser/zuvi.css', import.meta.url),
    'utf8'
  );
  const categories = ['A', 'B', 'C'];
  const series = [{ id: 's', name: 'Series', values: [1, 3, 2] }];
  const data = [
    { id: 'a', label: 'A', value: 3 },
    { id: 'b', label: 'B', value: 2 },
  ];
  const configs = forms.map((form) => {
    const common = { 'aria-label': `CDN ${form}`, height: 220, showDataTable: true };
    const type =
      form === 'stacked-area'
        ? 'area'
        : ['stacked-bar', 'horizontal-bar'].includes(form)
          ? 'bar'
          : form === 'bubble'
            ? 'scatter'
            : form;
    if (type === 'scatter')
      return {
        ...common,
        type,
        bubble: form === 'bubble',
        series: [
          {
            id: 's',
            name: 'Series',
            points: [
              { id: 'p1', x: 1, y: -2, value: 4 },
              { id: 'p2', x: 2, y: 4, value: 20 },
            ],
          },
        ],
      };
    if (type === 'heatmap')
      return {
        ...common,
        type,
        data: [
          { id: 'h1', row: 'R1', col: 'C1', value: -2 },
          { id: 'h2', row: 'R2', col: 'C2', value: 4 },
        ],
      };
    if (type === 'gauge')
      return { ...common, type, data: [{ id: 'g', label: 'G', value: 60 }], min: 0, max: 100 };
    if (type === 'waterfall')
      return {
        ...common,
        type,
        data: [
          { id: 'w1', label: 'Start', value: 10 },
          { id: 'w2', label: 'Delta', value: -4 },
        ],
      };
    if (['pie', 'donut', 'treemap', 'funnel'].includes(type)) return { ...common, type, data };
    return {
      ...common,
      type,
      categories,
      series,
      stack: form.startsWith('stacked-'),
      ...(form === 'horizontal-bar' ? { orientation: 'horizontal' } : {}),
    };
  });
  const errors: string[] = [];
  const requests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => requests.push(request.url()));
  await page.route('**/*', (route) => route.abort());
  const serialized = JSON.stringify(configs).replace(/</g, '\\u003c');
  await page.setContent(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Chart CDN verification</title><style>${styles}</style></head><body><main id="root"></main><script>${bundle.replace(/<\/script/gi, '<\\/script')}</script><script>const configs=${serialized};ZUVI.createRoot(document.getElementById('root')).render(ZUVI.React.createElement(ZUVI.React.Fragment,null,...configs.map((props,index)=>ZUVI.React.createElement(ZUVI.Chart,{...props,key:index}))));</script></body></html>`
  );
  await expect(page.locator('.zuvi-chart')).toHaveCount(17);
  for (const form of forms) {
    const chart = page.locator(`.zuvi-chart[aria-label="CDN ${form}"]`);
    await expect(chart).toHaveAttribute('data-status', 'ready');
    await expect(chart.locator('[data-part="mark"]')).not.toHaveCount(0);
    await finiteGeometry(chart);
  }
  expect(errors).toEqual([]);
  expect(requests).toEqual([]);
});

test('reduced-motion disables entry and update animations and all three pages pass axe in both themes', async ({
  page,
}) => {
  const axe = readFileSync(
    new URL('../packages/ui/node_modules/axe-core/axe.min.js', import.meta.url),
    'utf8'
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const theme of ['light', 'dark'] as const) {
    for (const route of ['/charts', '/charts/interactions', '/charts/playground']) {
      await page.goto('/#' + route);
      await expect(page.locator('.viz-page')).toBeVisible();
      await expect(page.locator('.zuvi-chart').first()).toHaveAttribute('data-status', 'ready');
      const themeName = theme === 'dark' ? '切换浅色' : '切换暗色';
      if (!(await page.getByRole('button', { name: themeName, exact: true }).isVisible())) {
        await page
          .getByRole('button', { name: theme === 'dark' ? '切换暗色' : '切换浅色', exact: true })
          .click();
      }
      await page.addScriptTag({ content: axe });
      const violations = await page.evaluate(async () => {
        const engine = (
          window as unknown as {
            axe: {
              run(
                node: Element
              ): Promise<{ violations: { id: string; nodes: { target: unknown }[] }[] }>;
            };
          }
        ).axe;
        const result = await engine.run(document.querySelector('.viz-page')!);
        return result.violations.map((issue) => ({
          id: issue.id,
          targets: issue.nodes.map((node) => node.target),
        }));
      });
      expect(violations).toEqual([]);
      if (route === '/charts/playground') {
        for (const name of ['外观', '代码']) {
          await page.getByRole('tab', { name, exact: true }).click();
          const panelViolations = await page.evaluate(async () => {
            const engine = (
              window as unknown as {
                axe: {
                  run(
                    node: Element
                  ): Promise<{ violations: { id: string; nodes: { target: unknown }[] }[] }>;
                };
              }
            ).axe;
            const result = await engine.run(document.querySelector('.viz-page')!);
            return result.violations.map((issue) => ({
              id: issue.id,
              targets: issue.nodes.map((node) => node.target),
            }));
          });
          expect(panelViolations).toEqual([]);
        }
      }
      if (route === '/charts/interactions') {
        await page.getByRole('checkbox', { name: '启用图表过渡', exact: true }).check();
        const plot = page.locator(
          '.zuvi-chart[aria-label="图例隐藏与 Shift 高亮示例图"] [data-part="plot"]'
        );
        await expect(plot).toHaveAttribute('data-animated');
        await expect(plot.locator('svg[data-part="svg"]')).toHaveCSS('animation-name', 'none');
        await expect(plot.locator('[data-part="mark"]').first()).toHaveCSS(
          'transition-duration',
          '0s'
        );
      }
    }
  }
});

test('touch pinch previews locally, preserves datum taps and cancels safely', async ({
  browser,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  try {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`http://localhost:${process.env.ZUVI_E2E_PORT ?? 5174}/#/charts/interactions`);
    const chart = page.locator('.zuvi-chart[aria-label="支持缩放与框选的函数图（示例）"]');
    await expect(chart).toHaveAttribute('data-status', 'ready');
    const plot = chart.locator('[data-part="plot"]');
    await plot.scrollIntoViewIfNeeded();
    await expect(plot).toHaveCSS('touch-action', 'none');
    const datum = chart.locator('[data-part="datum"][data-datum-id="sin:2"]');
    await datum.tap();
    await expect(datum).toHaveAttribute('aria-pressed', 'true');
    const bounds = (await plot.boundingBox())!;
    const center = bounds.x + bounds.width * 0.58;
    const y = bounds.y + 75;
    const client = await context.newCDPSession(page);
    const readout = page.locator('[data-chart-view-range]');
    const before = await readout.textContent();
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { id: 1, x: center - 27, y },
        { id: 2, x: center + 27, y },
      ],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { id: 1, x: center - 42, y },
        { id: 2, x: center + 42, y },
      ],
    });
    await expect(plot).toHaveAttribute('data-zoomed');
    await expect(readout).toHaveText(before!);
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { id: 1, x: center - 42, y },
        { id: 2, x: center + 42, y },
        { id: 3, x: center, y: y + 35 },
      ],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [
        { id: 1, x: center - 42, y },
        { id: 2, x: center + 42, y },
      ],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { id: 1, x: center - 46, y },
        { id: 2, x: center + 46, y },
      ],
    });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(readout).toContainText('实际可见 X 范围');
    await expect(datum).toHaveAttribute('aria-pressed', 'true');
    await finiteGeometry(chart);
    await chart.getByRole('button', { name: '恢复完整图表范围', exact: true }).tap();
    await expect(plot).not.toHaveAttribute('data-zoomed');
    const committed = await readout.textContent();
    const current = (await plot.boundingBox())!;
    const px = current.x + current.width * 0.58;
    const py = current.y + 75;
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { id: 1, x: px - 27, y: py },
        { id: 2, x: px + 27, y: py },
      ],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { id: 1, x: px - 43, y: py },
        { id: 2, x: px + 43, y: py },
      ],
    });
    await expect(plot).toHaveAttribute('data-zoomed');
    await client.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await expect(plot).not.toHaveAttribute('data-zoomed');
    await expect(readout).toHaveText(committed!);
    await expect(chart.locator('[data-part="mark"]')).toHaveCount(14);
  } finally {
    await context.close();
  }
});

for (const theme of ['light', 'dark'] as const) {
  test(`three visualization pages remain usable at 320px in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 860 });
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme });
    for (const route of ['/charts', '/charts/interactions', '/charts/playground']) {
      await page.goto('/#' + route);
      await expect(page.locator('.viz-page')).toBeVisible();
      await expect(page.locator('.zuvi-chart').first()).toHaveAttribute('data-status', 'ready');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      );
    }
  });
}
