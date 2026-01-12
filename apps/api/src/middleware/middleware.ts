import { join } from 'node:path';

import { env, errorHandler, gqlLogger, NotFoundError, skipRouteLogging } from '@app/utils';
import compression from 'compression';
import express, { ErrorRequestHandler, Express, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

/**
 * Configures Express middleware (before GraphQL):
 * 1. Rate limiting
 * 2. Security headers (helmet)
 * 3. Response compression (gzip/brotli)
 * 4. Skip logging for GraphQL/health routes
 * 5. Static file serving
 *
 * Note: Request logging is handled by pino-http.
 * GraphQL operation logging with timing is handled by LoggingPlugin.
 */
export function setupMiddleware(app: Express): void {
    // Rate limiting - protect against abuse
    const limiter = rateLimit({
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        max: env.RATE_LIMIT_MAX,
        // Skip rate limiting for health checks
        skip: (req) => {
            const path = req.url || '';
            return path === '/live' || path === '/ready' || path === '/health';
        },
        // Custom error response
        handler: (_req, res, _next, options) => {
            res.status(options.statusCode).json({
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: `Rate limit exceeded. Try again in ${Math.ceil(options.windowMs / 1000)} seconds.`,
                    retryAfter: Math.ceil(options.windowMs / 1000),
                },
            });
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use(limiter);

    // Security headers
    app.use(
        helmet({
            contentSecurityPolicy: false, // Disabled for GraphiQL
            crossOriginEmbedderPolicy: false,
        })
    );

    // Response compression (gzip)
    app.use(compression());

    // Pino-http logger - adds req.log and req.id to all requests
    // Must be before skipRouteLogging which uses req.skipLogging flag
    app.use(gqlLogger);

    // Skip automatic logging for GraphQL and health routes
    // GraphQL: LoggingPlugin handles with detailed timing
    // Health: High-frequency, low-value logs
    app.use(skipRouteLogging as RequestHandler);

    // Static files with caching
    app.use(
        '/assets',
        express.static(join(__dirname, 'assets'), {
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
