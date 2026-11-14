import { z } from 'zod';

export const visitStatusEnum = z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']);

export const createVisitSchema = z.object({
  body: z.object({
    propertyId: z.string().guid('Valid property ID is required'),
    leadId: z.string().guid('Valid lead ID is required'),
    agentId: z.string().guid().optional(),
    scheduledAt: z.string().datetime('Must be a valid ISO datetime string'),
    durationMinutes: z.number().int().min(5).max(1440).optional(),
    meetingPoint: z.string().max(300).optional(),
    visitorCount: z.number().int().min(1).max(100).optional(),
    outcomeNotes: z.string().max(2000).optional(),
    notes: z.string().max(2000).optional(),
  }),
});

export const updateVisitSchema = z.object({
  params: z.object({
    id: z.string().guid(),
  }),
  body: z.object({
    scheduledAt: z.string().datetime().optional(),
    status: visitStatusEnum.optional(),
    durationMinutes: z.number().int().min(5).max(1440).optional(),
    meetingPoint: z.string().max(300).optional(),
    visitorCount: z.number().int().min(1).max(100).optional(),
    outcomeNotes: z.string().max(2000).optional(),
    notes: z.string().max(2000).optional(),
    agentId: z.string().guid().optional(),
  }),
});

export const listVisitsQuerySchema = z.object({
  query: z.object({
    status: visitStatusEnum.optional(),
    agentId: z.string().guid().optional(),
    leadId: z.string().guid().optional(),
    propertyId: z.string().guid().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export type CreateVisitInput = z.infer<typeof createVisitSchema>['body'];
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>['body'];
export type ListVisitsQuery = z.infer<typeof listVisitsQuerySchema>['query'];
