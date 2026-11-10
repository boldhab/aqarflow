import { z } from 'zod';

export const dealStatusEnum = z.enum(['OPEN', 'WON', 'LOST']);

export const createDealSchema = z.object({
  body: z.object({
    propertyId: z.string().uuid('Valid property ID is required'),
    leadId: z.string().uuid('Valid lead ID is required'),
    agentId: z.string().uuid().optional(),
    value: z.number().positive('Deal value must be positive'),
    status: dealStatusEnum.default('OPEN'),
  }),
});

export const updateDealSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    value: z.number().positive().optional(),
    status: dealStatusEnum.optional(),
    agentId: z.string().uuid().optional(),
    closedAt: z.string().datetime().optional().nullable(),
  }),
});

export const listDealsQuerySchema = z.object({
  query: z.object({
    status: dealStatusEnum.optional(),
    agentId: z.string().uuid().optional(),
    leadId: z.string().uuid().optional(),
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
  }),
});

export type CreateDealInput = z.infer<typeof createDealSchema>['body'];
export type UpdateDealInput = z.infer<typeof updateDealSchema>['body'];
export type ListDealsQuery = z.infer<typeof listDealsQuerySchema>['query'];
