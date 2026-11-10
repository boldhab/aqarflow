import { Router } from 'express';
import { usersController } from './users.controller';
import { authMiddleware, roleMiddleware, validate } from '@/shared/middleware';
import { createUserSchema, updateUserSchema } from './users.schema';

const router = Router();

router.use(authMiddleware);

router.get('/', usersController.list);
router.get('/:id', usersController.getById);
router.post('/', roleMiddleware('ADMIN'), validate(createUserSchema), usersController.create);
router.patch('/:id', roleMiddleware('ADMIN'), validate(updateUserSchema), usersController.update);

export const usersRouter = router;
