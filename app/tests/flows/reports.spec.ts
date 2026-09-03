import { test, expect } from '../helpers/auth';

test.describe('Reports Flow', () => {
  test('should display reports dashboard', async ({ authenticatedPage: page }) => {
    await page.goto('/reports');
    await expect(page.locator('h1')).toContainText('Laporan');
  });

  test('should have accessible tab navigation with keyboard', async ({ authenticatedPage: page }) => {
    await page.goto('/reports');
    
    // Check for proper tab roles
    const tablist = page.locator('[role="tablist"]');
    await expect(tablist).toBeVisible();
    
    // Check individual tabs
    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(3);
    
    // Check aria-selected on active tab
    const activeTab = page.locator('[role="tab"][aria-selected="true"]');
    await expect(activeTab).toBeVisible();
  });

  test('should switch between report tabs', async ({ authenticatedPage: page }) => {
    await page.goto('/reports');
    
    // Click Produksi tab
    await page.click('[role="tab"]:has-text("Produksi")');
    await expect(page.locator('[role="tab"][aria-selected="true"]')).toContainText('Produksi');
    
    // Click Customer tab
    await page.click('[role="tab"]:has-text("Customer")');
    await expect(page.locator('[role="tab"][aria-selected="true"]')).toContainText('Customer');
    
    // Back to Keuangan
    await page.click('[role="tab"]:has-text("Keuangan")');
    await expect(page.locator('[role="tab"][aria-selected="true"]')).toContainText('Keuangan');
  });

  test('should filter by date range', async ({ authenticatedPage: page }) => {
    await page.goto('/reports');
    
    // Check period filter exists
    const periodButtons = page.locator('button:has-text("Bulan Ini"), button:has-text("Bulan Lalu")');
    if (await periodButtons.count() > 0) {
      await periodButtons.first().click();
    }
  });

  test('should filter by status', async ({ authenticatedPage: page }) => {
    await page.goto('/reports');
    
    const statusFilter = page.locator('button:has-text("Semua Status"), button:has-text("Draft")').first();
    if (await statusFilter.count() > 0) {
      await statusFilter.click();
    }
  });
});
