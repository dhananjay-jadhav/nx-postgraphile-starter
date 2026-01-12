#!/usr/bin/env node
/**
 * Generate a new wrapPlans API library for a GraphQL type using EJS templates.
 *
 * Usage:
 *   node scripts/generate-gql-crud.js <TypeName> [--name <lib-name>] [--operation <op>]
 *
 * Examples:
 *   node scripts/generate-gql-crud.js User                    # Creates libs/users-api/ with all operations
 *   node scripts/generate-gql-crud.js User --name user-plans  # Custom lib name
 *   node scripts/generate-gql-crud.js User --operation query  # Only query operations
 */

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const ejs = require('ejs');

// Valid operations for --operation flag
const VALID_OPERATIONS = ['query', 'mutation', 'all'];
const QUERY_TEMPLATES = ['__typeNameLower__.query.ts', '__typeNameLower__-by-id.query.ts', '__typeNamePlural__.query.ts'];
const MUTATION_TEMPLATES = [
    'create-__typeNameLower__.mutation.ts',
    'update-__typeNameLower__.mutation.ts',
    'update-__typeNameLower__-by-id.mutation.ts',
    'delete-__typeNameLower__.mutation.ts',
    'delete-__typeNameLower__-by-id.mutation.ts',
];

// Parse arguments
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node scripts/generate-gql-crud.js <TypeName> [options]

Arguments:
  TypeName     The GraphQL type name in PascalCase (e.g., User, BlogPost)

Options:
  --name       Custom library name (default: {typePlural}-api)
  --operation  Generate only specific operations: query, mutation, or all (default: all)

Examples:
  node scripts/generate-gql-crud.js User                     # All operations → libs/users-api/
  node scripts/generate-gql-crud.js BlogPost                 # All operations → libs/blog-posts-api/
  node scripts/generate-gql-crud.js User --name users        # Custom name → libs/users/
  node scripts/generate-gql-crud.js User --operation query   # Only query wrapPlans
  node scripts/generate-gql-crud.js User --operation mutation # Only mutation wrapPlans
