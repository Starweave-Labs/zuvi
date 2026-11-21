import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const axeSource = readFileSync(
  new URL('../packages/ui/node_modules/axe-core/axe.min.js', import.meta.url),
  'utf8'
);

async function openGlobe(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/components/globe');
  await expect(page.getByRole('heading', { name: 'Globe 3D 地球', exact: true })).toBeVisible();
  const demo = page.getByRole('region', { name: '全球城市网络', exact: true });
  await demo.getByRole('radio', { name: '2D 投影', exact: true }).click();
  const globe = demo.locator('.zuvi-globe[data-part="root"]');
  await expect(globe).toHaveAttribute('data-renderer', '2d');
  await expect(globe).toHaveAttribute('data-status', 'ready');
  return {
    demo,
    globe,
    stage: globe.getByRole('group', { name: '全球城市网络地球', exact: true }),
  };
}

async function expandPoints(globe: Locator) {
  const list = globe.locator('[data-part="point-list"]');
  if ((await list.getAttribute('open')) === null) await list.locator('summary').click();
  await expect(list).toHaveAttribute('open', '');
  return list;
}

async function expandArcs(globe: Locator) {
  const list = globe.locator('[data-part="arc-list"]');
  if ((await list.getAttribute('open')) === null) await list.locator('summary').click();
  await expect(list).toHaveAttribute('open', '');
  return list;
}

async function zoom(stage: Locator) {
  return Number(await stage.getAttribute('data-view-zoom'));
}

async function exportHtml(page: Page) {
  await page.locator('.studio-file-menu > summary').click();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出 HTML', exact: true }).click();
  const path = await (await downloaded).path();
  expect(path).not.toBeNull();
  return readFileSync(path!, 'utf8');
}

test('Globe docs expose accessible point selection, camera controls and in-place dataset updates', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const { demo, globe, stage } = await openGlobe(page);
  await expect(page).toHaveTitle('Globe 3D 地球 · ZUVI 文档');
  await expect(demo.locator('.globe-network')).toContainText('示例数据 · 非实时');
  await expect(demo.locator('.globe-network-stats')).toContainText('8');
  const list = await expandPoints(globe);
  await expect(list.locator('[data-part="point-item"]')).toHaveCount(8);
  await list.getByRole('button', { name: /^东京 Tokyo/ }).click();
  await expect(list.getByRole('button', { name: /^东京 Tokyo/ })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await expect(demo.getByRole('region', { name: '所选城市详情' })).toContainText('东京 Tokyo');
  await expect(stage).toHaveAttribute('data-view-latitude', '35.68');
  await expect(stage).toHaveAttribute('data-view-longitude', '139.65');
  await list.getByRole('button', { name: /^东京 Tokyo/ }).click();
  await expect(list.getByRole('button', { name: /^东京 Tokyo/ })).toHaveAttribute(
    'aria-pressed',
    'false'
  );
  await expect(demo.getByRole('region', { name: '所选城市详情' })).toContainText('选择一座城市');

  const controls = globe.locator('[data-part="controls"]');
  const initialZoom = await zoom(stage);
  await controls.getByRole('button', { name: '放大网络地球', exact: true }).click();
  await expect.poll(() => zoom(stage)).toBeCloseTo(initialZoom + 0.15, 4);
  await stage.focus();
  await stage.press('ArrowRight');
  await expect(stage).toHaveAttribute('data-view-longitude', '144.65');
  await stage.press('+');
  await expect.poll(() => zoom(stage)).toBeCloseTo(initialZoom + 0.25, 4);
  await stage.press('Home');
  await expect(stage).toHaveAttribute('data-view-latitude', '20.00');
  await expect(stage).toHaveAttribute('data-view-longitude', '105.00');
  await expect.poll(() => zoom(stage)).toBeCloseTo(1, 4);

  await globe.evaluate((element) => element.setAttribute('data-test-preserved-root', 'yes'));
  await demo.getByRole('button', { name: '加入巴黎', exact: true }).click();
  await expect(list.locator('[data-part="point-item"]')).toHaveCount(9);
  await expect(globe).toHaveAttribute('data-test-preserved-root', 'yes');
  await list.getByRole('button', { name: /^巴黎 Paris/ }).click();
  await expect(demo.getByRole('region', { name: '所选城市详情' })).toContainText('巴黎 Paris');
  await demo.getByRole('button', { name: '移除巴黎', exact: true }).click();
  await expect(list.locator('[data-part="point-item"]')).toHaveCount(8);
  await expect(list.getByRole('button', { name: /^巴黎 Paris/ })).toHaveCount(0);
  await expect(demo.getByRole('region', { name: '所选城市详情' })).toContainText('选择一座城市');
  await expect(globe).toHaveAttribute('data-test-preserved-root', 'yes');
  await demo.getByRole('switch', { name: '禁用交互', exact: true }).check();
  await expect(controls.getByRole('button', { name: '放大网络地球' })).toBeDisabled();
  await expect(list.getByRole('button', { name: /^上海 Shanghai/ })).toBeDisabled();
  await demo.getByRole('switch', { name: '禁用交互', exact: true }).uncheck();
  await expect(list.getByRole('button', { name: /^上海 Shanghai/ })).toBeEnabled();
  expect(errors).toEqual([]);
});

