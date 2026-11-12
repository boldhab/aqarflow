import { test, expect } from "@playwright/test";
import { mockWorkspace } from "../support/workspace";
test("inventory requires a session", async ({ page }) => {
  await page.goto("/inventory?purpose=RENT");
  await expect(page).toHaveURL(/login\?redirect=/);
  await expect(
    page.getByRole("heading", { name: "Sign in to Workspace" }),
  ).toBeVisible();
});
test("signed-in agents can still browse the public marketplace", async ({
  page,
}) => {
  await mockWorkspace(page, "AGENT");
  await page.goto("/properties");
  await expect(
    page.getByRole("heading", { name: "Explore Properties" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Go to Workspace", exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("link", { name: "AqarFlow home", exact: true }).click();
  await expect(page).toHaveURL("/");
});
test("agent inventory hides admin archive actions", async ({ page }) => {
  await mockWorkspace(page, "AGENT");
  await page.goto("/inventory");
  await expect(
    page.locator("table").getByRole("button", { name: "Edit", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Archive", exact: true }),
  ).toHaveCount(0);
});
test("real demo login opens the workspace and public browsing stays public", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill("admin@aqarflow.com");
  await page.locator("#password").fill("password123");
  await page
    .getByRole("button", { name: "Sign In to Workspace", exact: true })
    .click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(
    page.getByRole("heading", { name: /Welcome back/ }),
  ).toBeVisible();
  await page.goto("/properties");
  await expect(
    page.getByRole("heading", { name: "Explore Properties" }),
  ).toBeVisible();
});
