import { Router } from 'express';
import { visitsController } from './visits.controller';
import { authMiddleware, validate } from '@/shared/middleware';
import {
  createVisitSchema,
  updateVisitSchema,
  listVisitsQuerySchema,
} from './visits.schema';

const router = Router();

router.use(authMiddleware);

router.get('/', validate(listVisitsQuerySchema), visitsController.list);
router.get('/:id', visitsController.getById);
router.post('/', validate(createVisitSchema), visitsController.create);
router.patch('/:id', validate(updateVisitSchema), visitsController.update);

export const visitsRouter = router;
