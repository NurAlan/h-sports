import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form
    await page.fill('input[type="email"]', 'wahyunuralan@gmail.com');
    await page.fill('input[type="password"]', 'passwords');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await page.waitForURL('/');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error toast
    await expect(page.locator('text=/Email atau password salah|Gagal login/i')).toBeVisible();
  });

  test('should require both email and password', async ({ page }) => {
    await page.goto('/login');
    
    await page.click('button[type="submit"]');
    
    // Form validation should prevent submission
    await expect(page).toHaveURL('/login');
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');
    
    const passwordInput = page.locator('input[type="password"]');
    const toggleButton = page.locator('button:has(svg)').filter({ has: page.locator('svg') }).first();
    
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    await toggleButton.click();
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wahyunuralan@gmail.com');
    await page.fill('input[type="password"]', 'passwords');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Navigate to profile
    await page.goto('/profile');
    
    // Logout
    await page.click('button:has-text("Logout")');
    
    // Should redirect to login
    await page.waitForURL('/login');
  });
});
