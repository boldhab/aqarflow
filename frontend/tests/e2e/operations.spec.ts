import { test, expect } from "@playwright/test";
import { mockWorkspace } from "../support/workspace";
const id = "a6f76b1e-dc49-4696-93ab-1769b242bdbd";
test("invoice workflow has accessible line item editing and posts calculated inputs", async ({
  page,
}) => {
  await mockWorkspace(page);
  await page.route("**/api/v1/finance/invoices**", (route) =>
    route.fulfill({
      json: { data: { items: [], total: 0, totalPages: 0, page: 1 } },
    }),
  );
  await page.route("**/api/v1/contacts**", (route) =>
    route.fulfill({
      json: {
        data: {
          items: [{ id, name: "Tenant One" }],
          total: 1,
          totalPages: 1,
          page: 1,
        },
      },
    }),
  );
  await page.goto("/finance/invoices");
  await page
    .getByRole("button", { name: "Create invoice", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Customer").selectOption(id);
  await dialog.getByLabel("Due date").fill("2028-01-01");
  await dialog
    .getByLabel("Description", { exact: true })
    .fill("Agency service");
  await dialog.getByLabel("Unit price").fill("100");
  await dialog.getByRole("button", { name: "Add line", exact: true }).click();
  await expect(dialog.getByLabel("Description", { exact: true })).toHaveCount(
    2,
  );
  await dialog.getByRole("button", { name: "Remove line 2" }).click();
  let posted: unknown;
  await page.route("**/api/v1/finance/invoices", (route) => {
    if (route.request().method() === "POST") {
      posted = route.request().postDataJSON();
      return route.fulfill({ status: 201, json: { data: { id } } });
    }
    return route.fallback();
  });
  await dialog.getByRole("button", { name: "Issue invoice" }).click();
  await expect(dialog).not.toBeVisible();
  expect(posted).toMatchObject({
    contactId: id,
    dueDate: "2028-01-01",
    items: [{ description: "Agency service", quantity: 1, unitPrice: 100 }],
  });
});
test("new workspace screens stay usable on mobile and restrict admin actions", async ({
  page,
}) => {
  await mockWorkspace(page, "AGENT");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/v1/maintenance**", (route) =>
    route.fulfill({
      json: {
        data: {
          items: [
            {
              id,
              title: "Leaking tap",
              property: { title: "Rental home" },
              priority: "HIGH",
              status: "OPEN",
            },
          ],
          total: 1,
          totalPages: 1,
          page: 1,
        },
      },
    }),
  );
  await page.goto("/maintenance");
  await expect(
    page.getByRole("heading", { name: "Maintenance", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Leaking tap")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.goto("/users");
  await expect(page.getByText("Administrator access required.")).toBeVisible();
});
test("customer registration explains failures without staff redirect", async ({
  page,
}) => {
  await page.route("**/api/v1/auth/me", (route) =>
    route.fulfill({ status: 401, json: { message: "No staff session" } }),
  );
  await page.route("**/api/v1/portal/auth/register", (route) =>
    route.fulfill({
      status: 409,
      json: { message: "An account already uses this email" },
    }),
  );
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Customer One");
  await page.getByLabel("Pakistani mobile number").fill("+923001234567");
  await page.getByLabel("Email", { exact: true }).fill("customer@example.com");
  await page
    .getByLabel("Password", { exact: true })
    .fill("customer-password123");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "An account already uses this email" }),
  ).toContainText("An account already uses this email");
  await expect(page).toHaveURL(/register/);
});
