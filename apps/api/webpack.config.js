const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const nodeExternals = require('webpack-node-externals');
const { join } = require('path');
const { getLibAliases } = require('../../tools/webpack/lib-aliases');

const workspaceRoot = join(__dirname, '../..');

module.exports = {
    output: {
        path: join(__dirname, 'dist'),
        clean: true,
    },
    resolve: {
        alias: getLibAliases(workspaceRoot),
    },
    // Ignore warnings for missing optional dependencies and source maps
    ignoreWarnings: [
        /Failed to parse source map/,
        /Critical dependency/,
        /Can't resolve 'pg-native'/,
        /Can't resolve 'bufferutil'/,
        /Can't resolve 'utf-8-validate'/,
    ],
    externals: [
        nodeExternals({
            allowlist: [/^@app\//],
        }),
    ],
    plugins: [
        new NxAppWebpackPlugin({
            target: 'node',
            compiler: 'tsc',
            main: './src/main.ts',
            tsConfig: './tsconfig.app.json',
            assets: ['./src/assets'],
            optimization: false,
            outputHashing: 'none',
            generatePackageJson: false,
            sourceMap: true,
            externalDependencies: 'none',
        }),
    ],
};
