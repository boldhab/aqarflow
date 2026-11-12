import { test, expect } from "@playwright/test";
import { property } from "../support/workspace";
test("filters apply deliberately, update the URL, and validate budget", async ({
  page,
}) => {
  const requests: string[] = [];
  await page.route("**/api/v1/public/filters", (r) =>
    r.fulfill({
      json: { data: { cities: ["Lahore", "Karachi"], types: ["APARTMENT"] } },
    }),
  );
  await page.route("**/api/v1/public/properties**", (r) => {
    requests.push(r.request().url());
    return r.fulfill({
      json: {
        data: {
          items: [{ ...property, primaryImage: null }],
          total: 1,
          totalPages: 1,
        },
      },
    });
  });
  await page.goto("/properties");
  await expect(page.getByTestId("property-card")).toBeVisible();
  await page.getByLabel("Filter by city").selectOption("Lahore");
  await page
    .getByRole("button", { name: "Apply Filters", exact: true })
    .click();
  await expect(page).toHaveURL(/city=Lahore/);
  await expect
    .poll(() => requests.some((url) => url.includes("city=Lahore")))
    .toBe(true);
  await page.getByLabel("Minimum price (PKR)").fill("500");
  await page.getByLabel("Maximum price (PKR)").fill("100");
  await page
    .getByRole("button", { name: "Apply Filters", exact: true })
    .click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Maximum price must be at least",
  );
});
test("unavailable API offers retry without empty-result advice", async ({
  page,
}) => {
  let fail = true;
  await page.route("**/api/v1/public/properties**", (r) =>
    r.fulfill(
      fail
        ? { status: 503, json: { message: "Unavailable" } }
        : { json: { data: { items: [], total: 0, totalPages: 1 } } },
    ),
  );
  await page.goto("/properties");
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "temporarily unavailable",
  );
  await expect(
    page.getByText("No matching properties", { exact: true }),
  ).toHaveCount(0);
  fail = false;
  await page.getByRole("button", { name: "Retry", exact: true }).last().click();
  await expect(
    page.getByText("No matching properties", { exact: true }),
  ).toBeVisible();
});
test("mobile filters stay compact and navigation returns home", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/properties");
  await expect(page.getByLabel("Filter by city")).toBeHidden();
  await page.getByRole("button", { name: /^Filters/ }).click();
  await expect(page.getByLabel("Filter by city")).toBeVisible();
  await page.getByRole("button", { name: "Toggle navigation menu" }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation", exact: true })
    .getByRole("link", { name: "Home", exact: true })
    .click();
  await expect(page).toHaveURL("/");
});
test("real property detail has mobile contact actions and keyboard gallery", async ({
  page,
  request,
}) => {
  const res = await request.get("/api/v1/public/properties");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  const p = body.data.items.find((p: any) => p.images.length > 0);
  expect(p).toBeTruthy();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`/properties/${p.id}`);
  await expect(
    page.getByRole("heading", { name: p.title, exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Inquire", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Submit Inquiry", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open fullscreen gallery" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
