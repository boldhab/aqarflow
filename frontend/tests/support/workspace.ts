import { Page } from "@playwright/test";
export const property = {
  id: "11111111-1111-4111-8111-111111111111",
  agencyId: "agency",
  referenceCode: "AF-1001",
  title: "Gulberg Family Apartment",
  purpose: "RENT",
  type: "APARTMENT",
  status: "AVAILABLE",
  isPublished: false,
  price: 150000,
  currency: "PKR",
  areaValue: 1800,
  areaUnit: "SQFT",
  bedrooms: 3,
  bathrooms: 2,
  city: "Lahore",
  locality: "Gulberg III",
  images: [],
  assignedAgentId: "agent",
  assignedAgent: { id: "agent", name: "Agent User" },
  createdAt: "2026-11-12T09:00:00Z",
};
export const lead = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "Ayesha Khan",
  phone: "03001234567",
  stage: "NEW",
  createdAt: "2026-11-12T09:00:00Z",
  property,
  preferredContact: "PHONE",
};
export async function mockWorkspace(
  page: Page,
  role: "ADMIN" | "AGENT" = "ADMIN",
) {
  await page
    .context()
    .addCookies([
      { name: "aqarflow_session", value: "1", domain: "localhost", path: "/" },
    ]);
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url()),
      path = url.pathname.replace("/api/v1", "");
    if (path === "/auth/me")
      return route.fulfill({
        json: {
          data: {
            user: {
              id: role === "AGENT" ? "agent" : "admin",
              name: role === "AGENT" ? "Agent User" : "Admin User",
              role,
              email: "demo@example.com",
              agency: { id: "agency", name: "Demo Agency" },
            },
          },
        },
      });
    if (path === "/users")
      return route.fulfill({
        json: { data: [{ id: "agent", name: "Agent User" }] },
      });
    if (path === "/dashboard/overview")
      return route.fulfill({
        json: {
          data: {
            metrics: {
              activeListings: 1,
              totalProperties: 1,
              totalLeads: 1,
              newLeadsThisMonth: 1,
              scheduledVisits: 1,
              totalDealsValue: 0,
              wonDealsCount: 0,
            },
            recentLeads: [lead],
            upcomingVisits: [
              {
                id: "visit",
                scheduledAt: "2026-11-12T09:00:00Z",
                propertyName: property.title,
                leadName: lead.name,
              },
            ],
          },
        },
      });
    if (path === "/properties")
      return route.fulfill({
        json: {
          data: {
            items: [property],
            total: 1,
            totalPages: 1,
            page: 1,
            limit: 20,
          },
        },
      });
    if (path === "/leads")
      return route.fulfill({
        json: { data: { items: [lead], total: 1, totalPages: 1 } },
      });
    if (path === "/visits" || path === "/deals")
      return route.fulfill({
        json: { data: { items: [], total: 0, totalPages: 1 } },
      });
    if (path === "/public/filters")
      return route.fulfill({
        json: {
          data: {
            cities: ["Lahore", "Karachi"],
            types: ["APARTMENT", "HOUSE"],
          },
        },
      });
    if (path === "/public/properties")
      return route.fulfill({
        json: {
          data: {
            items: [{ ...property, primaryImage: null }],
            total: 1,
            totalPages: 1,
          },
        },
      });
    return route.fulfill({ status: 404, json: { message: "Not found" } });
  });
}
