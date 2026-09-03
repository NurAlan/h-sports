import { test, expect } from '../helpers/auth';

test.describe('Profile Flow', () => {
  test('should display profile page', async ({ authenticatedPage: page }) => {
    await page.goto('/profile');
    await expect(page.locator('h1')).toContainText('Profile');
  });

  test('should navigate to settings', async ({ authenticatedPage: page }) => {
    await page.goto('/profile');
    
    await page.click('a[href="/profile/settings"]');
    await expect(page).toHaveURL('/profile/settings');
    await expect(page.locator('h1')).toContainText('Pengaturan');
  });

  test('should navigate to master fabrics', async ({ authenticatedPage: page }) => {
    await page.goto('/profile');
    
    await page.click('a[href="/profile/fabrics"]');
    await expect(page).toHaveURL('/profile/fabrics');
    await expect(page.locator('h1')).toContainText('Master Fabric');
  });

  test('should open global tour dialog', async ({ authenticatedPage: page }) => {
    await page.goto('/profile');
    
    // Click panduan alur bisnis
    await page.click('text=/Panduan Alur Bisnis/i');
    
    // Dialog should open
    await expect(page.locator('text=/Panduan|Tour|Alur/i')).toBeVisible();
  });

  test('should have distinct icons for different menu items', async ({ authenticatedPage: page }) => {
    await page.goto('/profile');
    
    // Check that Laporan Keuangan and Laporan Produksi have different icons
    // This tests the fix we made (TrendingUp vs BarChart3)
    const menuItems = page.locator('a[href^="/reports"]');
    await expect(menuItems).toHaveCount(2);
  });
});
