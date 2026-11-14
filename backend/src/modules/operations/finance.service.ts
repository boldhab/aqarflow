import { ApiError } from "@/shared/errors";
import crypto from "crypto";
import { z } from "zod";
import { invoiceTotals, money, paymentBalance, rentSchedule } from "./domain";
import {
  depositInput,
  invoiceInput,
  leaseInput,
  paymentInput,
} from "./schemas";
import { audit, requireReference, transaction } from "./transaction";

export async function createInvoice(
  agencyId: string,
  actorId: string,
  input: z.infer<typeof invoiceInput>,
) {
  return transaction(async (tx) => {
    await requireReference(tx, "contact", input.contactId, agencyId);
    const agency = await tx.agency.findUniqueOrThrow({
      where: { id: agencyId },
    });
    const year = new Date().getUTCFullYear();
    const seq = await tx.invoiceSequence.upsert({
      where: { agencyId_year: { agencyId, year } },
      create: { agencyId, year, value: 1 },
      update: { value: { increment: 1 } },
    });
    const totals = invoiceTotals(input.items, input.taxRate);
    const invoice = await tx.invoice.create({
      data: {
        agencyId,
        contactId: input.contactId,
        dueDate: input.dueDate,
        notes: input.notes,
        currency: agency.currency,
        taxRate: input.taxRate,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        invoiceNumber: `${agency.invoicePrefix}-${year}-${String(seq.value).padStart(4, "0")}`,
        items: {
          create: input.items.map((item, i) => ({
            ...item,
            amount: totals.amounts[i],
          })),
        },
      },
      include: { items: true },
    });
    await audit(
      tx,
      agencyId,
      actorId,
      "INVOICE_CREATED",
      "Invoice",
      invoice.id,
      null,
      invoice,
    );
    return invoice;
  });
}
export async function recordPayment(
  agencyId: string,
  actorId: string,
  input: z.infer<typeof paymentInput>,
) {
  return transaction(async (tx) => {
    const previous = await tx.payment.findUnique({
      where: {
        agencyId_requestKey: { agencyId, requestKey: input.requestKey },
      },
    });
    if (previous) {
      if (
        previous.invoiceId !== (input.invoiceId ?? null) ||
        previous.obligationId !== (input.obligationId ?? null) ||
        !previous.amount.eq(input.amount) ||
        previous.method !== input.method ||
        previous.referenceCode !== (input.referenceCode ?? null)
      )
        throw ApiError.conflict(
          "Idempotency key was already used for another payment",
        );
      return previous;
    }
    let contactId: string;
    let currency: string;
    if (input.invoiceId) {
      const invoice = await tx.invoice.findFirst({
        where: { id: input.invoiceId, agencyId },
      });
      if (!invoice) throw ApiError.notFound("Invoice not found");
      if (invoice.status === "CANCELLED")
        throw ApiError.conflict("Cancelled invoices cannot receive payments");
      const balance = paymentBalance(
        invoice.totalAmount,
        invoice.amountPaid,
        input.amount,
      );
      await tx.invoice.update({ where: { id: invoice.id }, data: balance });
      contactId = invoice.contactId;
      currency = invoice.currency;
    } else {
      const obligation = await tx.rentObligation.findFirst({
        where: { id: input.obligationId, lease: { agencyId } },
        include: { lease: { include: { agency: true } } },
      });
      if (!obligation) throw ApiError.notFound("Rent installment not found");
      if (obligation.status === "WAIVED")
        throw ApiError.conflict("Waived installments cannot receive payments");
      const balance = paymentBalance(
        obligation.amount,
        obligation.amountPaid,
        input.amount,
      );
      await tx.rentObligation.update({
        where: { id: obligation.id },
        data: { amountPaid: balance.amountPaid },
      });
      contactId = obligation.lease.contactId;
      currency = obligation.lease.agency.currency;
    }
    const payment = await tx.payment.create({
      data: { ...input, agencyId, contactId, currency },
    });
    await audit(
      tx,
      agencyId,
      actorId,
      "PAYMENT_RECEIVED",
      "Payment",
      payment.id,
      null,
      payment,
    );
    return payment;
  });
}
export async function createLease(
  agencyId: string,
  actorId: string,
  input: z.infer<typeof leaseInput>,
  renewedFromId?: string,
) {
  return transaction(async (tx) => {
    await requireReference(tx, "property", input.propertyId, agencyId);
    await requireReference(tx, "contact", input.contactId, agencyId);
    await requireReference(tx, "contact", input.landlordContactId, agencyId);
    await requireReference(tx, "user", input.managerUserId, agencyId);
    const property = await tx.property.findUniqueOrThrow({
      where: { id: input.propertyId },
    });
    if (property.purpose === "SALE")
      throw ApiError.badRequest("Choose a rental or lease property");
    if (renewedFromId) {
      const original = await tx.lease.findFirst({
        where: { id: renewedFromId, agencyId },
      });
      if (
        !original ||
        original.propertyId !== input.propertyId ||
        original.contactId !== input.contactId ||
        input.startDate < original.endDate
      )
        throw ApiError.conflict(
          "Renewal must follow the original lease for the same tenant and property",
        );
    }
    const overlap = await tx.lease.findFirst({
      where: {
        agencyId,
        propertyId: input.propertyId,
        status: "ACTIVE",
        startDate: { lt: input.endDate },
        endDate: { gt: input.startDate },
      },
    });
    if (overlap)
      throw ApiError.conflict(
        "Property already has an active lease in this period",
      );
    const lease = await tx.lease.create({
      data: {
        ...input,
        agencyId,
        renewedFromId,
        obligations: {
          create: rentSchedule(input.startDate, input.endDate)
            .filter(
              (_, i) =>
                i %
                  { MONTHLY: 1, QUARTERLY: 3, BI_ANNUAL: 6, ANNUAL: 12 }[
                    input.billingFrequency
                  ] ===
                0,
            )
            .map((periodStart, i, periods) => {
              const step = {
                MONTHLY: 1,
                QUARTERLY: 3,
                BI_ANNUAL: 6,
                ANNUAL: 12,
              }[input.billingFrequency];
              const all = rentSchedule(input.startDate, input.endDate);
              const dueDate = new Date(periodStart);
              if (input.dueDayOfMonth) {
                dueDate.setUTCDate(
                  Math.min(
                    input.dueDayOfMonth,
                    new Date(
                      Date.UTC(
                        dueDate.getUTCFullYear(),
                        dueDate.getUTCMonth() + 1,
                        0,
                      ),
                    ).getUTCDate(),
                  ),
                );
                if (dueDate < input.startDate)
                  dueDate.setTime(input.startDate.getTime());
              }
              return {
                dueDate,
                periodStart,
                periodEnd: periods[i + 1] ?? input.endDate,
                amount: money(input.monthlyRent).mul(
                  Math.min(step, all.length - i * step),
                ),
              };
            }),
        },
      },
      include: { obligations: true },
    });
    if (renewedFromId) {
      const previous = await tx.lease.findUniqueOrThrow({
        where: { id: renewedFromId },
        include: { deposits: true },
      });
      const held = previous.deposits.reduce(
        (sum, m) =>
          m.type === "RECEIVED" ? sum.add(m.amount) : sum.sub(m.amount),
        money(0),
      );
      if (held.gt(input.depositAmount))
        throw ApiError.conflict(
          "Refund excess deposit before renewing with a smaller deposit",
        );
      await tx.lease.update({
        where: { id: renewedFromId },
        data: { status: "RENEWED" },
      });
      if (held.gt(0)) {
        await tx.depositMovement.create({
          data: {
            leaseId: renewedFromId,
            type: "TRANSFERRED",
            amount: held,
            notes: `Transferred to renewal ${lease.id}`,
            requestKey: crypto.randomUUID(),
          },
        });
        await tx.depositMovement.create({
          data: {
            leaseId: lease.id,
            type: "RECEIVED",
            amount: held,
            notes: `Rolled over from ${renewedFromId}`,
            requestKey: crypto.randomUUID(),
          },
        });
      }
    }
    if (input.startDate <= new Date())
      await tx.property.update({
        where: { id: input.propertyId },
        data: {
          status: property.purpose === "RENT" ? "RENTED" : "LEASED",
          isPublished: false,
        },
      });
    await audit(
      tx,
      agencyId,
      actorId,
      renewedFromId ? "LEASE_RENEWED" : "LEASE_CREATED",
      "Lease",
      lease.id,
      null,
      lease,
    );
    return lease;
  });
}
export async function recordDeposit(
  agencyId: string,
  actorId: string,
  leaseId: string,
  input: z.infer<typeof depositInput>,
) {
  return transaction(async (tx) => {
    const lease = await tx.lease.findFirst({
      where: { id: leaseId, agencyId },
      include: { deposits: true },
    });
    if (!lease) throw ApiError.notFound("Lease not found");
    const old = await tx.depositMovement.findUnique({
      where: { requestKey: input.requestKey },
    });
    if (old) {
      if (
        old.leaseId !== leaseId ||
        old.type !== input.type ||
        !old.amount.eq(input.amount)
      )
        throw ApiError.conflict("Deposit request key is already used");
      return old;
    }
    const balance = lease.deposits.reduce(
      (sum, m) =>
        m.type === "RECEIVED" ? sum.add(m.amount) : sum.sub(m.amount),
      money(0),
    );
    if (input.type !== "RECEIVED" && balance.lt(input.amount))
      throw ApiError.conflict(
        "Deposit refund or deduction exceeds the held balance",
      );
    if (
      input.type === "RECEIVED" &&
      balance.add(input.amount).gt(lease.depositAmount)
    )
      throw ApiError.conflict("Deposit exceeds the agreed amount");
    const movement = await tx.depositMovement.create({
      data: { ...input, leaseId },
    });
    await audit(
      tx,
      agencyId,
      actorId,
      "DEPOSIT_RECORDED",
      "Lease",
      leaseId,
      null,
      movement,
    );
    return movement;
  });
}
