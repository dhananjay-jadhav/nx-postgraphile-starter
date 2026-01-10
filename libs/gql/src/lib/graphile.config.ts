import { databaseConfig, getPool } from '@app/database';
import { env } from '@app/utils';
import { PgSimplifyInflectionPreset } from '@graphile/simplify-inflection';
import { makePgService } from 'postgraphile/adaptors/pg';
import { PostGraphileAmberPreset } from 'postgraphile/presets/amber';

export const preset: GraphileConfig.Preset = {
    extends: [PostGraphileAmberPreset, PgSimplifyInflectionPreset],
    pgServices: [
        makePgService({
            pool: getPool(),
            schemas: databaseConfig.schemas,
            pubsub: true,
        }),
    ],
    grafserv: {
        port: env.PORT,
        graphiql: !env.isProduction,
        graphqlPath: '/graphql',
        eventStreamPath: '/graphql/stream',
        watch: !env.isProduction,
    },
    grafast: {
        explain: !env.isProduction,
        context: () => ({}),
    },
    schema: {
        // Schema export for tooling (development only)
        exportSchemaSDLPath: env.isDevelopment ? './libs/gql/src/lib/schema.graphql' : undefined,
        sortExport: true,
        // Performance: disable introspection in production (optional)
        // disableIntrospection: env.isProduction,
    },
};
