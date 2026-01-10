/**
 * GraphQL Test Definitions
 *
 * Add new GraphQL query/mutation tests here.
 * Each test should have a unique key and follow the TestConfig interface.
 */

import { TestConfig } from '../types';

/** Helper to create GraphQL test config */
function gqlTest(
    baseUrl: string,
    name: string,
    query: string,
    variables?: Record<string, unknown>,
    description?: string
): TestConfig {
    return {
        name,
        url: `${baseUrl}/graphql`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
        category: 'graphql',
        description,
    };
}

export function getGraphQLTests(baseUrl: string): Record<string, TestConfig> {
    return {
        // Schema & Introspection
        graphql_typename: gqlTest(
            baseUrl,
            'GraphQL __typename',
            `{ __typename }`,
            undefined,
            'Minimal introspection query'
        ),

        graphql_introspection: gqlTest(
            baseUrl,
            'GraphQL Schema Introspection',
            `{
                __schema {
                    types {
                        name
                    }
                }
            }`,
            undefined,
            'Full schema type introspection'
        ),

        // Basic Queries
        graphql_query: gqlTest(
            baseUrl,
            'GraphQL Simple Query',
            `query { query { nodeId } }`,
            undefined,
            'Simple query returning nodeId'
        ),

        graphql_node: gqlTest(
            baseUrl,
            'GraphQL Node Query',
            `query GetNode($id: ID!) {
                node(id: $id) {
                    nodeId
                }
            }`,
            { id: 'WyJxdWVyeSJd' }, // Base64 encoded ["query"]
            'Node interface query'
        ),

        // Add more GraphQL tests here as your schema grows
        // Example:
        // graphql_users: gqlTest(
        //     baseUrl,
        //     'GraphQL Users Query',
        //     `query {
        //         allUsers(first: 10) {
        //             nodes {
        //                 id
        //                 name
        //                 email
        //             }
        //         }
        //     }`,
        //     undefined,
        //     'Paginated users query'
        // ),
        //
        // graphql_user_by_id: gqlTest(
        //     baseUrl,
        //     'GraphQL User by ID',
        //     `query GetUser($id: Int!) {
        //         userById(id: $id) {
        //             id
        //             name
        //         }
        //     }`,
        //     { id: 1 },
        //     'Single user lookup'
        // ),
    };
}
