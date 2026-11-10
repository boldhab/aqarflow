import { z } from 'zod';

export const propertyStatusEnum = z.enum([
  'DRAFT',
  'AVAILABLE',
  'RESERVED',
  'SOLD',
  'RENTED',
  'INACTIVE',
]);

export const createPropertySchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title is required'),
    description: z.string().optional(),
    price: z.number().positive('Price must be greater than 0'),
    currency: z.string().default('USD'),
    type: z.string().default('APARTMENT'),
    status: propertyStatusEnum.default('AVAILABLE'),
    bedrooms: z.number().int().nonnegative().optional(),
    bathrooms: z.number().int().nonnegative().optional(),
    areaSqFt: z.number().positive().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
  }),
});

export const updatePropertySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: createPropertySchema.shape.body.partial(),
});

export const listPropertiesQuerySchema = z.object({
  query: z.object({
    status: propertyStatusEnum.optional(),
    city: z.string().optional(),
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
  }),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>['body'];
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>['body'];
export type ListPropertiesQuery = z.infer<typeof listPropertiesQuerySchema>['query'];
