import { z } from "zod";
export const id = z.string().guid();
const text = z.string().trim().min(1).max(2000);
const amount = z
  .number()
  .finite()
  .positive()
  .max(99999999999)
  .refine(
    (v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.0001,
    "Use at most two decimal places",
  );
export const phone = z
  .string()
  .transform((v) =>
    v
      .replace(/[\s()-]/g, "")
      .replace(/^0092/, "+92")
      .replace(/^0(?=3)/, "+92"),
  )
  .refine(
    (v) => /^\+923\d{9}$/.test(v),
    "Enter a Pakistani mobile number, e.g. +923001234567",
  );
export const contactInput = z
  .object({
    name: text.max(150),
    phone,
    email: z.string().email().toLowerCase().optional(),
    type: z
      .enum(["BUYER", "SELLER", "TENANT", "LANDLORD", "INVESTOR"])
      .default("BUYER"),
    notes: text.optional(),
  })
  .strict();
export const activityInput = z
  .object({
    type: z.enum(["CALL", "MEETING", "EMAIL", "WHATSAPP", "SYSTEM_NOTE"]),
    subject: text.max(200),
    description: text.optional(),
  })
  .strict();
export const leaseInput = z
  .object({
    propertyId: id,
    contactId: id,
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    landlordContactId: id.optional(),
    managerUserId: id.optional(),
    billingFrequency: z
      .enum(["MONTHLY", "QUARTERLY", "BI_ANNUAL", "ANNUAL"])
      .default("MONTHLY"),
    dueDayOfMonth: z.number().int().min(1).max(31).optional(),
    gracePeriodDays: z.number().int().min(0).max(60).default(5),
    notes: text.optional(),
    monthlyRent: amount,
    depositAmount: amount.or(z.literal(0)).default(0),
  })
  .strict()
  .refine((v) => v.startDate < v.endDate, "End date must follow start date");
export const invoiceInput = z
  .object({
    contactId: id,
    dueDate: z.coerce.date(),
    taxRate: z.number().min(0).max(100).default(0),
    notes: text.optional(),
    items: z
      .array(
        z.object({
          description: text.max(300),
          quantity: z.number().int().min(1).max(100000),
          unitPrice: amount,
        }),
      )
      .min(1)
      .max(100),
  })
  .strict();
export const paymentInput = z
  .object({
    invoiceId: id.optional(),
    obligationId: id.optional(),
    amount,
    method: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "ONLINE_PAYMENT"]),
    referenceCode: text.max(150).optional(),
    requestKey: id,
  })
  .strict()
  .refine(
    (v) => Boolean(v.invoiceId) !== Boolean(v.obligationId),
    "Choose exactly one invoice or rent installment",
  );
export const depositInput = z
  .object({
    amount,
    type: z.enum(["RECEIVED", "REFUNDED", "DEDUCTED"]),
    notes: text.optional(),
    requestKey: id,
  })
  .strict();
export const expenseInput = z
  .object({
    category: text.max(80),
    description: text,
    amount,
    date: z.coerce.date(),
    receiptUrl: z.string().url().optional(),
  })
  .strict();
export const maintenanceInput = z
  .object({
    propertyId: id,
    title: text.max(200),
    description: text,
    category: text.max(80),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
    photos: z.array(z.string().url()).max(10).default([]),
  })
  .strict();
export const maintenanceUpdate = z
  .object({
    status: z
      .enum([
        "OPEN",
        "ASSIGNED",
        "IN_PROGRESS",
        "WAITING",
        "RESOLVED",
        "CLOSED",
      ])
      .optional(),
    assignedTo: text.max(150).optional(),
    cost: amount.or(z.literal(0)).optional(),
    photos: z.array(z.string().url()).max(10).optional(),
  })
  .strict();
export const branchInput = z
  .object({
    name: text.max(150),
    address: text.max(300),
    city: text.max(100),
    phone: text.max(40).optional(),
  })
  .strict();
export const settingsInput = z
  .object({
    name: text.max(150).optional(),
    email: z.string().email().optional(),
    phone: text.max(40).optional(),
    address: text.max(300).optional(),
    logoUrl: z.string().url().optional(),
    currency: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .optional(),
    timezone: z
      .string()
      .refine((v) => {
        try {
          new Intl.DateTimeFormat("en", { timeZone: v });
          return true;
        } catch {
          return false;
        }
      }, "Invalid time zone")
      .optional(),
    invoicePrefix: z
      .string()
      .regex(/^[A-Z]{2,10}$/)
      .optional(),
    taxNumber: text.max(100).optional(),
    commissionRate: z.number().min(0).max(100).optional(),
  })
  .strict();
export const listInput = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  status: z.string().max(40).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
