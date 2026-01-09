import { ErrorRequestHandler } from 'express';

import { env } from '../config/config';
import { AppError } from './errors';

interface GraphQLRequestBody {
    operationName?: string;
    query?: string;
    variables?: Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler: ErrorRequestHandler = (err: Error, req, res, _next): void => {
    // Use AppError properties if available, otherwise defaults
    const isAppError = err instanceof AppError;
    const statusCode = isAppError ? err.statusCode : 500;
    const code = isAppError ? err.code : 'INTERNAL_ERROR';
    const isServerError = statusCode >= 500;

    // Extract GraphQL operation name if present
    const body = req.body as GraphQLRequestBody | undefined;
    const graphqlOperation = body?.operationName;

    // Log error with context
    const logContext = {
        err,
        code,
        method: req.method,
        url: req.url,
        statusCode,
        requestId: req.id,
        ...(graphqlOperation && { graphqlOperation }),
    };

    if (isServerError) {
        req.log.error(logContext, 'Server error');
    } else {
        req.log.warn(logContext, 'Client error');
    }

    // Don't leak error details in production for server errors
    const message = env.isProduction && isServerError ? 'Internal Server Error' : err.message;

    res.status(statusCode).json({
        error: {
            message,
            code,
            ...(!env.isProduction && { stack: err.stack }),
        },
    });
};

export { errorHandler };
