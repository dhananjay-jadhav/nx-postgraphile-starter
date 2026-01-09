import { closePool, getPool } from '@app/database';
import { preset } from '@app/gql';
import { env, errorHandler, gqlLogger, logger, NotFoundError } from '@app/utils';
import express from 'express';
import { grafserv } from 'grafserv/express/v4';
import * as path from 'path';
import { postgraphile } from 'postgraphile';

import routes from './routes';

async function startServer(): Promise<void> {
    const app = express();

    app.use(gqlLogger);
    app.use('/assets', express.static(path.join(__dirname, 'assets')));

    // Initialize database pool (registers health checks)
    getPool();

    // Mount routes
    app.use(routes);

    // Initialize PostGraphile
    const pgl = postgraphile(preset);
    const serv = pgl.createServ(grafserv);

    const port = env.PORT;
    const server = app.listen(port, () => {
        logger.info({ port }, `Server listening at http://localhost:${port}/graphql`);
    });

    await serv.addTo(app, server);

    // 404 handler for unknown routes
    app.use((_req, _res, next) => {
        next(new NotFoundError('Route not found'));
    });

    // Error handling
    app.use(errorHandler);

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
        logger.info({ signal }, 'Shutting down...');
        await pgl.release();
        await closePool();
        server.close(() => {
            logger.info('Server closed');
            process.exit(0);
        });
        setTimeout(() => process.exit(1), 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    server.on('error', error => logger.error({ error }, 'Server error'));
}

startServer().catch(error => {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
});
