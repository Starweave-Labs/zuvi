import { expect, test } from '@playwright/test';

test('Globe touch drag and pinch own pointer sessions without changing the point data', async ({
  browser,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  try {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(
      'http://localhost:' + (process.env.ZUVI_E2E_PORT ?? 5174) + '/#/components/globe'
    );
    const demo = page.getByRole('region', { name: '全球城市网络', exact: true });
    await demo.getByRole('radio', { name: '2D 投影', exact: true }).click();
    const globe = demo.locator('.zuvi-globe[data-part="root"]');
    await expect(globe).toHaveAttribute('data-renderer', '2d');
    const stage = globe.locator('[data-part="stage"]');
    await stage.scrollIntoViewIfNeeded();
    await expect(stage).toHaveCSS('touch-action', 'none');
    const bounds = (await stage.boundingBox())!;
    const x = bounds.x + bounds.width * 0.2;
    const y = bounds.y + bounds.height * 0.08;
    const client = await context.newCDPSession(page);
    const longitude = Number(await stage.getAttribute('data-view-longitude'));
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ id: 1, x, y }],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ id: 1, x: x + 45, y: y + 15 }],
    });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect
      .poll(async () => Number(await stage.getAttribute('data-view-longitude')))
      .toBeCloseTo(longitude - 45 * 0.32, 1);
    const zoom = Number(await stage.getAttribute('data-view-zoom'));
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { id: 1, x: x - 30, y },
        { id: 2, x: x + 30, y },
      ],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { id: 1, x: x - 42, y },
        { id: 2, x: x + 42, y },
      ],
    });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect
      .poll(async () => Number(await stage.getAttribute('data-view-zoom')))
      .toBeCloseTo(zoom * 1.4, 1);
    await globe
      .locator('[data-part="controls"]')
      .getByRole('button', { name: '重置亚洲视角', exact: true })
      .tap();
    await expect(stage).toHaveAttribute('data-view-zoom', '1.00');
    await expect(globe.locator('[data-part="point-list"] summary')).toContainText('8');
    await expect(stage).toHaveAttribute('data-point-count', '8');
    await expect(stage).toHaveAttribute('data-arc-count', '9');
    await demo.locator('[data-globe-neighbor-id="tokyo"]').tap();
    await expect(stage).toHaveAttribute('data-view-latitude', '35.68');
    await expect(stage).toHaveAttribute('data-view-longitude', '139.65');
    await expect(stage).toHaveAttribute('data-transitioning', 'false');
    await expect(demo.getByRole('region', { name: '所选城市详情' })).toContainText('上海 Shanghai');
    const eastAsia = globe.getByRole('checkbox', { name: '东亚', exact: true });
    await eastAsia.tap();
    await expect(eastAsia).not.toBeChecked();
    await expect(stage).toHaveAttribute('data-point-count', '6');
    await expect(stage).toHaveAttribute('data-arc-count', '5');
    await expect(demo.getByRole('region', { name: '所选城市详情' })).toContainText('上海 Shanghai');
    await eastAsia.tap();
    await expect(eastAsia).toBeChecked();
    const list = globe.locator('[data-part="point-list"]');
    await list.locator('summary').tap();
    const search = list.getByRole('searchbox', { name: '搜索网络城市', exact: true });
    await search.fill('Tokyo');
    await expect(list.locator('[data-part="point-item"]')).toHaveCount(1);
    await expect(stage).toHaveAttribute('data-point-count', '8');
    await expect(stage).toHaveAttribute('data-arc-count', '9');
    const routes = globe.locator('[data-part="arc-list"]');
    await routes.locator('summary').tap();
    await routes.locator('[data-part="arc-item"][data-arc-id="shanghai-singapore"]').tap();
    await expect(
      globe.locator('[data-part="arc-details"][data-arc-id="shanghai-singapore"]')
    ).toContainText('端点 id：shanghai → singapore');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
  } finally {
    await context.close();
  }
});
