import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

/**
 * Pino logger options - used by both standalone logger and pino-http
 */
export const pinoOptions: pino.LoggerOptions = {
    level: logLevel,
    formatters: {
        level: (label: string): { level: string } => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    base: {
        env: process.env.NODE_ENV || 'development',
    },
    redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
        censor: '[REDACTED]',
    },
};

/**
 * Pino-http options for Express middleware
 */
export const pinoHttpOptions = {
    ...pinoOptions,
    customLogLevel: (_req: unknown, res: { statusCode: number }, err?: Error): string => {
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
    },
    serializers: {
        req: (req: pino.SerializedRequest): Record<string, unknown> => ({
            method: req.method,
            url: req.url,
            query: req.query,
            ...(isProduction ? {} : { headers: req.headers }),
        }),
        res: (res: pino.SerializedResponse): Record<string, unknown> => ({
            statusCode: res.statusCode,
        }),
    },
};

/**
 * Standalone pino logger for use outside of request context
 * (e.g., startup logs, background jobs, database initialization)
 */
export const logger = pino(pinoOptions);
