#!/usr/bin/env node

/**
 * Custom app generator that wraps Nx's @nx/node:application generator
 * and automatically configures webpack with shared path resolution
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

// Update webpack config with shared configuration
const webpackConfigPath = join(__dirname, '..', directory, 'webpack.config.js');
const webpackConfig = `const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
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
`;

writeFileSync(webpackConfigPath, webpackConfig);
console.log(`\n✅ Updated webpack.config.js with shared path resolution`);

console.log(`\n🎉 Application ${appName} created successfully!\n`);
console.log('To start the app:');
console.log(`  yarn start ${appName}\n`);
