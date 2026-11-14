import { Router } from 'express';
import { authRouter } from '@/modules/auth';
import { usersRouter } from '@/modules/users';
import { propertiesRouter } from '@/modules/properties';
import { publicPortalRouter } from '@/modules/public-portal';
import { leadsRouter } from '@/modules/leads';
import { visitsRouter } from '@/modules/visits';
import { dealsRouter } from '@/modules/deals';
import { dashboardRouter } from '@/modules/dashboard';

import { assetsRouter } from '@/modules/operations/assets.routes';
import { operationsRouter } from '@/modules/operations/operations.routes';
import { customerRouter } from '@/modules/operations/customer.routes';

const router = Router();
router.use('/portal', customerRouter);


router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/properties', propertiesRouter);
router.use('/public', publicPortalRouter);
router.use('/portal', publicPortalRouter);
router.use('/leads', leadsRouter);
router.use('/visits', visitsRouter);
router.use('/deals', dealsRouter);
router.use('/dashboard', dashboardRouter);

router.use(assetsRouter);
router.use(operationsRouter);

export const apiRouter = router;
