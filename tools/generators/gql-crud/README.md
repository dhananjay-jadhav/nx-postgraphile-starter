# GQL CRUD Generator

Generates WrapPlan stubs for PostGraphile 5 CRUD operations on a given GraphQL type.

## Usage

```bash
# Generate WrapPlans for a type
npm run gen:gql-crud User

# Generate into a specific library
npm run gen:gql-crud User user

# Or run the script directly
node scripts/generate-gql-crud.js User [libName]
```

## What Gets Generated

For a type like `User`, the generator creates:

```
libs/<libName>/src/
├── index.ts                           # Re-exports all wrapPlans
└── lib/
    └── plans/
        ├── queries/
        │   ├── user.query.ts          # userByRowId query
        │   ├── user-by-id.query.ts    # user query (by global ID)
        │   └── users.query.ts         # allUsers connection query
        └── mutations/
            ├── create-user.mutation.ts
            ├── update-user.mutation.ts
            ├── update-user-by-id.mutation.ts
            ├── delete-user.mutation.ts
            └── delete-user-by-id.mutation.ts
```

## Using Generated WrapPlans

1. Import the wrapPlans in your graphile config:

```typescript
// apps/api/src/server/graphile.config.ts
import { wrapPlans } from 'postgraphile/utils';
import {
    wrapUserByRowIdQuery,
    wrapUserByIdQuery,
    wrapAllUsersQuery,
    wrapCreateUserMutation,
    // ... other wrapPlans
} from '@app/user';

const MyWrapPlansPlugin = wrapPlans({
    Query: {
        userByRowId: wrapUserByRowIdQuery,
        user: wrapUserByIdQuery,
        allUsers: wrapAllUsersQuery,
    },
    Mutation: {
        createUser: wrapCreateUserMutation,
        // ... other mutations
    },
});
```

2. Add the plugin to your preset:

```typescript
export const preset: GraphileConfig.Preset = {
    extends: [postgraphilePresetAmber, PostGraphileConnectionFilterPreset],
    plugins: [
        LoggingPlugin,
        QueryValidationPlugin,
        MyWrapPlansPlugin, // Add your wrapPlans plugin
    ],
    // ... rest of config
};
```

## Customizing WrapPlans

Each generated file contains a template with common patterns:

```typescript
export function wrapUserByRowIdQuery(
    plan: () => ExecutableStep<User | null>,
    $source: ExecutableStep,
    fieldArgs: FieldArgs,
    info: FieldInfo
): ExecutableStep<User | null> {
    // Add your custom logic here:
    // - Input validation
    // - Permission checks
    // - Audit logging
    // - Side effects
    
    // Call original plan and return result
    return plan();
}
```

### Common Patterns

**Access arguments:**
```typescript
const $id = fieldArgs.getRaw('id');
const { $first, $last } = fieldArgs;
```

**Side effects (logging, notifications):**
```typescript
import { sideEffect } from 'grafast';

sideEffect($id, (id) => {
    console.log('Fetching user:', id);
});
```

**Access request context:**
```typescript
import { context } from 'grafast';

const $logger = context().get('logger');
```

**Transform results:**
```typescript
import { lambda } from 'grafast';

const $result = plan();
return lambda($result, (result) => {
    // Transform the result
    return result;
});
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `typeName` | The GraphQL type name (e.g., `User`, `BlogPost`) | Required |
| `libName` | Target library name under `libs/` | Lowercase of typeName |

## Files

- `scripts/generate-gql-crud.js` - Generator script
- `tools/generators/gql-crud/files/` - EJS templates

## Notes

- The generator uses PostGraphile's default naming conventions
- Only generates files for operations that exist in your schema
- Automatically updates the index.ts exports
- Safe to run multiple times (checks for existing files)
