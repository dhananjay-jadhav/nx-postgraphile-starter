import {
    livenessCheck,
    readinessCheck,
    registerHealthCheck,
    runHealthChecks,
    unregisterHealthCheck,
} from './health-check';

describe('Health Check', () => {
    beforeEach(() => {
        // Clear all health checks before each test
        unregisterHealthCheck('test-component');
        unregisterHealthCheck('database');
        unregisterHealthCheck('cache');
    });

    describe('registerHealthCheck', () => {
        it('should register a health check function', async () => {
            const checkFn = jest.fn().mockResolvedValue({ healthy: true });

            registerHealthCheck('test-component', checkFn);

            const report = await runHealthChecks();
            expect(checkFn).toHaveBeenCalled();
            expect(report.components).toHaveLength(1);
            expect(report.components[0].name).toBe('test-component');
        });
    });

    describe('unregisterHealthCheck', () => {
        it('should remove a registered health check', async () => {
            registerHealthCheck('test-component', async () => ({ healthy: true }));
            unregisterHealthCheck('test-component');

            const report = await runHealthChecks();
            expect(report.components).toHaveLength(0);
        });

        it('should return true if health check existed', () => {
            registerHealthCheck('test-component', async () => ({ healthy: true }));
            const result = unregisterHealthCheck('test-component');
            expect(result).toBe(true);
        });

        it('should return false if health check did not exist', () => {
            const result = unregisterHealthCheck('non-existent');
            expect(result).toBe(false);
        });
    });

    describe('runHealthChecks', () => {
        it('should return healthy status when all checks pass', async () => {
            registerHealthCheck('database', async () => ({ healthy: true, latencyMs: 5 }));
            registerHealthCheck('cache', async () => ({ healthy: true, latencyMs: 2 }));

            const report = await runHealthChecks();

            expect(report.status).toBe('healthy');
            expect(report.components).toHaveLength(2);
            expect(report.timestamp).toBeDefined();
            expect(report.uptime).toBeGreaterThanOrEqual(0);
        });

        it('should return unhealthy status when all checks fail', async () => {
            registerHealthCheck('database', async () => ({ healthy: false, error: 'Connection failed' }));
            registerHealthCheck('cache', async () => ({ healthy: false, error: 'Redis down' }));

            const report = await runHealthChecks();

            expect(report.status).toBe('unhealthy');
        });

        it('should return degraded status when some checks fail', async () => {
            registerHealthCheck('database', async () => ({ healthy: true }));
            registerHealthCheck('cache', async () => ({ healthy: false, error: 'Redis down' }));

            const report = await runHealthChecks();

            expect(report.status).toBe('degraded');
        });

        it('should catch and report thrown errors', async () => {
            registerHealthCheck('database', async () => {
                throw new Error('Unexpected error');
            });

            const report = await runHealthChecks();

            expect(report.status).toBe('unhealthy');
            expect(report.components[0].status).toBe('unhealthy');
            expect(report.components[0].error).toBe('Unexpected error');
        });

        it('should include latency when provided', async () => {
            registerHealthCheck('database', async () => ({ healthy: true, latencyMs: 15 }));

            const report = await runHealthChecks();

            expect(report.components[0].latencyMs).toBe(15);
        });
    });

    describe('livenessCheck', () => {
        it('should return alive true and uptime', () => {
            const result = livenessCheck();

            expect(result.alive).toBe(true);
            expect(result.uptime).toBeGreaterThanOrEqual(0);
        });
    });

    describe('readinessCheck', () => {
        it('should return ready true when all components healthy', async () => {
            registerHealthCheck('database', async () => ({ healthy: true }));

            const result = await readinessCheck();

            expect(result.ready).toBe(true);
            expect(result.components).toHaveLength(0);
        });

        it('should return ready false with unhealthy component names', async () => {
            registerHealthCheck('database', async () => ({ healthy: false }));
            registerHealthCheck('cache', async () => ({ healthy: false }));

            const result = await readinessCheck();

            expect(result.ready).toBe(false);
            expect(result.components).toContain('database');
            expect(result.components).toContain('cache');
        });

        it('should return ready true when degraded (some healthy)', async () => {
            registerHealthCheck('database', async () => ({ healthy: true }));
            registerHealthCheck('cache', async () => ({ healthy: false }));

            const result = await readinessCheck();

            expect(result.ready).toBe(true);
            expect(result.components).toContain('cache');
        });
    });
});
