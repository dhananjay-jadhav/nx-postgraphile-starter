import type { IRouter } from 'express';
import { Router } from 'express';

import apiRoutes from './api';
import healthRoutes from './health';

const router: IRouter = Router();

// Mount routes
router.use(healthRoutes);
router.use('/api', apiRoutes);

export default router;
