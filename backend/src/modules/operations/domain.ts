import crypto from "crypto";
import { ApiError } from "@/shared/errors";
import { Prisma } from "@prisma/client";

export const money = (value: Prisma.Decimal.Value) =>
  new Prisma.Decimal(value).toDecimalPlaces(2);

/** Monthly anniversaries retain the original day, clamping only the short month. End is exclusive. */
export function rentSchedule(start: Date, end: Date) {
  if (!(start < end))
    throw ApiError.badRequest("Lease end must follow its start");
  const dates: Date[] = [];
  for (let offset = 0; offset < 600; offset++) {
    const first = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + offset, 1),
    );
    const lastDay = new Date(
      Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
    ).getUTCDate();
    const due = new Date(
      Date.UTC(
        first.getUTCFullYear(),
        first.getUTCMonth(),
        Math.min(start.getUTCDate(), lastDay),
      ),
    );
    if (due >= end) return dates;
    dates.push(due);
  }
  throw ApiError.badRequest("Lease term must be shorter than 50 years");
}
export function invoiceTotals(
  items: { quantity: number; unitPrice: number }[],
  rate: number,
) {
  const amounts = items.map((i) => money(i.unitPrice).mul(i.quantity));
  const subtotal = amounts.reduce((a, b) => a.add(b), money(0));
  const taxAmount = money(subtotal.mul(rate).div(100));
  return { amounts, subtotal, taxAmount, totalAmount: subtotal.add(taxAmount) };
}
export function paymentBalance(
  total: Prisma.Decimal.Value,
  paid: Prisma.Decimal.Value,
  amount: Prisma.Decimal.Value,
) {
  const next = money(paid).add(money(amount));
  if (next.gt(total))
    throw ApiError.conflict("Payment exceeds the outstanding balance");
  return {
    amountPaid: next,
    status: next.eq(total) ? "PAID" : "PARTIALLY_PAID",
  };
}
export function csvCell(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function stableUuid(seed: string) {
  const h = crypto.createHash("sha256").update(seed).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
