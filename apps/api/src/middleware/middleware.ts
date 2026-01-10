import { errorHandler, gqlLogger, NotFoundError } from '@app/utils';
import compression from 'compression';
import express, { ErrorRequestHandler, Express, RequestHandler } from 'express';
import helmet from 'helmet';
import { join } from 'path';

/**
 * Configures Express middleware (before GraphQL):
 * 1. Security headers (helmet)
 * 2. Response compression (gzip/brotli)
 * 3. Request logging
 * 4. Static file serving
 *
 * Note: 404 and error handlers are added AFTER GraphQL is mounted
 */
export function setupMiddleware(app: Express): void {
    // Security headers
    app.use(
        helmet({
            contentSecurityPolicy: false, // Disabled for GraphiQL
            crossOriginEmbedderPolicy: false,
        })
    );

    // Response compression (gzip)
    app.use(compression());

    // Request logging
    app.use(gqlLogger as RequestHandler);

    // Static files with caching
    app.use(
        '/assets',
        express.static(join(__dirname, '..', 'assets'), {
            maxAge: '1d',
            etag: true,
        })
    );
}

/**
 * Configures error handling middleware (after GraphQL):
 * 1. 404 handler for unknown routes
 * 2. Global error handler
 *
 * MUST be called after GraphQL is mounted to allow /graphql to work
 */
export function setupErrorHandlers(app: Express): void {
    // 404 handler for unknown routes
    app.use(((_req, _res, next) => {
        next(new NotFoundError('Route not found'));
    }) as RequestHandler);

    // Global error handler (must be last)
    app.use(errorHandler as ErrorRequestHandler);
}
