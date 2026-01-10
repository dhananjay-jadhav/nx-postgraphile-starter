/**
 * Test Registry
 *
 * Central export for all test definitions.
 * Import new test files here and add them to getAllTests().
 */

import { TestConfig } from '../types';
import { getRestTests } from './rest.tests';
import { getGraphQLTests } from './graphql.tests';

export function getAllTests(baseUrl: string): Record<string, TestConfig> {
    return {
        ...getRestTests(baseUrl),
        ...getGraphQLTests(baseUrl),
    };
}

export function getTestsByCategory(baseUrl: string, category: 'rest' | 'graphql'): Record<string, TestConfig> {
    const allTests = getAllTests(baseUrl);
    return Object.fromEntries(Object.entries(allTests).filter(([, config]) => config.category === category));
}

export function getTestNames(baseUrl: string): string[] {
    return Object.keys(getAllTests(baseUrl));
}

export { getRestTests } from './rest.tests';
export { getGraphQLTests } from './graphql.tests';
