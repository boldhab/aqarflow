import { z } from 'zod';

export const propertyStatusEnum = z.enum([
  'DRAFT',
  'AVAILABLE',
  'RESERVED',
  'UNDER_OFFER',
  'SOLD',
  'RENTED',
  'LEASED',
  'INACTIVE',
]);

export const propertyPurposeEnum = z.enum(['SALE', 'RENT', 'LEASE']);

export const propertyTypeEnum = z.enum([
  'APARTMENT',
  'HOUSE',
  'VILLA',
  'PLOT',
  'COMMERCIAL',
  'OFFICE',
  'SHOP',
]);

export const areaUnitEnum = z.enum(['SQFT', 'SQM', 'MARLA', 'KANAL']);

export const propertySortEnum = z.enum(['newest', 'price_asc', 'price_desc']);

export const createPropertySchema = z.object({
  body: z.object({
    referenceCode: z.string().trim().min(1, 'Reference code cannot be empty').max(50).optional(),
    title: z.string().trim().min(3, 'Title must be at least 3 characters'),
    description: z.string().trim().optional().nullable(),
    purpose: propertyPurposeEnum.default('SALE'),
    type: propertyTypeEnum.default('APARTMENT'),
    status: propertyStatusEnum.default('AVAILABLE'),
    price: z.number().positive('Price must be greater than 0'),
    currency: z.string().trim().default('PKR'),
    areaValue: z.number().positive('Area value must be greater than 0'),
    areaUnit: areaUnitEnum.default('SQFT'),
    bedrooms: z.number().int().nonnegative().optional().nullable(),
    bathrooms: z.number().int().nonnegative().optional().nullable(),
    address: z.string().trim().optional().nullable(),
    city: z.string().trim().optional().nullable(),
    locality: z.string().trim().optional().nullable(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    assignedAgentId: z.string().uuid().optional().nullable(),
  }),
});

export const updatePropertySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid property ID'),
  }),
  body: z.object({
    referenceCode: z.string().trim().min(1, 'Reference code cannot be empty').max(50).optional(),
    title: z.string().trim().min(3, 'Title must be at least 3 characters').optional(),
    description: z.string().trim().optional().nullable(),
    purpose: propertyPurposeEnum.optional(),
    type: propertyTypeEnum.optional(),
    status: propertyStatusEnum.optional(),
    price: z.number().positive('Price must be greater than 0').optional(),
    currency: z.string().trim().optional(),
    areaValue: z.number().positive('Area value must be greater than 0').optional(),
    areaUnit: areaUnitEnum.optional(),
    bedrooms: z.number().int().nonnegative().optional().nullable(),
    bathrooms: z.number().int().nonnegative().optional().nullable(),
    address: z.string().trim().optional().nullable(),
    city: z.string().trim().optional().nullable(),
    locality: z.string().trim().optional().nullable(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    assignedAgentId: z.string().uuid().optional().nullable(),
  }),
});

export const listPropertiesQuerySchema = z.object({
  query: z.object({
    status: propertyStatusEnum.optional(),
    purpose: propertyPurposeEnum.optional(),
    type: propertyTypeEnum.optional(),
    city: z.string().trim().optional(),
    minPrice: z
      .string()
      .optional()
      .transform((v) => (v ? parseFloat(v) : undefined)),
    maxPrice: z
      .string()
      .optional()
      .transform((v) => (v ? parseFloat(v) : undefined)),
    bedrooms: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : undefined)),
    isPublished: z
      .string()
      .optional()
      .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
    search: z.string().trim().optional(),
    sort: propertySortEnum.optional().default('newest'),
    page: z
      .string()
      .optional()
      .transform((v) => (v ? Math.max(1, parseInt(v, 10)) : 1)),
    limit: z
      .string()
      .optional()
      .transform((v) => (v ? Math.min(50, Math.max(1, parseInt(v, 10))) : 20)),
  }),
});

export const propertyIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid property ID'),
  }),
});

export const propertyImageIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid property ID'),
    imageId: z.string().uuid('Invalid image ID'),
  }),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>['body'];
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>['body'];
export type ListPropertiesQuery = z.infer<typeof listPropertiesQuerySchema>['query'];
