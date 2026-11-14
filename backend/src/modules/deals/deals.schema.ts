import { z } from 'zod';

export const dealStageEnum = z.enum(['INQUIRY','QUALIFIED','VISIT','OFFER','NEGOTIATION','BOOKING','DOCUMENTATION','CLOSED_WON','CLOSED_LOST']);
export const dealStatusEnum = z.enum(['OPEN', 'WON', 'LOST']);

export const createDealSchema = z.object({
  body: z.object({
    propertyId: z.string().guid('Valid property ID is required'),
    leadId: z.string().guid('Valid lead ID is required'),
    agentId: z.string().guid().optional(),
    stage: dealStageEnum.optional(),
    offerAmount: z.number().positive().optional(),
    agreedAmount: z.number().positive().optional(),
    expectedCloseAt: z.string().datetime().optional(),
    notes: z.string().max(2000).optional(),
    value: z.number().positive('Deal value must be positive'),
    status: dealStatusEnum.optional(),
  }),
});

export const updateDealSchema = z.object({
  params: z.object({
    id: z.string().guid(),
  }),
  body: z.object({
    stage: dealStageEnum.optional(),
    offerAmount: z.number().positive().optional(),
    agreedAmount: z.number().positive().optional(),
    expectedCloseAt: z.string().datetime().optional(),
    notes: z.string().max(2000).optional(),
    value: z.number().positive().optional(),
    status: dealStatusEnum.optional(),
    agentId: z.string().guid().optional(),
    closedAt: z.string().datetime().optional().nullable(),
  }),
});

export const listDealsQuerySchema = z.object({
  query: z.object({
    status: dealStatusEnum.optional(),
    agentId: z.string().guid().optional(),
    leadId: z.string().guid().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export type CreateDealInput = z.infer<typeof createDealSchema>['body'];
export type UpdateDealInput = z.infer<typeof updateDealSchema>['body'];
export type ListDealsQuery = z.infer<typeof listDealsQuerySchema>['query'];
