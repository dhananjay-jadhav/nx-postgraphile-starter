# NX PostGraphile Starter

A production-ready [PostGraphile 5](https://grafast.org/postgraphile/) GraphQL API starter built with [Nx](https://nx.dev), Express.js, and PostgreSQL.

## Features

- 🚀 **PostGraphile 5** - Next-generation GraphQL API from your PostgreSQL schema
- 📦 **Nx Monorepo** - Scalable workspace with libraries and applications
- 🔒 **Production-ready** - Includes health checks, graceful shutdown, and proper error handling
- 📝 **Pino Logging** - Structured JSON logging with pino and pino-http
- 🔧 **Environment Validation** - Type-safe configuration using [Joi](https://github.com/hapijs/joi)
- 🏊 **Connection Pooling** - Optimized pg Pool configuration for production
- 🧪 **Testing** - Jest-based unit and e2e testing

## Project Structure

```
├── apps/
│   ├── api/                 # Express + PostGraphile server
│   │   └── src/
│   │       ├── main.ts      # Application entry point
│   │       └── routes/      # Express routes (health, api)
│   └── api-e2e/             # End-to-end tests
├── libs/
│   ├── database/            # Database pool and configuration
│   ├── gql/                 # PostGraphile preset and plugins
│   └── utils/               # Shared utilities (logger, config, health checks)
```

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Yarn

### Installation

```bash
# Install dependencies
yarn install

# Joi should already be installed, if not:
yarn add joi
```

### Configuration

Create a `.env` file in the root directory:

```env
# Application
NODE_ENV=development
PORT=3000
APP_NAME=postgraphile-api
LOG_LEVEL=debug

# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/your_database
DATABASE_SCHEMAS=public
DATABASE_POOL_MAX=20
DATABASE_POOL_MIN=2
DATABASE_IDLE_TIMEOUT=30000
DATABASE_CONNECTION_TIMEOUT=5000
DATABASE_STATEMENT_TIMEOUT=30000
DATABASE_QUERY_TIMEOUT=30000
DATABASE_SSL=false

# Security
JWT_SECRET=your-secret-key
```

### Running the Application

```bash
# Development mode with hot reload
yarn api:start

# Build for production
yarn api:build

# Run e2e tests
yarn api:e2e
```

## API Endpoints

| Endpoint    | Description                     |
| ----------- | ------------------------------- |
| `/graphql`  | GraphQL API endpoint            |
| `/graphiql` | GraphiQL IDE (development only) |
| `/api`      | API info endpoint               |
| `/live`     | Kubernetes liveness probe       |
| `/health`   | Comprehensive health check      |
| `/ready`    | Kubernetes readiness probe      |

## Environment Variables

| Variable            | Description                          | Default                                                |
| ------------------- | ------------------------------------ | ------------------------------------------------------ |
| `NODE_ENV`          | Environment (development/production) | `development`                                          |
| `PORT`              | Server port                          | `3000`                                                 |
| `APP_NAME`          | Application name for logging         | `postgraphile-api`                                     |
| `LOG_LEVEL`         | Logging level                        | `info`                                                 |
| `DATABASE_URL`      | PostgreSQL connection string         | `postgres://postgres:postgres@localhost:5432/postgres` |
| `DATABASE_SCHEMAS`  | Comma-separated schema names         | `public`                                               |
| `DATABASE_POOL_MAX` | Maximum pool connections             | `20`                                                   |
| `DATABASE_POOL_MIN` | Minimum pool connections             | `2`                                                    |
| `DATABASE_SSL`      | Enable SSL connection                | `false`                                                |
| `JWT_SECRET`        | Secret for JWT authentication        | -                                                      |

## Libraries

### @app/database

Database connection pool and configuration.

```typescript
import { getPool, query, withTransaction, closePool } from '@app/database';

// Execute a query
const result = await query('SELECT * FROM users WHERE id = $1', [userId]);

// Use transactions
await withTransaction(async client => {
    await client.query('INSERT INTO ...');
    await client.query('UPDATE ...');
});
```

### @app/utils

Shared utilities including logging, configuration, and health checks.

```typescript
import { logger, env, registerHealthCheck } from '@app/utils';

// Structured logging
logger.info({ userId }, 'User logged in');

// Access validated environment
console.log(env.DATABASE_URL);

// Register custom health checks
registerHealthCheck('redis', async () => {
    // Check redis connection
    return { healthy: true, latencyMs: 5 };
});
```

### @app/gql

PostGraphile configuration and plugins.

```typescript
import { preset } from '@app/gql';
import { postgraphile } from 'postgraphile';

const pgl = postgraphile(preset);
```

## Scripts

| Script      | Description                 |
| ----------- | --------------------------- |
| `api:start` | Start development server    |
| `api:build` | Build for production        |
| `api:e2e`   | Run e2e tests               |
| `lint`      | Run linting on all projects |
| `all:test`  | Run tests for all projects  |
| `all:build` | Build all projects          |
| `format`    | Format code with Prettier   |

## Production Deployment

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn api:build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist/apps/api ./
COPY --from=builder /app/node_modules ./node_modules
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "main.js"]
```

### Health Checks

The application exposes three health endpoints for Kubernetes:

- **`/live`** - Liveness probe (is the process running?)
- **`/ready`** - Readiness probe (is the app ready to serve traffic?)
- **`/health`** - Detailed health report with all component statuses

Example Kubernetes configuration:

```yaml
livenessProbe:
    httpGet:
        path: /live
        port: 3000
    initialDelaySeconds: 10
    periodSeconds: 10
readinessProbe:
    httpGet:
        path: /ready
        port: 3000
    initialDelaySeconds: 5
    periodSeconds: 5
```

## License

MIT

- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
