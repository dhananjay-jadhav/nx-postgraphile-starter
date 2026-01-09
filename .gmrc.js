/*
 * Graphile Migrate configuration file.
 * See: https://github.com/graphile/migrate
 */

require('dotenv').config();

module.exports = {
    // Connection string to the database.
    // Uses the DATABASE_URL environment variable from .env file.
    connectionString: process.env.DATABASE_URL,

    // Shadow database is used to verify migrations can be run cleanly.
    shadowConnectionString:
        process.env.DATABASE_SHADOW_URL || 'postgres://postgres:password@localhost:5432/postgres_shadow',

    // Root connection string for creating/dropping shadow database.
    // Uses template1 database as it always exists and is different from our app database.
    rootConnectionString: process.env.DATABASE_ROOT_URL || 'postgres://postgres:password@localhost:5432/template1',

    // The folder to store migration files in.
    // In development: ./libs/database/migrations
    // In production (Docker): ./migrations (copied during build)
    migrationsFolder: process.env.NODE_ENV === 'development' ? './libs/database/migrations' : './migrations',

    // SQL to run after resetting the database (before running migrations).
    // Useful for creating extensions, etc.
    afterReset: [
        // Example: "afterReset.sql"
    ],

    // SQL to run after all migrations have been applied.
    afterAllMigrations: [
        // Example: { _: 'command', command: 'yarn codegen' }
    ],

    // SQL to run after each individual migration.
    afterCurrent: [],

    // Configuration for blankMigrationContent.
    blankMigrationContent: '-- Enter migration here\n',

    /*
     * Actions to perform after a migration runs:
     *
     * Uncomment below to trigger your GraphQL schema generation after migrations:
     * afterAllMigrations: [
     *   { _: 'command', command: 'yarn codegen' }
     * ],
     */
};
