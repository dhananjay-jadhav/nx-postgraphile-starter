#!/usr/bin/env node

/**
 * Custom library generator that wraps Nx's @nx/js:lib generator
 * and automatically adds path mappings to tsconfig.json
 *
 * Note: webpack.config.js auto-discovers libs via getLibAliases()
 *
 * Usage: node scripts/generate-lib.js <lib-name>
 * Example: node scripts/generate-lib.js my-new-lib
 */

const { execSync } = require('child_process');
const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const libName = process.argv[2];

if (!libName) {
    console.error('Usage: node scripts/generate-lib.js <lib-name>');
    console.error('Example: node scripts/generate-lib.js my-new-lib');
    process.exit(1);
}

// Validate lib name
if (!/^[a-z][a-z0-9-]*$/.test(libName)) {
    console.error(
        'Library name must be lowercase, start with a letter, and contain only letters, numbers, and hyphens'
    );
    process.exit(1);
}

const importPath = `@app/${libName}`;
const directory = `libs/${libName}`;

console.log(`\n📦 Generating library: ${importPath}\n`);

// Run Nx generator
try {
    execSync(
        `npx nx g @nx/js:lib ${libName} --directory=${directory} --importPath=${importPath} --bundler=tsc --linter=eslint --unitTestRunner=jest`,
        { stdio: 'inherit' }
    );
} catch (error) {
    console.error('Failed to generate library');
    process.exit(1);
}

// Add path mapping to tsconfig.json
const tsconfigPath = join(__dirname, '..', 'tsconfig.json');
const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));

if (!tsconfig.compilerOptions) {
    tsconfig.compilerOptions = {};
}
if (!tsconfig.compilerOptions.paths) {
    tsconfig.compilerOptions.paths = {};
}

const pathMapping = `libs/${libName}/src/index.ts`;
if (!tsconfig.compilerOptions.paths[importPath]) {
    tsconfig.compilerOptions.paths[importPath] = [pathMapping];
    writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 4) + '\n');
    console.log(`\n✅ Added path mapping to tsconfig.json: "${importPath}" -> "${pathMapping}"`);
} else {
    console.log(`\n⚠️  Path mapping for "${importPath}" already exists in tsconfig.json`);
}

console.log(`\n🎉 Library ${importPath} created successfully!\n`);
console.log('Webpack aliases are auto-discovered - no manual config needed.');
console.log(`\nYou can now import from it:`);
console.log(`  import { ... } from '${importPath}';\n`);
