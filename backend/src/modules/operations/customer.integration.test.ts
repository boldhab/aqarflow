import request from "supertest";
import crypto from "crypto";
import prisma from "@/config/db";
import { app } from "@/app";
import { env } from "@/config/env";
const suite =
  process.env.RUN_OPERATIONS_INTEGRATION === "1" ? describe : describe.skip;
suite("Customer portal isolation", () => {
  let propertyId: string,
    privateId: string,
    email: string,
    cookie: string,
    agencyId: string;
  beforeAll(async () => {
    const agency = await prisma.agency.upsert({
      where: { slug: env.DEFAULT_AGENCY_SLUG },
      create: { slug: env.DEFAULT_AGENCY_SLUG, name: "Portal test agency" },
      update: {},
    });
    agencyId = agency.id;
    propertyId = (
      await prisma.property.create({
        data: {
          agencyId,
          title: "Portal home",
          referenceCode: crypto.randomUUID(),
          isPublished: true,
          price: 10000,
        },
      })
    ).id;
    privateId = (
      await prisma.property.create({
        data: {
          agencyId,
          title: "Private home",
          referenceCode: crypto.randomUUID(),
          price: 10000,
        },
      })
    ).id;
    email = `${crypto.randomUUID()}@test.example`;
  });
  afterAll(async () => prisma.$disconnect());
  it("creates a separate HttpOnly customer session", async () => {
    const phone = `+923${String(Date.now()).slice(-9)}`;
    const response = await request(app)
      .post("/api/v1/portal/auth/register")
      .send({
        name: "Portal Customer",
        email,
        password: "customer-password123",
        phone,
      });
    expect(response.status).toBe(201);
    expect(response.body.data.password).toBeUndefined();
    const cookies = response.headers["set-cookie"] as unknown as string[];
    const raw = cookies.find((c) => c.startsWith("aqarflow_customer="))!;
    expect(raw).toMatch(/HttpOnly/);
    expect(raw).toMatch(/Path=\/api\/v1\/portal/);
    cookie = raw.split(";")[0];
    expect(
      (await request(app).get("/api/v1/contacts").set("Cookie", cookie)).status,
    ).toBe(401);
  });
  it("only favorites visible listings, using replay-safe save/remove operations", async () => {
    expect(
      (
        await request(app)
          .post(`/api/v1/portal/favorites/${privateId}`)
          .set("Cookie", cookie)
      ).status,
    ).toBe(404);
    for (let i = 0; i < 2; i++)
      expect(
        (
          await request(app)
            .post(`/api/v1/portal/favorites/${propertyId}`)
            .set("Cookie", cookie)
        ).status,
      ).toBe(200);
    const result = await request(app)
      .get("/api/v1/portal/favorites")
      .set("Cookie", cookie);
    expect(result.body.data.items).toHaveLength(1);
    expect(
      (
        await request(app)
          .delete(`/api/v1/portal/favorites/${propertyId}`)
          .set("Cookie", cookie)
      ).status,
    ).toBe(200);
  });
  it("links authenticated inquiries to the account and queues acknowledgments", async () => {
    const response = await request(app)
      .post("/api/v1/portal/inquiries")
      .set("Cookie", cookie)
      .send({ propertyId, message: "Please arrange a viewing" });
    expect(response.status).toBe(201);
    const result = await request(app)
      .get("/api/v1/portal/my-inquiries")
      .set("Cookie", cookie);
    expect(result.body.data.items.map((i: { id: string }) => i.id)).toContain(
      response.body.data.id,
    );
    expect(
      await prisma.emailJob.count({ where: { agencyId, recipient: email } }),
    ).toBeGreaterThanOrEqual(2);
    expect((await request(app).get("/api/v1/portal/auth/me")).status).toBe(401);
  });
  it("does not let a signup claim an existing CRM identity", async () => {
    const phone = `+923${String(Date.now() + 1).slice(-9)}`;
    await prisma.contact.create({
      data: {
        agencyId,
        name: "Existing tenant",
        phone,
        normalizedPhone: phone,
      },
    });
    const response = await request(app)
      .post("/api/v1/portal/auth/register")
      .send({
        name: "Pretender",
        email: `${crypto.randomUUID()}@test.example`,
        password: "customer-password123",
        phone,
      });
    expect(response.status).toBe(409);
  });
});