test('Globe categories hide endpoint routes, retain selection and keep search local to the point list', async ({
  page,
}) => {
  const { demo, globe, stage } = await openGlobe(page);
  await expect(stage).toHaveAttribute('data-point-count', '8');
  await expect(stage).toHaveAttribute('data-arc-count', '9');
  const list = await expandPoints(globe);
  const routes = await expandArcs(globe);
  const selected = demo.getByRole('region', { name: '所选城市详情' });
  const eastAsia = globe.getByRole('checkbox', { name: '东亚', exact: true });
  await expect(
    globe.locator('[data-part="legend-item"][data-category-id="east-asia"]')
  ).toBeVisible();
  await expect(eastAsia).toBeChecked();
  await expect(list.locator('[data-point-id="shanghai"]')).toHaveAttribute('aria-pressed', 'true');
  await eastAsia.uncheck();
  await expect(stage).toHaveAttribute('data-point-count', '6');
  await expect(stage).toHaveAttribute('data-arc-count', '5');
  await expect(globe.locator('[data-part="point"][data-point-id="shanghai"]')).toHaveCount(0);
  await expect(list.locator('[data-part="point-item"]')).toHaveCount(6);
  await expect(routes.locator('[data-part="arc-item"]')).toHaveCount(5);
  await expect(routes.locator('[data-arc-id="shanghai-tokyo"]')).toHaveCount(0);
  await expect(routes.locator('[data-arc-id="tokyo-san-francisco"]')).toHaveCount(0);
  await expect(selected).toContainText('上海 Shanghai');
  await expect(selected).toContainText('所选城市已被分类隐藏');
  await expect(globe.locator('[data-part="arc-details"]')).toHaveCount(0);
  await eastAsia.check();
  await expect(stage).toHaveAttribute('data-point-count', '8');
  await expect(stage).toHaveAttribute('data-arc-count', '9');
  await expect(list.locator('[data-point-id="shanghai"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(
    globe.locator('[data-part="arc-details"][data-arc-id="shanghai-tokyo"]')
  ).toBeVisible();

  const search = list
    .locator('[data-part="search"]')
    .getByRole('searchbox', { name: '搜索网络城市' });
  const markerSize = await globe
    .locator('[data-part="point"][data-point-id="shanghai"]')
    .getAttribute('data-point-size');
  await search.fill('Tokyo');
  await expect(list.locator('[data-part="point-item"]')).toHaveCount(1);
  await expect(list.locator('[data-part="point-item"]')).toHaveAttribute('data-point-id', 'tokyo');
  await expect(stage).toHaveAttribute('data-point-count', '8');
  await expect(stage).toHaveAttribute('data-arc-count', '9');
  await expect(routes.locator('[data-part="arc-item"]')).toHaveCount(9);
  await expect(selected).toContainText('上海 Shanghai');
  await expect(globe.locator('[data-part="point"][data-point-id="shanghai"]')).toHaveAttribute(
    'data-point-size',
    markerSize!
  );
  await search.fill('not-a-city');
  await expect(list.locator('[data-part="point-item"]')).toHaveCount(0);
  await expect(stage).toHaveAttribute('data-point-count', '8');
  await list.locator('[data-part="search"]').getByRole('button').click();
  await expect(search).toHaveValue('');
  await expect(list.locator('[data-part="point-item"]')).toHaveCount(8);
  await eastAsia.uncheck();
  await globe.locator('[data-part="legend"]').getByRole('button').click();
  await expect(eastAsia).toBeChecked();
  await expect(stage).toHaveAttribute('data-arc-count', '9');
});

test('Globe sample degree sizes stay stable under filtering and route details identify actual endpoints', async ({
  page,
}) => {
  const { demo, globe, stage } = await openGlobe(page);
  const shanghai = globe.locator('[data-part="point"][data-point-id="shanghai"]');
  const tokyo = globe.locator('[data-part="point"][data-point-id="tokyo"]');
  const radius = async (point: Locator) => Number(await point.getAttribute('data-point-size'));
  await expect.poll(() => radius(shanghai)).toBeGreaterThan(await radius(tokyo));
  await expect.poll(() => radius(shanghai)).toBeCloseTo(0.036, 4);
  await expect.poll(() => radius(tokyo)).toBeCloseTo(0.012, 4);
  const initial = await radius(shanghai);
  await globe.getByRole('checkbox', { name: '北美', exact: true }).uncheck();
  await expect(stage).toHaveAttribute('data-arc-count', '6');
  await expect.poll(() => radius(shanghai)).toBeCloseTo(initial, 6);
  await globe.getByRole('checkbox', { name: '北美', exact: true }).check();
  const routes = await expandArcs(globe);
  await routes.locator('[data-part="arc-item"][data-arc-id="shanghai-singapore"]').click();
  await expect(routes.locator('[data-arc-id="shanghai-singapore"]')).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  const details = globe.locator('[data-part="arc-details"][data-arc-id="shanghai-singapore"]');
  await expect(details).toContainText('上海 Shanghai → 新加坡 Singapore');
  await expect(details).toContainText('示例路径 2');
  await expect(details).toContainText('端点 id：shanghai → singapore');
  await expect(details.locator('[data-globe-route-id="shanghai-singapore"]')).toBeVisible();
  await expect(demo.getByRole('region', { name: '所选城市详情' })).toContainText('上海 Shanghai');
  await routes.locator('[data-arc-id="shanghai-singapore"]').click();
  await expect(routes.locator('[data-arc-id="shanghai-singapore"]')).toHaveAttribute(
    'aria-pressed',
    'false'
  );
  await expect(globe.locator('[data-part="arc-details"]')).toHaveCount(0);
});

test('Globe keyed focus flies independently and reduced motion arrives without a transition', async ({
  page,
}) => {
  const { demo, globe, stage } = await openGlobe(page);
  const selected = demo.getByRole('region', { name: '所选城市详情' });
  const neighbor = demo.locator('[data-globe-neighbor-id="tokyo"]');
  await stage.evaluate((node) => {
    const element = node as HTMLElement & {
      globeFocusTest?: { transitioned: boolean; observer: MutationObserver };
    };
    const record = { transitioned: false, observer: new MutationObserver(() => {}) };
    record.observer = new MutationObserver((mutations) => {
      if (
        element.getAttribute('data-transitioning') === 'true' ||
        mutations.some((mutation) => mutation.oldValue === 'true')
      )
        record.transitioned = true;
    });
    record.observer.observe(element, {
      attributes: true,
      attributeFilter: ['data-transitioning'],
      attributeOldValue: true,
    });
    element.globeFocusTest = record;
  });
  await neighbor.click();
  await expect(stage).toHaveAttribute('data-view-latitude', '35.68');
  await expect(stage).toHaveAttribute('data-view-longitude', '139.65');
  await expect(stage).toHaveAttribute('data-transitioning', 'false');
  await expect(selected).toContainText('上海 Shanghai');
  const points = await expandPoints(globe);
  await expect(points.locator('[data-point-id="shanghai"]')).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await expect(points.locator('[data-point-id="tokyo"]')).toHaveAttribute('aria-pressed', 'false');
  await globe.getByRole('button', { name: '重置亚洲视角', exact: true }).click();
  await expect(stage).toHaveAttribute('data-view-longitude', '105.00');
  await neighbor.click();
  await expect(stage).toHaveAttribute('data-view-longitude', '139.65');
  await expect(stage).toHaveAttribute('data-transitioning', 'false');
  await expect(selected).toContainText('上海 Shanghai');
  expect(
    await stage.evaluate(
      (node) =>
        (node as HTMLElement & { globeFocusTest?: { transitioned: boolean } }).globeFocusTest
          ?.transitioned
    )
  ).toBe(false);

  await globe.getByRole('button', { name: '重置亚洲视角', exact: true }).click();
  await demo.getByRole('switch', { name: '自动旋转', exact: true }).uncheck();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await neighbor.click();
  await expect
    .poll(() =>
      stage.evaluate(
        (node) =>
          (node as HTMLElement & { globeFocusTest?: { transitioned: boolean } }).globeFocusTest
            ?.transitioned
      )
    )
    .toBe(true);
  await expect(stage).toHaveAttribute('data-transitioning', 'false');
  await expect(stage).toHaveAttribute('data-view-longitude', '139.65');
  await expect(selected).toContainText('上海 Shanghai');
  await stage.evaluate((node) =>
    (
      node as HTMLElement & { globeFocusTest?: { observer: MutationObserver } }
    ).globeFocusTest?.observer.disconnect()
  );
});

test('Globe dense real-city fixture mounts lazily with a visible, nonoverlapping label budget', async ({
  page,
}) => {
  const { globe } = await openGlobe(page);
  const dense = page.getByRole('region', { name: '密集城市网络', exact: true });
  await expect(dense.locator('.zuvi-globe')).toHaveCount(0);
  await dense.getByRole('button', { name: '展开 60 城市网络', exact: true }).click();
  const fixture = dense.locator('.zuvi-globe[data-part="root"]');
  await expect(fixture).toHaveAttribute('data-renderer', '2d');
  const stage = fixture.locator('[data-part="stage"]');
  await expect(stage).toHaveAttribute('data-point-count', '60');
  await expect(stage).toHaveAttribute('data-arc-count', '60');
  await expect(stage).toHaveAttribute('data-animating', 'false');
  await expect(fixture.locator('canvas')).toHaveCSS('visibility', 'hidden');
  const labels = fixture.locator('[data-part="label"]');
  await expect
    .poll(async () =>
      labels.evaluateAll(
        (nodes) =>
          nodes.filter((node) => {
            const element = node as HTMLElement;
            const style = getComputedStyle(element);
            return !element.hidden && style.visibility !== 'hidden' && style.display !== 'none';
          }).length
      )
    )
    .toBeGreaterThan(0);
  const inspectLabels = () =>
    labels.evaluateAll((nodes) =>
      nodes.flatMap((node) => {
        const element = node as HTMLElement;
        const style = getComputedStyle(element);
        if (element.hidden || style.visibility === 'hidden' || style.display === 'none') return [];
        const rect = element.getBoundingClientRect();
        const marker = element
          .closest('[data-part="stage"]')!
          .querySelector<HTMLElement>(
            `[data-part="point"][data-point-id="${element.dataset.pointId}"]`
          );
        const markerStyle = marker ? getComputedStyle(marker) : null;
        return [
          {
            id: element.dataset.pointId,
            text: element.textContent,
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            ariaHidden: element.closest('[aria-hidden="true"]') !== null,
            markerVisible: Boolean(
              marker && !marker.hidden && markerStyle?.visibility !== 'hidden'
            ),
          },
        ];
      })
    );
  const verifyLabels = async () => {
    const visible = await inspectLabels();
    expect(visible.length).toBeGreaterThan(0);
    expect(visible.length).toBeLessThanOrEqual(12);
    const bounds = (await stage.boundingBox())!;
    for (const label of visible) {
      expect(label.text).toBeTruthy();
      expect(label.markerVisible).toBe(true);
      expect(label.ariaHidden).toBe(true);
      expect(label.left).toBeGreaterThanOrEqual(bounds.x);
      expect(label.right).toBeLessThanOrEqual(bounds.x + bounds.width);
      expect(label.top).toBeGreaterThanOrEqual(bounds.y);
      expect(label.bottom).toBeLessThanOrEqual(bounds.y + bounds.height);
    }
    for (let i = 0; i < visible.length; i++) {
      for (let j = i + 1; j < visible.length; j++) {
        const a = visible[i];
        const b = visible[j];
        expect(
          a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top
        ).toBe(true);
      }
    }
  };
  await verifyLabels();
  const points = await expandPoints(fixture);
  await expect(points.locator('[data-part="point-item"]')).toHaveCount(60);
  await points.getByRole('searchbox', { name: '搜索密集城市', exact: true }).fill('Nairobi');
  await expect(points.locator('[data-part="point-item"]')).toHaveCount(1);
  await expect(points.locator('[data-part="point-item"]')).toHaveAttribute(
    'data-point-id',
    'nairobi'
  );
  await expect(stage).toHaveAttribute('data-point-count', '60');
  await expect(stage).toHaveAttribute('data-arc-count', '60');
  await page.setViewportSize({ width: 320, height: 860 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await expect.poll(async () => (await inspectLabels()).length).toBeGreaterThan(0);
  await verifyLabels();
  await dense.getByRole('button', { name: '展开 60 城市网络', exact: true }).click();
  await expect(dense.locator('.zuvi-globe')).toHaveCount(0);
  await expect(globe).toHaveAttribute('data-renderer', '2d');
});

test('Globe lazy 2d/loading example and token palettes stay usable at 320px', async ({ page }) => {
  const { demo } = await openGlobe(page);
  const secondary = page.getByRole('region', { name: '二维视图与按需挂载', exact: true });
  await expect(secondary.locator('.zuvi-globe')).toHaveCount(0);
  await secondary.getByRole('button', { name: '展开二维与加载示例', exact: true }).click();
  const compact = secondary.locator('.zuvi-globe[data-part="root"]');
  await expect(compact).toHaveAttribute('data-renderer', '2d');
  const points = await expandPoints(compact);
  await points.getByRole('button', { name: /^迪拜 Dubai/ }).focus();
  await points.getByRole('button', { name: /^迪拜 Dubai/ }).press('Enter');
  await expect(points.getByRole('button', { name: /^迪拜 Dubai/ })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await secondary.getByRole('radio', { name: '加载占位', exact: true }).click();
  await expect(secondary.getByRole('status', { name: '自定义加载占位' })).toBeVisible();
  await expect(secondary.locator('.zuvi-globe')).toHaveCount(0);
  await secondary.getByRole('button', { name: '展开二维与加载示例', exact: true }).click();
  await expect(secondary.locator('.globe-loading-preview')).toHaveCount(0);

  await page.setViewportSize({ width: 320, height: 860 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  for (const [name, palette] of [
    ['浅色', 'light'],
    ['深色', 'dark'],
    ['透明', 'transparent'],
  ]) {
    await demo.getByRole('radio', { name, exact: true }).click();
    await expect(demo.locator('.globe-network')).toHaveAttribute('data-palette', palette);
    await expect(demo.getByRole('region', { name: '所选城市详情' })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
  }
  await secondary.getByRole('button', { name: '展开二维与加载示例', exact: true }).click();
  await expect(secondary.locator('.zuvi-globe')).toHaveAttribute('data-renderer', '2d');
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
});

test('Globe builder accepts flat point/arc rows and exports an offline interactive HTML document', async ({
  page,
  context,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/builder');
  await expect(page.locator('#preview-frame')).toBeVisible();
  const defaults = await page.evaluate(async () => {
    const path = '/src/pages/builder/builder-config.tsx';
    const { builderConfig } = await import(path);
    return JSON.parse(JSON.stringify(builderConfig.components.Globe.defaultProps));
  });
  expect(defaults.renderMode).toBe('2d');
  const input = {
    root: { props: { title: '离线地球', theme: 'light', maxWidth: 960, padding: 16 } },
    content: [
      {
        type: 'Globe',
        props: {
          ...defaults,
          id: 'globe-offline',
          label: '离线城市地球',
          categoriesJson: [
            { id: 'east-asia', name: '东亚', color: 'var(--zuvi-color-primary)' },
            { id: 'oceania', name: '大洋洲', color: 'var(--zuvi-color-success)' },
          ],
          pointLabels: 'auto',
          maxLabels: 12,
          valueScale: true,
          searchable: true,
          showArcList: true,
          defaultArcValue: 'asia',
          transitionDuration: 650,
          rowsJson: [
            {
              id: 'shanghai',
              name: '上海',
              lat: 31.2304,
              lng: 121.4737,
              value: 1,
              category: 'east-asia',
            },
            {
              id: 'tokyo',
              name: '东京',
              lat: 35.6762,
              lng: 139.6503,
              value: 2,
              category: 'east-asia',
            },
            {
              id: 'sydney',
              name: '悉尼',
              lat: -33.8688,
              lng: 151.2093,
              value: 1,
              category: 'oceania',
            },
          ],
          arcsJson: [
            {
              id: 'asia',
              from: 'shanghai',
              to: 'tokyo',
              name: '上海 → 东京',
              value: '示例路径 A',
              animated: false,
            },
            {
              id: 'pacific',
              from: 'tokyo',
              to: 'sydney',
              name: '东京 → 悉尼',
              value: '示例路径 B',
              altitude: 0.3,
            },
          ],
        },
      },
    ],
  };
  await page.getByLabel('导入页面或工作区 JSON', { exact: true }).setInputFiles({
    name: 'globe.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(input)),
  });
  await expect(page.locator('.doc-builder-notice')).toContainText('已导入 1 个页面');
  const canvas = page.frameLocator('#preview-frame');
  await expect(canvas.locator('[data-builder-component="Globe"] .zuvi-globe')).toHaveAttribute(
    'data-renderer',
    '2d'
  );
  await expect(
    canvas.locator('[data-builder-component="Globe"] [data-part="stage"]')
  ).not.toHaveAttribute('data-interactive', 'true');
  await expect(
    canvas.locator('[data-builder-component="Globe"] [data-part="stage"]')
  ).toHaveAttribute('data-transitioning', 'false');
  await page.getByRole('button', { name: '图层结构', exact: true }).click();
  await page.locator('[data-builder-layer-id="globe-offline"] .studio-layer-select').click();
  const pointField = page
    .locator('.studio-data-field')
    .filter({ has: page.getByRole('textbox', { name: '点位（id、lat、lng） JSON', exact: true }) });
  await pointField
    .getByRole('textbox', { name: '点位（id、lat、lng） JSON', exact: true })
    .fill(
      JSON.stringify([
        ...input.content[0].props.rowsJson,
        { id: 'singapore', name: '新加坡', lat: 1.3521, lng: 103.8198 },
      ])
    );
  await pointField.getByRole('button', { name: '应用数据', exact: true }).click();
  await expect(pointField.getByRole('alert')).toHaveCount(0);
  const stored = JSON.parse((await page.locator('.doc-builder-json').textContent()) || '{}');
  expect(stored.content[0].props.rowsJson).toHaveLength(4);
  await pointField
    .getByRole('textbox', { name: '点位（id、lat、lng） JSON', exact: true })
    .fill('[{"id":"nested","lat":{"value":0},"lng":0}]');
  await pointField.getByRole('button', { name: '应用数据', exact: true }).click();
  await expect(pointField.getByRole('alert')).toContainText('文字、数字、布尔值或空值');
  await expect(page.locator('.doc-builder-save-state')).toContainText('已保存到本机');

  const standalone = await context.newPage();
  const errors: string[] = [];
  const requests: string[] = [];
  standalone.on('pageerror', (error) => errors.push(error.message));
  standalone.on('request', (request) => requests.push(request.url()));
  await standalone.route('**/*', (route) => route.abort());
  await standalone.emulateMedia({ reducedMotion: 'reduce' });
  const exported = await exportHtml(page);
  expect(exported).not.toMatch(/<script\s+src=/i);
  expect(exported).not.toMatch(/<link[^>]+rel=["']stylesheet/i);
  await standalone.setContent(exported);
  const globe = standalone.locator(
    '[data-builder-component="Globe"] .zuvi-globe[data-part="root"]'
  );
  await expect(globe).toHaveAttribute('data-renderer', '2d');
  await expect(globe).toHaveAttribute('data-status', 'ready');
  const list = await expandPoints(globe);
  await expect(list.locator('[data-part="point-item"]')).toHaveCount(4);
  const routes = await expandArcs(globe);
  await expect(routes.locator('[data-part="arc-item"]')).toHaveCount(2);
  await expect(globe.locator('[data-part="arc-details"][data-arc-id="asia"]')).toContainText(
    '端点 id：shanghai → tokyo'
  );
  const search = list.getByRole('searchbox');
  await search.fill('东京');
  await expect(list.locator('[data-part="point-item"]')).toHaveCount(1);
  await expect(globe.locator('[data-part="stage"]')).toHaveAttribute('data-point-count', '4');
  await expect(globe.locator('[data-part="stage"]')).toHaveAttribute('data-arc-count', '2');
  await search.fill('');
  await globe.getByRole('checkbox', { name: '东亚', exact: true }).uncheck();
  await expect(globe.locator('[data-part="stage"]')).toHaveAttribute('data-point-count', '2');
  await expect(globe.locator('[data-part="stage"]')).toHaveAttribute('data-arc-count', '0');
  await globe.getByRole('checkbox', { name: '东亚', exact: true }).check();
  await expect(list.locator('[data-point-id="shanghai"]')).toHaveAttribute('aria-pressed', 'true');
  await routes.locator('[data-arc-id="pacific"]').click();
  await expect(globe.locator('[data-part="arc-details"][data-arc-id="pacific"]')).toContainText(
    '东京 → 悉尼'
  );
  await expect(globe.locator('[data-part="arc-details"][data-arc-id="pacific"]')).toContainText(
    '示例路径 B'
  );
  await list.getByRole('button', { name: /^新加坡/ }).click();
  await expect(list.getByRole('button', { name: /^新加坡/ })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await expect(standalone.getByText('当前选择：新加坡', { exact: true })).toBeVisible();
  const stage = globe.getByRole('group', { name: '离线城市地球', exact: true });
  await expect(stage).toHaveAttribute('data-transitioning', 'false');
  const before = await zoom(stage);
  await globe
    .locator('[data-part="controls"]')
    .getByRole('button', { name: '放大', exact: true })
    .click();
  await expect.poll(() => zoom(stage)).toBeCloseTo(before + 0.15, 4);
  await standalone.setViewportSize({ width: 320, height: 860 });
  await expect
    .poll(() => standalone.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  expect(errors).toEqual([]);
  expect(requests).toEqual([]);
});

test('Globe standalone CDN bundle exposes the component and works without network requests', async ({
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
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => requests.push(request.url()));
  await page.route('**/*', (route) => route.abort());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setContent(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>Globe CDN smoke</title><style>${css}</style></head><body><main id="root"></main><script>${script.replace(/<\/script/gi, '<\\/script')}</script><script>
    const root = ZUVI.createRoot(document.getElementById('root'));
    const points = [
      { id: 'a', name: '节点 A', latitude: 31.23, longitude: 121.47 },
      { id: 'b', name: '节点 B', latitude: 35.68, longitude: 139.65 }
    ];
    root.render(ZUVI.React.createElement(ZUVI.Globe, {
      points, arcs: [{ id: 'ab', from: 'a', to: 'b' }],
      height: 360, autoRotate: false, animateArcs: false,
      labels: { label: '独立 CDN 地球' }
    }));
  </script></body></html>`);
  const globe = page.locator('.zuvi-globe[data-part="root"]');
  await expect(globe).toHaveAttribute('data-renderer', 'webgl');
  await expect(globe).toHaveAttribute('data-status', 'ready');
  const list = await expandPoints(globe);
  await list.getByRole('button', { name: /^节点 B/ }).click();
  await expect(list.getByRole('button', { name: /^节点 B/ })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await globe
    .locator('[data-part="controls"]')
    .getByRole('button', { name: '放大', exact: true })
    .click();
  await expect(globe.locator('[data-part="stage"]')).toHaveAttribute('data-view-zoom', '1.15');
  expect(errors).toEqual([]);
  expect(requests).toEqual([]);
});

test('Globe renders actual WebGL, survives mode/context changes and honors motion preferences', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/components/globe');
  const demo = page.getByRole('region', { name: '全球城市网络', exact: true });
  const globe = demo.locator('.zuvi-globe[data-part="root"]');
  const stage = globe.locator('[data-part="stage"]');
  await expect(globe).toHaveAttribute('data-renderer', 'webgl');
  await expect(globe).toHaveAttribute('data-status', 'ready');
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute('data-animating', 'false');
  const canvas = globe.locator('canvas');
  expect(
    await canvas.evaluate((element: HTMLCanvasElement) => {
      const context = element.getContext('webgl2');
      return Boolean(
        context &&
        !context.isContextLost() &&
        context.getError() === context.NO_ERROR &&
        element.width > 0 &&
        element.height > 0
      );
    })
  ).toBe(true);

  const bounds = (await stage.boundingBox())!;
  const beforeLongitude = Number(await stage.getAttribute('data-view-longitude'));
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2 + 60, bounds.y + bounds.height / 2 + 10, {
    steps: 6,
  });
  await page.mouse.up();
  await expect
    .poll(async () => Number(await stage.getAttribute('data-view-longitude')))
    .toBeCloseTo(beforeLongitude - 60 * 0.32, 1);
  await stage.focus();
  await stage.press('Home');
  await expect(stage).toHaveAttribute('data-view-longitude', '105.00');

  for (const palette of ['浅色', '透明', '深色']) {
    await demo.getByRole('radio', { name: palette, exact: true }).click();
    await expect(globe).toHaveAttribute('data-renderer', 'webgl');
    await page.addScriptTag({ content: axeSource });
    const violations = await page.evaluate(async () => {
      const result = await window.axe.run(document.querySelector('.globe-network')!, {
        rules: { region: { enabled: false } },
      });
      return result.violations.map((item) => ({
        id: item.id,
        targets: item.nodes.map((node) => node.target),
      }));
    });
    expect(violations).toEqual([]);
  }

  await demo.getByRole('radio', { name: '2D 投影', exact: true }).click();
  await expect(globe).toHaveAttribute('data-renderer', '2d');
  await demo.getByRole('radio', { name: '自动 3D', exact: true }).click();
  await expect(globe).toHaveAttribute('data-renderer', 'webgl');
  await canvas.evaluate((element: HTMLCanvasElement) => {
    const extension = element.getContext('webgl2')!.getExtension('WEBGL_lose_context');
    if (!extension) throw new Error('Context-loss extension is unavailable in this renderer');
    extension.loseContext();
    (window as Window & { restoreGlobeContext?: () => void }).restoreGlobeContext = () =>
      extension.restoreContext();
  });
  await expect(globe).toHaveAttribute('data-renderer', '2d');
  await expect(globe).toHaveAttribute('data-status', 'fallback');
  await page.evaluate(() =>
    (window as Window & { restoreGlobeContext?: () => void }).restoreGlobeContext?.()
  );
  await expect(globe).toHaveAttribute('data-renderer', 'webgl');
  await expect(globe).toHaveAttribute('data-status', 'ready');
  // Settings clicks can scroll the map below the viewport; offscreen scenes correctly pause.
  await stage.scrollIntoViewIfNeeded();
  expect(
    await stage.evaluate((node) => {
      const bounds = node.getBoundingClientRect();
      return (
        bounds.bottom > 0 && bounds.top < innerHeight && !node.contains(document.activeElement)
      );
    })
  ).toBe(true);
  await page.mouse.move(5, 5);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(stage).toHaveAttribute('data-animating', 'true');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(stage).toHaveAttribute('data-animating', 'false');
  expect(errors).toEqual([]);
});
