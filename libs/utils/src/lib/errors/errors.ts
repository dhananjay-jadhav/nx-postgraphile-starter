export class AppError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly statusCode = 500
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ConfigError extends AppError {
    constructor(
        message: string,
        public readonly validationErrors?: string[]
    ) {
        super(message, 'CONFIG_ERROR', 500);
    }
}

export class DatabaseError extends AppError {
    constructor(message: string) {
        super(message, 'DATABASE_ERROR', 503);
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 'NOT_FOUND', 404);
    }
}

export class ValidationError extends AppError {
    constructor(
        message: string,
        public readonly fields?: Record<string, string>
    ) {
        super(message, 'VALIDATION_ERROR', 400);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 'UNAUTHORIZED', 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 'FORBIDDEN', 403);
    }
}
