import { z } from 'zod';

export const visitStatusEnum = z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']);

export const createVisitSchema = z.object({
  body: z.object({
    propertyId: z.string().uuid('Valid property ID is required'),
    leadId: z.string().uuid('Valid lead ID is required'),
    agentId: z.string().uuid().optional(),
    scheduledAt: z.string().datetime('Must be a valid ISO datetime string'),
    notes: z.string().optional(),
  }),
});

export const updateVisitSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    scheduledAt: z.string().datetime().optional(),
    status: visitStatusEnum.optional(),
    notes: z.string().optional(),
    agentId: z.string().uuid().optional(),
  }),
});

export const listVisitsQuerySchema = z.object({
  query: z.object({
    status: visitStatusEnum.optional(),
    agentId: z.string().uuid().optional(),
    leadId: z.string().uuid().optional(),
    propertyId: z.string().uuid().optional(),
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
  }),
});

export type CreateVisitInput = z.infer<typeof createVisitSchema>['body'];
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>['body'];
export type ListVisitsQuery = z.infer<typeof listVisitsQuerySchema>['query'];
