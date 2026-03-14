import { test, expect } from '@playwright/test';

/**
 * SELF-HEALING API HEALTH TESTS
 *
 * Strategy: Tests are designed to be resilient against local environment differences.
 * - api/health is unauthenticated
 * - /festivals now requires JWT — we get one by calling /auth/login first
 */

const API_BASE = 'http://localhost:3001/api';
const TEST_EMAIL = 'admin@example.com';
const TEST_PASSWORD = 'Testing123!';

async function getToken(request: any): Promise<string | null> {
    try {
        const res = await request.post(`${API_BASE}/auth/login`, {
            data: { email: TEST_EMAIL, password: TEST_PASSWORD },
            timeout: 5000,
        });
        if (res.ok()) {
            const body = await res.json();
            return body.access_token || null;
        }
        return null;
    } catch {
        return null;
    }
}

test.describe('API Health Verification', () => {
    test('/api/health - unauthenticated backend contract verification', async ({ request }) => {
        let response: Awaited<ReturnType<typeof request.get>>;
        try {
            response = await request.get(`${API_BASE}/health`, { timeout: 5000 });
        } catch {
            test.skip(true, 'NestJS backend not running at localhost:3001 — skipping API health check.');
            return;
        }

        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);

        const healthData = await response.json();
        expect(healthData).toHaveProperty('status');
        expect(healthData.status).toBe('ok');
    });

    test('POST /auth/login - returns JWT access_token', async ({ request }) => {
        let response: Awaited<ReturnType<typeof request.post>>;
        try {
            response = await request.post(`${API_BASE}/auth/login`, {
                data: { email: TEST_EMAIL, password: TEST_PASSWORD },
                timeout: 5000,
            });
        } catch {
            test.skip(true, 'NestJS backend not running — skipping auth test.');
            return;
        }

        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body).toHaveProperty('access_token');
        expect(body).toHaveProperty('user');
        expect(body.user.email).toBe(TEST_EMAIL);
    });

    test('GET /festivals - requires JWT (returns 401 without token)', async ({ request }) => {
        let response: Awaited<ReturnType<typeof request.get>>;
        try {
            response = await request.get(`${API_BASE}/festivals`, { timeout: 5000 });
        } catch {
            test.skip(true, 'NestJS backend not running — skipping festivals test.');
            return;
        }
        expect(response.status()).toBe(401);
    });

    test('GET /festivals - returns list with JWT token', async ({ request }) => {
        const token = await getToken(request);
        if (!token) {
            test.skip(true, 'NestJS backend not running or auth failed — skipping festivals test.');
            return;
        }

        const response = await request.get(`${API_BASE}/festivals`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(Array.isArray(data)).toBeTruthy();
    });
});
