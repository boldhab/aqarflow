import { Router } from 'express';
import { propertiesController } from './properties.controller';
import { authMiddleware, validate } from '@/shared/middleware';
import {
  createPropertySchema,
  updatePropertySchema,
  listPropertiesQuerySchema,
} from './properties.schema';

const router = Router();

router.use(authMiddleware);

router.get('/', validate(listPropertiesQuerySchema), propertiesController.list);
router.get('/:id', propertiesController.getById);
router.post('/', validate(createPropertySchema), propertiesController.create);
router.patch('/:id', validate(updatePropertySchema), propertiesController.update);
router.delete('/:id', propertiesController.delete);

export const propertiesRouter = router;
