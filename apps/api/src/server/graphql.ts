import { Server } from 'node:http';

import { preset } from '@app/gql';
import { logger } from '@app/utils';
import { Express } from 'express';
import { grafserv } from 'grafserv/express/v4';
import { postgraphile, PostGraphileInstance } from 'postgraphile';

/**
 * Initializes and mounts the PostGraphile GraphQL server.
 * @throws Error if GraphQL server fails to initialize
 */
export async function setupGraphQL(app: Express, server: Server): Promise<PostGraphileInstance> {
    try {
        const pgl = postgraphile(preset);
        const serv = pgl.createServ(grafserv);

        await serv.addTo(app, server);

        logger.info('GraphQL server initialized');

        return pgl;
    } catch (error) {
        logger.error({ error }, 'Failed to initialize GraphQL server');
        throw error;
    }
}
