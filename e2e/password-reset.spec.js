const { test, expect } = require('@playwright/test');

test('password reset request & accept', async ({ request }) => {
  const email = `test+pw+${Date.now()}@example.com`;
  const res = await request.post('/api/auth/password-reset/request', { data: { email } });
  expect(res.ok()).toBeTruthy();
});
