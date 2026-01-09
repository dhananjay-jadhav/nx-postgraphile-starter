const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { getResolveConfig, getOutputConfig } = require('../../tools/webpack/shared-config');

module.exports = {
    output: getOutputConfig(__dirname),
    resolve: getResolveConfig(__dirname),
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
        }),
    ],
};
