import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

async function openDataGrid(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/components/data-grid');
  await expect(page.getByRole('heading', { name: 'DataGrid 数据网格', exact: true })).toBeVisible();
  const grid = page.getByRole('grid', { name: '订单数据网格示例', exact: true });
  await expect(grid).toBeVisible();
  await expect(grid).toHaveAttribute('aria-rowcount', '10000');
  return grid;
}

async function assertFiniteGrid(grid: Locator) {
  const problems = await grid.evaluate((element) =>
    [...element.querySelectorAll('[role="row"]')].flatMap((row) =>
      ['aria-rowindex', 'aria-colindex'].flatMap((name) => {
        const value = row.getAttribute(name);
        return value && /NaN|undefined/.test(value) ? [`${name}: ${value}`] : [];
      })
    )
  );
  expect(problems).toEqual([]);
}

test('DataGrid implementation stays lazy until mounted and survives a load failure with retry', async ({
  page,
}) => {
  let allowView = false;
  const blocked: string[] = [];
  await page.route(/DataGridView[^/]*\.(?:js|mjs)(?:\?.*)?$/i, async (route) => {
    if (!allowView) {
      blocked.push(route.request().url());
      await route.abort();
    } else await route.continue();
  });
  await page.goto('/#/components/button');
  await expect(page.getByRole('heading', { name: 'Button 按钮', exact: true })).toBeVisible();
  await page.goto('/#/components/data-grid');
  await expect(page.getByRole('heading', { name: 'DataGrid 数据网格', exact: true })).toBeVisible();
  await expect(page.locator('.zuvi-datagrid').first()).toHaveAttribute('data-status', 'error');
  expect(blocked.length).toBeGreaterThan(0);
  allowView = true;
  await page.locator('.zuvi-datagrid').first().getByRole('button').click();
  const grid = page.getByRole('grid', { name: '订单数据网格示例', exact: true });
  await expect(grid).toBeVisible();
  await expect(grid).toHaveAttribute('aria-rowcount', '10000');
});

test('10k rows render a small window, sort for real and keep selection semantics', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const grid = await openDataGrid(page);
  await expect(grid.locator('[role="row"][aria-rowindex]')).toHaveCount(20);
  await assertFiniteGrid(grid);

  const amountHeader = grid.locator('[role="columnheader"]', { hasText: '金额' });
  await amountHeader.getByRole('button').click();
  await expect(amountHeader).toHaveAttribute('aria-sort', 'ascending');
  const firstAmount = () =>
    grid.locator('[role="row"][aria-rowindex="1"]').locator('[aria-colindex="4"]').innerText();
  const ascending = await firstAmount();
  await amountHeader.getByRole('button').click();
  await expect(amountHeader).toHaveAttribute('aria-sort', 'descending');
  await expect.poll(firstAmount, { timeout: 5000 }).not.toBe(ascending);
  await amountHeader.getByRole('button').click();
  await expect(amountHeader).not.toHaveAttribute('aria-sort');

  const selectAll = grid.locator('input[data-part="select-all"]').first();
  await selectAll.click();
  await expect(page.locator('.doc-note')).toContainText(/已选 \d+ 行/);
  await expect(grid.locator('[role="row"][aria-selected="true"]').first()).toBeVisible();
  await expect(page.locator('.zuvi-datagrid')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('grid keyboard model moves activedescendant and Space selects the focused row', async ({
  page,
}) => {
  const grid = await openDataGrid(page);
  await grid.focus();
  await expect(grid).toHaveAttribute('aria-activedescendant', expect.stringMatching(/-c0-0$/));
  await grid.press('ArrowDown');
  await expect(grid).toHaveAttribute('aria-activedescendant', expect.stringMatching(/-c1-0$/));
  await grid.press('ArrowRight');
  await expect(grid).toHaveAttribute('aria-activedescendant', expect.stringMatching(/-c1-1$/));
  await grid.press('Home');
  await expect(grid).toHaveAttribute('aria-activedescendant', expect.stringMatching(/-c1-0$/));
  await grid.press('End');
  await expect(grid).toHaveAttribute('aria-activedescendant', expect.stringMatching(/-c1-5$/));
  const before = await grid.locator('[role="row"][aria-selected="true"]').count();
  await grid.press('Space');
  await expect(grid.locator('[role="row"][aria-selected="true"]')).toHaveCount(before + 1);
});

test('DataGrid passes axe in light and dark and stays usable at 320px', async ({ page }) => {
  // 两轮主题各对含 10k 行网格的整页跑一次 axe 分析，超出默认 30s。
  test.setTimeout(90000);
  const axe = readFileSync(
    new URL('../packages/ui/node_modules/axe-core/axe.min.js', import.meta.url),
    'utf8'
  );
  await page.setViewportSize({ width: 320, height: 760 });
  for (const theme of ['light', 'dark'] as const) {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme });
    await page.goto('/#/components/data-grid');
    await expect(page.locator('.zuvi-datagrid').first()).toHaveAttribute('data-status', 'ready');
    const themeName = theme === 'dark' ? '切换浅色' : '切换暗色';
    // Theme follows the emulated system setting asynchronously; wait for it to settle.
    await expect(page.getByRole('button', { name: themeName, exact: true })).toBeVisible();
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
      const result = await engine.run(document.querySelector('.doc-page')!);
      return result.violations.map((issue) => ({
        id: issue.id,
        targets: issue.nodes.map((node) => node.target),
      }));
    });
    expect(violations, theme).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320
    );
  }
});

