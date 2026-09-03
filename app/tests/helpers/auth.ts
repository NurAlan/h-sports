import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Helper: Login to H-Sport
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
  await expect(page.locator('h1')).toContainText('Dashboard');
}

/**
 * Helper: Logout from H-Sport
 */
export async function logout(page: Page) {
  await page.goto('/profile');
  await page.click('button:has-text("Logout")');
  await page.waitForURL('/login');
}

/**
 * Helper: Wait for navigation to stabilize
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Test fixture with authenticated session
 */
export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    await login(page, 'wahyunuralan@gmail.com', 'passwords');
    await use(page);
    await logout(page);
  },
});

export { expect };
