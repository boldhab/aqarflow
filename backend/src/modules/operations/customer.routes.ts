import prisma from "@/config/db";
import { env } from "@/config/env";
import { ApiError } from "@/shared/errors";
import { comparePassword, hashPassword } from "@/shared/utils/password";
import { NextFunction, Request, Response, Router } from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { id, phone } from "./schemas";
import { transaction } from "./transaction";
export const customerRouter = Router();
const r = customerRouter;
const run =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
const ok = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data });
const cookie = {
  httpOnly: true,
  secure: env.NODE_ENV === "production" || env.COOKIE_SAMESITE === "none",
  sameSite: env.COOKIE_SAMESITE,
  path: "/api/v1/portal",
};
const authInput = z
  .object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(10).max(128),
  })
  .strict();
const registration = authInput.extend({
  name: z.string().trim().min(2).max(150),
  phone,
});
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
});
async function agency() {
  return prisma.agency.findUniqueOrThrow({
    where: { slug: env.DEFAULT_AGENCY_SLUG },
  });
}
async function customer(req: Request) {
  let payload: jwt.JwtPayload;
  try {
    const decoded = jwt.verify(
      req.cookies?.aqarflow_customer ?? "",
      env.JWT_SECRET,
      { audience: "customer-portal" },
    );
    if (typeof decoded === "string") throw new Error();
    payload = decoded;
  } catch {
    throw ApiError.unauthorized("Sign in to your customer account");
  }
  const c = await prisma.customer.findFirst({
    where: { id: payload.sub, agencyId: (await agency()).id },
    include: { contact: true },
  });
  if (!c) throw ApiError.unauthorized();
  return c;
}
function session(
  res: Response,
  c: { id: string; email: string; contact: { name: string } },
) {
  const token = jwt.sign({}, env.JWT_SECRET, {
    subject: c.id,
    audience: "customer-portal",
    expiresIn: "8h",
  });
  res.cookie("aqarflow_customer", token, { ...cookie, maxAge: 8 * 3600000 });
  return { id: c.id, email: c.email, name: c.contact.name };
}
r.post(
  "/auth/register",
  limiter,
  run(async (req, res) => {
    const input = registration.parse(req.body),
      a = await agency();
    const password = await hashPassword(input.password);
    const c = await transaction(async (tx) => {
      if (
        await tx.customer.findUnique({
          where: { agencyId_email: { agencyId: a.id, email: input.email } },
        })
      )
        throw ApiError.conflict("An account already uses this email");
      const existing = await tx.contact.findUnique({
        where: {
          agencyId_normalizedPhone: {
            agencyId: a.id,
            normalizedPhone: input.phone,
          },
        },
      });
      // Never claim an existing CRM identity using an unverified phone/email.
      if (existing)
        throw ApiError.conflict(
          "This phone is already in our records. Contact the agency to link your account.",
        );
      const contact = await tx.contact.create({
        data: {
          agencyId: a.id,
          name: input.name,
          phone: input.phone,
          normalizedPhone: input.phone,
          email: input.email,
        },
      });
      const customer = await tx.customer.create({
        data: {
          agencyId: a.id,
          contactId: contact.id,
          email: input.email,
          password,
        },
        include: { contact: true },
      });
      await tx.emailJob.create({
        data: {
          agencyId: a.id,
          recipient: input.email,
          subject: `Welcome to ${a.name}`,
          body: `Hello ${input.name}, your customer account is ready.`,
        },
      });
      return customer;
    });
    return ok(res, session(res, c), 201);
  }),
);
r.post(
  "/auth/login",
  limiter,
  run(async (req, res) => {
    const input = authInput.parse(req.body),
      a = await agency();
    const c = await prisma.customer.findUnique({
      where: { agencyId_email: { agencyId: a.id, email: input.email } },
      include: { contact: true },
    });
    if (!c || !(await comparePassword(input.password, c.password)))
      throw ApiError.unauthorized("Invalid email or password");
    return ok(res, session(res, c));
  }),
);
r.get(
  "/auth/me",
  run(async (req, res) => {
    const c = await customer(req);
    return ok(res, { id: c.id, name: c.contact.name, email: c.email });
  }),
);
r.post(
  "/auth/logout",
  run(async (_req, res) => {
    res.clearCookie("aqarflow_customer", cookie);
    return ok(res, { signedOut: true });
  }),
);
r.get(
  "/favorites",
  run(async (req, res) => {
    const c = await customer(req);
    const items = await prisma.savedProperty.findMany({
      where: {
        customerId: c.id,
        property: {
          agencyId: c.agencyId,
          isPublished: true,
          deletedAt: null,
          status: { in: ["AVAILABLE", "RESERVED", "UNDER_OFFER"] },
        },
      },
      include: { property: { include: { images: true } } },
      take: 100,
      orderBy: { createdAt: "desc" },
    });
    return ok(res, { items });
  }),
);
const setFavorite = (save: boolean) =>
  run(async (req, res) => {
    const c = await customer(req),
      propertyId = id.parse(req.params.id);
    const p = await prisma.property.findFirst({
      where: {
        id: propertyId,
        agencyId: c.agencyId,
        isPublished: true,
        deletedAt: null,
        status: { in: ["AVAILABLE", "RESERVED", "UNDER_OFFER"] },
      },
    });
    if (!p) throw ApiError.notFound("Property is not available");
    if (save)
      await prisma.savedProperty.upsert({
        where: { customerId_propertyId: { customerId: c.id, propertyId } },
        create: { customerId: c.id, propertyId },
        update: {},
      });
    else
      await prisma.savedProperty.deleteMany({
        where: { customerId: c.id, propertyId },
      });
    return ok(res, { saved: save });
  });
