import { DatabaseError, logger, registerHealthCheck } from '@app/utils';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

import { databaseConfig } from './database.config';

let pool: Pool | null = null;

export function getPool(): Pool {
    if (!pool) {
        pool = new Pool({
            connectionString: databaseConfig.connectionString,
            ...databaseConfig.pool,
        });

        pool.on('error', err => {
            logger.error({ err }, 'Unexpected error on idle database client');
        });

        registerHealthCheck('database', async () => {
            const start = Date.now();
            try {
                await pool?.query('SELECT 1');
                return { healthy: true, latencyMs: Date.now() - start };
            } catch (error) {
                return {
                    healthy: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                };
            }
        });

        logger.info(
            { poolConfig: { max: databaseConfig.pool.max, min: databaseConfig.pool.min } },
            'Database pool initialized'
        );
    }

    return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
): Promise<QueryResult<T>> {
    try {
        return await getPool().query<T>(text, params);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Query failed';
        throw new DatabaseError(message);
    }
}

export async function getClient(): Promise<PoolClient> {
    try {
        return await getPool().connect();
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get database client';
        throw new DatabaseError(message);
    }
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        if (error instanceof DatabaseError) {
            throw error;
        }
        const message = error instanceof Error ? error.message : 'Transaction failed';
        throw new DatabaseError(message);
    } finally {
        client.release();
    }
}

export function getPoolStats(): { totalCount: number; idleCount: number; waitingCount: number } {
    const p = getPool();
    return {
        totalCount: p.totalCount,
        idleCount: p.idleCount,
        waitingCount: p.waitingCount,
    };
}

export async function closePool(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = null;
        logger.info('Database pool closed');
    }
}
