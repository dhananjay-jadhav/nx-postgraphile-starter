/**
 * Main Application Router
 * Mounts all route modules under their respective paths
 */
import type { IRouter } from 'express';
import { Router } from 'express';

import apiRoutes from './api.routes';
import healthRoutes from './health.routes';

const router: IRouter = Router();

// Health check routes (/, /live, /ready, /health)
router.use(healthRoutes);

// API routes (/api/*)
router.use('/api', apiRoutes);

export default router;
