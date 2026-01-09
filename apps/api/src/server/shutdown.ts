import { Server } from 'node:http';

import { closePool } from '@app/database';
import { env, logger } from '@app/utils';
import { PostGraphileInstance } from 'postgraphile';

/**
 * Sets up graceful shutdown handlers for SIGTERM and SIGINT signals.
 * Ensures proper cleanup of resources before process exit.
 */
export function setupGracefulShutdown(server: Server, pgl: PostGraphileInstance): void {
    let isShuttingDown = false;

    const shutdown = async (signal: string): Promise<void> => {
        // Prevent multiple shutdown attempts
        if (isShuttingDown) {
            logger.warn({ signal }, 'Shutdown already in progress');
            return;
        }
        isShuttingDown = true;

        logger.info({ signal }, 'Shutting down gracefully...');

        // Force exit if graceful shutdown takes too long
        const forceExitTimer = setTimeout(() => {
            logger.error('Forced shutdown due to timeout');
            process.exit(1);
        }, env.SHUTDOWN_TIMEOUT);

        // Don't keep the process alive just for this timer
        forceExitTimer.unref();

        try {
            // Stop accepting new connections
            await new Promise<void>((resolve, reject) => {
                server.close(err => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            logger.info('HTTP server closed');

            // Release PostGraphile resources
            await pgl.release();
            logger.info('PostGraphile released');

            // Close database pool
            await closePool();
            logger.info('Database pool closed');

            clearTimeout(forceExitTimer);
            logger.info('Graceful shutdown complete');
            process.exit(0);
        } catch (error) {
            logger.error({ error }, 'Error during shutdown');
            process.exit(1);
        }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}
