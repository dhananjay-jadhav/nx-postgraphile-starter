import type { IRouter } from 'express';
import { Request, Response, Router } from 'express';

const apiRoutes: IRouter = Router();

/**
 * Base API endpoint - returns welcome message
 */
apiRoutes.get('/', (req: Request, res: Response) => {
    req.log.info('Processing API request');
    res.json({ message: 'Welcome to api!' });
});

export default apiRoutes;
