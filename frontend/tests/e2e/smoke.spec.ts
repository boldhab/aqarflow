import { test, expect } from '@playwright/test';

test.describe('AqarFlow Smoke Tests', () => {
  test('home page loads and displays hero header', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AqarFlow/);
    await expect(page.locator('text=Find Your Dream Property in Pakistan')).toBeVisible();
  });

  test('login page renders form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Sign in to AqarFlow')).toBeVisible();
  });
});
