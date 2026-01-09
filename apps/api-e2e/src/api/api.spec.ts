import axios from 'axios';

describe('API Endpoints', () => {
    describe('GET /api', () => {
        it('should return a welcome message', async () => {
            const res = await axios.get('/api');

            expect(res.status).toBe(200);
            expect(res.data).toEqual({ message: 'Welcome to api!' });
        });
    });

    describe('GET /live', () => {
        it('should return liveness status', async () => {
            const res = await axios.get('/live');

            expect(res.status).toBe(200);
            expect(res.data).toHaveProperty('alive', true);
            expect(res.data).toHaveProperty('uptime');
        });
    });

    describe('GET /health', () => {
        it('should return health status', async () => {
            const res = await axios.get('/health');

            expect(res.status).toBe(200);
            expect(res.data).toHaveProperty('status');
            expect(res.data).toHaveProperty('timestamp');
            expect(res.data).toHaveProperty('uptime');
            expect(res.data).toHaveProperty('components');
        });
    });

    describe('GET /ready', () => {
        it('should return readiness status', async () => {
            const res = await axios.get('/ready');

            expect([200, 503]).toContain(res.status);
            expect(res.data).toHaveProperty('status');
        });
    });
});
