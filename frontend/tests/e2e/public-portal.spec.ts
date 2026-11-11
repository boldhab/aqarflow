import { test, expect } from '@playwright/test';

test.describe('Public Portal & Inquiry-to-Lead E2E Tests', () => {
  const visitorName = `Zainab Visitor ${Date.now()}`;
  const visitorPhone = '03001239876';

  test('visitor filters properties, submits inquiry, and admin verifies lead in workspace', async ({
    page,
  }) => {
    // 1. Visitor opens public properties page unauthenticated
    await page.goto('/properties');
    await expect(page.locator('h2')).toContainText('Explore Properties');

    // Filter by city: select Lahore and wait for response
    const citySelect = page.locator('select[aria-label="Filter by city"]');
    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes('/public/properties') &&
          r.url().includes('city=Lahore') &&
          r.status() === 200
      ),
      citySelect.selectOption('Lahore'),
    ]);

    // Wait for filtered properties to load and click on first visible property card
    const propertyCard = page.locator('[data-testid="property-card"]').first();
    await expect(propertyCard).toBeVisible();
    await expect(propertyCard).toContainText('Lahore');

    // Get the title of the property we are clicking
    const cardTitle = (await propertyCard.locator('h3').innerText()).trim();
    await propertyCard.click();

    // 2. Property detail page
    await expect(page).toHaveURL(/\/properties\/[a-f0-9-]+/);
    await expect(page.locator('h1')).toContainText(cardTitle);
    await expect(page.locator('text=PKR')).toBeVisible();
    await expect(page.locator('text=Property Overview')).toBeVisible();

    // Fill inquiry form
    await page.fill('input[placeholder*="Tariq Mansoor"]', visitorName);
    await page.fill('input[placeholder*="0300 1234567"]', visitorPhone);
    await page.fill('input[placeholder*="tariq@example.com"]', 'zainab@example.com');
    await page.fill('textarea[placeholder*="viewing"]', 'I would love to view this property tomorrow.');

    // Submit inquiry
    await page.click('button:has-text("Submit Property Inquiry")');

    // Verify success banner appears
    await expect(page.locator('text=Inquiry Received')).toBeVisible();
    await expect(
      page.locator('text=Thank you! Your inquiry has been sent to the agent.')
    ).toBeVisible();

    // 3. Admin logs into workspace to verify lead creation
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@aqarflow.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to Leads workspace
    await page.goto('/leads');
    await expect(page.locator('h1')).toHaveText('Leads');

    // Verify the newly created lead is listed in the table
    const leadRow = page.locator('tr', { hasText: visitorName });
    await expect(leadRow).toBeVisible();
    await expect(leadRow).toContainText(visitorPhone);
    await expect(leadRow).toContainText('NEW');

    // Verify lead is linked to the property
    await expect(leadRow).toContainText(cardTitle);

    // Open Lead Details modal
    await leadRow.locator('button:has-text("Details")').click();
    await expect(page.locator('h3:has-text("Lead Details")')).toBeVisible();
    await expect(page.locator('text=Client Name').locator('..')).toContainText(visitorName);
    await expect(page.locator('text=Linked Property').locator('..')).toContainText(cardTitle);

    // Close modal
    await page.click('button:has-text("Close")');
    await expect(page.locator('h3:has-text("Lead Details")')).not.toBeVisible();
  });

  test('mobile viewport (375px) check: responsive home, listing, and inquiry form', async ({
    page,
  }) => {
    // 1. Set mobile viewport size (iPhone SE / 375px width)
    await page.setViewportSize({ width: 375, height: 667 });

    // 2. Open Homepage
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Find Your Dream Property in Pakistan');

    // Check mobile hamburger button
    const hamburgerBtn = page.locator('button[aria-label="Toggle navigation menu"]');
    await expect(hamburgerBtn).toBeVisible();
    await hamburgerBtn.click();
    await expect(page.locator('header').getByRole('link', { name: /Sign In|Go to Workspace/i }).last()).toBeVisible();

    // 3. Navigate to /properties on mobile
    await page.goto('/properties');
    await expect(page.locator('h2')).toContainText('Explore Properties');

    // Verify cards are visible and stacked vertically
    const propertyCards = page.locator('[data-testid="property-card"]');
    await expect(propertyCards.first()).toBeVisible();

    // Open first property on mobile
    await propertyCards.first().click();
    await expect(page).toHaveURL(/\/properties\/[a-f0-9-]+/);

    // Verify inquiry form is visible and interactive on mobile
    const inquiryNameInput = page.locator('input[placeholder*="Tariq Mansoor"]');
    await expect(inquiryNameInput).toBeVisible();
    await inquiryNameInput.scrollIntoViewIfNeeded();

    const submitBtn = page.locator('button:has-text("Submit Property Inquiry")');
    await expect(submitBtn).toBeVisible();
  });
});
