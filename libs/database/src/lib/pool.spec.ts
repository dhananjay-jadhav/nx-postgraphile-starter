import { closePool, getPool, getPoolStats, query, withTransaction } from './pool';

describe('Database Pool (Integration)', () => {
    afterAll(async () => {
        await closePool();
    });

    describe('getPool', () => {
        it('should return a pool instance', () => {
            const pool = getPool();
            expect(pool).toBeDefined();
            expect(pool.totalCount).toBeGreaterThanOrEqual(0);
        });
    });

    describe('getPoolStats', () => {
        it('should return pool statistics', () => {
            const stats = getPoolStats();

            expect(stats).toHaveProperty('totalCount');
            expect(stats).toHaveProperty('idleCount');
            expect(stats).toHaveProperty('waitingCount');
            expect(typeof stats.totalCount).toBe('number');
        });
    });

    describe('query', () => {
        it('should execute a simple query', async () => {
            const result = await query('SELECT 1 + 1 AS sum');

            expect(result.rows).toHaveLength(1);
            expect(result.rows[0].sum).toBe(2);
        });

        it('should execute parameterized query', async () => {
            const result = await query('SELECT $1::text AS name, $2::int AS age', ['John', 30]);

            expect(result.rows).toHaveLength(1);
            expect(result.rows[0]).toEqual({ name: 'John', age: 30 });
        });

        it('should throw error for invalid query', async () => {
            await expect(query('SELECT * FROM non_existent_table_xyz')).rejects.toThrow();
        });
    });

    describe('withTransaction', () => {
        beforeAll(async () => {
            await query(`
                CREATE TABLE IF NOT EXISTS test_transactions (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL
                )
            `);
        });

        afterAll(async () => {
            await query('DROP TABLE IF EXISTS test_transactions');
        });

        beforeEach(async () => {
            await query('TRUNCATE test_transactions RESTART IDENTITY');
        });

        it('should commit transaction on success', async () => {
            await withTransaction(async client => {
                await client.query("INSERT INTO test_transactions (name) VALUES ('Alice')");
                await client.query("INSERT INTO test_transactions (name) VALUES ('Bob')");
            });

            const result = await query('SELECT * FROM test_transactions ORDER BY id');
            expect(result.rows).toHaveLength(2);
            expect(result.rows[0].name).toBe('Alice');
            expect(result.rows[1].name).toBe('Bob');
        });

        it('should rollback transaction on error', async () => {
            await expect(
                withTransaction(async client => {
                    await client.query("INSERT INTO test_transactions (name) VALUES ('Charlie')");
                    throw new Error('Intentional error');
                })
            ).rejects.toThrow('Intentional error');

            const result = await query('SELECT * FROM test_transactions');
            expect(result.rows).toHaveLength(0);
        });

        it('should return value from transaction', async () => {
            const result = await withTransaction(async client => {
                const res = await client.query(
                    "INSERT INTO test_transactions (name) VALUES ('Dave') RETURNING id, name"
                );
                return res.rows[0];
            });

            expect(result).toEqual({ id: 1, name: 'Dave' });
        });
    });
});
