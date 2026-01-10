import { IncomingMessage } from 'http';
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
            return url.includes('/health') || url.includes('/ready') || url.includes('/live');
        },
    },
});
