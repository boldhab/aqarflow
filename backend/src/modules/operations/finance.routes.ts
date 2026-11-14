import prisma from "@/config/db";
import { ApiError } from "@/shared/errors";
import { roleMiddleware } from "@/shared/middleware";
import { Router } from "express";
import { z } from "zod";
import { createInvoice, recordPayment } from "./finance.service";
import { ok, page, pagination, params, run, user } from "./http";
import { sendPdf } from "./pdf";
import * as schema from "./schemas";
import { audit, transaction } from "./transaction";
const r = Router();
const admin = roleMiddleware("ADMIN");
r.get(
  "/finance/invoices",
  run(async (req, res) => {
    const u = user(req),
      q = pagination(req);
    const where = {
      agencyId: u.agencyId,
      ...(q.status === "DUE"
        ? {
            status: { in: ["ISSUED", "PARTIALLY_PAID"] },
            dueDate: { lt: new Date() },
          }
        : q.status
          ? { status: q.status }
          : {}),
      ...(q.search
        ? {
            invoiceNumber: { contains: q.search, mode: "insensitive" as const },
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { contact: { select: { name: true } }, items: true },
        orderBy: { issueDate: "desc" },
        skip: q.skip,
        take: q.take,
      }),
      prisma.invoice.count({ where }),
    ]);
    return ok(res, page(items, total, q));
  }),
);
r.post(
  "/finance/invoices",
  admin,
  run(async (req, res) => {
    const u = user(req);
    return ok(
      res,
      await createInvoice(
        u.agencyId,
        u.id,
        schema.invoiceInput.parse(req.body),
      ),
      201,
    );
  }),
);
r.patch(
  "/finance/invoices/:id",
  admin,
  run(async (req, res) => {
    z.object({ status: z.literal("CANCELLED") })
      .strict()
      .parse(req.body);
    const u = user(req),
      id = params(req);
    return ok(
      res,
      await transaction(async (tx) => {
        const old = await tx.invoice.findFirst({
          where: { id, agencyId: u.agencyId },
        });
        if (!old) throw ApiError.notFound();
        if (!old.amountPaid.isZero())
          throw ApiError.conflict("Paid invoices cannot be cancelled");
        const invoice = await tx.invoice.update({
          where: { id },
          data: { status: "CANCELLED" },
        });
        await audit(
          tx,
          u.agencyId,
          u.id,
          "INVOICE_CANCELLED",
          "Invoice",
          id,
          old,
          invoice,
        );
        return invoice;
      }),
    );
  }),
);
r.get(
  "/finance/invoices/:id/pdf",
  run(async (req, res) => {
    const u = user(req);
    const invoice = await prisma.invoice.findFirst({
      where: { id: params(req), agencyId: u.agencyId },
      include: { items: true, contact: true, agency: true },
    });
    if (!invoice) throw ApiError.notFound();
    sendPdf(res, `${invoice.invoiceNumber}.pdf`, invoice.agency.name, [
      `Invoice ${invoice.invoiceNumber}`,
      `Customer: ${invoice.contact.name}`,
      `Status: ${invoice.status}`,
      `Issued: ${invoice.issueDate.toISOString().slice(0, 10)}  Due: ${invoice.dueDate.toISOString().slice(0, 10)}`,
      ...invoice.items.map(
        (i) =>
          `${i.description} | ${i.quantity} x ${i.unitPrice} = ${i.amount}`,
      ),
      `Subtotal: ${invoice.subtotal}`,
      `Tax (${invoice.taxRate}%): ${invoice.taxAmount}`,
      `Total: ${invoice.currency} ${invoice.totalAmount}`,
      `Paid: ${invoice.amountPaid}`,
      `Balance: ${invoice.totalAmount.sub(invoice.amountPaid)}`,
      invoice.agency.taxNumber ? `Tax number: ${invoice.agency.taxNumber}` : "",
      invoice.notes ?? "",
    ]);
  }),
);
r.get(
  "/finance/payments",
  run(async (req, res) => {
    const u = user(req),
      q = pagination(req),
      where = { agencyId: u.agencyId };
    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          contact: { select: { name: true } },
          invoice: { select: { invoiceNumber: true } },
        },
        orderBy: { paidAt: "desc" },
        skip: q.skip,
        take: q.take,
      }),
      prisma.payment.count({ where }),
    ]);
    return ok(res, page(items, total, q));
  }),
);
r.post(
  "/finance/payments",
  run(async (req, res) => {
    const u = user(req);
    return ok(
      res,
      await recordPayment(
        u.agencyId,
        u.id,
        schema.paymentInput.parse(req.body),
      ),
      201,
    );
  }),
);
r.get(
  "/finance/payments/:id/pdf",
  run(async (req, res) => {
    const u = user(req);
    const p = await prisma.payment.findFirst({
      where: { id: params(req), agencyId: u.agencyId },
      include: { agency: true, contact: true, invoice: true },
    });
    if (!p) throw ApiError.notFound();
    sendPdf(res, `receipt-${p.id}.pdf`, `${p.agency.name} - Payment receipt`, [
      `Receipt: ${p.id}`,
      `Received from: ${p.contact.name}`,
      `Amount: ${p.currency} ${p.amount}`,
      `Method: ${p.method}`,
      `Date: ${p.paidAt.toISOString().slice(0, 10)}`,
      `Reference: ${p.referenceCode ?? "-"}`,
      `Invoice: ${p.invoice?.invoiceNumber ?? "Rent installment"}`,
    ]);
  }),
);
r.get(
  "/finance/expenses",
  run(async (req, res) => {
    const u = user(req),
      q = pagination(req),
      where = { agencyId: u.agencyId };
    const [items, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { date: "desc" },
        skip: q.skip,
        take: q.take,
      }),
      prisma.expense.count({ where }),
    ]);
    return ok(res, page(items, total, q));
  }),
);
r.post(
  "/finance/expenses",
  admin,
  run(async (req, res) => {
    const u = user(req),
      input = schema.expenseInput.parse(req.body);
    return ok(
      res,
      await transaction(async (tx) => {
        const agency = await tx.agency.findUniqueOrThrow({
          where: { id: u.agencyId },
        });
        const e = await tx.expense.create({
          data: { ...input, agencyId: u.agencyId, currency: agency.currency },
        });
        await audit(
          tx,
          u.agencyId,
          u.id,
          "EXPENSE_CREATED",
          "Expense",
          e.id,
          null,
          e,
        );
        return e;
      }),
      201,
    );
  }),
);
r.get(
  "/finance/commissions",
  run(async (req, res) => {
    const u = user(req),
      q = pagination(req),
      where = {
        agencyId: u.agencyId,
        ...(u.role === "AGENT" ? { agentId: u.id } : {}),
      };
    const [items, total] = await Promise.all([
      prisma.commission.findMany({
        where,
        include: {
          agent: { select: { name: true } },
          deal: { include: { property: { select: { title: true } } } },
        },
        skip: q.skip,
        take: q.take,
      }),
      prisma.commission.count({ where }),
    ]);
    return ok(res, page(items, total, q));
  }),
);
r.patch(
  "/finance/commissions/:id",
  admin,
  run(async (req, res) => {
    const u = user(req),
      id = params(req),
      input = z
        .object({ status: z.enum(["APPROVED", "PAID", "CANCELLED"]) })
        .strict()
        .parse(req.body);
    return ok(
      res,
      await transaction(async (tx) => {
        const c = await tx.commission.findFirst({
          where: { id, agencyId: u.agencyId },
        });
        if (!c) throw ApiError.notFound();
        const allowed =
          c.status === "PENDING_APPROVAL"
            ? ["APPROVED", "CANCELLED"]
            : c.status === "APPROVED"
              ? ["PAID", "CANCELLED"]
              : [];
        if (!allowed.includes(input.status))
          throw ApiError.conflict("Invalid commission transition");
        const next = await tx.commission.update({
          where: { id },
          data: {
            status: input.status,
            ...(input.status === "APPROVED" ? { approvedAt: new Date() } : {}),
            ...(input.status === "PAID" ? { paidAt: new Date() } : {}),
          },
        });
        await audit(
          tx,
          u.agencyId,
          u.id,
          "COMMISSION_UPDATED",
          "Commission",
          id,
          c,
          next,
        );
        return next;
      }),
    );
  }),
);

export const financeRouter = r;
