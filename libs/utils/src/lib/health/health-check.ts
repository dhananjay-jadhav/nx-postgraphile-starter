import { logger } from '../logger/logger.js';

export interface HealthCheckResult {
    healthy: boolean;
    latencyMs?: number;
    error?: string;
}

export interface ComponentHealth {
    name: string;
    status: 'healthy' | 'unhealthy' | 'degraded';
    latencyMs?: number;
    error?: string;
}

export interface HealthReport {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    uptime: number;
    components: ComponentHealth[];
}

type HealthCheckFn = () => Promise<HealthCheckResult>;

const healthChecks = new Map<string, HealthCheckFn>();
const startTime = Date.now();

export function registerHealthCheck(name: string, checkFn: HealthCheckFn): void {
    healthChecks.set(name, checkFn);
    logger.debug({ component: name }, 'Health check registered');
}

export function unregisterHealthCheck(name: string): boolean {
    return healthChecks.delete(name);
}

export async function runHealthChecks(): Promise<HealthReport> {
    const components: ComponentHealth[] = [];
    let overallHealthy = true;

    const checks = Array.from(healthChecks.entries()).map(async ([name, checkFn]) => {
        try {
            const result = await checkFn();
            components.push({
                name,
                status: result.healthy ? 'healthy' : 'unhealthy',
                latencyMs: result.latencyMs,
                error: result.error,
            });
            if (!result.healthy) overallHealthy = false;
        } catch (error) {
            components.push({
                name,
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            overallHealthy = false;
        }
    });

    await Promise.all(checks);

    const hasHealthy = components.some(c => c.status === 'healthy');
    const status = overallHealthy ? 'healthy' : hasHealthy ? 'degraded' : 'unhealthy';

    return {
        status,
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - startTime) / 1000),
        components,
    };
}

export function livenessCheck(): { alive: boolean; uptime: number } {
    return {
        alive: true,
        uptime: Math.floor((Date.now() - startTime) / 1000),
    };
}

export async function readinessCheck(): Promise<{ ready: boolean; components: string[] }> {
    const report = await runHealthChecks();
    const unhealthy = report.components.filter(c => c.status === 'unhealthy').map(c => c.name);

    return {
        ready: report.status !== 'unhealthy',
        components: unhealthy,
    };
}
