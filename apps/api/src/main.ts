import { createServer } from 'node:http';

import { getPool } from '@app/database';
import { env, logger } from '@app/utils';
import express from 'express';

import { setupErrorHandling, setupMiddleware, setupRoutes } from './middleware/middleware';
import { setupGraphQL } from './server/graphql';
import { setupGracefulShutdown } from './server/shutdown';

// ============================================================================
// Server Initialization
// ============================================================================

async function startServer(): Promise<void> {
    // Create Express app and HTTP server
    const app = express();
    const server = createServer(app);

    // Handle server errors
    server.on('error', (error: Error) => {
        logger.error({ error }, 'Server error');
        process.exit(1);
    });

    // Initialize database connection
    getPool();
    logger.info('Database pool initialized');

    // Setup middleware (logging, static files, health check)
    setupMiddleware(app);

    // Setup application routes
    setupRoutes(app);

    // Setup GraphQL server
    const pgl = await setupGraphQL(app, server);

    // Setup error handling (must be after all routes)
    setupErrorHandling(app);

    // Setup graceful shutdown handlers
    setupGracefulShutdown(server, pgl);

    // Start listening
    await server.listen(env.PORT, () => {
        logger.info({ port: env.PORT, env: env.NODE_ENV }, `${env.APP_NAME} listening at http://localhost:${env.PORT}`);
        logger.info({ port: env.PORT }, `GraphQL available at http://localhost:${env.PORT}/graphql`);
    });
}

// ============================================================================
// Entry Point
// ============================================================================

startServer()
    .then(() => {
        logger.info('Server started successfully');
    })
    .catch((error: Error) => {
        logger.error({ error }, 'Failed to start server');
        process.exit(1);
    })
    .finally(() => {
        logger.info('Server initialization process complete');
    });
