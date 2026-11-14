import prisma from "@/config/db";
import { ApiError } from "@/shared/errors";
import { roleMiddleware } from "@/shared/middleware";
import { Router } from "express";
import { z } from "zod";
import { createLease, recordDeposit } from "./finance.service";
import { ok, page, pagination, params, run, user } from "./http";
import * as schema from "./schemas";
import { audit, transaction } from "./transaction";
const r = Router();
const admin = roleMiddleware("ADMIN");
r.get(
  "/rentals",
  run(async (req, res) => {
    const u = user(req),
      q = pagination(req),
      where = {
        agencyId: u.agencyId,
        ...(q.status === "EXPIRING"
          ? {
              status: "ACTIVE",
              endDate: {
                gte: new Date(),
                lte: new Date(Date.now() + 30 * 86400000),
              },
            }
          : q.status
            ? { status: q.status }
            : {}),
      };
    const [items, total] = await Promise.all([
      prisma.lease.findMany({
        where,
        include: {
          property: { select: { title: true } },
          contact: { select: { name: true } },
          landlord: { select: { name: true } },
        },
        orderBy: { endDate: "asc" },
        skip: q.skip,
        take: q.take,
      }),
      prisma.lease.count({ where }),
    ]);
    return ok(res, page(items, total, q));
  }),
);
r.post(
  "/rentals",
  admin,
  run(async (req, res) => {
    const u = user(req);
    return ok(
      res,
      await createLease(u.agencyId, u.id, schema.leaseInput.parse(req.body)),
      201,
    );
  }),
);
r.get(
  "/rentals/:id",
  run(async (req, res) => {
    const u = user(req);
    const lease = await prisma.lease.findFirst({
      where: { id: params(req), agencyId: u.agencyId },
      include: {
        property: { select: { title: true } },
        contact: true,
        landlord: true,
        manager: { select: { id: true, name: true } },
        obligations: {
          include: { payments: true },
          orderBy: { dueDate: "asc" },
        },
        deposits: true,
        renewal: true,
      },
    });
    if (!lease) throw ApiError.notFound();
    return ok(res, lease);
  }),
);
r.post(
  "/rentals/:id/renew",
  admin,
  run(async (req, res) => {
    const u = user(req);
    return ok(
      res,
      await createLease(
        u.agencyId,
        u.id,
        schema.leaseInput.parse(req.body),
        params(req),
      ),
      201,
    );
  }),
);
r.post(
  "/rentals/:id/deposits",
  admin,
  run(async (req, res) => {
    const u = user(req);
    return ok(
      res,
      await recordDeposit(
        u.agencyId,
        u.id,
        params(req),
        schema.depositInput.parse(req.body),
      ),
      201,
    );
  }),
);
r.patch(
  "/rentals/:id",
  admin,
  run(async (req, res) => {
    const u = user(req),
      id = params(req);
    const input = z
      .object({ status: z.enum(["ENDED", "TERMINATED"]) })
      .strict()
      .parse(req.body);
    return ok(
      res,
      await transaction(async (tx) => {
        const old = await tx.lease.findFirst({
          where: { id, agencyId: u.agencyId },
        });
        if (!old) throw ApiError.notFound();
        const lease = await tx.lease.update({ where: { id }, data: input });
        await audit(
          tx,
          u.agencyId,
          u.id,
          "LEASE_STATUS_CHANGED",
          "Lease",
          id,
          old,
          lease,
        );
        return lease;
      }),
    );
  }),
);

r.post(
  "/rentals/:id/terminate",
  admin,
  run(async (req, res) => {
    const u = user(req),
      id = params(req),
      input = z
        .object({
          notes: z.string().trim().min(1).max(2000),
          makeAvailable: z.boolean().default(false),
        })
        .strict()
        .parse(req.body);
    return ok(
      res,
      await transaction(async (tx) => {
        const old = await tx.lease.findFirst({
          where: { id, agencyId: u.agencyId },
        });
        if (!old) throw ApiError.notFound();
        if (old.status !== "ACTIVE")
          throw ApiError.conflict("Only active leases can be terminated");
        const next = await tx.lease.update({
          where: { id },
          data: { status: "TERMINATED", notes: input.notes },
        });
        await tx.rentObligation.updateMany({
          where: { leaseId: id, dueDate: { gt: new Date() }, amountPaid: 0 },
          data: {
            status: "WAIVED",
            waiverReason: "Future charge waived on termination",
          },
        });
        if (input.makeAvailable) {
          if (
            await tx.lease.findFirst({
              where: {
                propertyId: old.propertyId,
                agencyId: u.agencyId,
                status: "ACTIVE",
                id: { not: id },
                startDate: { lte: new Date() },
                endDate: { gt: new Date() },
              },
            })
          )
            throw ApiError.conflict("Another active lease holds this property");
          await tx.property.update({
            where: { id: old.propertyId },
            data: { status: "AVAILABLE" },
          });
        }
        await audit(
          tx,
          u.agencyId,
          u.id,
          "LEASE_TERMINATED",
          "Lease",
          id,
          old,
          next,
        );
        return next;
      }),
    );
  }),
);
export const rentalsRouter = r;
