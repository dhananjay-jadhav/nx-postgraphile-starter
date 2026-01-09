import { errorHandler, gqlLogger, NotFoundError } from '@app/utils';
import express, { Application, ErrorRequestHandler, RequestHandler } from 'express';
import { join } from 'path';

import { router } from '../router';

/**
 * Configures all Express middleware in the correct order:
 * 1. Request logging
 * 2. Static file serving
 * 3. Application routes
 * 4. 404 handler
 * 5. Global error handler
 */
export function setupMiddleware(app: Application): void {
    // Request logging
    app.use(gqlLogger as RequestHandler);

    // Static files
    app.use('/assets', express.static(join(__dirname, '..', 'assets')));

    // Mount application routes
    app.use(router);

    // 404 handler for unknown routes
    app.use(((_req, _res, next) => {
        next(new NotFoundError('Route not found'));
    }) as RequestHandler);

    // Global error handler (must be last)
    app.use(errorHandler as ErrorRequestHandler);
}
