import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: /Welcome to/i })).toBeVisible();
});

test('reports page loads', async ({ page }) => {
	await page.goto('/reports');
	await expect(page.getByRole('heading', { name: /Reports/i })).toBeVisible();
});

test('feature flags page loads', async ({ page }) => {
	await page.goto('/admin/feature-flags');
	await expect(page.getByRole('heading', { name: /Feature Flags/i })).toBeVisible();
});
