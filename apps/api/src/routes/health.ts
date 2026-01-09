import { getPoolStats } from '@app/database';
import { livenessCheck, readinessCheck, runHealthChecks } from '@app/utils';
import type { IRouter } from 'express';
import { Request, Response, Router } from 'express';

const router: IRouter = Router();

// Liveness probe - confirms the process is running
router.get('/live', (_req: Request, res: Response) => {
    res.status(200).json(livenessCheck());
});

// Health check - comprehensive health report
router.get('/health', async (_req: Request, res: Response) => {
    const report = await runHealthChecks();
    const poolStats = getPoolStats();
    res.status(report.status === 'unhealthy' ? 503 : 200).json({ ...report, pool: poolStats });
});

// Readiness probe - confirms all components are ready
router.get('/ready', async (_req: Request, res: Response) => {
    const result = await readinessCheck();
    if (result.ready) {
        res.status(200).json({ status: 'ready' });
    } else {
        res.status(503).json({ status: 'not ready', unhealthyComponents: result.components });
    }
});

export default router;
