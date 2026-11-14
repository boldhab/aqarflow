import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().trim().email('Invalid email address').toLowerCase(),
    password: z.string().min(10, 'Password must be at least 10 characters').max(128),
    role: z.enum(['ADMIN', 'AGENT']).default('AGENT'),
    phone: z.string().optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().guid(),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    isActive: z.boolean().optional(),
    role: z.enum(['ADMIN', 'AGENT']).optional(),
    phone: z.string().optional(),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
