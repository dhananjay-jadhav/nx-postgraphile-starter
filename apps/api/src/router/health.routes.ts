/**
 * Health Check Routes
 * Provides Kubernetes-compatible health endpoints for container orchestration
 */
import { getPoolStats } from '@app/database';
import { livenessCheck, logger, readinessCheck, runHealthChecks } from '@app/utils';
import type { IRouter } from 'express';
import { NextFunction, Request, Response, Router } from 'express';

const healthRoutes: IRouter = Router();

/**
 * Liveness probe - confirms the process is running
 * Used by Kubernetes to determine if container needs restart
 */
healthRoutes.get('/live', (_req: Request, res: Response) => {
    res.status(200).json(livenessCheck());
});

/**
 * Health check - comprehensive health report
 * Returns detailed status of all system components
 */
healthRoutes.get('/health', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const report = await runHealthChecks();
        const poolStats = getPoolStats();
        res.status(report.status === 'unhealthy' ? 503 : 200).json({ ...report, pool: poolStats });
    } catch (error) {
        next(error);
    }
});

/**
 * Readiness probe - confirms all components are ready to serve traffic
 * Used by Kubernetes to determine if pod should receive traffic
 */
healthRoutes.get('/ready', async (_req: Request, res: Response) => {
    try {
        const result = await readinessCheck();
        if (result.ready) {
            res.status(200).json({ status: 'ready' });
        } else {
            res.status(503).json({ status: 'not ready', unhealthyComponents: result.components });
        }
    } catch (error) {
        logger.error({ error }, 'Readiness check failed');
        res.status(503).json({ status: 'error', message: 'Readiness check failed' });
    }
});

export default healthRoutes;
