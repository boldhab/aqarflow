import prisma from "@/config/db";
import { roleMiddleware } from "@/shared/middleware";
import { ApiError } from "@/shared/errors";
import { transaction, audit } from "./transaction";
import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { recordPayment } from "./finance.service";
import { ok, pagination, params, run, user } from "./http";
import { paymentInput } from "./schemas";
export const rentScheduleRouter = Router();
rentScheduleRouter.get(
  "/rent-obligations",
  run(async (req, res) => {
    const u = user(req),
      q = pagination(req);
    const status = q.status
      ? z
          .enum([
            "PENDING",
            "DUE",
            "OVERDUE",
            "PARTIALLY_PAID",
            "PAID",
            "WAIVED",
          ])
          .parse(q.status)
      : null;
    const calculated = Prisma.sql`CASE WHEN o.status='WAIVED' THEN 'WAIVED' WHEN o."amountPaid" >= o."amount" THEN 'PAID' WHEN o."dueDate" + l."gracePeriodDays" * interval '1 day' < now() THEN 'OVERDUE' WHEN o."amountPaid" > 0 THEN 'PARTIALLY_PAID' WHEN o."dueDate" <= now() THEN 'DUE' ELSE 'PENDING' END`;
    const where = Prisma.sql`l."agencyId"=${u.agencyId} ${q.from ? Prisma.sql`AND o."dueDate">=${q.from}` : Prisma.empty} ${q.to ? Prisma.sql`AND o."dueDate"<=${q.to}` : Prisma.empty} ${status ? Prisma.sql`AND (${calculated})=${status}` : Prisma.empty}`;
    const [items, count] = await Promise.all([
      prisma.$queryRaw<unknown[]>(
        Prisma.sql`SELECT o.*, ${calculated} AS status, json_build_object('title',p.title) AS property, json_build_object('name',c.name) AS contact FROM rent_obligations o JOIN leases l ON l.id=o."leaseId" JOIN properties p ON p.id=l."propertyId" JOIN contacts c ON c.id=l."contactId" WHERE ${where} ORDER BY o."dueDate" LIMIT ${q.take} OFFSET ${q.skip}`,
      ),
      prisma.$queryRaw<{ total: bigint }[]>(
        Prisma.sql`SELECT count(*) AS total FROM rent_obligations o JOIN leases l ON l.id=o."leaseId" WHERE ${where}`,
      ),
    ]);
    const total = Number(count[0].total);
    return ok(res, {
      items,
      total,
      page: q.page,
      totalPages: Math.ceil(total / q.limit),
    });
  }),
);
rentScheduleRouter.post(
  "/rent-obligations/:id/pay",
  run(async (req, res) => {
    const u = user(req);
    return ok(
      res,
      await recordPayment(
        u.agencyId,
        u.id,
        paymentInput.parse({ ...req.body, obligationId: params(req) }),
      ),
      201,
    );
  }),
);

rentScheduleRouter.post(
  "/rent-obligations/:id/waive",
  roleMiddleware("ADMIN"),
  run(async (req, res) => {
    const u = user(req),
      id = params(req),
      input = z
        .object({ reason: z.string().trim().min(1).max(2000) })
        .strict()
        .parse(req.body);
    return ok(
      res,
      await transaction(async (tx) => {
        const old = await tx.rentObligation.findFirst({
          where: { id, lease: { agencyId: u.agencyId } },
        });
        if (!old) throw ApiError.notFound();
        if (!old.amountPaid.isZero())
          throw ApiError.conflict(
            "Paid installments require an accounting reversal before waiver",
          );
        const next = await tx.rentObligation.update({
          where: { id },
          data: { status: "WAIVED", waiverReason: input.reason },
        });
        await audit(
          tx,
          u.agencyId,
          u.id,
          "RENT_WAIVED",
          "RentObligation",
          id,
          old,
          next,
        );
        return next;
      }),
    );
  }),
);
