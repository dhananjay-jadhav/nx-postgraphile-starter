/**
 * Performance Test Configuration Types
 */

export interface TestConfig {
    /** Display name for the test */
    name: string;
    /** Full URL to test */
    url: string;
    /** HTTP method */
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    /** Request headers */
    headers?: Record<string, string>;
    /** Request body (for POST/PUT/PATCH) */
    body?: string;
    /** Test category for grouping */
    category: 'rest' | 'graphql';
    /** Description of what this test measures */
    description?: string;
}

export interface TestResult {
    name: string;
    requests: {
        average: number;
        mean: number;
        stddev: number;
        min: number;
        max: number;
        total: number;
        sent: number;
        p0_001: number;
        p0_01: number;
        p0_1: number;
        p1: number;
        p2_5: number;
        p10: number;
        p25: number;
        p50: number;
        p75: number;
        p90: number;
        p97_5: number;
        p99: number;
        p99_9: number;
        p99_99: number;
        p99_999: number;
    };
    latency: {
        average: number;
        mean: number;
        stddev: number;
        min: number;
        max: number;
        p0_001: number;
        p0_01: number;
        p0_1: number;
        p1: number;
        p2_5: number;
        p10: number;
        p25: number;
        p50: number;
        p75: number;
        p90: number;
        p97_5: number;
        p99: number;
        p99_9: number;
        p99_99: number;
        p99_999: number;
    };
    throughput: {
        average: number;
        mean: number;
        stddev: number;
        min: number;
        max: number;
        total: number;
        p0_001: number;
        p0_01: number;
        p0_1: number;
        p1: number;
        p2_5: number;
        p10: number;
        p25: number;
        p50: number;
        p75: number;
        p90: number;
        p97_5: number;
        p99: number;
        p99_9: number;
        p99_99: number;
        p99_999: number;
    };
    errors: number;
    timeouts: number;
    duration: number;
    start: Date;
    finish: Date;
    connections: number;
    pipelining: number;
    non2xx: number;
}

export interface RunnerConfig {
    /** Base URL of the API */
    baseUrl: string;
    /** Duration of each test in seconds */
    duration: number;
    /** Number of concurrent connections */
    connections: number;
    /** HTTP pipelining factor */
    pipelining: number;
}

export interface TestSummary {
    test: string;
    category: string;
    reqPerSec: number;
    latencyAvg: number;
    latencyP99: number;
    throughputMBs: number;
    errors: number;
}
