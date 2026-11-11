import { Router } from 'express';
import multer from 'multer';
import { propertiesController } from './properties.controller';
import { authMiddleware, validate } from '@/shared/middleware';
import {
  createPropertySchema,
  updatePropertySchema,
  listPropertiesQuerySchema,
  propertyIdParamSchema,
  propertyImageIdParamSchema,
} from './properties.schema';

const router = Router();

// Multer memory storage for validating magic bytes before saving to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10,
  },
});

router.use(authMiddleware);

/**
 * @openapi
 * /properties:
 *   get:
 *     summary: List properties with pagination, filtering, searching and sorting
 *     tags: [Properties]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, AVAILABLE, RESERVED, UNDER_OFFER, SOLD, RENTED, LEASED, INACTIVE]
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
 *         name: isPublished
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, price_asc, price_desc]
 *           default: newest
 *     responses:
 *       200:
 *         description: Paginated list of properties
 */
router.get('/', validate(listPropertiesQuerySchema), propertiesController.list);

/**
 * @openapi
 * /properties/{id}:
 *   get:
 *     summary: Get property details by ID
 *     tags: [Properties]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Property details
 *       404:
 *         description: Property not found
 */
router.get('/:id', validate(propertyIdParamSchema), propertiesController.getById);

/**
 * @openapi
 * /properties:
 *   post:
 *     summary: Create a new property
 *     tags: [Properties]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, price, areaValue]
 *             properties:
 *               referenceCode:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               purpose:
 *                 type: string
 *                 enum: [SALE, RENT, LEASE]
 *               type:
 *                 type: string
 *                 enum: [APARTMENT, HOUSE, VILLA, PLOT, COMMERCIAL, OFFICE, SHOP]
 *               status:
 *                 type: string
 *                 enum: [DRAFT, AVAILABLE, RESERVED, UNDER_OFFER, SOLD, RENTED, LEASED, INACTIVE]
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: PKR
 *               areaValue:
 *                 type: number
 *               areaUnit:
 *                 type: string
 *                 enum: [SQFT, SQM, MARLA, KANAL]
 *               bedrooms:
 *                 type: integer
 *               bathrooms:
 *                 type: integer
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               locality:
 *                 type: string
 *     responses:
 *       201:
 *         description: Property created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Reference code already exists
 */
router.post('/', validate(createPropertySchema), propertiesController.create);

/**
 * @openapi
 * /properties/{id}:
 *   patch:
 *     summary: Update an existing property
 *     tags: [Properties]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Property updated successfully
 *       403:
 *         description: Forbidden (agent editing other agent's property)
 *       404:
 *         description: Property not found
 */
router.patch('/:id', validate(updatePropertySchema), propertiesController.update);

/**
 * @openapi
 * /properties/{id}:
 *   delete:
 *     summary: Soft delete/archive a property (Admin only)
 *     tags: [Properties]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Property archived successfully
 *       403:
 *         description: Forbidden (only admin can archive)
 *       404:
 *         description: Property not found
 */
router.delete('/:id', validate(propertyIdParamSchema), propertiesController.delete);

/**
 * @openapi
 * /properties/{id}/publish:
 *   patch:
 *     summary: Publish a property
 *     tags: [Properties]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Property published successfully
 *       400:
 *         description: Publishing requirements not met
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Property not found
 */
router.patch('/:id/publish', validate(propertyIdParamSchema), propertiesController.publish);

/**
 * @openapi
 * /properties/{id}/unpublish:
 *   patch:
 *     summary: Unpublish a property
 *     tags: [Properties]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Property unpublished successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Property not found
 */
router.patch('/:id/unpublish', validate(propertyIdParamSchema), propertiesController.unpublish);

/**
 * @openapi
 * /properties/{id}/images:
 *   post:
 *     summary: Upload property images (up to 10 files, max 15 per property)
 *     tags: [Properties]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *       400:
 *         description: Invalid image format, oversize or limit reached
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Property not found
 */
router.post(
  '/:id/images',
  validate(propertyIdParamSchema),
  propertiesController.checkImageUploadPermission,
  upload.array('images', 10),
  propertiesController.uploadImages
);

/**
 * @openapi
 * /properties/{id}/images/{imageId}/primary:
 *   patch:
 *     summary: Set an image as primary for the property
 *     tags: [Properties]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Primary image updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Property or image not found
 */
router.patch(
  '/:id/images/:imageId/primary',
  validate(propertyImageIdParamSchema),
  propertiesController.setPrimaryImage
);

/**
 * @openapi
 * /properties/{id}/images/{imageId}:
 *   delete:
 *     summary: Delete a property image
 *     tags: [Properties]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Property or image not found
 */
router.delete(
  '/:id/images/:imageId',
  validate(propertyImageIdParamSchema),
  propertiesController.deleteImage
);

export const propertiesRouter = router;
