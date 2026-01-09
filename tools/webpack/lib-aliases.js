/**
 * Shared webpack utility for auto-discovering @app/* library aliases
 */
const { join } = require('path');
const { readdirSync } = require('fs');

/**
 * Auto-generate webpack aliases for all libs in the workspace
 * @param {string} workspaceRoot - Path to workspace root
 * @returns {object} Webpack alias object mapping @app/* to lib source files
 */
function getLibAliases(workspaceRoot) {
    const libsDir = join(workspaceRoot, 'libs');
    const aliases = {};
    readdirSync(libsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .forEach(dirent => {
            aliases[`@app/${dirent.name}`] = join(libsDir, dirent.name, 'src/index.ts');
        });
    return aliases;
}

module.exports = { getLibAliases };