test('standalone DataGrid in the CDN bundle virtualizes and sorts without network requests', async ({
  page,
}) => {
  const bundle = readFileSync(
    new URL('../packages/ui/dist/browser/zuvi.global.js', import.meta.url),
    'utf8'
  );
  const styles = readFileSync(
    new URL('../packages/ui/dist/browser/zuvi.css', import.meta.url),
    'utf8'
  );
  const errors: string[] = [];
  const requests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => requests.push(request.url()));
  await page.route('**/*', (route) => route.abort());
  const rows = Array.from({ length: 300 }, (_, index) => ({
    id: `r${index}`,
    name: `行 ${index}`,
    amount: index,
  }));
  const serialized = JSON.stringify(rows).replace(/</g, '\\u003c');
  await page.setContent(
    `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>DataGrid CDN</title><style>${styles}</style></head><body><main id="root"></main><script>${bundle.replace(/<\/script/gi, '<\\/script')}</script><script>
    ZUVI.createRoot(document.getElementById('root')).render(ZUVI.React.createElement(ZUVI.DataGrid, {
      'aria-label': 'CDN 网格',
      height: 200,
      rowHeight: 40,
      columns: [
        { key: 'name', dataIndex: 'name', header: '名称', textValue: '名称', sortable: true, width: 160 },
        { key: 'amount', dataIndex: 'amount', header: '数量', textValue: '数量', sortable: true, align: 'end', width: 100 },
      ],
      rows: ${serialized},
    }));
    </script></body></html>`
  );
  const grid = page.getByRole('grid', { name: 'CDN 网格', exact: true });
  await expect(grid).toHaveAttribute('aria-rowcount', '300');
  await expect(grid.locator('[role="row"][aria-rowindex]')).toHaveCount(17);
  await grid.locator('[role="columnheader"][aria-colindex="3"] [data-part="sort"]').click();
  await expect(grid.locator('[role="columnheader"][aria-colindex="3"]')).toHaveAttribute(
    'aria-sort',
    'ascending'
  );
  await expect(grid.locator('[role="row"][aria-rowindex="1"] [aria-colindex="2"]')).toHaveText(
    '行 0'
  );
  expect(errors).toEqual([]);
  expect(requests).toEqual([]);
});

test('column resize works by drag and keyboard and sticky columns survive horizontal scroll', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/components/data-grid');
  const grid = page.getByRole('grid', { name: '排序与选择示例网格', exact: true });
  await expect(grid).toBeVisible();

  // Drag the 订单号 resize handle by +60px and read the committed width.
  const handle = grid
    .locator('[role="columnheader"]', { hasText: '订单号' })
    .locator('[data-part="resize-handle"]');
  await handle.scrollIntoViewIfNeeded();
  const before = Number(await handle.getAttribute('aria-valuenow'));
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 4 });
  await page.mouse.up();
  await expect(handle).toHaveAttribute('aria-valuenow', String(before + 60));
  await expect(grid.locator('[role="columnheader"]', { hasText: '订单号' })).toHaveAttribute(
    'data-sticky',
    'true'
  );

  // Keyboard resize clamps to the declared contract.
  await handle.focus();
  await handle.press('End');
  await expect(handle).toHaveAttribute('aria-valuenow', '400');
  await handle.press('Home');
  await expect(handle).toHaveAttribute('aria-valuenow', '60');
  await handle.press('ArrowRight');
  await expect(handle).toHaveAttribute('aria-valuenow', '76');
  await handle.press('ArrowLeft');
  await expect(handle).toHaveAttribute('aria-valuenow', '60');

  // Sticky first business column keeps its header and cells visible while the
  // viewport scrolls horizontally past the second column.
  const viewport = grid.locator('[data-part="viewport"]');
  await viewport.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  const stickyHeader = grid.locator('[role="columnheader"][data-sticky]');
  await expect(stickyHeader).toHaveCount(1);
  const headerBox = (await stickyHeader.boundingBox())!;
  expect(headerBox.x).toBeGreaterThanOrEqual(0);
  const stickyCell = grid.locator('[role="gridcell"][data-sticky]').first();
  await expect(stickyCell).toBeVisible();
  const cellBox = (await stickyCell.boundingBox())!;
  expect(cellBox.x).toBeGreaterThanOrEqual(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  // The handle anchors to its own header cell, not the header row's right end.
  const amountHeader = grid.locator('[role="columnheader"]', { hasText: '金额' });
  const amountHandle = amountHeader.locator('[data-part="resize-handle"]');
  const amountHeaderBox = (await amountHeader.boundingBox())!;
  const amountHandleBox = (await amountHandle.boundingBox())!;
  expect(
    Math.abs(
      amountHeaderBox.x +
        amountHeaderBox.width -
        (amountHandleBox.x + amountHandleBox.width)
    )
  ).toBeLessThanOrEqual(2);
});

test('filter disclosure narrows the grid and Escape returns focus to the trigger', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/components/data-grid');
  const grid = page.getByRole('grid', { name: '排序与选择示例网格', exact: true });
  await expect(grid).toBeVisible();
  await expect(grid).toHaveAttribute('aria-rowcount', '200');

  const trigger = grid
    .locator('[role="columnheader"]', { hasText: '区域' })
    .locator('[data-part="filter-trigger"]');
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  const panel = grid.locator('[data-part="filter-panel"]');
  await expect(panel).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');

  await panel.getByRole('checkbox', { name: '华东', exact: true }).check();
  const filtered = Number(await grid.getAttribute('aria-rowcount'));
  expect(filtered).toBeGreaterThan(0);
  expect(filtered).toBeLessThan(200);
  // The first visible row keeps contiguous view indexes after filtering.
  await expect(grid.locator('[role="row"][aria-rowindex="1"]')).toBeVisible();

  await panel.press('Escape');
  await expect(panel).toHaveCount(0);
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toBeFocused();
  // The constraint survives the panel closing.
  expect(Number(await grid.getAttribute('aria-rowcount'))).toBe(filtered);
});
