import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
    schema: './libs/gql/src/lib/schema.graphql',
    generates: {
        './libs/gql/src/lib/generated/types.ts': {
            plugins: ['typescript'],
            config: {
                scalars: {
                    UUID: 'string',
                    Datetime: 'string',
                    JSON: 'Record<string, unknown>',
                    Cursor: 'string',
                },
                enumsAsTypes: true,
                skipTypename: false,
                declarationKind: 'interface',
            },
        },
    },
    watch: process.argv.includes('--watch'),
};

export default config;
