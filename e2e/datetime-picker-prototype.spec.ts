import { expect, test as base } from '@playwright/test';

// DateTimePicker 组合验证原型（路线图「暂不独立立项」前置）：证明
// DatePicker + TimePicker 能在调用方拼出日期时间单值与同日时间范围语义，
// 并暴露必须由正式组件才能解决的手写负担。结论回写 docs/COMPONENT-ROADMAP.md。
const test = base.extend<{ errorGuard: void }>({
  errorGuard: [
    async ({ page }, use) => {
      const pageErrors: string[] = [];
      const consoleErrors: string[] = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      await use();
      expect(pageErrors, '未捕获的页面异常').toEqual([]);
      expect(consoleErrors, 'console.error 输出').toEqual([]);
    },
    { auto: true },
  ],
});

async function openPrototype(page: import('@playwright/test').Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/prototype/datetime-picker');
  await expect(
    page.getByRole('heading', { level: 1, name: 'DateTimePicker 组合验证原型', exact: true })
  ).toBeVisible();
}

async function commitUnit(
  page: import('@playwright/test').Page,
  label: string,
  unit: 'hour' | 'minute',
  value: string
) {
  // TimePicker 触发器是带 aria-label 的 button；点击只更新草稿，Enter 提交。
  // 浮层焦点在面板本体上（FloatingPanel focusOnOpen），Enter 从面板按下去 confirm。
  // 组合场景浮层不互斥：用触发器的 aria-controls 精确锁定本列面板。
  const trigger = page.getByRole('button', { name: label });
  await trigger.click();
  const panelId = await trigger.getAttribute('aria-controls');
  const panel = page.locator(`[id="${panelId}"]`);
  // 触发器点击是开关：前序步骤可能已把面板打开，此处确保最终为开启态。
  if ((await panel.getAttribute('data-open')) !== 'true') await trigger.click();
  await panel
    .locator(`[data-part="column"][data-unit="${unit}"]`)
    .getByRole('option', { name: value, exact: true })
    .click();
  await panel.press('Enter');
  // TimePicker 面板常驻 DOM（data-open 切换 CSS 隐藏），提交后验证收起状态。
  await expect(panel).toHaveAttribute('data-open', 'false');
}

test('日期与时间子控件联动出单个组合值', async ({ page }) => {
  await openPrototype(page);
  const echo = page.locator('p.doc-note').first();
  await expect(echo).toHaveText('组合值："2026-03-15T08:30"');

  // 输入合法日期（Enter 提交）：时间子控件值保留，组合值日期段更新。
  // DatePicker 的 combobox 就是原生 input 本体；demo 边界为 2026-03 月。
  const dateInput = page.getByRole('combobox', { name: '组合日期' });
  await dateInput.fill('2026-03-20');
  await dateInput.press('Enter');
  await expect(echo).toHaveText('组合值："2026-03-20T08:30"');
  // 组合实测：DatePicker 聚焦即开面板，提交后保持开启（aria-controls 仅开启时存在）。
  const datePanelId = await dateInput.getAttribute('aria-controls');
  const datePanel = page.locator(`[id="${datePanelId}"]`);
  // DatePicker 条件渲染面板：存在于 DOM 即开启（与 TimePicker 的 data-open 相反）。
  await expect(datePanel).toBeVisible();

  // 不手动收日期面板，直接点时间触发器：外点关闭把日期面板收起（互斥兜底）。
  const timeTrigger = page.getByRole('button', { name: '组合时间' });
  await timeTrigger.click();
  await expect(datePanel).toHaveCount(0);

  // 时间面板按列确认：先小时（分钟沿草稿 30），再分钟。
  await commitUnit(page, '组合时间', 'hour', '09');
  await expect(echo).toHaveText('组合值："2026-03-20T09:30"');
  await commitUnit(page, '组合时间', 'minute', '45');
  await expect(echo).toHaveText('组合值："2026-03-20T09:45"');
});

test('日期边界由 DatePicker 承担：越界输入还原，组合值不变', async ({ page }) => {
  await openPrototype(page);
  const echo = page.locator('p.doc-note').first();
  await expect(echo).toHaveText('组合值："2026-03-15T08:30"');

  const dateInput = page.getByRole('combobox', { name: '组合日期' });
  await dateInput.fill('2026-04-01');
  await dateInput.press('Enter');
  // DatePicker 把越界草稿还原为当前值，组合值保持不变。
  await expect(echo).toHaveText('组合值："2026-03-15T08:30"');
  await expect(dateInput).toHaveValue('2026-03-15');
});

test('时间范围在 end < start 时自动交换', async ({ page }) => {
  await openPrototype(page);
  const rangeEcho = page.locator('p.doc-note').nth(1);
  await expect(rangeEcho).toHaveText('范围：08:30 → 18:00（有效）');

  // 结束时间的小时选到 06（分钟沿草稿 00）：06:00 < 08:30 触发交换。
  await commitUnit(page, '结束时间', 'hour', '06');
  await expect(rangeEcho).toHaveText('范围：06:00 → 08:30（有效）');
});

test('组合原型在 320px 暗色视口无横向溢出', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.goto('/#/prototype/datetime-picker');
  await expect(
    page.getByRole('heading', { level: 1, name: 'DateTimePicker 组合验证原型', exact: true })
  ).toBeVisible();
  await expect(page.getByRole('combobox', { name: '组合日期' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
