#!/usr/bin/env node

/**
 * Custom app generator that wraps Nx's @nx/node:application generator
 * and automatically configures webpack with dynamic lib alias resolution
 *
 * Usage: node scripts/generate-app.js <app-name>
 * Example: node scripts/generate-app.js my-new-api
 */

const { execSync } = require('child_process');
const { writeFileSync } = require('fs');
const { join } = require('path');

const appName = process.argv[2];

if (!appName) {
    console.error('Usage: node scripts/generate-app.js <app-name>');
    console.error('Example: node scripts/generate-app.js my-new-api');
    process.exit(1);
}

// Validate app name
if (!/^[a-z][a-z0-9-]*$/.test(appName)) {
    console.error('App name must be lowercase, start with a letter, and contain only letters, numbers, and hyphens');
    process.exit(1);
}

const directory = `apps/${appName}`;

console.log(`\n🚀 Generating Node.js application: ${appName}\n`);

// Run Nx generator
try {
    execSync(
        `npx nx g @nx/node:application ${appName} --directory=${directory} --bundler=webpack --e2eTestRunner=jest --linter=eslint`,
        { stdio: 'inherit' }
    );
} catch (error) {
    console.error('Failed to generate application');
    process.exit(1);
}

// Create webpack config using shared lib-aliases utility
const webpackConfigPath = join(__dirname, '..', directory, 'webpack.config.js');
const webpackConfig = `const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
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
            allowlist: [/^@app\\//],
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
`;

writeFileSync(webpackConfigPath, webpackConfig);
console.log(`\n✅ Created webpack.config.js with auto-discovery of all @app/* libs`);

console.log(`\n🎉 Application ${appName} created successfully!\n`);
console.log('To start the app:');
console.log(`  yarn start ${appName}\n`);
