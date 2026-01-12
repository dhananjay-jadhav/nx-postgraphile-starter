import { Server } from 'node:http';

import { Express } from 'express';
import { grafserv } from 'grafserv/express/v4';
import { postgraphile, PostGraphileInstance } from 'postgraphile';

import { preset } from './graphile.config.js';

/**
 * Initializes and mounts the PostGraphile GraphQL server.
 *
 * Query validation (depth/cost limits) is handled by QueryValidationPlugin
 * which hooks into grafast's middleware after parsing, avoiding double-parse.
 *
 * @throws Error if GraphQL server fails to initialize
 */
export async function setupGraphQL(app: Express, server: Server): Promise<PostGraphileInstance> {
    const pgl = postgraphile(preset);
    const serv = pgl.createServ(grafserv);

    await serv.addTo(app, server);

    return pgl;
}
