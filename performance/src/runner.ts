/**
 * Performance Test Runner
 *
 * Executes performance tests using Autocannon and formats results.
 */

import autocannon, { Result } from 'autocannon';
import { RunnerConfig, TestConfig, TestResult, TestSummary } from './types';

export class TestRunner {
    private config: RunnerConfig;

    constructor(config: Partial<RunnerConfig> = {}) {
        this.config = {
            baseUrl: config.baseUrl || process.env.API_URL || 'http://localhost:3000',
            duration: config.duration || parseInt(process.env.DURATION || '10', 10),
            connections: config.connections || parseInt(process.env.CONNECTIONS || '10', 10),
            pipelining: config.pipelining || parseInt(process.env.PIPELINING || '1', 10),
        };
    }

    async checkServerReachable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.config.baseUrl}/live`);
            return response.ok;
        } catch {
            return false;
        }
    }

    async runTest(testName: string, testConfig: TestConfig): Promise<TestResult> {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Testing: ${testConfig.name}`);
        console.log(`URL: ${testConfig.url}`);
        console.log(`Duration: ${this.config.duration}s | Connections: ${this.config.connections}`);
        if (testConfig.description) {
            console.log(`Description: ${testConfig.description}`);
        }
        console.log('='.repeat(60));

        // Use callback-based API to get Instance for progress tracking
        return new Promise(resolve => {
            const instance = autocannon(
                {
                    url: testConfig.url,
                    method: testConfig.method,
                    duration: this.config.duration,
                    connections: this.config.connections,
                    pipelining: this.config.pipelining,
                    headers: testConfig.headers,
                    body: testConfig.body,
                },
                (err: Error | null, result: Result) => {
                    resolve({
                        name: testName,
                        ...result,
                    } as TestResult);
                }
            );

            autocannon.track(instance, { renderProgressBar: true });
        });
    }

    async runTests(tests: Record<string, TestConfig>): Promise<TestResult[]> {
        const results: TestResult[] = [];

        for (const [name, config] of Object.entries(tests)) {
            const result = await this.runTest(name, config);
            results.push(result);
        }

        return results;
    }

    formatResults(results: TestResult[]): TestSummary[] {
        return results.map(r => ({
            test: r.name,
            category: 'unknown',
            reqPerSec: Math.round(r.requests.average),
            latencyAvg: parseFloat(r.latency.average.toFixed(2)),
            latencyP99: parseFloat(r.latency.p99.toFixed(2)),
            throughputMBs: parseFloat((r.throughput.average / 1024 / 1024).toFixed(2)),
            errors: r.errors + r.timeouts,
        }));
    }

    printSummary(results: TestResult[]): void {
        console.log('\n\n');
        console.log('='.repeat(80));
        console.log('PERFORMANCE TEST SUMMARY');
        console.log('='.repeat(80));
        console.log('');

        const summary = results.map(r => ({
            'Test': r.name,
            'Req/sec': r.requests.average.toFixed(0),
            'Latency (ms)': r.latency.average.toFixed(2),
            'P99 (ms)': r.latency.p99.toFixed(2),
            'Throughput (MB/s)': (r.throughput.average / 1024 / 1024).toFixed(2),
            'Errors': r.errors + r.timeouts,
        }));

        console.table(summary);

        // Performance analysis
        console.log('\n📊 Analysis:');
        results.forEach(r => {
            if (r.latency.p99 > 100) {
                console.log(`  ⚠️  ${r.name}: P99 latency > 100ms - consider optimization`);
            }
            if (r.errors > 0 || r.timeouts > 0) {
                console.log(`  ❌ ${r.name}: ${r.errors} errors, ${r.timeouts} timeouts`);
            }
            if (r.requests.average > 1000) {
                console.log(`  ✅ ${r.name}: Excellent throughput (${r.requests.average.toFixed(0)} req/s)`);
            }
        });
    }

    getConfig(): RunnerConfig {
        return { ...this.config };
    }
}
