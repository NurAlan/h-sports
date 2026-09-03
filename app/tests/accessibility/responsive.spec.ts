import { test, expect, devices } from '@playwright/test';
import { login } from '../helpers/auth';

/**
 * Responsive Design Tests
 * 
 * Tests:
 * - Mobile breakpoints (< 768px)
 * - Tablet breakpoints (768px - 1024px)
 * - Desktop breakpoints (> 1024px)
 * - Touch target sizes (min 44x44px)
 * - Horizontal overflow
 * - Navigation collapse
 */

test.describe('Responsive Design', () => {
  test('Mobile - should not have horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await login(page, 'wahyunuralan@gmail.com', 'passwords');
    await page.goto('/');
    
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    expect(hasOverflow, 'Should not have horizontal overflow on mobile').toBe(false);
  });

  test('Mobile - bottom navigation should be visible and accessible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await login(page, 'wahyunuralan@gmail.com', 'passwords');
    await page.goto('/');
    
    const bottomNav = page.locator('nav').filter({ hasText: /dashboard|order|inventory/i });
    await expect(bottomNav).toBeVisible();
    
    // Should be fixed at bottom
    const position = await bottomNav.evaluate(el => window.getComputedStyle(el).position);
    expect(position).toBe('fixed');
  });

  test('Mobile - touch targets should be at least 44x44px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await login(page, 'wahyunuralan@gmail.com', 'passwords');
    await page.goto('/');
    
    const interactiveElements = await page.locator('button, a').all();
    const tooSmall: string[] = [];
    
    for (const element of interactiveElements.slice(0, 30)) {
      const box = await element.boundingBox();
      if (box && (box.width < 44 || box.height < 44)) {
        const text = await element.textContent();
        tooSmall.push(`${box.width.toFixed(0)}x${box.height.toFixed(0)} - "${text?.slice(0, 20) || '(no text)'}"`);
      }
    }
    
    if (tooSmall.length > 0) {
      console.log('\n⚠️  Touch targets smaller than 44x44px:');
      tooSmall.forEach(item => console.log(item));
    }
    
    expect(tooSmall, 'All interactive elements should be at least 44x44px').toHaveLength(0);
  });

  test('Mobile - cards should stack vertically', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await login(page, 'wahyunuralan@gmail.com', 'passwords');
    await page.goto('/');
    
    // Check stat cards layout
    const cards = page.locator('[class*="card"]').first();
    const parent = cards.locator('..');
    
    const flexDirection = await parent.evaluate(el => window.getComputedStyle(el).flexDirection);
    const gridColumns = await parent.evaluate(el => window.getComputedStyle(el).gridTemplateColumns);
    
    // Should be column flex or single-column grid
    const isMobileLayout = flexDirection === 'column' || gridColumns === 'none' || !gridColumns.includes(' ');
    
    expect(isMobileLayout, 'Cards should stack vertically on mobile').toBe(true);
  });

  test('Tablet - should show intermediate layout', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await login(page, 'wahyunuralan@gmail.com', 'passwords');
    await page.goto('/');
    
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Desktop - should show full layout', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page, 'wahyunuralan@gmail.com', 'passwords');
    await page.goto('/');
    
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Mobile - FAB should be visible and not obscured', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await login(page, 'wahyunuralan@gmail.com', 'passwords');
    await page.goto('/orders');
    
    const fab = page.locator('button').filter({ hasText: /tambah/i }).first();
    if (await fab.count() > 0) {
      await expect(fab).toBeVisible();
      
      // Should be fixed positioned
      const position = await fab.evaluate(el => window.getComputedStyle(el).position);
      expect(['fixed', 'absolute']).toContain(position);
    }
  });

  test('Mobile - forms should be fully accessible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    
    // All inputs should be visible
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    
    // Should not have horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    expect(hasOverflow).toBe(false);
  });
});
