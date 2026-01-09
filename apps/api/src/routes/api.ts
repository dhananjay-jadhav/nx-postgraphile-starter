import type { IRouter } from 'express';
import { Request, Response, Router } from 'express';

const router: IRouter = Router();

router.get('/', (req: Request, res: Response) => {
    req.log.info('Processing API request');
    res.json({ message: 'Welcome to api!' });
});

export default router;
