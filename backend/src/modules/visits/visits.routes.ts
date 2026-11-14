import { Router } from 'express';
import { visitsController } from './visits.controller';
import { authMiddleware, validate } from '@/shared/middleware';
import {
  createVisitSchema,
  updateVisitSchema,
  listVisitsQuerySchema,
} from './visits.schema';

import { transaction } from '@/modules/operations/transaction';
import { visitConflict } from '@/modules/operations/core.service';

const router = Router();

router.use(authMiddleware);

router.get('/', validate(listVisitsQuerySchema), visitsController.list);
router.post('/check-conflict', async (req, res, next) => {
  try {
    const input = createVisitSchema.shape.body.pick({agentId:true, scheduledAt:true, durationMinutes:true}).parse(req.body);
    const start = new Date(input.scheduledAt);
    const conflicts = await transaction(tx => visitConflict(tx, req.user!.agencyId, input.agentId, start, new Date(start.getTime() + (input.durationMinutes ?? 60)*60000)));
    res.json({success:true,data:{conflicts}});
  } catch(error) {next(error);}
});
router.get('/:id', visitsController.getById);
router.post('/', validate(createVisitSchema), visitsController.create);
router.patch('/:id', validate(updateVisitSchema), visitsController.update);

export const visitsRouter = router;
