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
  "/contacts",
  run(async (req, res) => {
    const { agencyId } = user(req),
      q = pagination(req);
    const where = {
      agencyId,
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: "insensitive" as const } },
              { phone: { contains: q.search } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip: q.skip,
        take: q.take,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.contact.count({ where }),
    ]);
    return ok(res, page(items, total, q));
  }),
);
r.post(
  "/contacts",
  run(async (req, res) => {
    const u = user(req),
      input = schema.contactInput.parse(req.body);
    const data = await transaction(async (tx) => {
      const c = await tx.contact.create({
        data: { ...input, agencyId: u.agencyId, normalizedPhone: input.phone },
      });
      await audit(
        tx,
        u.agencyId,
        u.id,
        "CONTACT_CREATED",
        "Contact",
        c.id,
        null,
        c,
      );
      return c;
    });
    return ok(res, data, 201);
  }),
);
r.patch(
  "/contacts/:id",
  run(async (req, res) => {
    const u = user(req),
      id = params(req),
      input = schema.contactInput.partial().parse(req.body);
    return ok(
      res,
      await transaction(async (tx) => {
        await requireReference(tx, "contact", id, u.agencyId);
        const old = await tx.contact.findUniqueOrThrow({ where: { id } });
        if (
          input.phone &&
          input.phone !== old.phone &&
          (await tx.customer.findUnique({ where: { contactId: id } }))
        )
          throw ApiError.conflict(
            "Linked customer phone changes require identity verification",
          );
        const next = await tx.contact.update({
          where: { id },
          data: {
            ...input,
            ...(input.phone ? { normalizedPhone: input.phone } : {}),
          },
        });
        await audit(
          tx,
          u.agencyId,
          u.id,
          "CONTACT_UPDATED",
          "Contact",
          id,
          old,
          next,
        );
        return next;
      }),
    );
  }),
);
r.get(
  "/contacts/:id",
  run(async (req, res) => {
    const { agencyId } = user(req);
    const c = await prisma.contact.findFirst({
      where: { id: params(req), agencyId },
      include: {
        activities: { orderBy: { occurredAt: "desc" }, take: 100 },
        leads: { include: { visits: true, deals: true }, take: 100 },
        leases: { take: 50 },
        invoices: { take: 50 },
      },
    });
    if (!c) throw ApiError.notFound();
    return ok(res, c);
  }),
);
r.post(
  "/contacts/:id/activities",
  run(async (req, res) => {
    const u = user(req),
      contactId = params(req),
      input = schema.activityInput.parse(req.body);
    return ok(
      res,
      await transaction(async (tx) => {
        await requireReference(tx, "contact", contactId, u.agencyId);
        return tx.activity.create({
          data: { ...input, contactId, actorId: u.id },
        });
      }),
      201,
    );
  }),
);
r.get(
  "/notifications",
  run(async (req, res) => {
    const u = user(req),
      q = pagination(req);
    const [items, total, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { agencyId: u.agencyId, userId: u.id },
        orderBy: { createdAt: "desc" },
        skip: q.skip,
        take: q.take,
      }),
      prisma.notification.count({
        where: { agencyId: u.agencyId, userId: u.id },
      }),
      prisma.notification.count({
        where: { agencyId: u.agencyId, userId: u.id, readAt: null },
      }),
    ]);
    return ok(res, { ...page(items, total, q), unread });
  }),
);
r.patch(
  "/notifications/:id/read",
  run(async (req, res) => {
    const u = user(req);
    const result = await prisma.notification.updateMany({
      where: { id: params(req), agencyId: u.agencyId, userId: u.id },
      data: { readAt: new Date() },
    });
    if (!result.count) throw ApiError.notFound();
    return ok(res, { read: true });
  }),
);

export const contactsRouter = r;
