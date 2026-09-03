import { test, expect } from '../helpers/auth';

test.describe('Orders Flow', () => {
  test('should display orders dashboard', async ({ authenticatedPage: page }) => {
    await page.goto('/orders');
    await expect(page.locator('h1')).toContainText('Order');
  });

  test('should create new order via FAB', async ({ authenticatedPage: page }) => {
    await page.goto('/orders');
    
    // Click FAB
    await page.click('button[aria-label="Tambah Pembelian Kain"], button:has-text("Tambah")');
    
    // Fill order form
    await page.fill('input[name="customerName"], input#customerName', 'Test Customer');
    await page.fill('input[name="quantity"], input#quantity', '100');
    await page.fill('input[type="date"]', '2025-12-31');
    
    // Submit
    await page.click('button[type="submit"]:has-text("Buat Order")');
    
    // Should show success toast
    await expect(page.locator('text=/berhasil dibuat/i')).toBeVisible({ timeout: 5000 });
  });

  test('should filter orders by status', async ({ authenticatedPage: page }) => {
    await page.goto('/orders');
    
    // Click status filter
    const statusButton = page.locator('button:has-text("Draft"), button:has-text("Produksi")').first();
    await statusButton.click();
    
    // Should filter results
    await page.waitForTimeout(500);
  });

  test('should search orders', async ({ authenticatedPage: page }) => {
    await page.goto('/orders');
    
    const searchInput = page.locator('input[placeholder*="Cari"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await page.waitForTimeout(300);
    }
  });

  test('should navigate to order detail', async ({ authenticatedPage: page }) => {
    await page.goto('/orders');
    
    // Click first order card
    const firstOrder = page.locator('a[href^="/orders/"]').first();
    if (await firstOrder.count() > 0) {
      await firstOrder.click();
      await expect(page).toHaveURL(/\/orders\/.+/);
    }
  });

  test('should delete order via dialog', async ({ authenticatedPage: page }) => {
    await page.goto('/orders');
    
    // Click delete button on first order
    const deleteButton = page.locator('button:has(svg)').filter({ hasText: /hapus/i }).first();
    if (await deleteButton.count() > 0) {
      await deleteButton.click();
      
      // Confirm deletion in dialog
      await page.click('button:has-text("Ya, Hapus")');
      
      // Should show success
      await expect(page.locator('text=/berhasil dihapus/i')).toBeVisible({ timeout: 5000 });
    }
  });
});
