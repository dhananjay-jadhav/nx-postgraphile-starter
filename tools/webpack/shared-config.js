/**
 * Shared webpack configuration for Node.js applications
 * Automatically resolves @app/* path mappings from tsconfig.json
 */
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const { join } = require('path');

/**
 * Creates webpack resolve configuration with tsconfig paths support
 * @param {string} appDir - The __dirname of the app's webpack config
 * @returns {object} Webpack resolve configuration
 */
function getResolveConfig(appDir) {
    const workspaceRoot = join(appDir, '../..');
    return {
        plugins: [
            new TsconfigPathsPlugin({
                configFile: join(workspaceRoot, 'tsconfig.json'),
            }),
        ],
    };
}

/**
 * Creates standard output configuration for Node.js apps
 * @param {string} appDir - The __dirname of the app's webpack config
 * @returns {object} Webpack output configuration
 */
function getOutputConfig(appDir) {
    return {
        path: join(appDir, 'dist'),
        clean: true,
        ...(process.env.NODE_ENV !== 'production' && {
            devtoolModuleFilenameTemplate: '[absolute-resource-path]',
        }),
    };
}

module.exports = {
    getResolveConfig,
    getOutputConfig,
};
