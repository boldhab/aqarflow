import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Property Management Workspace E2E Tests', () => {
  test('agent creates property, uploads image, publishes, filters, edits to RESERVED, and admin archives it', async ({
    page,
  }) => {
    const uniqueTitle = `E2E Playwright Penthouse ${Date.now()}`;

    // 1. Agent logs in
    await page.goto('/login');
    await page.fill('input[type="email"]', 'agent@aqarflow.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('[data-testid="agency-name"]')).toHaveText('Demo Agency');

    // 2. Navigate to Properties workspace
    await page.goto('/properties');
    await expect(page.locator('h1')).toHaveText('Properties Inventory');

    // 3. Agent creates a new property
    await page.click('button:has-text("+ Add Property")');
    await expect(page.locator('text=Create New Property')).toBeVisible();

    // Fill form fields
    await page.fill('input[placeholder*="Gulberg"]', uniqueTitle);
    // Purpose: SALE (default), Type: APARTMENT (default)
    // Status: AVAILABLE
    const formSelects = page.locator('form select');
    await formSelects.nth(2).selectOption('AVAILABLE');

    await page.fill('input[placeholder*="Amount in PKR"]', '55000000');
    await page.fill('input[placeholder*="e.g. 2400"]', '3200');
    await page.fill('input[placeholder*="Lahore, Karachi, Islamabad"]', 'Islamabad');
    await page.fill('input[placeholder*="DHA Phase 6"]', 'Sector F-7');

    await page.click('button[type="submit"]:has-text("Create Property")');

    // Verify property appears in list
    const propertyRow = page.locator('tr', { hasText: uniqueTitle });
    await expect(propertyRow).toBeVisible();

    // 4. Upload an image
    await propertyRow.locator('button:has-text("Images")').click();
    await expect(page.locator('text=Manage Images')).toBeVisible();

    const imageFixturePath = path.resolve(__dirname, '../fixtures/sample.png');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(imageFixturePath);

    // Wait for image upload to succeed
    await expect(page.locator('text=1 of 15 images uploaded')).toBeVisible();
    await expect(page.locator('text=★ PRIMARY')).toBeVisible();

    // Close image manager
    await page.click('button:has-text("Done")');

    // 5. Publish property
    const publishButton = propertyRow.locator('button:has-text("Publish")');
    await expect(publishButton).toBeVisible();
    await publishButton.click();

    // Now button switches to Unpublish and published badge shows Live
    await expect(propertyRow.locator('button:has-text("Unpublish")')).toBeVisible();
    await expect(propertyRow.locator('text=● Live')).toBeVisible();

    // 6. Filter by Status = AVAILABLE
    const filterSelect = page.locator('select').filter({ hasText: 'All Statuses' });
    await filterSelect.selectOption('AVAILABLE');
    await expect(page.locator(`text=${uniqueTitle}`)).toBeVisible();

    // 7. Edit status to RESERVED
    await propertyRow.locator('button:has-text("Edit")').click();
    await expect(page.locator('text=Edit Property')).toBeVisible();

    const editFormSelects = page.locator('form select');
    await editFormSelects.nth(2).selectOption('RESERVED');
    await page.click('button[type="submit"]:has-text("Save Changes")');

    // Reset filters to see all properties
    await page.click('button:has-text("Reset")');

    const updatedRow = page.locator('tr', { hasText: uniqueTitle });
    await expect(updatedRow).toBeVisible();
    await expect(updatedRow.locator('text=RESERVED')).toBeVisible();

    // 8. Agent cannot delete (Archive button is hidden from Agent)
    await expect(updatedRow.locator('button:has-text("Archive")')).not.toBeVisible();

    // 9. Logout Agent
    await page.locator('[data-testid="logout-button"]').click();
    await expect(page).toHaveURL(/\/login/);

    // 10. Login as Admin to archive the property
    await page.fill('input[type="email"]', 'admin@aqarflow.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto('/properties');

    const adminPropertyRow = page.locator('tr', { hasText: uniqueTitle });
    await expect(adminPropertyRow).toBeVisible();

    // Admin clicks Archive
    const archiveButton = adminPropertyRow.locator('button:has-text("Archive")');
    await expect(archiveButton).toBeVisible();
    await archiveButton.click();

    // Confirmation modal appears
    await expect(page.getByRole('heading', { name: 'Archive Property' })).toBeVisible();
    await page.click('button:has-text("Yes, Archive")');

    // 11. Modal closes and property is archived from inventory table
    await expect(page.getByRole('heading', { name: 'Archive Property' })).not.toBeVisible();
    await expect(page.locator('table').getByText(uniqueTitle)).not.toBeVisible();
  });
});
