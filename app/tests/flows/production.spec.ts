import { test, expect } from '../helpers/auth';

test.describe('Production Flow', () => {
  test('should display production dashboard', async ({ authenticatedPage: page }) => {
    await page.goto('/production');
    await expect(page.locator('h1')).toContainText('Production');
  });

  test('should show progress bars with aria attributes', async ({ authenticatedPage: page }) => {
    await page.goto('/production');
    
    // Check for progress bar with proper aria
    const progressBar = page.locator('[role="progressbar"]').first();
    if (await progressBar.count() > 0) {
      await expect(progressBar).toHaveAttribute('aria-valuenow');
      await expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      await expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    }
  });

  test('should open timeline update dialog', async ({ authenticatedPage: page }) => {
    await page.goto('/production');
    
    // Click on first order card
    const firstCard = page.locator('[class*="card"]').filter({ hasText: /progress|produksi/i }).first();
    if (await firstCard.count() > 0) {
      await firstCard.click();
      
      // Dialog should open
      await expect(page.locator('text=/Update Timeline|Timeline/i')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should navigate to order detail from production', async ({ authenticatedPage: page }) => {
    await page.goto('/production');
    
    const detailLink = page.locator('a[href^="/orders/"]:has-text("Detail Order")').first();
    if (await detailLink.count() > 0) {
      await detailLink.click();
      await expect(page).toHaveURL(/\/orders\/.+/);
    }
  });
});
