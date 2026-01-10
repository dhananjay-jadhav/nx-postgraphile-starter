/**
 * REST API Test Definitions
 *
 * Add new REST endpoint tests here.
 * Each test should have a unique key and follow the TestConfig interface.
 */

import { TestConfig } from '../types';

export function getRestTests(baseUrl: string): Record<string, TestConfig> {
    return {
        // Health & Monitoring Endpoints
        health: {
            name: 'Health Check',
            url: `${baseUrl}/health`,
            method: 'GET',
            category: 'rest',
            description: 'Comprehensive health check with database status',
        },
        live: {
            name: 'Liveness Probe',
            url: `${baseUrl}/live`,
            method: 'GET',
            category: 'rest',
            description: 'Simple liveness check for Kubernetes',
        },
        ready: {
            name: 'Readiness Probe',
            url: `${baseUrl}/ready`,
            method: 'GET',
            category: 'rest',
            description: 'Readiness check for Kubernetes load balancing',
        },

        // API Endpoints
        api: {
            name: 'API Root',
            url: `${baseUrl}/api`,
            method: 'GET',
            category: 'rest',
            description: 'Main API endpoint',
        },

        // Add more REST endpoints here as your API grows
        // Example:
        // users_list: {
        //     name: 'List Users',
        //     url: `${baseUrl}/api/users`,
        //     method: 'GET',
        //     category: 'rest',
        //     description: 'Paginated user list endpoint',
        // },
    };
}
