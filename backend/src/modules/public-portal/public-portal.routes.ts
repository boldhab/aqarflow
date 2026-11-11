import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { publicPortalController } from './public-portal.controller';
import { validate } from '@/shared/middleware';
import { publicPropertiesQuerySchema, publicInquirySchema } from './public-portal.schema';

const router = Router();

const inquiryRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many inquiries submitted from this IP, please try again after 15 minutes',
    },
  },
  skip: () => process.env.NODE_ENV === 'test' && !process.env.TEST_RATE_LIMIT,
});

/**
 * @swagger
 * /public/properties:
 *   get:
 *     summary: List published properties for public portal
 *     tags: [Public Portal]
 *     parameters:
 *       - in: query
 *         name: purpose
 *         schema:
 *           type: string
 *           enum: [SALE, RENT, LEASE]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [APARTMENT, HOUSE, VILLA, PLOT, COMMERCIAL, OFFICE, SHOP]
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: bedrooms
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, price_asc, price_desc]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated public properties
 */
router.get('/properties', validate(publicPropertiesQuerySchema), publicPortalController.listProperties);

/**
 * @swagger
 * /public/properties/{id}:
 *   get:
 *     summary: Get published property details
 *     tags: [Public Portal]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Public property detail
 *       404:
 *         description: Property not found
 */
router.get('/properties/:id', publicPortalController.getProperty);

/**
 * @swagger
 * /public/filters:
 *   get:
 *     summary: Get distinct filter options for visible properties
 *     tags: [Public Portal]
 *     responses:
 *       200:
 *         description: Distinct cities and types
 */
router.get('/filters', publicPortalController.getFilters);

/**
 * @swagger
 * /public/inquiries:
 *   post:
 *     summary: Submit a property lead inquiry
 *     tags: [Public Portal]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               message:
 *                 type: string
 *               propertyId:
 *                 type: string
 *               preferredContact:
 *                 type: string
 *                 enum: [PHONE, EMAIL, WHATSAPP]
 *               honeypot:
 *                 type: string
 *     responses:
 *       201:
 *         description: Inquiry submitted successfully
 *       400:
 *         description: Invalid input or Pakistani phone number
 *       404:
 *         description: Property not found
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/inquiries', inquiryRateLimiter, validate(publicInquirySchema), publicPortalController.createInquiry);

// Backwards-compatible aliases for /portal/listings
router.get('/listings', validate(publicPropertiesQuerySchema), publicPortalController.listProperties);
router.get('/listings/:id', publicPortalController.getProperty);

export const publicPortalRouter = router;
