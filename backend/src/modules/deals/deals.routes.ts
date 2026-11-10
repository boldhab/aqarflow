import { Router } from 'express';
import { dealsController } from './deals.controller';
import { authMiddleware, validate } from '@/shared/middleware';
import {
  createDealSchema,
  updateDealSchema,
  listDealsQuerySchema,
} from './deals.schema';

const router = Router();

router.use(authMiddleware);

router.get('/', validate(listDealsQuerySchema), dealsController.list);
router.get('/:id', dealsController.getById);
router.post('/', validate(createDealSchema), dealsController.create);
router.patch('/:id', validate(updateDealSchema), dealsController.update);

export const dealsRouter = router;
