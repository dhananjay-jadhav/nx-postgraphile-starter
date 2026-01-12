/**
 * Query Validation Plugin for PostGraphile V5
 *
 * Validates GraphQL queries for depth and cost limits AFTER parsing,
 * avoiding double-parsing overhead of preHandler validation.
 *
 * Benefits over Express middleware:
 * - Single parse (PostGraphile parses, we validate)
 * - Native GraphQL error formatting
 * - Integrated with PostGraphile lifecycle
 *
 * @see https://grafast.org/grafast/middleware
 */
import 'grafserv/express/v4';

import { env, logger } from '@app/utils';
import type { DocumentNode } from 'graphql';
import { GraphQLError } from 'graphql';

import { validateQuery } from '../validation/query-validation';

/**
 * Query Validation Plugin
 *
 * Hooks into grafast's middleware to validate queries after parsing
 * but before execution, using the already-parsed document.
 *
 * Configuration is read from environment variables:
 * - GRAPHQL_DEPTH_LIMIT (default: 10)
 * - GRAPHQL_COST_LIMIT (default: 1000)
 *
 * @example
 * ```typescript
 * // graphile.config.ts
 * import { QueryValidationPlugin } from '@app/gql';
 *
 * export const preset: GraphileConfig.Preset = {
 *     plugins: [QueryValidationPlugin],
 * };
 * ```
 */
export const QueryValidationPlugin: GraphileConfig.Plugin = {
    name: 'QueryValidationPlugin',
    version: '1.0.0',
    description: 'Validates GraphQL queries for depth and cost limits',

    grafast: {
        middleware: {
            prepareArgs(next, event) {
                const { args } = event;

                // Get the already-parsed document from grafast
                const document = args.document as DocumentNode | undefined;

                if (!document) {
                    return next();
                }

                // Get validation options from env
                const maxDepth = env.GRAPHQL_DEPTH_LIMIT;
                const maxCost = env.GRAPHQL_COST_LIMIT;

                // Validate the query
                const validation = validateQuery(document, { maxDepth, maxCost });

                if (!validation.valid) {
                    logger.warn(
                        {
                            depth: validation.depth,
                            cost: validation.cost,
                            maxDepth,
                            maxCost,
                            errors: validation.errors,
                        },
                        'GraphQL query rejected due to complexity'
                    );

                    // Throw GraphQL errors that PostGraphile will format correctly
                    const errors = validation.errors.map(
                        (message: string) =>
                            new GraphQLError(message, {
                                extensions: {
                                    code: 'QUERY_COMPLEXITY_EXCEEDED',
                                    depth: validation.depth,
                                    cost: validation.cost,
                                    maxDepth,
                                    maxCost,
                                },
                            })
                    );

                    // Throw the first error (GraphQL spec returns array, but we throw one)
                    throw errors[0];
                }

                return next();
            },
        },
    },
};
