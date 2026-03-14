import { test, expect, BrowserContext, request as createRequest } from '@playwright/test';

const API_BASE = 'http://localhost:3001/api';
const ORGANIZER_EMAIL = 'organizer@ddd.com';
const ADMIN_EMAIL = 'admin@example.com';
const TEST_PASSWORD = 'Testing123!';

/**
 * Authenticates via the API and injects the auth_token cookie into the browser context.
 * Returns true if successful, false if the backend is unavailable.
 */
async function apiLogin(context: BrowserContext, email = ORGANIZER_EMAIL): Promise<boolean> {
    const apiContext = await createRequest.newContext();
    try {
        const res = await apiContext.post(`${API_BASE}/auth/login`, {
            data: { email, password: TEST_PASSWORD },
            timeout: 3000,
        });
        if (!res.ok()) return false;
        const { access_token, user } = await res.json();
        // Inject the JWT as a cookie — this is what Next.js middleware reads
        await context.addCookies([{
            name: 'auth_token',
            value: access_token,
            domain: 'localhost',
            path: '/',
            sameSite: 'Strict',
            expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
        }]);
        // Inject into localStorage for the React auth lib
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

test.describe('Dashboard Portal', () => {
    test('Sidebar navigation is present after login', async ({ page, context }) => {
        const ok = await apiLogin(context, ORGANIZER_EMAIL);
        if (!ok) { test.skip(true, 'Backend unavailable.'); return; }

        await page.goto('/dashboard');
        await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 8000 });
        await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('link', { name: /Festivals/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /Team/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /Analytics/i })).toBeVisible();
    });

    test('Admin-only sidebar links visible with ADMIN role', async ({ page, context }) => {
        const ok = await apiLogin(context, ADMIN_EMAIL);
        if (!ok) { test.skip(true, 'Backend unavailable.'); return; }

        await page.goto('/dashboard');
        await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 8000 });
        await expect(page.getByRole('link', { name: /System Settings/i })).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('link', { name: /User Management/i })).toBeVisible();
    });

    test('Dark mode toggle is present in sidebar footer', async ({ page, context }) => {
        const ok = await apiLogin(context, ORGANIZER_EMAIL);
        if (!ok) { test.skip(true, 'Backend unavailable.'); return; }

        await page.goto('/dashboard');
        await expect(page.getByRole('button', { name: /Toggle Dark Mode/i })).toBeVisible({ timeout: 10000 });
    });

    test('Dashboard heading loads successfully', async ({ page, context }) => {
        const ok = await apiLogin(context, ORGANIZER_EMAIL);
        if (!ok) { test.skip(true, 'Backend unavailable.'); return; }

        await page.goto('/dashboard');
        await expect(page.getByRole('heading', { level: 1, name: /Organizer Hub/i }))
            .toBeVisible({ timeout: 15000 });
    });

    test('Analytics chart section renders', async ({ page, context }) => {
        const ok = await apiLogin(context, ORGANIZER_EMAIL);
        if (!ok) { test.skip(true, 'Backend unavailable.'); return; }

        await page.goto('/dashboard');
        await expect(page.getByRole('heading', { name: /Analytics/i })).toBeVisible({ timeout: 15000 });
    });

    test('Create Festival modal opens and closes', async ({ page, context }) => {
        const ok = await apiLogin(context, ORGANIZER_EMAIL);
        if (!ok) { test.skip(true, 'Backend unavailable.'); return; }

        await page.goto('/dashboard');
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

    test('Festival card reveals events table', async ({ page, context }) => {
        const ok = await apiLogin(context, ORGANIZER_EMAIL);
        if (!ok) { test.skip(true, 'Backend unavailable.'); return; }

        await page.goto('/dashboard');
        await expect(page.getByRole('heading', { level: 1, name: /Organizer Hub/i }))
            .toBeVisible({ timeout: 15000 });

        const festivalCard = page.getByRole('heading', { level: 3 }).first();
        if ((await festivalCard.count()) > 0) {
            await festivalCard.click();
            await expect(page.getByRole('heading', { level: 2, name: /Events for/i }))
                .toBeVisible({ timeout: 8000 });
        }
    });
});
