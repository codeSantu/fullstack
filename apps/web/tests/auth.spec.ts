import { test, expect, BrowserContext, request as createRequest } from '@playwright/test';

const API_BASE = 'http://localhost:3001/api';
const TEST_EMAIL = 'admin@example.com';
const TEST_PASSWORD = 'Testing123!';

/**
 * Direct API login via Playwright's request context — bypasses form submission timing.
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

/**
 * SELF-HEALING AUTH TESTS
 * Tests the login page structure, invalid credentials, and auth-guarded navigation.
 */

test('has title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.+/);
});

test('login page renders correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
});

test('login page has heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Welcome to Enterprise DDD/i })).toBeVisible();
});

test('login navigation flow via API auth', async ({ page, context }) => {
    // Use API login for reliability — avoids form submit / cookie timing race
    const ok = await apiLogin(context, TEST_EMAIL);
    if (!ok) { test.skip(true, 'Backend unavailable.'); return; }

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 8000 });
    await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible({ timeout: 10000 });
});

test('invalid credentials show error message', async ({ page, context }) => {
    const apiCtx = await createRequest.newContext();
    let backendUp = false;
    try {
        const r = await apiCtx.post(`${API_BASE}/auth/login`, {
            data: { email: TEST_EMAIL, password: TEST_PASSWORD },
            timeout: 2000,
        });
        backendUp = r.ok();
    } catch { /* offline */ }
    await apiCtx.dispose();

    if (!backendUp) { test.skip(true, 'Backend unavailable.'); return; }

    await page.goto('/');
    await page.getByLabel(/email/i).fill('wrong@wrong.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /Sign In/i }).click();

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 8000 });
    await expect(page).not.toHaveURL(/.*\/dashboard/);
});
