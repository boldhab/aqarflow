import prisma from "@/config/db";
import { ApiError } from "@/shared/errors";
import { roleMiddleware } from "@/shared/middleware";
import { Request, Router } from "express";
import { z } from "zod";
import { csvCell } from "./domain";
import { ok, page, pagination, params, run, user } from "./http";
import { sendPdf } from "./pdf";
import { report } from "./reports.service";
import * as schema from "./schemas";
import { audit, requireReference, transaction } from "./transaction";
const r = Router();
const admin = roleMiddleware("ADMIN");
r.get(
  "/settings/agency",
  admin,
  run(async (req, res) =>
    ok(
      res,
      await prisma.agency.findUnique({
        where: { id: user(req).agencyId },
        include: { branches: true },
      }),
    ),
  ),
);
r.patch(
  "/settings/agency",
  admin,
  run(async (req, res) => {
    const u = user(req),
      input = schema.settingsInput.parse(req.body);
    return ok(
      res,
      await transaction(async (tx) => {
        const before = await tx.agency.findUniqueOrThrow({
          where: { id: u.agencyId },
        });
        if (input.currency && input.currency !== before.currency) {
          const count =
            (await tx.invoice.count({ where: { agencyId: u.agencyId } })) +
            (await tx.lease.count({ where: { agencyId: u.agencyId } })) +
            (await tx.expense.count({ where: { agencyId: u.agencyId } })) +
            (await tx.commission.count({ where: { agencyId: u.agencyId } })) +
            (await tx.payment.count({ where: { agencyId: u.agencyId } }));
          if (count)
            throw ApiError.conflict(
              "Currency cannot change after financial records exist",
            );
        }
        const next = await tx.agency.update({
          where: { id: u.agencyId },
          data: input,
        });
        await audit(
          tx,
          u.agencyId,
          u.id,
          "AGENCY_UPDATED",
          "Agency",
          u.agencyId,
          before,
          next,
        );
        return next;
      }),
    );
  }),
);
r.post(
  "/settings/branches",
  admin,
  run(async (req, res) => {
    const u = user(req),
      input = schema.branchInput.parse(req.body);
    return ok(
      res,
      await transaction(async (tx) => {
        const b = await tx.branch.create({
          data: { ...input, agencyId: u.agencyId },
        });
        await audit(
          tx,
          u.agencyId,
          u.id,
          "BRANCH_CREATED",
          "Branch",
          b.id,
          null,
          b,
        );
        return b;
      }),
      201,
    );
  }),
);
r.patch(
  "/settings/branches/:id",
  admin,
  run(async (req, res) => {
    const u = user(req),
      id = params(req),
      input = schema.branchInput.partial().parse(req.body);
    return ok(
      res,
      await transaction(async (tx) => {
        await requireReference(tx, "branch", id, u.agencyId);
        const old = await tx.branch.findUnique({ where: { id } });
        const b = await tx.branch.update({ where: { id }, data: input });
        await audit(
          tx,
          u.agencyId,
          u.id,
          "BRANCH_UPDATED",
          "Branch",
          id,
          old,
          b,
        );
        return b;
      }),
    );
  }),
);
r.post(
  "/settings/branches/:id/assign",
  admin,
  run(async (req, res) => {
    const u = user(req),
      id = params(req),
      input = z
        .object({
          userId: schema.id.optional(),
          propertyId: schema.id.optional(),
        })
        .strict()
        .refine((v) => Boolean(v.userId) !== Boolean(v.propertyId))
        .parse(req.body);
    return ok(
      res,
      await transaction(async (tx) => {
        await requireReference(tx, "branch", id, u.agencyId);
        if (input.userId) {
          await requireReference(tx, "user", input.userId, u.agencyId);
          await tx.user.update({
            where: { id: input.userId },
            data: { branchId: id },
          });
        }
        if (input.propertyId) {
          await requireReference(tx, "property", input.propertyId, u.agencyId);
          await tx.property.update({
            where: { id: input.propertyId },
            data: { branchId: id },
          });
        }
        await audit(
          tx,
          u.agencyId,
          u.id,
          "BRANCH_ASSIGNED",
          input.userId ? "User" : "Property",
          input.userId ?? input.propertyId!,
          null,
          { branchId: id },
        );
        return { assigned: true };
      }),
    );
  }),
);
r.get(
  "/audit-logs",
  admin,
  run(async (req, res) => {
    const u = user(req),
      q = pagination(req);
    const where = {
      agencyId: u.agencyId,
      ...(q.search
        ? { action: { contains: q.search, mode: "insensitive" as const } }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: q.skip,
        take: q.take,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return ok(res, page(items, total, q));
  }),
);
const getReport = async (req: Request) => {
  const q = schema.listInput.parse(req.query);
  const to = q.to ?? new Date();
  const from =
    q.from ?? new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - 11, 1));
  if (from > to || to.getTime() - from.getTime() > 366 * 5 * 86400000)
    throw ApiError.badRequest("Choose a date range of up to five years");
  return report(user(req).agencyId, from, to);
};
for (const path of ["/reports/sales", "/reports/rentals"])
  r.get(
    path,
    admin,
    run(async (req, res) => ok(res, await getReport(req))),
  );
r.get(
  "/reports/export-csv",
  admin,
  run(async (req, res) => {
    const data = await getReport(req);
    res
      .type("text/csv")
      .attachment("report.csv")
      .send(
        [
          [
            "Month",
            "Sales volume",
            "Collections",
            "Rental collections",
            "Expenses",
          ],
          ...data.monthly.map((m) => [
            m.month,
            m.sales,
            m.collections,
            m.rent,
            m.expenses,
          ]),
        ]
          .map((row) => row.map(csvCell).join(","))
          .join("\r\n"),
      );
  }),
);
r.get(
  "/reports/pdf",
  admin,
  run(async (req, res) => {
    const data = await getReport(req);
    sendPdf(res, "report.pdf", "Business performance", [
      `Rent due: ${data.rentDue}`,
      `Rent collected: ${data.rentCollected}`,
      `Collection efficiency: ${data.collectionRate}%`,
      ...data.monthly.map(
        (m) =>
          `${m.month}: Sales ${m.sales}, Collections ${m.collections}, Expenses ${m.expenses}`,
      ),
    ]);
  }),
);

export const administrationRouter = r;
