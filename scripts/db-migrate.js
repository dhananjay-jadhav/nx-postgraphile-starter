#!/usr/bin/env node

/**
 * Wrapper script for graphile-migrate commands that handles
 * the "database is being accessed by other users" error
 * by terminating connections to both databases first.
 *
 * In production (NODE_ENV=production), connection termination is skipped
 * since we typically only run 'migrate' which doesn't need it.
 *
 * Usage: node scripts/db-migrate.js <command> [args...]
 * Example: node scripts/db-migrate.js commit
 *          node scripts/db-migrate.js reset --erase
 */

const { execSync, spawn } = require('child_process');

require('dotenv').config();

const isDevelopment = process.env.NODE_ENV === 'development' ? true : false;

// Get the command and args from CLI
const [command, ...args] = process.argv.slice(2);

if (!command) {
    console.error('Usage: node scripts/db-migrate.js <command> [args...]');
    console.error('Commands: migrate, watch, commit, uncommit, reset, status');
    process.exit(1);
}

// Get database names from connection strings
const mainUrl = process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/postgres';
const shadowUrl = process.env.DATABASE_SHADOW_URL || 'postgres://postgres:password@localhost:5432/postgres_shadow';
const mainDbName = new URL(mainUrl).pathname.slice(1);
const shadowDbName = new URL(shadowUrl).pathname.slice(1);

function terminateConnections(dbName) {
    try {
        execSync(
            `docker exec postgraphile-db psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName}' AND pid <> pg_backend_pid();"`,
            { stdio: 'pipe' }
        );
    } catch (e) {
        // Ignore errors (e.g., if container not running or no connections exist)
    }
}

// Commands that may need connection termination (development only)
const commandsNeedingTermination = ['commit', 'uncommit', 'reset', 'watch'];

// Only terminate connections in development
if (isDevelopment && commandsNeedingTermination.includes(command)) {
    console.log(`Terminating connections to ${mainDbName} and ${shadowDbName}...`);
    terminateConnections(mainDbName);
    terminateConnections(shadowDbName);
}

// In production, only allow 'migrate' and 'status' commands
if (!isDevelopment && !['migrate', 'status'].includes(command)) {
    console.error(`Error: '${command}' is not allowed in production.`);
    console.error('Only "migrate" and "status" commands are allowed in production.');
    process.exit(1);
}

// Run graphile-migrate with the specified command
const child = spawn('npx', ['graphile-migrate', command, ...args], {
    stdio: 'inherit',
});

child.on('close', code => {
    process.exit(code);
});
