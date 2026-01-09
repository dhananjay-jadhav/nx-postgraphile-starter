import {
    AppError,
    ConfigError,
    DatabaseError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
    ValidationError,
} from './errors';

describe('Error Classes', () => {
    describe('AppError', () => {
        it('should create error with message, code and statusCode', () => {
            const error = new AppError('Test error', 'TEST_ERROR', 400);

            expect(error.message).toBe('Test error');
            expect(error.code).toBe('TEST_ERROR');
            expect(error.statusCode).toBe(400);
            expect(error.name).toBe('AppError');
            expect(error instanceof Error).toBe(true);
        });

        it('should default statusCode to 500', () => {
            const error = new AppError('Test error', 'TEST_ERROR');

            expect(error.statusCode).toBe(500);
        });

        it('should have stack trace', () => {
            const error = new AppError('Test error', 'TEST_ERROR');

            expect(error.stack).toBeDefined();
        });
    });

    describe('ConfigError', () => {
        it('should create with CONFIG_ERROR code and 500 status', () => {
            const error = new ConfigError('Invalid config');

            expect(error.code).toBe('CONFIG_ERROR');
            expect(error.statusCode).toBe(500);
            expect(error.name).toBe('ConfigError');
        });

        it('should store validation errors', () => {
            const validationErrors = ['PORT must be a number', 'DATABASE_URL is required'];
            const error = new ConfigError('Validation failed', validationErrors);

            expect(error.validationErrors).toEqual(validationErrors);
        });
    });

    describe('DatabaseError', () => {
        it('should create with DATABASE_ERROR code and 503 status', () => {
            const error = new DatabaseError('Connection failed');

            expect(error.message).toBe('Connection failed');
            expect(error.code).toBe('DATABASE_ERROR');
            expect(error.statusCode).toBe(503);
            expect(error.name).toBe('DatabaseError');
        });
    });

    describe('NotFoundError', () => {
        it('should create with NOT_FOUND code and 404 status', () => {
            const error = new NotFoundError();

            expect(error.message).toBe('Resource not found');
            expect(error.code).toBe('NOT_FOUND');
            expect(error.statusCode).toBe(404);
        });

        it('should accept custom message', () => {
            const error = new NotFoundError('User not found');

            expect(error.message).toBe('User not found');
        });
    });

    describe('ValidationError', () => {
        it('should create with VALIDATION_ERROR code and 400 status', () => {
            const error = new ValidationError('Invalid input');

            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.statusCode).toBe(400);
        });

        it('should store field errors', () => {
            const fields = { email: 'Invalid email format', age: 'Must be a number' };
            const error = new ValidationError('Validation failed', fields);

            expect(error.fields).toEqual(fields);
        });
    });

    describe('UnauthorizedError', () => {
        it('should create with UNAUTHORIZED code and 401 status', () => {
            const error = new UnauthorizedError();

            expect(error.message).toBe('Unauthorized');
            expect(error.code).toBe('UNAUTHORIZED');
            expect(error.statusCode).toBe(401);
        });
    });

    describe('ForbiddenError', () => {
        it('should create with FORBIDDEN code and 403 status', () => {
            const error = new ForbiddenError();

            expect(error.message).toBe('Forbidden');
            expect(error.code).toBe('FORBIDDEN');
            expect(error.statusCode).toBe(403);
        });
    });

    describe('Error inheritance', () => {
        it('all errors should be instances of AppError', () => {
            expect(new ConfigError('test') instanceof AppError).toBe(true);
            expect(new DatabaseError('test') instanceof AppError).toBe(true);
            expect(new NotFoundError() instanceof AppError).toBe(true);
            expect(new ValidationError('test') instanceof AppError).toBe(true);
            expect(new UnauthorizedError() instanceof AppError).toBe(true);
            expect(new ForbiddenError() instanceof AppError).toBe(true);
        });

        it('all errors should be instances of Error', () => {
            expect(new ConfigError('test') instanceof Error).toBe(true);
            expect(new DatabaseError('test') instanceof Error).toBe(true);
            expect(new NotFoundError() instanceof Error).toBe(true);
        });
    });
});
