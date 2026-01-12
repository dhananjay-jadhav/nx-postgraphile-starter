# gql

GraphQL library for PostGraphile 5 configuration, plugins, and utilities.

## Features

- **Generated Types**: TypeScript types generated from GraphQL schema
- **Grafast Plugins**: Reusable plugins for logging, validation, and more
- **Query Validation**: Depth and cost limiting for GraphQL queries
- **WrapPlan Types**: Type definitions for custom wrapPlan functions

## Exports

```typescript
// Generated GraphQL types
export * from './lib/generated/types';

// Grafast plugins
export { LoggingPlugin } from './lib/plugins/logging.plugin';
export { QueryValidationPlugin } from './lib/plugins/query-validation.plugin';

// Query validation utilities
export { calculateQueryDepth, estimateQueryCost, validateQuery } from './lib/validation';

// WrapPlan type helpers
export type { WrapPlanFn, QueryWrapPlanFn, MutationWrapPlanFn } from './lib/wrap-plan.types';
```

## Plugins

### LoggingPlugin

Adds structured logging to all GraphQL operations:
- Assigns unique trace IDs to each request
- Logs operation timing and performance metrics
- Includes operation name and type in logs
- Integrates with pino logger

```typescript
import { LoggingPlugin } from '@app/gql';

// Add to your graphile.config.ts preset
export const preset: GraphileConfig.Preset = {
    plugins: [LoggingPlugin],
    // ...
};
```

### QueryValidationPlugin

Validates GraphQL queries against configurable limits:
- **Depth Limiting**: Prevents deeply nested queries (default: 10 levels)
- **Cost Estimation**: Blocks expensive queries based on estimated cost (default: 1000)

```typescript
import { QueryValidationPlugin } from '@app/gql';

// Add to your graphile.config.ts preset
export const preset: GraphileConfig.Preset = {
    plugins: [QueryValidationPlugin],
    // ...
};
```

Configure via environment variables:
- `GRAPHQL_DEPTH_LIMIT` - Maximum query depth (default: 10)
- `GRAPHQL_COST_LIMIT` - Maximum query cost (default: 1000)

## Query Validation Utilities

Use these functions for custom validation logic:

```typescript
import { calculateQueryDepth, estimateQueryCost, validateQuery } from '@app/gql';

// Calculate query depth
const depth = calculateQueryDepth(queryString);

// Estimate query cost
const cost = estimateQueryCost(queryString);

// Validate against limits (throws on violation)
validateQuery(queryString, { maxDepth: 10, maxCost: 1000 });
```

## WrapPlan Types

Type definitions for creating type-safe wrapPlan functions:

```typescript
import type { WrapPlanFn, QueryWrapPlanFn, MutationWrapPlanFn } from '@app/gql';
import type { User } from '@app/gql';

// Type-safe wrapPlan for a query returning User
const wrapUserQuery: QueryWrapPlanFn<User | null> = (plan, $source, fieldArgs, info) => {
    // Your custom logic
    return plan();
};
```

## Building

Run `nx build gql` to build the library.

## Running unit tests

Run `nx test gql` to execute the unit tests via [Jest](https://jestjs.io).

## Code Generation

### GraphQL Types

Generate TypeScript types from schema:

```bash
npm run gql:codegen
```

### WrapPlan Stubs

Generate CRUD wrapPlan stubs for a type:

```bash
npm run gen:gql-crud User
```

See [GQL CRUD Generator](../../tools/generators/gql-crud/README.md) for details.
