# database

This library contains database utilities, configuration, and migrations for the application.

## Migrations

Database migrations are managed using [graphile-migrate](https://github.com/graphile/migrate).

### Folder Structure

```
libs/database/
├── src/                      # Database utilities and configuration
│   ├── index.ts
│   └── lib/
│       └── database.ts
├── migrations/               # Database migrations
│   ├── current.sql           # Your working migration (uncommitted)
│   └── committed/            # Finalized, versioned migrations
```

### Migration Commands

| Command            | Description                                                         |
| ------------------ | ------------------------------------------------------------------- |
| `yarn db:migrate`  | Apply all pending migrations to your database                       |
| `yarn db:watch`    | Watch mode - auto-applies `current.sql` changes during development  |
| `yarn db:commit`   | Finalize `current.sql` and move it to `committed/` with a timestamp |
| `yarn db:uncommit` | Undo the last committed migration (useful for fixing mistakes)      |
| `yarn db:reset`    | Reset database and re-run all migrations from scratch               |
| `yarn db:status`   | Show current migration status                                       |

### Workflow

1. **Start your database**:

    ```bash
    yarn db:up
    ```

2. **Write migrations** in `migrations/current.sql`:

    ```sql
    CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ```

3. **During development**, run `yarn db:watch` to auto-apply changes as you save.

4. **When ready**, run `yarn db:commit` to finalize the migration.

5. **In CI/production**, run `yarn db:migrate` to apply all committed migrations.

### Configuration

The migration tool is configured via `.gmrc.js` in the project root. It uses:

- `DATABASE_URL` from your `.env` file for the connection string
- `SHADOW_DATABASE_URL` (optional) for the shadow database used to verify migrations

## Building

Run `nx build database` to build the library.

## Running unit tests

Run `nx test database` to execute the unit tests via [Jest](https://jestjs.io).
