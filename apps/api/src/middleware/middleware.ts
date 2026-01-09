import { errorHandler, gqlLogger, NotFoundError } from '@app/utils';
import express, { Application } from 'express';
import * as path from 'path';

import routes from '../routes';

/**
 * Configures all Express middleware in the correct order.
 */
export function setupMiddleware(app: Application): void {
    // Request logging
    app.use(gqlLogger);

    // Static files
    app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));
}

/**
 * Mounts all application routes.
 */
export function setupRoutes(app: Application): void {
    app.use(routes);
}

/**
 * Configures error handling middleware.
 * Must be called after all routes are mounted.
 */
export function setupErrorHandling(app: Application): void {
    // 404 handler for unknown routes
    app.use((_req, _res, next) => {
        next(new NotFoundError('Route not found'));
    });

    // Global error handler (must be last)
    app.use(errorHandler);
}
