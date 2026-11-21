import { expect, test, type Page } from '@playwright/test';

async function openDropdownPage(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/components/dropdown-menu');
  await expect(
    page.getByRole('heading', { name: 'DropdownMenu 下拉菜单', exact: true })
  ).toBeVisible();
}

test('ContextTrigger opens the menu at the pointer and closes with Escape back on the region', async ({
  page,
}) => {
  await openDropdownPage(page);
  const region = page.locator('[data-part="context-trigger"]');
  await expect(region).toHaveCount(1);
  await region.scrollIntoViewIfNeeded();
  const box = (await region.boundingBox())!;
  const pointerX = box.x + box.width / 2;
  const pointerY = box.y + box.height / 2;
  await page.mouse.click(pointerX, pointerY, { button: 'right' });

  const menu = page.locator('[role="menu"]');
  await expect(menu).toBeVisible();
  const menuBox = (await menu.boundingBox())!;
  // 与原生右键菜单一致：左上角落在指针处（top 带少量 offset）且整体在视口内。
  expect(Math.abs(menuBox.x - pointerX)).toBeLessThanOrEqual(4);
  expect(menuBox.y).toBeGreaterThanOrEqual(0);
  expect(menuBox.y).toBeGreaterThanOrEqual(pointerY - 8);
  expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(page.viewportSize()!.height);

  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(region).toBeFocused();
});

test('menu key opens from the region anchor and selection returns focus', async ({ page }) => {
  await openDropdownPage(page);
  const region = page.locator('[data-part="context-trigger"]');
  await region.scrollIntoViewIfNeeded();
  await region.focus();
  await page.keyboard.press('ContextMenu');

  const menu = page.locator('[role="menu"]');
  await expect(menu).toBeVisible();
  // APG 模型继承：首项聚焦，ArrowDown/Enter 触发后关闭并归还焦点。
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(menu).toHaveCount(0);
  await expect(region).toBeFocused();
});
