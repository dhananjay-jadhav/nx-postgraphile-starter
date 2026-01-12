import Joi from 'joi';

import { ConfigError } from '../errors/errors';
import { logger } from '../logger/logger';

const envSchema = Joi.object({
    // Application
    NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
    PORT: Joi.number().port().default(3000),
    APP_NAME: Joi.string().default('postgraphile-api'),
    LOG_LEVEL: Joi.string().valid('trace', 'debug', 'info', 'warn', 'error', 'fatal').default('info'),
    SHUTDOWN_TIMEOUT: Joi.number().min(1000).default(10000),
    KEEP_ALIVE_TIMEOUT: Joi.number().min(1000).default(65000),

    // Database
    DATABASE_URL: Joi.string()
        .pattern(/^postgres(ql)?:\/\/.+/)
        .default('postgres://postgres:postgres@localhost:5432/postgres'),
    DATABASE_SCHEMAS: Joi.string().default('public'),
    DATABASE_POOL_MAX: Joi.number().min(1).max(100).default(20),
    DATABASE_POOL_MIN: Joi.number().min(0).default(2),
    DATABASE_IDLE_TIMEOUT: Joi.number().min(1000).default(30000),
    DATABASE_CONNECTION_TIMEOUT: Joi.number().min(1000).default(5000),
    DATABASE_STATEMENT_TIMEOUT: Joi.number().min(1000).default(30000),
    DATABASE_QUERY_TIMEOUT: Joi.number().min(1000).default(30000),
    DATABASE_SSL: Joi.boolean().default(false),
    DATABASE_SSL_REJECT_UNAUTHORIZED: Joi.boolean().default(true),

    // Security
    JWT_SECRET: Joi.string().allow('').default(''),

    // Rate Limiting
    RATE_LIMIT_MAX: Joi.number().min(1).default(100),
    RATE_LIMIT_WINDOW_MS: Joi.number().min(1000).default(60000), // 1 minute

    // GraphQL Security
    GRAPHQL_DEPTH_LIMIT: Joi.number().min(1).default(10),
    GRAPHQL_COST_LIMIT: Joi.number().min(1).default(1000),
})
    .unknown(true)
    .options({ abortEarly: false });

export interface EnvConfig {
    NODE_ENV: 'development' | 'test' | 'production';
    PORT: number;
    APP_NAME: string;
    LOG_LEVEL: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    SHUTDOWN_TIMEOUT: number;
    KEEP_ALIVE_TIMEOUT: number;
    DATABASE_URL: string;
    DATABASE_SCHEMAS: string;
    DATABASE_POOL_MAX: number;
    DATABASE_POOL_MIN: number;
    DATABASE_IDLE_TIMEOUT: number;
    DATABASE_CONNECTION_TIMEOUT: number;
    DATABASE_STATEMENT_TIMEOUT: number;
    DATABASE_QUERY_TIMEOUT: number;
    DATABASE_SSL: boolean;
    DATABASE_SSL_REJECT_UNAUTHORIZED: boolean;
    JWT_SECRET: string;
    RATE_LIMIT_MAX: number;
    RATE_LIMIT_WINDOW_MS: number;
    GRAPHQL_DEPTH_LIMIT: number;
    GRAPHQL_COST_LIMIT: number;
    isProduction: boolean;
    isDevelopment: boolean;
    isTest: boolean;
}

function validateEnv(): EnvConfig {
    const { error, value } = envSchema.validate(process.env) as {
        error: Joi.ValidationError | undefined;
        value: EnvConfig;
    };

    if (error) {
        const validationErrors = error.details.map((d: Joi.ValidationErrorItem) => d.message);
        const errorMessage = `Environment validation failed:\n${validationErrors.map(e => `  - ${e}`).join('\n')}`;
        logger.error(errorMessage);
        throw new ConfigError(errorMessage, validationErrors);
    }

    const config: EnvConfig = {
        ...value,
        isProduction: value.NODE_ENV === 'production',
        isDevelopment: value.NODE_ENV === 'development',
        isTest: value.NODE_ENV === 'test',
    };

    logger.info({ env: config.NODE_ENV, port: config.PORT }, 'Environment configuration loaded');

    return config;
}

export const env = validateEnv();

export function getDatabaseSchemas(): string[] {
    return env.DATABASE_SCHEMAS.split(',')
        .map(s => s.trim())
        .filter(Boolean);
}
