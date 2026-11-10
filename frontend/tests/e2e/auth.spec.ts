import { test, expect } from '@playwright/test';

test.describe('Authentication and RBAC E2E Tests', () => {
  test('unauthenticated visit to /dashboard redirects to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard/);
    await expect(page.locator('text=Sign in to AqarFlow')).toBeVisible();
  });

  test('admin login lands on /dashboard and displays agency name and admin links', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'admin@aqarflow.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('[data-testid="agency-name"]')).toHaveText('Demo Agency');
    await expect(page.locator('text=Agency Settings')).toBeVisible();
    await expect(page.locator('text=Team')).toBeVisible();
  });

  test('agent login hides admin links', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'agent@aqarflow.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('[data-testid="agency-name"]')).toHaveText('Demo Agency');
    await expect(page.locator('text=Properties')).toBeVisible();

    // Admin-only links must be hidden from AGENT
    await expect(page.locator('text=Agency Settings')).not.toBeVisible();
    await expect(page.locator('text=Team')).not.toBeVisible();
  });

  test('malicious ?redirect=//evil.com is ignored and redirects safely to /dashboard', async ({ page }) => {
    await page.goto('/login?redirect=//evil.com');

    await page.fill('input[type="email"]', 'admin@aqarflow.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);
    expect(page.url()).not.toContain('evil.com');
  });

  test('logout returns to /login and protects /dashboard from future access', async ({ page }) => {
    // 1. Log in
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@aqarflow.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // 2. Click logout
    await page.locator('[data-testid="logout-button"]').click();
    await expect(page).toHaveURL(/\/login/);

    // 3. Try to access /dashboard again
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard/);
  });
});
