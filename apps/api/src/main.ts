import { createServer } from 'node:http';

import { getPool } from '@app/database';
import { env, logger } from '@app/utils';
import express, { Express } from 'express';

import { setupErrorHandlers, setupMiddleware } from './middleware';
import { router } from './router';
import { setupGracefulShutdown, setupGraphQL } from './server';

// ============================================================================
// Server Initialization
// ============================================================================

async function startServer(): Promise<void> {
    // Create Express app and HTTP server
    const app: Express = express();
    const server = createServer(app);

    server.keepAliveTimeout = env.KEEP_ALIVE_TIMEOUT || 65000;

    // Handle server errors
    server.on('error', (error: Error) => {
        logger.error({ error }, 'Server error');
        process.exit(1);
    });

    // Initialize database connection
    getPool();
    logger.info('Database pool initialized');

    // Setup middleware (logging, static files, etc.)
    setupMiddleware(app);

    // Mount application routes (health, api)
    app.use(router);

    // Setup GraphQL server (must be before error handlers)
    const pgl = await setupGraphQL(app, server);

    // Setup error handlers (must be after GraphQL)
    setupErrorHandlers(app);

    // Setup graceful shutdown handlers
    setupGracefulShutdown(server, pgl);

    // Start listening
    server.listen(env.PORT, () => {
        logger.info({ port: env.PORT, env: env.NODE_ENV }, `${env.APP_NAME} listening at http://localhost:${env.PORT}`);
        logger.info({ port: env.PORT }, `GraphQL available at http://localhost:${env.PORT}/graphql`);
    });
}

// ============================================================================
// Entry Point
// ============================================================================

startServer().catch((error: Error) => {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
});
