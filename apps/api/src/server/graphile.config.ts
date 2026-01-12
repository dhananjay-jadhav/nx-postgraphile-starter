import { databaseConfig, getPool } from '@app/database';
import { LoggingPlugin, QueryValidationPlugin } from '@app/gql';
import { env } from '@app/utils';
import { PgSimplifyInflectionPreset } from '@graphile/simplify-inflection';
import { makePgService } from 'postgraphile/adaptors/pg';
import { PostGraphileAmberPreset } from 'postgraphile/presets/amber';

export const preset: GraphileConfig.Preset = {
    extends: [PostGraphileAmberPreset, PgSimplifyInflectionPreset],
    plugins: [LoggingPlugin, QueryValidationPlugin],
    pgServices: [
        makePgService({
            pool: getPool(),
            schemas: databaseConfig.schemas,
            pubsub: true,
        }),
    ],
    grafserv: {
        port: env.PORT,
        graphiql: env.isDevelopment,
        graphqlPath: '/graphql',
        eventStreamPath: '/graphql/stream',
        watch: !env.isProduction,
    },
    grafast: {
        explain: env.isDevelopment,
        context: () => ({}),
    },
    schema: {
        exportSchemaSDLPath: env.isDevelopment ? './libs/gql/src/lib/schema.graphql' : undefined,
        sortExport: true,
    },
};
