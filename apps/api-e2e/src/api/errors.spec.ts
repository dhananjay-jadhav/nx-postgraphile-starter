import axios, { AxiosError } from 'axios';

describe('Error Handling', () => {
    describe('404 Not Found', () => {
        it('should return 404 for non-existent routes', async () => {
            try {
                await axios.get('/non-existent-route');
                fail('Expected request to fail');
            } catch (error) {
                const axiosError = error as AxiosError;
                expect(axiosError.response?.status).toBe(404);
            }
        });

        it('should return 404 for unknown API routes', async () => {
            try {
                await axios.get('/api/unknown-endpoint');
                fail('Expected request to fail');
            } catch (error) {
                const axiosError = error as AxiosError;
                expect(axiosError.response?.status).toBe(404);
            }
        });
    });

    describe('GraphQL Error Handling', () => {
        it('should handle invalid GraphQL queries gracefully', async () => {
            try {
                const res = await axios.post('/graphql', {
                    query: '{ invalidQuery }',
                });

                expect(res.data).toHaveProperty('errors');
                expect(Array.isArray(res.data.errors)).toBe(true);
            } catch (error) {
                const axiosError = error as AxiosError;
                expect([400, 200]).toContain(axiosError.response?.status);
            }
        });

        it('should handle malformed GraphQL request body', async () => {
            try {
                await axios.post('/graphql', 'not-valid-json', {
                    headers: { 'Content-Type': 'application/json' },
                });
                fail('Expected request to fail');
            } catch (error) {
                const axiosError = error as AxiosError;
                expect([400, 500]).toContain(axiosError.response?.status);
            }
        });

        it('should handle empty GraphQL query', async () => {
            try {
                const res = await axios.post('/graphql', { query: '' });

                if (res.data.errors) {
                    expect(Array.isArray(res.data.errors)).toBe(true);
                }
            } catch (error) {
                const axiosError = error as AxiosError;
                expect([400, 500]).toContain(axiosError.response?.status);
            }
        });
    });

    describe('Method Not Allowed', () => {
        it('should handle unsupported methods on known routes', async () => {
            try {
                await axios.delete('/api');
                fail('Expected request to fail');
            } catch (error) {
                const axiosError = error as AxiosError;
                expect([404, 405]).toContain(axiosError.response?.status);
            }
        });
    });

    describe('Response Format', () => {
        it('should return JSON error responses', async () => {
            try {
                await axios.get('/non-existent-route');
                fail('Expected request to fail');
            } catch (error) {
                const axiosError = error as AxiosError;
                const contentType = axiosError.response?.headers['content-type'];
                expect(contentType).toMatch(/application\/json/);
            }
        });
    });
});
