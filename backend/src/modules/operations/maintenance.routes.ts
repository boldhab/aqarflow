import prisma from "@/config/db";
import { ApiError } from "@/shared/errors";
import { roleMiddleware } from "@/shared/middleware";
import { Router } from "express";
import { ok, page, pagination, params, run, user } from "./http";
import * as schema from "./schemas";
import { audit, requireReference, transaction } from "./transaction";
const r = Router();
const admin = roleMiddleware("ADMIN");
r.get(
  "/maintenance",
  run(async (req, res) => {
    const u = user(req),
      q = pagination(req),
      where = {
        agencyId: u.agencyId,
        ...(q.status ? { status: q.status } : {}),
      };
    const [items, total] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        where,
        include: { property: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
        skip: q.skip,
        take: q.take,
      }),
      prisma.maintenanceRequest.count({ where }),
    ]);
    return ok(res, page(items, total, q));
  }),
);
r.post(
  "/maintenance",
  run(async (req, res) => {
    const u = user(req),
      input = schema.maintenanceInput.parse(req.body);
    return ok(
      res,
      await transaction(async (tx) => {
        await requireReference(tx, "property", input.propertyId, u.agencyId);
        const ticket = await tx.maintenanceRequest.create({
          data: { ...input, agencyId: u.agencyId },
        });
        await audit(
          tx,
          u.agencyId,
          u.id,
          "MAINTENANCE_CREATED",
          "Maintenance",
          ticket.id,
          null,
          ticket,
        );
        return ticket;
      }),
      201,
    );
  }),
);
r.patch(
  "/maintenance/:id",
  run(async (req, res) => {
    const u = user(req),
      id = params(req),
      input = schema.maintenanceUpdate.parse(req.body);
    return ok(
      res,
      await transaction(async (tx) => {
        const old = await tx.maintenanceRequest.findFirst({
          where: { id, agencyId: u.agencyId },
        });
        if (!old) throw ApiError.notFound();
        if (old.status === "CLOSED")
          throw ApiError.conflict("Closed tickets cannot be changed");
        const ticket = await tx.maintenanceRequest.update({
          where: { id },
          data: {
            ...input,
            ...(input.status
              ? {
                  resolvedAt: ["RESOLVED", "CLOSED"].includes(input.status)
                    ? new Date()
                    : null,
                }
              : {}),
          },
        });
        await audit(
          tx,
          u.agencyId,
          u.id,
          "MAINTENANCE_UPDATED",
          "Maintenance",
          id,
          old,
          ticket,
        );
        return ticket;
      }),
    );
  }),
);

export const maintenanceRouter = r;