`);
    process.exit(0);
}

const typeName = args[0];

// Parse --name option
const nameIndex = args.indexOf('--name');
const customName = nameIndex !== -1 ? args[nameIndex + 1] : null;

// Parse --operation option
const operationIndex = args.indexOf('--operation');
const operation = operationIndex !== -1 ? args[operationIndex + 1] : 'all';

// ============ Input Validation ============

// Validate TypeName is PascalCase
if (!/^[A-Z][a-zA-Z0-9]*$/.test(typeName)) {
    console.error('❌ Error: TypeName must be PascalCase (e.g., "User", "BlogPost")');
    console.error(`   Received: "${typeName}"`);
    process.exit(1);
}

// Validate --operation value
if (!VALID_OPERATIONS.includes(operation)) {
    console.error(`❌ Error: Invalid operation "${operation}"`);
    console.error(`   Valid options: ${VALID_OPERATIONS.join(', ')}`);
    process.exit(1);
}

// Validate --name format if provided
if (customName && !/^[a-z][a-z0-9-]*$/.test(customName)) {
    console.error('❌ Error: Library name must be lowercase, start with a letter, and contain only letters, numbers, and hyphens');
    console.error(`   Received: "${customName}"`);
    process.exit(1);
}

// Generate names using names() utility pattern
const nameVariants = names(typeName);
const typeNameLower = nameVariants.fileName.replace(/-/g, ''); // user, blogpost
const typeNameKebab = nameVariants.fileName; // user, blog-post
const typeNamePlural = pluralize(typeNameLower);
const typeNamePluralKebab = pluralize(nameVariants.fileName); // users, blog-posts
const TypeNamePlural = typeNamePlural.charAt(0).toUpperCase() + typeNamePlural.slice(1);
const libName = customName || `${typeNamePluralKebab}-api`;
const libNameForFile = libName.replace(/-/g, '');

// Paths
const rootDir = path.resolve(__dirname, '..');
const libDir = path.join(rootDir, 'libs', libName);
const srcDir = path.join(libDir, 'src');
const libSrcDir = path.join(srcDir, 'lib');
const templatesDir = path.join(rootDir, 'tools/generators/gql-crud/files');
const generatedTypesPath = path.join(rootDir, 'libs/gql/src/lib/generated/types.ts');

console.log(`\n📦 Creating wrapPlans API library for ${typeName}`);
console.log(`   Library: libs/${libName}/`);
console.log(`   Import:  @app/${libName}\n`);

// Check if lib already exists
if (fs.existsSync(libDir)) {
    console.error(`❌ Error: Library libs/${libName}/ already exists`);
    process.exit(1);
}

// Validate type exists in generated schema
console.log('🔍 Validating type exists in generated schema...');
let generatedTypes = '';
try {
    generatedTypes = fs.readFileSync(generatedTypesPath, 'utf-8');
} catch (error) {
    console.error('❌ Error: Could not read generated types. Run "yarn codegen" first.');
    process.exit(1);
}

if (!generatedTypes.includes(`export interface ${typeName} `)) {
    console.error(`❌ Error: Type "${typeName}" not found in generated types.`);
    console.error('   Make sure the type exists in your schema and run "yarn codegen".');
    process.exit(1);
}

console.log(`✅ Found type ${typeName} with related types`);

// Step 1: Generate base library using @nx/js:library
console.log('\n🔧 Running nx generate @nx/js:library...');
try {
    execSync(
        `npx nx generate @nx/js:library ${libName} ` +
            `--directory=libs/${libName} ` +
            `--importPath=@app/${libName} ` +
            `--bundler=tsc ` +
            `--unitTestRunner=jest ` +
            `--linter=eslint ` +
            `--projectNameAndRootFormat=as-provided`,
        { cwd: rootDir, stdio: 'inherit' }
    );
} catch (error) {
    console.error('❌ Failed to generate library');
    process.exit(1);
}

// Step 2: Remove default files and generate from templates
console.log('\n📁 Generating files from EJS templates...');

// Remove default generated files
const defaultFiles = [
    path.join(libSrcDir, `${libNameForFile}.ts`),
    path.join(libSrcDir, `${libNameForFile}.spec.ts`),
    path.join(libSrcDir, `${libName.replace(/-/g, '-')}.ts`),
    path.join(libSrcDir, `${libName.replace(/-/g, '-')}.spec.ts`),
];
for (const file of defaultFiles) {
    if (fs.existsSync(file)) {
        fs.unlinkSync(file);
    }
}

// Also try to find any .ts files in libSrcDir and remove them
if (fs.existsSync(libSrcDir)) {
    const files = fs.readdirSync(libSrcDir);
    for (const file of files) {
        const filePath = path.join(libSrcDir, file);
        if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
        }
    }
}

// Create subdirectories based on operation
if (operation === 'all' || operation === 'query') {
    fs.mkdirSync(path.join(libSrcDir, 'queries'), { recursive: true });
}
if (operation === 'all' || operation === 'mutation') {
    fs.mkdirSync(path.join(libSrcDir, 'mutations'), { recursive: true });
}

// Get structured operation types (inspired by other repo's getOperationTypes pattern)
const operationTypes = getOperationTypes(typeName, nameVariants.propertyName, TypeNamePlural);

// Template context with all name variants and operation types
const templateContext = {
    // Name variants
    typeName,                    // User
    typeNameLower,               // user
    typeNamePlural,              // users
    TypeNamePlural,              // Users
    typeNameKebab,               // user (or blog-post)
    typeNamePluralKebab,         // users (or blog-posts)
    propertyName: nameVariants.propertyName,  // user (camelCase)
    className: nameVariants.className,        // User (PascalCase)
    constantName: nameVariants.constantName,  // USER (SCREAMING_SNAKE)
    libName,
    
    // Operation flags for conditional template rendering
    includeQueries: operation === 'all' || operation === 'query',
    includeMutations: operation === 'all' || operation === 'mutation',
    
    // Structured operation types for templates
    operations: operationTypes,
};

// Generate files from EJS templates
generateFromTemplates(templatesDir, srcDir, templateContext, operation);

// Format generated files with Prettier
console.log('\n💅 Formatting generated files...');
try {
    execSync(`npx prettier --write "libs/${libName}/src/**/*.ts"`, { 
        cwd: rootDir, 
        stdio: 'pipe' 
    });
    console.log('   ✓ Files formatted');
} catch (error) {
    console.log('   ⚠ Prettier formatting skipped (not installed or failed)');
}

// Auto-import plugin into graphile.config.ts
console.log('\n🔗 Updating graphile.config.ts...');
const graphileConfigPath = path.join(rootDir, 'apps/api/src/server/graphile.config.ts');
try {
    updateGraphileConfig(graphileConfigPath, {
        libName,
        typeName,
    });
    console.log('   ✓ graphile.config.ts updated');
} catch (error) {
    console.log(`   ⚠ Could not update graphile.config.ts: ${error.message}`);
    console.log(`   Add manually: import { ${typeName}WrapPlansPlugin } from '@app/${libName}';`);
    console.log(`   And add to plugins array: plugins: [..., ${typeName}WrapPlansPlugin]`);
}

console.log(`\n✅ Library created successfully!`);

// Dynamic structure output based on operation
const structureLines = [
    `📂 Structure:`,
    `libs/${libName}/`,
    `  src/`,
    `    index.ts`,
    `    lib/`,
];

if (operation === 'all' || operation === 'query') {
    structureLines.push(
        `      queries/`,
        `        ${typeNameLower}.query.ts`,
        `        ${typeNameLower}-by-id.query.ts`,
        `        ${typeNamePlural}.query.ts`
    );
}

if (operation === 'all' || operation === 'mutation') {
    structureLines.push(
        `      mutations/`,
        `        create-${typeNameLower}.mutation.ts`,
        `        update-${typeNameLower}.mutation.ts`,
        `        update-${typeNameLower}-by-id.mutation.ts`,
        `        delete-${typeNameLower}.mutation.ts`,
        `        delete-${typeNameLower}-by-id.mutation.ts`
    );
}

console.log(`\n${structureLines.join('\n')}`);

// Simplified usage example - the plugin is auto-imported
console.log(`
📝 The plugin has been auto-imported into graphile.config.ts:

