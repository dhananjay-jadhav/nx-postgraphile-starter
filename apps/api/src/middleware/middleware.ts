import { errorHandler, gqlLogger, NotFoundError } from '@app/utils';
import express, { Application, ErrorRequestHandler, RequestHandler } from 'express';
import { join } from 'path';

/**
 * Configures Express middleware (before GraphQL):
 * 1. Request logging
 * 2. Static file serving
 * 3. Application routes (health, api)
 *
 * Note: 404 and error handlers are added AFTER GraphQL is mounted
 */
export function setupMiddleware(app: Application): void {
    // Request logging
    app.use(gqlLogger as RequestHandler);

    // Static files
    app.use('/assets', express.static(join(__dirname, '..', 'assets')));
}

/**
 * Configures error handling middleware (after GraphQL):
 * 1. 404 handler for unknown routes
 * 2. Global error handler
 *
 * MUST be called after GraphQL is mounted to allow /graphql to work
 */
export function setupErrorHandlers(app: Application): void {
    // 404 handler for unknown routes
    app.use(((_req, _res, next) => {
        next(new NotFoundError('Route not found'));
    }) as RequestHandler);

    // Global error handler (must be last)
    app.use(errorHandler as ErrorRequestHandler);
}
