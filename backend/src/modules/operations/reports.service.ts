import prisma from "@/config/db";
import { Prisma } from "@prisma/client";
import { money } from "./domain";
type MonthTotal = { month: string; value: Prisma.Decimal };
/** Aggregate in PostgreSQL: report memory is bounded by month/agent counts, not transaction volume. */
export async function report(agencyId: string, from: Date, to: Date) {
  const dateRange = { gte: from, lte: to };
  const [
    sales,
    collections,
    rent,
    expenses,
    leadCount,
    visitCount,
    offerCount,
    wonCount,
    converted,
    obligations,
    activeLeases,
    expiringLeases,
    agents,
    propertyCount,
  ] = await Promise.all([
    prisma.$queryRaw<
      MonthTotal[]
    >`SELECT to_char(COALESCE(d."closedAt",d."createdAt"),'YYYY-MM') AS month,sum(COALESCE(d."agreedAmount",d.value)) AS value FROM deals d JOIN properties p ON p.id=d."propertyId" WHERE d."agencyId"=${agencyId} AND d.status='WON' AND p.purpose='SALE' AND COALESCE(d."closedAt",d."createdAt") BETWEEN ${from} AND ${to} GROUP BY 1`,
    prisma.$queryRaw<
      MonthTotal[]
    >`SELECT to_char("paidAt",'YYYY-MM') AS month,sum(amount) AS value FROM payments WHERE "agencyId"=${agencyId} AND "paidAt" BETWEEN ${from} AND ${to} GROUP BY 1`,
    prisma.$queryRaw<
      MonthTotal[]
    >`SELECT to_char("paidAt",'YYYY-MM') AS month,sum(amount) AS value FROM payments WHERE "agencyId"=${agencyId} AND "obligationId" IS NOT NULL AND "paidAt" BETWEEN ${from} AND ${to} GROUP BY 1`,
    prisma.$queryRaw<
      MonthTotal[]
    >`SELECT to_char(date,'YYYY-MM') AS month,sum(amount) AS value FROM expenses WHERE "agencyId"=${agencyId} AND date BETWEEN ${from} AND ${to} GROUP BY 1`,
    prisma.lead.count({ where: { agencyId, createdAt: dateRange } }),
    prisma.visit.count({ where: { agencyId, scheduledAt: dateRange } }),
    prisma.deal.count({
      where: {
        agencyId,
        createdAt: dateRange,
        stage: {
          in: [
            "OFFER",
            "NEGOTIATION",
            "BOOKING",
            "DOCUMENTATION",
            "CLOSED_WON",
          ],
        },
      },
    }),
    prisma.deal.count({
      where: { agencyId, status: "WON", closedAt: dateRange },
    }),
    prisma.lead.count({
      where: {
        agencyId,
        createdAt: dateRange,
        deals: { some: { status: "WON" } },
      },
    }),
    prisma.rentObligation.aggregate({
      where: {
        lease: { agencyId },
        dueDate: dateRange,
        status: { not: "WAIVED" },
      },
      _sum: { amount: true, amountPaid: true },
    }),
    prisma.lease.count({
      where: {
        agencyId,
        status: { in: ["ACTIVE", "RENEWED"] },
        startDate: { lte: new Date() },
        endDate: { gt: new Date() },
      },
    }),
    prisma.lease.findMany({
      where: {
        agencyId,
        status: "ACTIVE",
        endDate: { gte: new Date(), lte: new Date(Date.now() + 30 * 86400000) },
      },
      select: {
        id: true,
        endDate: true,
        property: { select: { title: true } },
        contact: { select: { name: true } },
      },
      take: 100,
      orderBy: { endDate: "asc" },
    }),
    prisma.$queryRaw<
      {
        id: string;
        name: string;
        listings: bigint;
        visits: bigint;
        won: bigint;
        volume: Prisma.Decimal;
        commissions: Prisma.Decimal;
      }[]
    >`SELECT u.id,u.name,(SELECT count(*) FROM properties p WHERE p."assignedAgentId"=u.id AND p."agencyId"=${agencyId} AND p."deletedAt" IS NULL) AS listings,(SELECT count(*) FROM visits v WHERE v."agentId"=u.id AND v."agencyId"=${agencyId} AND v.status='COMPLETED' AND v."scheduledAt" BETWEEN ${from} AND ${to}) AS visits,(SELECT count(*) FROM deals d WHERE d."agentId"=u.id AND d."agencyId"=${agencyId} AND d.status='WON' AND d."closedAt" BETWEEN ${from} AND ${to}) AS won,COALESCE((SELECT sum(COALESCE(d."agreedAmount",d.value)) FROM deals d WHERE d."agentId"=u.id AND d."agencyId"=${agencyId} AND d.status='WON' AND d."closedAt" BETWEEN ${from} AND ${to}),0) AS volume,COALESCE((SELECT sum(c.amount) FROM commissions c JOIN deals d ON d.id=c."dealId" WHERE c."agentId"=u.id AND c."agencyId"=${agencyId} AND c.status<>'CANCELLED' AND d."closedAt" BETWEEN ${from} AND ${to}),0) AS commissions FROM users u WHERE u."agencyId"=${agencyId} ORDER BY u.name`,
    prisma.property.count({
      where: { agencyId, purpose: { in: ["RENT", "LEASE"] }, deletedAt: null },
    }),
  ]);
  const maps = [sales, collections, rent, expenses].map(
    (rows) => new Map(rows.map((r) => [r.month, Number(r.value)])),
  );
  const monthly = [];
  for (
    let d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
    d <= to;
    d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
  ) {
    const month = d.toISOString().slice(0, 7);
    monthly.push({
      month,
      sales: maps[0].get(month) ?? 0,
      collections: maps[1].get(month) ?? 0,
      rent: maps[2].get(month) ?? 0,
      expenses: maps[3].get(month) ?? 0,
    });
  }
  const due = obligations._sum.amount ?? money(0),
    collected = obligations._sum.amountPaid ?? money(0);
  return {
    monthly,
    funnel: [
      { name: "Inquiries", value: leadCount },
      { name: "Visits", value: visitCount },
      { name: "Offers", value: offerCount },
      { name: "Won", value: wonCount },
    ],
    conversionRate: leadCount
      ? Number(((converted / leadCount) * 100).toFixed(1))
      : 0,
    rentDue: due,
    rentCollected: collected,
    collectionRate: due.isZero()
      ? 0
      : Number(collected.div(due).mul(100).toFixed(1)),
    occupancyRate: propertyCount
      ? Number(((activeLeases / propertyCount) * 100).toFixed(1))
      : 0,
    activeLeases,
    expiringLeases,
    agents: agents.map((a) => ({
      ...a,
      listings: Number(a.listings),
      visits: Number(a.visits),
      won: Number(a.won),
      volume: Number(a.volume),
      commissions: Number(a.commissions),
    })),
  };
}
