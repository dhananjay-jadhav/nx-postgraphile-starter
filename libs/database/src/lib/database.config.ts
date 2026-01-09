import { env, getDatabaseSchemas } from '@app/utils';
import { PoolConfig } from 'pg';

export interface DatabaseConfig {
    connectionString: string;
    schemas: string[];
    pool: PoolConfig;
}

/**
 * Production-ready database configuration
 * Optimized for PostGraphile with connection pooling best practices
 * Uses Joi for environment variable validation
 */
export const databaseConfig: DatabaseConfig = {
    connectionString: env.DATABASE_URL,
    schemas: getDatabaseSchemas(),
    pool: {
        max: env.DATABASE_POOL_MAX,
        min: env.DATABASE_POOL_MIN,
        idleTimeoutMillis: env.DATABASE_IDLE_TIMEOUT,
        connectionTimeoutMillis: env.DATABASE_CONNECTION_TIMEOUT,
        statement_timeout: env.DATABASE_STATEMENT_TIMEOUT,
        query_timeout: env.DATABASE_QUERY_TIMEOUT,
        allowExitOnIdle: true,
        application_name: env.APP_NAME,
        ...(env.DATABASE_SSL && {
            ssl: { rejectUnauthorized: env.DATABASE_SSL_REJECT_UNAUTHORIZED },
        }),
    },
};

export default databaseConfig;
