import { reconcileLifecycle } from "./lifecycle.worker";
/** Run only against an explicitly selected disposable database. */
import request from "supertest";
import crypto from "crypto";
import prisma from "@/config/db";
import { app } from "@/app";
import { hashPassword } from "@/shared/utils/password";
import { signToken } from "@/shared/utils/jwt";
const suite =
  process.env.RUN_OPERATIONS_INTEGRATION === "1" ? describe : describe.skip;
suite("Integrated product workflows", () => {
  let agencyId: string,
    adminId: string,
    agentId: string,
    propertyId: string,
    contactId: string,
    leadId: string,
    foreignPropertyId: string,
    token: string,
    agentToken: string;
  beforeAll(async () => {
    const agency = await prisma.agency.create({
      data: { name: "Test Agency", slug: `operations-${crypto.randomUUID()}` },
    });
    agencyId = agency.id;
    const password = await hashPassword("test-password123");
    const admin = await prisma.user.create({
      data: {
        agencyId,
        name: "Admin",
        email: `${crypto.randomUUID()}@test.example`,
        password,
        role: "ADMIN",
      },
    });
    adminId = admin.id;
    token = signToken({ userId: adminId, agencyId, role: "ADMIN" });
    const agent = await prisma.user.create({
      data: {
        agencyId,
        name: "Agent",
        email: `${crypto.randomUUID()}@test.example`,
        password,
        role: "AGENT",
      },
    });
    agentId = agent.id;
    agentToken = signToken({ userId: agentId, agencyId, role: "AGENT" });
    propertyId = (
      await prisma.property.create({
        data: {
          agencyId,
          title: "Rental home",
          referenceCode: "OP-1",
          price: 10000,
          purpose: "RENT",
          assignedAgentId: agentId,
          isPublished: true,
        },
      })
    ).id;
    const foreign = await prisma.agency.create({
      data: { name: "Other agency", slug: `foreign-${crypto.randomUUID()}` },
    });
    foreignPropertyId = (
      await prisma.property.create({
        data: {
          agencyId: foreign.id,
          title: "Private",
          referenceCode: "OTHER",
          price: 100,
        },
      })
    ).id;
    contactId = (
      await prisma.contact.create({
        data: {
          agencyId,
          name: "Tenant",
          phone: "+923001112233",
          normalizedPhone: "+923001112233",
        },
      })
    ).id;
    leadId = (
      await prisma.lead.create({
        data: {
          agencyId,
          name: "Tenant",
          phone: "+923001112233",
          contactId,
          assignedAgentId: agentId,
          propertyId,
        },
      })
    ).id;
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });
  const post = (path: string, body: object, t?: string) =>
    request(app)
      .post(`/api/v1${path}`)
      .set("Authorization", `Bearer ${t ?? token}`)
      .send(body);
  it("rejects cross-agency references and agent financial creation", async () => {
    expect(
      (
        await post("/rentals", {
          propertyId: foreignPropertyId,
          contactId,
          startDate: "2028-01-01",
          endDate: "2029-01-01",
          monthlyRent: 100,
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await post(
          "/finance/invoices",
          {
            contactId,
            dueDate: "2028-01-01",
            items: [{ description: "Rent", quantity: 1, unitPrice: 100 }],
          },
          agentToken,
        )
      ).status,
    ).toBe(403);
  });
  it("creates 12 rent obligations, accepts partial payments, rejects overpayments, and prevents overlapping leases", async () => {
    const body = {
      propertyId,
      contactId,
      startDate: "2028-01-31",
      endDate: "2029-01-31",
      monthlyRent: 100,
      depositAmount: 200,
    };
    const lease = await post("/rentals", body);
    expect(lease.status).toBe(201);
    expect(lease.body.data.obligations).toHaveLength(12);
    expect((await post("/rentals", body)).status).toBe(409);
    const obligationId = lease.body.data.obligations[0].id;
    const payment = {
      obligationId,
      amount: 30,
      method: "CASH",
      requestKey: crypto.randomUUID(),
    };
    const p1 = await post("/finance/payments", payment);
    expect(p1.status).toBe(201);
    const replay = await post("/finance/payments", payment);
    expect(replay.status).toBe(201);
    expect(replay.body.data.id).toBe(p1.body.data.id);
    expect(
      (
        await post("/finance/payments", {
          ...payment,
          amount: 80,
          requestKey: crypto.randomUUID(),
        })
      ).status,
    ).toBe(409);
    expect(
      (
        await post(`/rentals/${lease.body.data.id}/deposits`, {
          type: "REFUNDED",
          amount: 1,
          requestKey: crypto.randomUUID(),
        })
      ).status,
    ).toBe(409);
    expect(
      (
        await post(`/rentals/${lease.body.data.id}/deposits`, {
          type: "RECEIVED",
          amount: 200,
          requestKey: crypto.randomUUID(),
        })
      ).status,
    ).toBe(201);
  });
  it("issues unique sequential invoices, posts once, and renders valid PDF documents", async () => {
    const invoice = await post("/finance/invoices", {
      contactId,
      dueDate: "2028-01-01",
      taxRate: 5,
      items: [{ description: "Agency fee", quantity: 2, unitPrice: 50 }],
    });
    expect(invoice.status).toBe(201);
    expect(invoice.body.data.invoiceNumber).toMatch(/^INV-\d{4}-0001$/);
    const invoiceId = invoice.body.data.id,
      payment = {
        invoiceId,
        amount: 50,
        method: "BANK_TRANSFER",
        requestKey: crypto.randomUUID(),
      };
    const [a, b] = await Promise.all([
      post("/finance/payments", payment),
      post("/finance/payments", payment),
    ]);
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    expect(a.body.data.id).toBe(b.body.data.id);
    const stored = await prisma.invoice.findUniqueOrThrow({
      where: { id: invoiceId },
    });
    expect(stored.amountPaid.toNumber()).toBe(50);
    expect(stored.status).toBe("PARTIALLY_PAID");
    const pdf = await request(app)
      .get(`/api/v1/finance/invoices/${invoiceId}/pdf`)
      .set("Authorization", `Bearer ${token}`);
    expect(pdf.status).toBe(200);
    expect(pdf.headers["content-type"]).toContain("application/pdf");
    expect(pdf.body.subarray(0, 4).toString()).toBe("%PDF");
  });
  it("blocks agent double-booking but accepts touching time boundaries", async () => {
    const body = {
      propertyId,
      leadId,
      agentId,
      scheduledAt: "2028-03-01T10:00:00Z",
      durationMinutes: 60,
    };
    expect((await post("/visits", body)).status).toBe(201);
    expect(
      (await post("/visits", { ...body, scheduledAt: "2028-03-01T10:30:00Z" }))
        .status,
    ).toBe(409);
    expect(
      (await post("/visits", { ...body, scheduledAt: "2028-03-01T11:00:00Z" }))
        .status,
    ).toBe(201);
  });
  it("reserves a property once, generates a commission on winning, and records audit history", async () => {
    const body = {
      propertyId,
      leadId,
      agentId,
      value: 10000,
      stage: "BOOKING",
    };
    const deal = await post("/deals", body);
    expect(deal.status).toBe(201);
    expect((await post("/deals", body)).status).toBe(409);
    const won = await request(app)
      .patch(`/api/v1/deals/${deal.body.data.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ stage: "CLOSED_WON", agreedAmount: 10000 });
    expect(won.status).toBe(200);
    const commission = await prisma.commission.findUniqueOrThrow({
      where: { dealId: deal.body.data.id },
    });
    expect(commission.amount.toNumber()).toBe(150);
    const logs = await prisma.auditLog.findMany({ where: { agencyId } });
    expect(logs.length).toBeGreaterThan(0);
    await expect(
      prisma.auditLog.delete({ where: { id: logs[0].id } }),
    ).rejects.toThrow();
  });
  it("tracks maintenance through resolution and prevents non-admin settings updates", async () => {
    const ticket = await post("/maintenance", {
      propertyId,
      title: "Water leak",
      description: "Bathroom pipe",
      category: "Plumbing",
    });
    expect(ticket.status).toBe(201);
    const update = await request(app)
      .patch(`/api/v1/maintenance/${ticket.body.data.id}`)
      .set("Authorization", `Bearer ${agentToken}`)
      .send({ status: "RESOLVED", assignedTo: "Plumber", cost: 500 });
    expect(update.status).toBe(200);
    expect(update.body.data.resolvedAt).toBeTruthy();
    expect(
      (
        await request(app)
          .patch("/api/v1/settings/agency")
          .set("Authorization", `Bearer ${agentToken}`)
          .send({ name: "Changed" })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .get("/api/v1/reports/sales")
          .set("Authorization", `Bearer ${token}`)
      ).status,
    ).toBe(200);
  });
  it("supports quarterly billing, deposit rollover, and live rent schedule statuses", async () => {
    const property = await prisma.property.create({
      data: {
        agencyId,
        title: "Quarterly rental",
        referenceCode: crypto.randomUUID(),
        price: 100,
        purpose: "RENT",
      },
    });
    const body = {
      propertyId: property.id,
      contactId,
      startDate: "2027-01-01",
      endDate: "2028-01-01",
      monthlyRent: 100,
      depositAmount: 200,
      billingFrequency: "QUARTERLY",
    };
    const created = await post("/leases", body);
    expect(created.status).toBe(201);
    expect(created.body.data.obligations).toHaveLength(4);
    expect(Number(created.body.data.obligations[0].amount)).toBe(300);
    expect(
      (
        await post(`/rentals/${created.body.data.id}/deposits`, {
          amount: 200,
          type: "RECEIVED",
          requestKey: crypto.randomUUID(),
        })
      ).status,
    ).toBe(201);
    const renewal = await post(`/leases/${created.body.data.id}/renew`, {
      ...body,
      startDate: "2028-01-01",
      endDate: "2029-01-01",
    });
    expect(renewal.status).toBe(201);
    const movements = await prisma.depositMovement.findMany({
      where: { leaseId: renewal.body.data.id },
    });
    expect(movements).toHaveLength(1);
    expect(movements[0].amount.toNumber()).toBe(200);
    const schedule = await request(app)
      .get("/api/v1/rent-obligations?status=PENDING")
      .set("Authorization", `Bearer ${token}`);
    expect(schedule.status).toBe(200);
    expect(schedule.body.data.total).toBeGreaterThan(0);
  });
  it("serializes concurrent scheduling and invoice numbering", async () => {
    const visit = {
      propertyId,
      leadId,
      agentId,
      scheduledAt: "2029-03-01T10:00:00Z",
      durationMinutes: 60,
    };
    const appointments = await Promise.all([
      post("/visits", visit),
      post("/visits", { ...visit, scheduledAt: "2029-03-01T10:20:00Z" }),
    ]);
    expect(appointments.map((r) => r.status).sort()).toEqual([201, 409]);
    const invoice = {
      contactId,
      dueDate: "2029-03-01",
      items: [{ description: "Service", quantity: 1, unitPrice: 10 }],
    };
    const result = await Promise.all([
      post("/finance/invoices", invoice),
      post("/finance/invoices", invoice),
    ]);
    expect(result.map((r) => r.status)).toEqual([201, 201]);
    expect(result[0].body.data.invoiceNumber).not.toBe(
      result[1].body.data.invoiceNumber,
    );
  });
  it("protects the final administrator and cross-agency branch assignments", async () => {
    expect(
      (
        await request(app)
          .patch(`/api/v1/users/${adminId}`)
          .set("Authorization", `Bearer ${token}`)
          .send({ isActive: false })
      ).status,
    ).toBe(409);
    const branch = await post("/settings/branches", {
      name: "City office",
      address: "Main street",
      city: "Lahore",
    });
    expect(branch.status).toBe(201);
    expect(
      (
        await post(`/settings/branches/${branch.body.data.id}/assign`, {
          propertyId: foreignPropertyId,
        })
      ).status,
    ).toBe(400);
  });
  it("waives future charges on termination and prevents collecting them", async () => {
    const property = await prisma.property.create({
      data: {
        agencyId,
        title: "Terminating lease",
        referenceCode: crypto.randomUUID(),
        price: 100,
        purpose: "RENT",
      },
    });
    const lease = await post("/rentals", {
      propertyId: property.id,
      contactId,
      startDate: "2029-01-01",
      endDate: "2030-01-01",
      monthlyRent: 100,
    });
    expect(lease.status).toBe(201);
    const terminated = await post(`/rentals/${lease.body.data.id}/terminate`, {
      notes: "Inspection completed",
      makeAvailable: true,
    });
    expect(terminated.status).toBe(200);
    expect(
      (
        await post("/finance/payments", {
          obligationId: lease.body.data.obligations[0].id,
          amount: 10,
          method: "CASH",
          requestKey: crypto.randomUUID(),
        })
      ).status,
    ).toBe(409);
    const schedule = await request(app)
      .get("/api/v1/rent-obligations?status=WAIVED")
      .set("Authorization", `Bearer ${token}`);
    expect(schedule.status).toBe(200);
    expect(schedule.body.data.total).toBeGreaterThan(0);
  });
  it("reconciles expirations and sends replay-safe visit reminders", async () => {
    const property = await prisma.property.create({
      data: {
        agencyId,
        title: "Expired rental",
        referenceCode: crypto.randomUUID(),
        price: 100,
        purpose: "RENT",
      },
    });
    const lease = await post("/rentals", {
      propertyId: property.id,
      contactId,
      startDate: "2020-01-01",
      endDate: "2021-01-01",
      monthlyRent: 100,
    });
    expect(lease.status).toBe(201);
    const appointment = await post("/visits", {
      propertyId: property.id,
      leadId,
      agentId,
      scheduledAt: new Date(Date.now() + 3600000).toISOString(),
    });
    expect(appointment.status).toBe(201);
    await reconcileLifecycle();
    await reconcileLifecycle();
    expect(
      (
        await prisma.lease.findUniqueOrThrow({
          where: { id: lease.body.data.id },
        })
      ).status,
    ).toBe("EXPIRED");
    const reminders = await prisma.notification.findMany({
      where: { agencyId, userId: agentId, title: "Upcoming visit" },
    });
    expect(reminders).toHaveLength(1);
    const read = await request(app)
      .patch(`/api/v1/notifications/${reminders[0].id}/read`)
      .set("Authorization", `Bearer ${agentToken}`);
    expect(read.status).toBe(200);
  });
});
