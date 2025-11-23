// Basic Playwright test scaffold (JS) - adjust to your CI/test DB
const { test, expect } = require('@playwright/test');

test('invite accept flow', async ({ page, request, baseURL }) => {
  const email = `test+invite+${Date.now()}@example.com`;
  const res = await request.post('/api/auth/invite', { data: { email, role: 'RECEPTIONIST' } });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.ok).toBeTruthy();
});
