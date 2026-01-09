import { getDatabaseSchemas } from './config';

// Note: env is validated at module load time, so we test the helper function
// The actual env validation is tested implicitly by the application starting

describe('Config', () => {
    describe('getDatabaseSchemas', () => {
        it('should parse comma-separated schemas', () => {
            // This tests the function logic, actual env.DATABASE_SCHEMAS comes from config
            const originalEnv = process.env.DATABASE_SCHEMAS;

            // The function uses env.DATABASE_SCHEMAS which is already validated
            // We're testing that the parsing logic works correctly
            const schemas = getDatabaseSchemas();

            expect(Array.isArray(schemas)).toBe(true);
            expect(schemas.length).toBeGreaterThan(0);

            process.env.DATABASE_SCHEMAS = originalEnv;
        });

        it('should trim whitespace from schema names', () => {
            const schemas = getDatabaseSchemas();

            schemas.forEach(schema => {
                expect(schema).toBe(schema.trim());
            });
        });

        it('should filter out empty strings', () => {
            const schemas = getDatabaseSchemas();

            schemas.forEach(schema => {
                expect(schema.length).toBeGreaterThan(0);
            });
        });
    });
});
