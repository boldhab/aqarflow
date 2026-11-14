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
    email: z.string().email().optional().nullable().or(z.literal('')),
    phone: z.string().min(5, 'Phone number is required'),
    stage: leadStageEnum.default('NEW'),
    source: z.enum(['WEBSITE', 'MANUAL']).default('MANUAL'),
    propertyId: z.string().guid().optional().nullable(),
    assignedAgentId: z.string().guid().optional().nullable(),
    assignedToId: z.string().guid().optional().nullable(),
    message: z.string().optional().nullable(),
    preferredContact: z.enum(['PHONE', 'EMAIL', 'WHATSAPP']).default('PHONE'),
  }),
});

export const updateLeadSchema = z.object({
  params: z.object({
    id: z.string().guid(),
  }),
  body: createLeadSchema.shape.body.partial(),
});

export const assignLeadSchema = z.object({
  params: z.object({
    id: z.string().guid(),
  }),
  body: z.object({
    assignedAgentId: z.string().guid().optional(),
    assignedToId: z.string().guid().optional(),
  }),
});

export const addLeadNoteSchema = z.object({
  params: z.object({
    id: z.string().guid(),
  }),
  body: z.object({
    content: z.string().min(1, 'Note content cannot be empty'),
  }),
});

export const listLeadsQuerySchema = z.object({
  query: z.object({
    stage: leadStageEnum.optional(),
    assignedAgentId: z.string().guid().optional(),
    assignedToId: z.string().guid().optional(),
    propertyId: z.string().guid().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>['body'];
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>['body'];
export type AssignLeadInput = z.infer<typeof assignLeadSchema>['body'];
export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>['query'];
