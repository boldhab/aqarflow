import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authMiddleware, validate } from '@/shared/middleware';
import { dashboardOverviewQuerySchema } from './dashboard.schema';

const router = Router();

router.use(authMiddleware);

router.get('/overview', validate(dashboardOverviewQuerySchema), dashboardController.getOverview);

export const dashboardRouter = router;
