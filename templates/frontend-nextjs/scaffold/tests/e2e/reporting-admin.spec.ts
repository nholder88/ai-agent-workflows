import { test, expect } from '@playwright/test';

test('navigates to reports page', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Reports');
  await expect(page).toHaveURL('/reports');
  await expect(page.locator('h1')).toContainText('Reports');
});

test('navigates to admin feature flags page', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Admin');
  await expect(page).toHaveURL('/admin/feature-flags');
  await expect(page.locator('h1')).toContainText('Feature Flags');
});
