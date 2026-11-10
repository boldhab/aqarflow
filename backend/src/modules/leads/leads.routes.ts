import { Router } from 'express';
import { leadsController } from './leads.controller';
import { authMiddleware, validate } from '@/shared/middleware';
import {
  createLeadSchema,
  updateLeadSchema,
  assignLeadSchema,
  addLeadNoteSchema,
  listLeadsQuerySchema,
} from './leads.schema';

const router = Router();

router.use(authMiddleware);

router.get('/', validate(listLeadsQuerySchema), leadsController.list);
router.get('/:id', leadsController.getById);
router.post('/', validate(createLeadSchema), leadsController.create);
router.patch('/:id', validate(updateLeadSchema), leadsController.update);
router.post('/:id/assign', validate(assignLeadSchema), leadsController.assign);
router.post('/:id/notes', validate(addLeadNoteSchema), leadsController.addNote);

export const leadsRouter = router;
