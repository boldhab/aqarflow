import { test, expect } from "@playwright/test";
import { mockWorkspace, property } from "../support/workspace";
test.beforeEach(async ({ page }) => {
  await mockWorkspace(page);
});
test("inventory honors the rent shortcut and pagination size", async ({
  page,
}) => {
  let query = "";
  await page.route("**/api/v1/properties?**", (r) => {
    query = r.request().url();
    return r.fulfill({
      json: {
        data: {
          items: [property],
          total: 21,
          totalPages: 2,
          page: 1,
          limit: 20,
        },
      },
    });
  });
  await page.goto("/inventory?purpose=RENT");
  await expect(
    page
      .locator("select")
      .filter({ has: page.locator('option[value="RENT"]') }),
  ).toHaveValue("RENT");
  expect(query).toContain("purpose=RENT");
  expect(query).toContain("limit=20");
  await expect(
    page.getByRole("navigation", { name: "Pagination Navigation" }),
  ).toContainText("1–20");
});
test("mobile inventory exposes price, publication, and actions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/inventory");
  const card = page.getByRole("article").first();
  await expect(card).toContainText("150,000");
  await expect(card).toContainText("Unpublished");
  await expect(
    card.getByRole("button", { name: "Edit", exact: true }),
  ).toBeVisible();
  await expect(card.getByRole("button", { name: /Photos/ })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("creation dialog contains focus and protects unsaved work", async ({
  page,
}) => {
  await page.goto("/inventory?create=1");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Create Property", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Close modal", exact: true })).toBeFocused();
  await dialog.getByLabel("Property Title").fill("Unsaved family apartment");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "Discard unsaved changes?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keep editing" }).click();
  await expect(page.getByLabel("Property Title")).toHaveValue(
    "Unsaved family apartment",
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "Discard", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("new lead shortcut saves through the API and refreshes the list", async ({
  page,
}) => {
  let payload: any;
  await page.route("**/api/v1/leads", (r) => {
    if (r.request().method() === "POST") {
      payload = r.request().postDataJSON();
      return r.fulfill({ json: { data: { id: "new" } } });
    }
    return r.fulfill({
      json: { data: { items: [], total: 0, totalPages: 1 } },
    });
  });
  await page.goto("/leads?create=1");
  await page.getByLabel("Client name").fill("Sara Ahmed");
  await page
    .getByRole("textbox", { name: "Phone number", exact: true })
    .fill("03001234567");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "New Lead", exact: true })
    .click();
  await expect(page.getByText("Lead created.", { exact: true })).toBeVisible();
  expect(payload.name).toBe("Sara Ahmed");
  expect(payload.source).toBe("MANUAL");
});
test("visit and deal shortcuts submit correct values", async ({ page }) => {
  for (const kind of ["visits", "deals"]) {
    let payload: any;
    await page.route(`**/api/v1/${kind}`, (r) => {
      if (r.request().method() === "POST") {
        payload = r.request().postDataJSON();
        return r.fulfill({ json: { data: { id: "new" } } });
      }
      return r.fulfill({
        json: { data: { items: [], total: 0, totalPages: 1 } },
      });
    });
    await page.goto(`/${kind}?create=1`);
    await page
      .getByRole("combobox", { name: "Property", exact: true })
      .selectOption(property.id);
    await page
      .getByLabel("Client / lead")
      .selectOption("22222222-2222-4222-8222-222222222222");
    if (kind === "visits")
      await page
        .getByLabel("Appointment date and time (PKT)")
        .fill("2026-12-20T14:30");
    else await page.getByLabel("Deal value (PKR)").fill("2500000");
    await page
      .getByRole("dialog")
      .getByRole("button", {
        name: kind === "visits" ? "Schedule Visit" : "Create Deal",
        exact: true,
      })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(payload.propertyId).toBe(property.id);
    if (kind === "visits")
      expect(payload.scheduledAt).toBe("2026-12-20T09:30:00.000Z");
    else expect(payload.value).toBe(2500000);
  }
});
test("pipeline URL selects the pipeline and cards support the keyboard", async ({
  page,
}) => {
  await page.goto("/leads?view=pipeline");
  await expect(page.getByRole("button", { name: /Ayesha Khan/ })).toBeVisible();
  await page.getByRole("button", { name: /Ayesha Khan/ }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
});
test("property creation preserves zero bedrooms and continues to photo management", async ({
  page,
}) => {
  let payload: any;
  await page.route("**/api/v1/properties", (r) => {
    if (r.request().method() === "POST") {
      payload = r.request().postDataJSON();
      return r.fulfill({
        json: {
          data: {
            ...property,
            title: payload.title,
            bedrooms: payload.bedrooms,
          },
        },
      });
    }
    return r.continue();
  });
  await page.goto("/inventory?create=1");
  await page.getByLabel("Property Title").fill("New studio apartment");
  await page.getByLabel("Asking Price (PKR)").fill("150000");
  await page.getByLabel("Area Value").fill("500");
  await page.getByLabel("Bedrooms", { exact: true }).fill("0");
  await page
    .getByRole("button", { name: "Create Property", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Photos: New studio apartment" }),
  ).toBeVisible();
  expect(payload.bedrooms).toBe(0);
  await expect(
    page.getByRole("button", { name: "Choose photos" }),
  ).toBeVisible();
});
test("photo upload failures can be retried and deletion requires confirmation", async ({
  page,
}) => {
  let attempts = 0;
  const image = {
    id: "photo-1",
    url: "/missing-photo.jpg",
    isPrimary: true,
    sortOrder: 0,
  };
  await page.route(`**/api/v1/properties/${property.id}/images`, (r) => {
    attempts++;
    return r.fulfill(
      attempts === 1
        ? { status: 503, json: { message: "Upload temporarily unavailable" } }
        : { json: { data: { ...property, images: [image] } } },
    );
  });
  await page.goto("/inventory");
  await page
    .locator("table")
    .getByRole("button", { name: /Photos/ })
    .click();
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "cover.png",
      mimeType: "image/png",
      buffer: Buffer.from("89504e470d0a1a0a", "hex"),
    });
  await expect(
    page.getByRole("button", { name: "Retry failed photos" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Retry failed photos" }).click();
  await expect(
    page.getByText("1 of 1 photos uploaded", { exact: true }),
  ).toBeVisible();
  expect(attempts).toBe(2);
  await page
    .getByRole("button", { name: "Delete photo 1", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Delete this photo?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Delete this photo?" }),
  ).toHaveCount(0);
});
