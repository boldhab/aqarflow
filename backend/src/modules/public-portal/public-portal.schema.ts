import { z } from 'zod';

export const publicListingQuerySchema = z.object({
  query: z.object({
    agencySlug: z.string().optional(),
    city: z.string().optional(),
    type: z.string().optional(),
    minPrice: z.string().optional().transform((v) => (v ? parseFloat(v) : undefined)),
    maxPrice: z.string().optional().transform((v) => (v ? parseFloat(v) : undefined)),
    bedrooms: z.string().optional().transform((v) => (v ? parseInt(v, 10) : undefined)),
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
  }),
});

export const publicInquirySchema = z.object({
  body: z.object({
    agencyId: z.string().uuid('Valid agency ID is required'),
    propertyId: z.string().uuid().optional(),
    name: z.string().min(2, 'Name is required'),
    email: z.string().email().optional(),
    phone: z.string().min(5, 'Phone number is required'),
    message: z.string().optional(),
  }),
});

export type PublicListingQuery = z.infer<typeof publicListingQuerySchema>['query'];
export type PublicInquiryInput = z.infer<typeof publicInquirySchema>['body'];
