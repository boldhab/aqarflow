import { Router } from 'express';
import { publicPortalController } from './public-portal.controller';
import { validate } from '@/shared/middleware';
import { publicListingQuerySchema, publicInquirySchema } from './public-portal.schema';

const router = Router();

router.get('/listings', validate(publicListingQuerySchema), publicPortalController.listListings);
router.get('/listings/:id', publicPortalController.getListingDetails);
router.post('/inquiries', validate(publicInquirySchema), publicPortalController.createInquiry);

export const publicPortalRouter = router;
