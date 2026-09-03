import { test, expect } from '../helpers/auth';

test.describe('Inventory Flow', () => {
  test('should display inventory dashboard', async ({ authenticatedPage: page }) => {
    await page.goto('/inventory');
    await expect(page.locator('h1')).toContainText('Inventory');
  });

  test('should search inventory items', async ({ authenticatedPage: page }) => {
    await page.goto('/inventory');
    
    const searchInput = page.locator('input[placeholder*="Cari"]');
    await searchInput.fill('kain');
    await page.waitForTimeout(300);
  });

  test('should navigate to fabric detail', async ({ authenticatedPage: page }) => {
    await page.goto('/inventory');
    
    const firstFabric = page.locator('a[href^="/inventory/"]').first();
    if (await firstFabric.count() > 0) {
      await firstFabric.click();
      await expect(page).toHaveURL(/\/inventory\/.+/);
    }
  });

  test('should open add fabric purchase dialog', async ({ authenticatedPage: page }) => {
    await page.goto('/inventory');
    
    // Click FAB
    await page.click('button:has-text("Tambah Pembelian Kain")');
    
    // Dialog should open
    await expect(page.locator('text=/Tambah Pembelian|Purchase/i')).toBeVisible();
  });

  test('should delete fabric via dialog (not confirm)', async ({ authenticatedPage: page }) => {
    await page.goto('/inventory');
    
    // Click delete on first fabric
    const deleteButton = page.locator('button[aria-label*="hapus"], button:has(svg)').filter({ hasText: /trash|hapus/i }).first();
    if (await deleteButton.count() > 0) {
      await deleteButton.click();
      
      // Should show dialog
      await expect(page.locator('text=/Hapus Kain|Delete/i')).toBeVisible();
      
      // Cancel instead of deleting
      await page.click('button:has-text("Batal")');
    }
  });
});
