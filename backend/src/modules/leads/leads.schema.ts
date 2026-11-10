import { z } from 'zod';

export const leadStageEnum = z.enum([
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'VISIT_SCHEDULED',
  'NEGOTIATION',
  'CONVERTED',
  'LOST',
]);

export const createLeadSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email().optional(),
    phone: z.string().min(5, 'Phone number is required'),
    stage: leadStageEnum.default('NEW'),
    source: z.string().optional(),
    assignedToId: z.string().uuid().optional(),
  }),
});

export const updateLeadSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: createLeadSchema.shape.body.partial(),
});

export const assignLeadSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    assignedToId: z.string().uuid('Valid user ID is required'),
  }),
});

export const addLeadNoteSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    content: z.string().min(1, 'Note content cannot be empty'),
  }),
});

export const listLeadsQuerySchema = z.object({
  query: z.object({
    stage: leadStageEnum.optional(),
    assignedToId: z.string().uuid().optional(),
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
  }),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>['body'];
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>['body'];
export type AssignLeadInput = z.infer<typeof assignLeadSchema>['body'];
export type AddLeadNoteInput = z.infer<typeof addLeadNoteSchema>['body'];
export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>['query'];