r.post("/favorites/:id", setFavorite(true));
r.delete("/favorites/:id", setFavorite(false));
r.get(
  "/my-inquiries",
  run(async (req, res) => {
    const c = await customer(req);
    const items = await prisma.lead.findMany({
      where: { agencyId: c.agencyId, contactId: c.contactId },
      select: {
        id: true,
        stage: true,
        createdAt: true,
        property: { select: { id: true, title: true } },
        visits: {
          select: {
            id: true,
            scheduledAt: true,
            status: true,
            meetingPoint: true,
          },
        },
      },
      take: 100,
      orderBy: { createdAt: "desc" },
    });
    return ok(res, { items });
  }),
);
r.post(
  "/inquiries",
  run(async (req, res) => {
    const c = await customer(req),
      input = z
        .object({ propertyId: id, message: z.string().trim().min(1).max(2000) })
        .strict()
        .parse(req.body);
    const lead = await transaction(async (tx) => {
      const p = await tx.property.findFirst({
        where: {
          id: input.propertyId,
          agencyId: c.agencyId,
          isPublished: true,
          deletedAt: null,
          status: { in: ["AVAILABLE", "RESERVED", "UNDER_OFFER"] },
        },
      });
      if (!p) throw ApiError.notFound("Property is not available");
      const lead = await tx.lead.create({
        data: {
          agencyId: c.agencyId,
          contactId: c.contactId,
          propertyId: p.id,
          assignedAgentId: p.assignedAgentId,
          name: c.contact.name,
          email: c.email,
          normalizedEmail: c.email,
          phone: c.contact.phone,
          normalizedPhone: c.contact.normalizedPhone,
          message: input.message,
        },
      });
      await tx.activity.create({
        data: {
          contactId: c.contactId,
          type: "SYSTEM_NOTE",
          subject: "Property inquiry submitted",
          description: input.message,
        },
      });
      await tx.emailJob.create({
        data: {
          agencyId: c.agencyId,
          recipient: c.email,
          subject: "We received your inquiry",
          body: `Your inquiry about ${p.title} has been received.`,
        },
      });
      if (p.assignedAgentId)
        await tx.notification.create({
          data: {
            agencyId: c.agencyId,
            userId: p.assignedAgentId,
            title: "New customer inquiry",
            body: `${c.contact.name} enquired about ${p.title}`,
            linkUrl: "/leads",
          },
        });
      return { id: lead.id };
    });
    return ok(res, lead, 201);
  }),
);