import { ${typeName}WrapPlansPlugin } from '@app/${libName}';

export const preset: GraphileConfig.Preset = {
    plugins: [LoggingPlugin, ${typeName}WrapPlansPlugin],
    // ... rest of config
};

📖 To customize individual wrapPlan functions, edit the files in libs/${libName}/src/lib/
   Each function receives (plan, $source, fieldArgs, info) - call plan() to execute the original.
`);

/**
 * Generate files from EJS templates recursively
 * Handles __variableName__ placeholders in filenames
 * @param {string} templatesDir - Source templates directory
 * @param {string} outputDir - Output directory
 * @param {object} context - Template variables
 * @param {string} operationFilter - 'all', 'query', or 'mutation'
 */
function generateFromTemplates(templatesDir, outputDir, context, operationFilter = 'all') {
    const entries = fs.readdirSync(templatesDir, { withFileTypes: true });
    
    for (const entry of entries) {
        const templatePath = path.join(templatesDir, entry.name);
        
        if (entry.isDirectory()) {
            // Skip directories based on operation filter
            if (operationFilter === 'query' && entry.name === 'mutations') continue;
            if (operationFilter === 'mutation' && entry.name === 'queries') continue;
            
            // Create directory and recurse
            const newOutputDir = path.join(outputDir, entry.name);
            if (!fs.existsSync(newOutputDir)) {
                fs.mkdirSync(newOutputDir, { recursive: true });
            }
            generateFromTemplates(templatePath, newOutputDir, context, operationFilter);
        } else if (entry.name.endsWith('.template')) {
            // Process filename placeholders like __typeNameLower__
            let outputFileName = entry.name.replace('.template', '');
            outputFileName = outputFileName.replace(/__(\\w+)__/g, (match, varName) => {
                return context[varName] || match;
            });
            
            const outputPath = path.join(outputDir, outputFileName);
            
            const template = fs.readFileSync(templatePath, 'utf-8');
            const rendered = ejs.render(template, context);
            
            fs.writeFileSync(outputPath, rendered);
            console.log(`   ✓ ${path.relative(rootDir, outputPath)}`);
        }
    }
}

/**
 * Update graphile.config.ts to import the generated WrapPlans plugin
 * @param {string} configPath - Path to graphile.config.ts
 * @param {object} options - Generation options
 */
function updateGraphileConfig(configPath, options) {
    const { libName, typeName } = options;
    const pluginName = `${typeName}WrapPlansPlugin`;
    
    if (!fs.existsSync(configPath)) {
        throw new Error('graphile.config.ts not found');
    }
    
    let content = fs.readFileSync(configPath, 'utf-8');
    
    // Check if plugin is already imported
    if (content.includes(pluginName)) {
        console.log(`   ℹ ${pluginName} already imported in graphile.config.ts`);
        return;
    }
    
    // Build import statement
    const importStatement = `import { ${pluginName} } from '@app/${libName}';`;
    
    // Add import after last import statement
    const importRegex = /^import .+ from ['\"][^'\"]+['\"];?\\s*$/gm;
    let lastImportMatch = null;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        lastImportMatch = match;
    }
    
    if (lastImportMatch) {
        const insertPos = lastImportMatch.index + lastImportMatch[0].length;
        content = content.slice(0, insertPos) + '\n' + importStatement + content.slice(insertPos);
    } else {
        // No imports found, add at beginning
        content = importStatement + '\n\n' + content;
    }
    
    // Add plugin to plugins array
    // Look for plugins: [...] pattern
    const pluginsArrayMatch = content.match(/plugins:\\s*\\[([^\\]]*)\\]/s);
    if (pluginsArrayMatch) {
        const existingPlugins = pluginsArrayMatch[1].trim();
        let newPluginsContent;
        
        if (existingPlugins) {
            // Add to existing plugins
            newPluginsContent = existingPlugins.trimEnd();
            if (!newPluginsContent.endsWith(',')) {
                newPluginsContent += ',';
            }
            newPluginsContent += ` ${pluginName}`;
        } else {
            // Empty plugins array
            newPluginsContent = pluginName;
        }
        
        content = content.replace(
            pluginsArrayMatch[0],
            `plugins: [${newPluginsContent}]`
        );
    } else {
        // No plugins array found, try to add one to the preset
        console.log('   ⚠ Could not find plugins array. Please add manually:');
        console.log(`      plugins: [${pluginName}]`);
    }
    
    fs.writeFileSync(configPath, content);
    
    // Format the config file
    try {
        execSync(`npx prettier --write "${configPath}"`, { cwd: rootDir, stdio: 'pipe' });
    } catch (e) {
        // Ignore prettier errors
    }
    
    console.log(`   ✓ Added ${pluginName} to graphile.config.ts`);
}

/**
 * Nx-style names utility - generates all case variants of a name
 * @param {string} name - Input name (e.g., 'BlogPost')
 * @returns {object} Object with fileName, className, propertyName, constantName
 */
function names(name) {
    // Convert PascalCase/camelCase to kebab-case
    const fileName = name
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
        .toLowerCase();
    
    // className is PascalCase
    const className = name.charAt(0).toUpperCase() + name.slice(1);
    
    // propertyName is camelCase
    const propertyName = name.charAt(0).toLowerCase() + name.slice(1);
    
    // constantName is SCREAMING_SNAKE_CASE
    const constantName = fileName.replace(/-/g, '_').toUpperCase();
    
    return { fileName, className, propertyName, constantName };
}

/**
 * Simple pluralize function
 */
function pluralize(word) {
    if (word.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(word[word.length - 2])) {
        return word.slice(0, -1) + 'ies';
    }
    if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z') || 
        word.endsWith('ch') || word.endsWith('sh')) {
        return word + 'es';
    }
    return word + 's';
}

/**
 * Get structured operation types for a GraphQL type
 * Centralizes all type name derivations for each operation
 * 
 * @param {string} typeName - PascalCase type name (e.g., 'User')
 * @param {string} propertyName - camelCase property name (e.g., 'user')
 * @param {string} typeNamePlural - Capitalized plural (e.g., 'Users')
 * @returns {object} Operation type mappings
 */
function getOperationTypes(typeName, propertyName, typeNamePlural) {
    const propertyNamePlural = typeNamePlural.charAt(0).toLowerCase() + typeNamePlural.slice(1);
    
    return {
        // Common type names for imports
        types: {
            entity: typeName,
            connection: `${typeName}Connection`,
            edge: `${typeName}Edge`,
            condition: `${typeName}Condition`,
            orderBy: `${typeNamePlural}OrderBy`,
        },
        
        // Query operations
        query: {
            name: 'query',
            wrapPlanName: `${propertyName}QueryWrapPlan`,
            fieldName: propertyName,
            inputType: `{ rowId: number }`,
            outputType: typeName,
            payloadType: `${typeName} | null`,
            argsType: `Query${typeName}Args`,
        },
        queryById: {
            name: 'queryById',
            wrapPlanName: `${propertyName}ByIdQueryWrapPlan`,
            fieldName: `${propertyName}ById`,
            inputType: `{ id: string }`,
            outputType: typeName,
            payloadType: `${typeName} | null`,
            argsType: `Query${typeName}ByIdArgs`,
        },
        queryConnection: {
            name: 'queryConnection',
            wrapPlanName: `${propertyNamePlural}ConnectionWrapPlan`,
            fieldName: propertyNamePlural,
            inputType: `Query${typeNamePlural}Args`,
            outputType: `${typeName}Connection`,
            payloadType: `${typeName}Connection`,
            argsType: `Query${typeNamePlural}Args`,
        },
        
        // Mutation operations
        create: {
            name: 'create',
            wrapPlanName: `create${typeName}WrapPlan`,
            fieldName: `create${typeName}`,
            inputType: `Create${typeName}Input`,
            outputType: `Create${typeName}Payload`,
            payloadType: `Create${typeName}Payload`,
        },
        update: {
            name: 'update',
            wrapPlanName: `update${typeName}WrapPlan`,
            fieldName: `update${typeName}`,
            inputType: `Update${typeName}Input`,
            outputType: `Update${typeName}Payload`,
            payloadType: `Update${typeName}Payload`,
        },
        updateById: {
            name: 'updateById',
            wrapPlanName: `update${typeName}ByIdWrapPlan`,
            fieldName: `update${typeName}ById`,
            inputType: `Update${typeName}ByIdInput`,
            outputType: `Update${typeName}Payload`,
            payloadType: `Update${typeName}Payload`,
        },
        delete: {
            name: 'delete',
            wrapPlanName: `delete${typeName}WrapPlan`,
            fieldName: `delete${typeName}`,
            inputType: `Delete${typeName}Input`,
            outputType: `Delete${typeName}Payload`,
            payloadType: `Delete${typeName}Payload`,
        },
        deleteById: {
            name: 'deleteById',
            wrapPlanName: `delete${typeName}ByIdWrapPlan`,
            fieldName: `delete${typeName}ById`,
            inputType: `Delete${typeName}ByIdInput`,
            outputType: `Delete${typeName}Payload`,
            payloadType: `Delete${typeName}Payload`,
        },
    };
}
