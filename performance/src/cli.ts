#!/usr/bin/env node
/**
 * Performance Test CLI
 *
 * Usage:
 *   npx ts-node performance/src/cli.ts                     # Run all tests
 *   npx ts-node performance/src/cli.ts --endpoint=health   # Test specific endpoint
 *   npx ts-node performance/src/cli.ts --category=graphql  # Test all GraphQL endpoints
 *   npx ts-node performance/src/cli.ts --duration=30       # Run for 30 seconds
 *   npx ts-node performance/src/cli.ts --connections=100   # Use 100 concurrent connections
 *   npx ts-node performance/src/cli.ts --list              # List available tests
 */

import { TestRunner } from './runner';
import { getAllTests, getTestsByCategory, getTestNames } from './tests/index';

interface CliArgs {
    endpoints?: string[];
    category?: 'rest' | 'graphql';
    duration?: number;
    connections?: number;
    list?: boolean;
    help?: boolean;
}

function parseArgs(): CliArgs {
    const args: CliArgs = { endpoints: [] };
    const argv = process.argv.slice(2);
    let expectingEndpoint = false;

    for (const arg of argv) {
        if (expectingEndpoint) {
            // Previous arg was --endpoint without =, so this is the value
            const endpoints = arg.split(',').map(e => e.trim());
            args.endpoints!.push(...endpoints);
            expectingEndpoint = false;
            continue;
        }

        if (arg === '--help' || arg === '-h') {
            args.help = true;
        } else if (arg === '--list' || arg === '-l') {
            args.list = true;
        } else if (arg === '--endpoint' || arg === '--endpoints') {
            // --endpoint without = means next arg is the value
            expectingEndpoint = true;
        } else if (arg.startsWith('--')) {
            const [key, value] = arg.replace('--', '').split('=');
            if (key === 'endpoint' || key === 'endpoints') {
                // Support comma-separated endpoints: --endpoint=health,live,ready
                const endpoints = value.split(',').map(e => e.trim());
                args.endpoints!.push(...endpoints);
            } else if (key === 'category') args.category = value as 'rest' | 'graphql';
            else if (key === 'duration') args.duration = parseInt(value, 10);
            else if (key === 'connections') args.connections = parseInt(value, 10);
        } else if (!arg.startsWith('-')) {
            // Support positional arguments: yarn perf:run health graphql_typename
            args.endpoints!.push(arg);
        }
    }

    return args;
}

function printHelp(): void {
    console.log(`
Performance Test Suite

Usage:
  yarn perf:test [options] [endpoints...]

Options:
  --endpoint=<names>    Run specific tests (comma-separated or multiple flags)
  --category=<type>     Run all tests in a category (rest|graphql)
  --duration=<seconds>  Duration per test (default: 10)
  --connections=<num>   Concurrent connections (default: 10)
  --list, -l            List all available tests
  --help, -h            Show this help message

Examples:
  yarn perf:test                                  # Run all tests
  yarn perf:test health                           # Run health test only
  yarn perf:test health live ready                # Run multiple tests
  yarn perf:test --endpoint=health,graphql_typename  # Comma-separated
  yarn perf:test --category=graphql               # Run all GraphQL tests
  yarn perf:test --duration=30                    # 30 second tests
  yarn perf:test --connections=100                # 100 concurrent connections
`);
}

async function main(): Promise<void> {
    const args = parseArgs();

    if (args.help) {
        printHelp();
        process.exit(0);
    }

    const runner = new TestRunner({
        duration: args.duration,
        connections: args.connections,
    });

    const config = runner.getConfig();

    if (args.list) {
        console.log('\n📋 Available Tests:\n');
        const tests = getAllTests(config.baseUrl);
        Object.entries(tests).forEach(([key, test]) => {
            console.log(`  ${key.padEnd(25)} [${test.category}] ${test.name}`);
            if (test.description) {
                console.log(`  ${''.padEnd(25)} └─ ${test.description}`);
            }
        });
        console.log(`\nTotal: ${Object.keys(tests).length} tests`);
        process.exit(0);
    }

    console.log('🚀 Performance Test Suite');
    console.log(`Target: ${config.baseUrl}`);
    console.log(`Duration: ${config.duration}s per test`);
    console.log(`Connections: ${config.connections}`);

    // Check server reachability
    const isReachable = await runner.checkServerReachable();
    if (!isReachable) {
        console.error('\n❌ Cannot reach server. Make sure it is running:');
        console.error('   yarn start');
        process.exit(1);
    }
    console.log('✅ Server is reachable\n');

    // Determine which tests to run
    let testsToRun: Record<string, import('./types').TestConfig>;

    if (args.endpoints && args.endpoints.length > 0) {
        const allTests = getAllTests(config.baseUrl);
        testsToRun = {};
        const unknownEndpoints: string[] = [];

        for (const endpoint of args.endpoints) {
            if (allTests[endpoint]) {
                testsToRun[endpoint] = allTests[endpoint];
            } else {
                unknownEndpoints.push(endpoint);
            }
        }

        if (unknownEndpoints.length > 0) {
            console.error(`❌ Unknown endpoint(s): ${unknownEndpoints.join(', ')}`);
            console.error(`Available: ${getTestNames(config.baseUrl).join(', ')}`);
            process.exit(1);
        }

        if (Object.keys(testsToRun).length === 0) {
            console.error('❌ No valid endpoints specified');
            process.exit(1);
        }
    } else if (args.category) {
        testsToRun = getTestsByCategory(config.baseUrl, args.category);
        if (Object.keys(testsToRun).length === 0) {
            console.error(`❌ No tests found for category: ${args.category}`);
            process.exit(1);
        }
    } else {
        testsToRun = getAllTests(config.baseUrl);
    }

    // Run tests
    const results = await runner.runTests(testsToRun);

    // Print summary
    runner.printSummary(results);
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
