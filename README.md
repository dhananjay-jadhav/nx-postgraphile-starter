# NX PostGraphile Starter

A production-ready [PostGraphile 5](https://grafast.org/postgraphile/) GraphQL API starter built with [Nx](https://nx.dev), Express.js, and PostgreSQL.

## Related Projects

- **[nx-postgraphile-fastify-template](https://github.com/dhananjay-jadhav/nx-postgraphile-fastify-template)**: For even better performance, check out this alternative starter that uses Fastify instead of Express. Fastify delivers 2-3x higher throughput with lower overhead, making it ideal for high-load applications. See the [detailed benchmark comparison](https://github.com/dhananjay-jadhav/nx-postgraphile-fastify-template/blob/main/performance/BenchMark.md).


## Features

- 🚀 **PostGraphile 5** - Next-generation GraphQL API from your PostgreSQL schema
- 📦 **Nx Monorepo** - Scalable workspace with libraries and applications
- 🔒 **Production-ready** - Includes health checks, graceful shutdown, and proper error handling
- 📝 **Pino Logging** - Structured JSON logging with pino and pino-http
- 🔧 **Environment Validation** - Type-safe configuration using [Joi](https://github.com/hapijs/joi)
- 🐳 **Docker Integration** - `docker-compose` for easy local development setup
- 🔄 **GitHub Actions CI** - Automated linting, testing, and building
- 🏊 **Connection Pooling** - Optimized pg Pool configuration for production
- 🧪 **Testing** - Jest-based unit and e2e testing
- 🤖 **GraphQL Codegen** - Type generation for your GraphQL schema
- 🛡️ **Rate Limiting** - Express rate limiting with configurable limits
- 🔐 **GraphQL Security** - Query depth and cost limiting to prevent abuse
- 📊 **GraphQL Logging Plugin** - Structured logging with trace IDs for all operations
- 🛠️ **Code Generation** - WrapPlan stub generator for custom CRUD logic

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

##Yarn

- Docker

### Installation

```bash
# Install dependencies
yarn install
```

### Running the Database

In a separate terminal, start the PostgreSQL database using Docker Compose:

```bash
docker compose up -d
```

This will start a PostgreSQL container and expose it on port `5432`.

### Configuration

Create a `.env` file in the root directory. You can copy the example file:

```bash
cp .env.example .env
```

The default `DATABASE_URL` in `.env.example` is configured to work with the `docker-compose` setup.

### Running the Application

```bash
# Development mode with hot reload
yarn start api

# Build for production
yarn build api

# Run unit tests
yarn test utils
yarn test database

# Run e2e tests
yarn e2e api-build

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

## Performance

### Benchmark Results

> **Test Environment**: MacBook Air M1, Node.js v20, PostgreSQL 15  
> **Test Parameters**: 10 concurrent connections, 10 seconds duration

#### REST API Performance

| Endpoint  | Req/sec | Avg Latency | P99 Latency | Throughput |
| --------- | ------- | ----------- | ----------- | ---------- |
| `/live`   | 42,182  | 0.01 ms     | < 1 ms.     | 26 MB/s    |
| `/ready`  | 16,529  | 0.02 ms     | 1 ms        | 10 MB/s    |
| `/health` | 15,238  | 0.03 ms     | 1 ms        | 12 MB/s    |
| `/api`    | 11,350  | 0.18 ms     | 2 ms        | 20 MB/s    |

#### GraphQL Performance

| Query         | Req/sec | Avg Latency | P99 Latency | Throughput |
| ------------- | ------- | ----------- | ----------- | ---------- |
| Simple Query  | 28,138  | 0.03 ms     | 1 ms        | 21 MB/s    |
| Introspection | 22,205  | 0.04 ms     | 2 ms        | 24 MB/s    |

#### Key Metrics

- ⚡ **Peak Throughput**: 42,182 req/s (liveness endpoint)
- 🚀 **GraphQL Throughput**: 28,138 req/s (simple queries)
- 📊 **P99 Latency**: < 2ms for all endpoints
- ✅ **Error Rate**: 0%

### Running Performance Tests

```bash
# Start the API server
yarn start

# Run all performance tests
yarn perf:test

# Run specific test(s)
yarn perf:run health
yarn perf:run health,live,graphql_typename

# Run by category
yarn perf:rest
yarn perf:graphql

# Stress test (100 connections, 60 seconds)
yarn perf:stress
```

See [performance/README.md](performance/README.md) for detailed documentation.

## Environment Variables

| Variable              | Description                          | Default                                                |
| --------------------- | ------------------------------------ | ------------------------------------------------------ |
| `NODE_ENV`            | Environment (development/production) | `development`                                          |
| `PORT`                | Server port                          | `3000`                                                 |
| `APP_NAME`            | Application name for logging         | `postgraphile-api`                                     |
| `LOG_LEVEL`           | Logging level                        | `info`                                                 |
| `DATABASE_URL`        | PostgreSQL connection string         | `postgres://postgres:postgres@localhost:5432/postgres` |
| `DATABASE_SCHEMAS`    | Comma-separated schema names         | `public`                                               |
| `DATABASE_POOL_MAX`   | Maximum pool connections             | `20`                                                   |
| `DATABASE_POOL_MIN`   | Minimum pool connections             | `2`                                                    |
| `DATABASE_SSL`        | Enable SSL connection                | `false`                                                |
| `JWT_SECRET`          | Secret for JWT authentication        | -                                                      |
| `RATE_LIMIT_MAX`      | Max requests per window              | `100`                                                  |
| `RATE_LIMIT_WINDOW_MS`| Rate limit window in milliseconds    | `60000`                                                |
| `GRAPHQL_DEPTH_LIMIT` | Maximum GraphQL query depth          | `10`                                                   |
| `GRAPHQL_COST_LIMIT`  | Maximum GraphQL query cost           | `1000`                                                 |
| `SHUTDOWN_TIMEOUT`    | Graceful shutdown timeout (ms)       | `10000`                                                |
| `KEEP_ALIVE_TIMEOUT`  | HTTP keep-alive timeout (ms)         | `65000`                                                |

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

| Script                  | Description                        |
| ----------------------- | ---------------------------------- |
| `yarn start api`        | Start development server           |
| `yarn build api`        | Build the API for production       |
| `yarn api:e2e`          | Run e2e tests for the API          |
| `yarn lint`             | Run linting on all projects        |
| `yarn test <lib>`       | Run unit tests for a library       |
| `yarn all:test`         | Run tests for all projects         |
| `yarn all:build`        | Build all projects                 |
| `yarn format`           | Format code with Prettier          |
| `yarn db:up`            | Start PostgreSQL via Docker        |
| `yarn db:down`          | Stop and remove PostgreSQL         |
| `yarn db:logs`          | View PostgreSQL container logs     |
| `yarn perf:test`        | Run all performance tests          |
| `yarn perf:list`        | List available performance tests   |
| `yarn perf:run <tests>` | Run specific test(s)               |
| `yarn perf:rest`        | Run REST endpoint tests            |
| `yarn perf:graphql`     | Run GraphQL tests                  |
| `yarn perf:stress`      | Stress test (100 connections, 60s) |

```dockerfile
# Stage 1: Build the application
FROM node:24 as builder
WORKDIR /app
COPY package.json yarn.lock ./
COPY nx.json ./
COPY tsconfig.base.json ./
COPY .yarn ./
RUN yarn install --immutable
COPY . .
RUN npx nx build api

# Stage 2: Create the final production image
FROM node:24-alpine
WORKDIR /app
COPY --from=builder /app/dist/apps/api/package.json ./
COPY --from=builder /app/dist/apps/api/yarn.lock ./
RUN yarn workspaces focus --all --production
COPY --from=builder /app/dist/apps/api .
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
