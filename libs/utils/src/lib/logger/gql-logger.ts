/**
 * Route Logging Filter
 *
 * Conditionally skips pino-http's automatic request logging for specific routes.
 * This reduces log noise for high-frequency or specially-handled endpoints.
 *
 * @module
 */
import { IncomingMessage } from 'node:http';

import { NextFunction, Request, Response } from 'express';
import pino from 'pino';
import pinoHttp from 'pino-http';

import { env } from '../config/config';
import { logger } from './logger';

interface RequestWithBody extends IncomingMessage {
    body?: { operationName?: string };
    query?: { operationName?: string };
}

const getGraphQLOperationName = (req: RequestWithBody): string | undefined => {
    return req.body?.operationName || req.query?.operationName;
};

const isGraphQLRequest = (req: IncomingMessage): boolean => {
    const url = req.url || '';
    return url.includes('/graphql') || url.includes('/graphiql');
};

/**
 * Routes to skip from pino-http's automatic request logging:
 * - GraphQL: LoggingPlugin handles with operation details and timing
 * - Health endpoints: High-frequency probes we don't need to log
 *
 * @see libs/gql/src/lib/plugins/logging.plugin.ts for GraphQL operation logging
 */
const SKIP_LOGGING_PATTERNS = ['/graphql', '/graphiql', '/health', '/ready', '/live'];

const shouldSkipLogging = (url: string): boolean => SKIP_LOGGING_PATTERNS.some((pattern) => url.includes(pattern));

/**
 * Express middleware to conditionally skip automatic request logging.
 *
 * pino-http automatically logs all requests. This middleware sets a flag
 * that pino-http's autoLogging.ignore can check.
 *
 * Usage: app.use(skipRouteLogging);
 */
export const skipRouteLogging = (req: Request, _res: Response, next: NextFunction): void => {
    if (shouldSkipLogging(req.url || '')) {
        // Set flag for pino-http's autoLogging.ignore to check
        (req as Request & { skipLogging?: boolean }).skipLogging = true;
    }
    next();
};

export const gqlLogger = pinoHttp({
    logger,
    customLogLevel: (_req, res, err) => {
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
    },
    customSuccessMessage: (req, res) => {
        if (isGraphQLRequest(req)) {
            const op = getGraphQLOperationName(req);
            return op ? `GraphQL ${op} completed` : `GraphQL request completed`;
        }
        return `${req.method} ${req.url} ${res.statusCode}`;
    },
    customErrorMessage: (req, res, err) => {
        return `${req.method} ${req.url} failed: ${err?.message || res.statusCode}`;
    },
    customProps: req => ({
        requestId: req.id,
        ...(isGraphQLRequest(req) && {
            graphql: { operationName: getGraphQLOperationName(req) },
        }),
        ...(!env.isDevelopment && {
            userAgent: req.headers['user-agent'],
            ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
        }),
    }),
    serializers: {
        req: (req: pino.SerializedRequest): Record<string, unknown> => ({
            method: req.method,
            url: req.url,
            query: req.query,
        }),
        res: (res: pino.SerializedResponse): Record<string, unknown> => ({
            statusCode: res.statusCode,
        }),
    },
    genReqId: req => {
        const existingId = req.headers['x-request-id'];
        return (typeof existingId === 'string' ? existingId : undefined) ?? crypto.randomUUID();
    },
    autoLogging: {
        ignore: req => {
            const url = req.url || '';
            // Skip health checks and GraphQL (LoggingPlugin handles GraphQL logging)
            return shouldSkipLogging(url) || (req as Request & { skipLogging?: boolean }).skipLogging === true;
        },
    },
});
