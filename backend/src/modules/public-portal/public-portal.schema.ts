import { z } from 'zod';
import { validateAndNormalizePakistaniPhone } from './public-portal.utils';

export const publicPropertiesQuerySchema = z.object({
  query: z.object({
    purpose: z.enum(['SALE', 'RENT', 'LEASE']).optional(),
    type: z
      .enum(['APARTMENT', 'HOUSE', 'VILLA', 'PLOT', 'COMMERCIAL', 'OFFICE', 'SHOP'])
      .optional(),
    city: z.string().trim().optional(),
    minPrice: z.coerce.number().finite().nonnegative().optional(),
    maxPrice: z.coerce.number().finite().nonnegative().optional(),
    bedrooms: z.coerce.number().int().nonnegative().optional(),
    search: z.string().trim().optional(),
    sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(24).default(12),
  }),
});

export const publicInquirySchema = z.object({
  body: z.object({
    name: z
      .string({ error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters'),
    phone: z
      .string({ error: 'Phone number is required' })
      .trim()
      .refine((val) => validateAndNormalizePakistaniPhone(val).isValid, {
        message: 'Must be a valid Pakistani phone number (e.g. 03001234567 or +923001234567)',
      }),
    email: z
      .string()
      .trim()
      .email('Invalid email address')
      .optional()
      .nullable()
      .or(z.literal('')),
    message: z
      .string()
      .trim()
      .max(1000, 'Message cannot exceed 1000 characters')
      .optional()
      .nullable()
      .or(z.literal('')),
    propertyId: z
      .string()
      .guid('Invalid property ID')
      .optional()
      .nullable()
      .or(z.literal('')),
    preferredContact: z.enum(['PHONE', 'EMAIL', 'WHATSAPP']).default('PHONE'),
    honeypot: z.string().optional().nullable(),
    hp_name: z.string().optional().nullable(),
  }),
});

export type PublicPropertiesQuery = z.infer<typeof publicPropertiesQuerySchema>['query'];
export type PublicInquiryInput = z.infer<typeof publicInquirySchema>['body'];
