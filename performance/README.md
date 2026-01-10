# Performance Testing

This directory contains TypeScript-based performance testing scripts and results for the API.

## Directory Structure

```
performance/
├── src/
│   ├── cli.ts              # CLI entry point
│   ├── runner.ts           # Test runner using Autocannon
│   ├── types.ts            # TypeScript type definitions
│   ├── index.ts            # Module exports
│   └── tests/
│       ├── index.ts        # Test registry
│       ├── rest.tests.ts   # REST endpoint test definitions
│       └── graphql.tests.ts # GraphQL query test definitions
├── results/                # Test results (gitignored)
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

## Quick Start

```bash
# Start the API server first
yarn start

# Run all performance tests
yarn perf:test

# List available tests
yarn perf:list

# Run by category
yarn perf:rest
yarn perf:graphql

# Run specific test(s)
yarn perf:run health
yarn perf:run health,live,graphql_typename

# Stress test (100 connections, 60 seconds)
yarn perf:stress
```

## Available Scripts

| Command                 | Description                            |
| ----------------------- | -------------------------------------- |
| `yarn perf:test`        | Run all performance tests              |
| `yarn perf:list`        | List all available tests               |
| `yarn perf:rest`        | Run REST API tests only                |
| `yarn perf:graphql`     | Run GraphQL tests only                 |
| `yarn perf:run <tests>` | Run specific test(s) - comma-separated |
| `yarn perf:stress`      | Stress test (60s, 100 connections)     |

## CLI Options

```bash
ts-node performance/src/cli.ts [options] [endpoints...]

Options:
  --endpoint=<names>    Run specific tests (comma-separated or multiple flags)
  --category=<type>     Run all tests in a category (rest|graphql)
  --duration=<seconds>  Duration per test (default: 10)
  --connections=<num>   Concurrent connections (default: 10)
  --list, -l            List all available tests
  --help, -h            Show help message

Environment Variables:
  API_URL               Base URL (default: http://localhost:3000)
  DURATION              Test duration in seconds
  CONNECTIONS           Concurrent connections
  PIPELINING            HTTP pipelining factor
```

## Running Specific Tests

```bash
# Single test (positional argument)
yarn perf:test health

# Multiple tests (positional arguments)
yarn perf:test health live ready

# Multiple tests (comma-separated)
yarn perf:test --endpoint=health,graphql_typename

# Multiple tests (multiple flags)
yarn perf:test --endpoint=health --endpoint=graphql_typename

# Run all REST tests
yarn perf:rest

# Run all GraphQL tests
yarn perf:graphql
```

## Adding New Tests

### REST Endpoints

Edit `src/tests/rest.tests.ts`:

```typescript
export function getRestTests(baseUrl: string): Record<string, TestConfig> {
    return {
        // ... existing tests ...

        // Add new REST endpoint
        users_list: {
            name: 'List Users',
            url: `${baseUrl}/api/users`,
            method: 'GET',
            category: 'rest',
            description: 'Paginated user list endpoint',
        },
    };
}
```

### GraphQL Queries

Edit `src/tests/graphql.tests.ts`:

```typescript
export function getGraphQLTests(baseUrl: string): Record<string, TestConfig> {
    return {
        // ... existing tests ...

        // Add new GraphQL query
        graphql_users: gqlTest(
            baseUrl,
            'GraphQL Users Query',
            `query {
                allUsers(first: 10) {
                    nodes { id name email }
                }
            }`,
            undefined,
            'Paginated users query'
        ),
    };
}
```

## Benchmark Results

> **Test Environment**: MacBook Air M1, Node.js v20, PostgreSQL 15  
> **Test Parameters**: 10 concurrent connections, 10 seconds duration

### REST API Performance

| Endpoint  | Req/sec | Avg Latency | P99 Latency | Throughput |
| --------- | ------- | ----------- | ----------- | ---------- |
| `/live`   | 42,182  | 0.01 ms     | < 1 ms      | 26 MB/s    |
| `/ready`  | 16,529  | 0.02 ms     | 1 ms        | 10 MB/s    |
| `/health` | 15,238  | 0.03 ms     | 1 ms        | 12 MB/s    |
| `/api`    | 11,350  | 0.18 ms     | 2 ms        | 20 MB/s    |

### GraphQL Performance

| Query         | Req/sec | Avg Latency | P99 Latency | Throughput |
| ------------- | ------- | ----------- | ----------- | ---------- |
| Simple Query  | 28,138  | 0.03 ms     | 1 ms        | 21 MB/s    |
| Introspection | 22,205  | 0.04 ms     | 2 ms        | 24 MB/s    |

### Key Metrics

- **Peak Throughput**: 42,182 req/s (liveness endpoint)
- **GraphQL Throughput**: 28,138 req/s (simple queries)
- **P99 Latency**: < 2ms for all endpoints
- **Error Rate**: 0%

## Performance Tips

### Database

- Tune `DATABASE_POOL_MAX` based on your workload
- Use connection pooling (PgBouncer) for high concurrency
- Add indexes for frequently queried fields

### Application

- Enable response compression (already configured)
- Use HTTP/2 in production (via reverse proxy)
- Consider Redis caching for hot data

### Infrastructure

- Use horizontal scaling for high traffic
- Place behind a CDN for static assets
- Monitor with Prometheus + Grafana

## Generating Reports

```bash
# Save results to file
yarn perf:test 2>&1 | tee performance/results/$(date +%Y%m%d-%H%M%S).txt

# Save specific category results
yarn perf:graphql 2>&1 | tee performance/results/graphql-$(date +%Y%m%d-%H%M%S).txt

# Save stress test results
yarn perf:stress 2>&1 | tee performance/results/stress-$(date +%Y%m%d-%H%M%S).txt
```
