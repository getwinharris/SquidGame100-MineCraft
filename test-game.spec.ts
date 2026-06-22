import { test, expect } from '@playwright/test';

test('game loads correctly', async ({ page }) => {
  await page.goto('http://localhost:5173');
  const app = page.locator('#app');
  await expect(app).toBeVisible();

  const gameHud = page.locator('#game-hud');
  await expect(gameHud).toBeVisible();
  await expect(gameHud).toContainText('SQUID GAME 100');
  await expect(gameHud).toContainText('WASD Move');

  // Take a screenshot to verify the visual state
  await page.screenshot({ path: 'game-load-test.png' });
});
