import { test, expect } from '@playwright/test';

/**
 * Smoke test: Landing page loads and renders key UI elements
 */
test('landing page loads with correct branding', async ({ page }) => {
  await page.goto('/');

  // Check page title
  await expect(page).toHaveTitle(/ZAO OS/);

  // Check hero heading
  await expect(page.getByRole('heading', { level: 1 })).toContainText('THE ZAO');

  // Check tagline
  await expect(page.getByText('Where music artists build onchain')).toBeVisible();

  // Check feature pills are rendered
  await expect(page.getByText('Community')).toBeVisible();
  await expect(page.getByText('Music')).toBeVisible();
  await expect(page.getByText('Encrypted')).toBeVisible();
  await expect(page.getByText('Governance')).toBeVisible();

  // Check Discord join section
  await expect(page.getByText('Not a member yet?')).toBeVisible();
});

test('landing page has login button area', async ({ page }) => {
  await page.goto('/');

  // The login button wrapper should be present (farcaster sign-in)
  await expect(page.locator('.farcaster-signin-wrapper')).toBeVisible();

  // Wallet login fallback should be present
  await expect(page.getByText(/no farcaster\? use wallet/i)).toBeVisible();
});

test('landing page has no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Filter out known harmless errors (e.g. third-party font/service failures)
  const realErrors = errors.filter(e => !e.includes('favicon') && !e.includes('fonts.'));
  expect(realErrors).toHaveLength(0);
});
