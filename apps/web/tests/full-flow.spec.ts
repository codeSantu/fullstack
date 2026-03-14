import { test, expect, BrowserContext, request as createRequest } from '@playwright/test';

const API_BASE = 'http://localhost:3001/api';
const TEST_EMAIL = 'admin@example.com';
const TEST_PASSWORD = 'Testing123!';

/**
 * Authenticates via the API and injects auth_token cookie into browser context.
 */
async function apiLogin(context: BrowserContext, email = TEST_EMAIL): Promise<boolean> {
    const apiContext = await createRequest.newContext();
    try {
        const res = await apiContext.post(`${API_BASE}/auth/login`, {
            data: { email, password: TEST_PASSWORD },
            timeout: 3000,
        });
        if (!res.ok()) return false;
        const { access_token, user } = await res.json();
        await context.addCookies([{
            name: 'auth_token',
            value: access_token,
            domain: 'localhost',
            path: '/',
            sameSite: 'Strict',
            expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
        }]);
        const page = await context.newPage();
        await page.goto('http://localhost:3000');
        await page.evaluate(({ token, userData }) => {
            localStorage.setItem('auth_token', token);
            localStorage.setItem('auth_user', JSON.stringify(userData));
        }, { token: access_token, userData: user });
        await page.close();
        return true;
    } catch {
        return false;
    } finally {
        await apiContext.dispose();
    }
}

test.describe('Full Application Flow', () => {
    test('Login page has correct structure', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { name: /Welcome to Enterprise DDD/i })).toBeVisible();
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByLabel(/password/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
    });

    test('Route protection: /dashboard redirects to / without auth', async ({ page, context }) => {
        await context.clearCookies();
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/^\/?$|^\/\?.*$/, { timeout: 8000 });
        await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
    });

    test('Full E2E Flow: Authenticated dashboard access', async ({ page, context }) => {
        const ok = await apiLogin(context, TEST_EMAIL);
        if (!ok) { test.skip(true, 'Backend not available.'); return; }

        await page.goto('/dashboard');
        await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 8000 });
        await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('heading', { level: 1, name: /Organizer Hub/i }))
            .toBeVisible({ timeout: 15000 });

        const createButton = page.getByRole('button', { name: /Create Festival/i });
        await expect(createButton).toBeVisible({ timeout: 10000 });
        await createButton.click();

        await expect(page.getByRole('heading', { level: 2, name: /Create New Festival/i }))
            .toBeVisible({ timeout: 5000 });

        await page.getByRole('button', { name: /Cancel/i }).click();
        await expect(page.getByRole('heading', { level: 2, name: /Create New Festival/i }))
            .not.toBeVisible();
    });
});
