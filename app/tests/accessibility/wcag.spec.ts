import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

/**
 * Accessibility Tests - WCAG 2.1 AA Compliance
 * 
 * Tests:
 * - Color contrast ratios (4.5:1 for body text, 3:1 for large text)
 * - Focus indicators
 * - Keyboard navigation
 * - ARIA attributes
 * - Form labels
 */

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(rgb1: { r: number; g: number; b: number }, rgb2: { r: number; g: number; b: number }): number {
  const getLuminance = (rgb: { r: number; g: number; b: number }) => {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
      const s = val / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Extract color from CSS color string
 */
function parseColor(colorStr: string): { r: number; g: number; b: number } | null {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
    };
  }
  return null;
}

test.describe('Accessibility - WCAG Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'wahyunuralan@gmail.com', 'passwords');
  });

  test('should have sufficient contrast on all text elements - Dashboard', async ({ page }) => {
    await page.goto('/');
    
    const contrastIssues: string[] = [];
    
    const textElements = await page.locator('p, h1, h2, h3, h4, h5, h6, span, button, a, label').all();
    
    for (const element of textElements.slice(0, 50)) { // Sample first 50
      const text = await element.textContent();
      if (!text || text.trim().length === 0) continue;
      
      const box = await element.boundingBox();
      if (!box) continue;
      
      const fontSize = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return parseFloat(computed.fontSize);
      });
      
      const colors = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
        };
      });
      
      const textColor = parseColor(colors.color);
      const bgColor = parseColor(colors.backgroundColor);
      
      if (!textColor || !bgColor) continue;
      
      // Skip transparent backgrounds
      if (colors.backgroundColor === 'rgba(0, 0, 0, 0)' || colors.backgroundColor === 'transparent') continue;
      
      const ratio = getContrastRatio(textColor, bgColor);
      
      // WCAG AA: 4.5:1 for normal text, 3:1 for large text (18px+ or 14px+ bold)
      const isLargeText = fontSize >= 18;
      const minRatio = isLargeText ? 3 : 4.5;
      
      if (ratio < minRatio) {
        contrastIssues.push(
          `❌ Contrast ${ratio.toFixed(2)}:1 (needs ${minRatio}:1) - "${text.slice(0, 30)}" - ${colors.color} on ${colors.backgroundColor}`
        );
      }
    }
    
    if (contrastIssues.length > 0) {
      console.log('\n❌ Contrast issues found on Dashboard:');
      contrastIssues.forEach(issue => console.log(issue));
    }
    
    expect(contrastIssues, 'All text should meet WCAG AA contrast requirements').toHaveLength(0);
  });

  test('should have focus indicators on interactive elements', async ({ page }) => {
    await page.goto('/');
    
    const interactiveElements = await page.locator('button, a, input, select, textarea').all();
    const missingFocus: string[] = [];
    
    for (const element of interactiveElements.slice(0, 20)) {
      await element.focus();
      
      const outlineStyle = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          outline: computed.outline,
          outlineWidth: computed.outlineWidth,
          outlineStyle: computed.outlineStyle,
          boxShadow: computed.boxShadow,
          border: computed.border,
        };
      });
      
      const hasFocusIndicator = 
        (outlineStyle.outlineWidth !== '0px' && outlineStyle.outlineStyle !== 'none') ||
        outlineStyle.boxShadow.includes('rgb') ||
        outlineStyle.border !== 'none';
      
      if (!hasFocusIndicator) {
        const tagName = await element.evaluate(el => el.tagName);
        const text = await element.textContent();
        missingFocus.push(`${tagName}: "${text?.slice(0, 30) || '(no text)'}"`);
      }
    }
    
    if (missingFocus.length > 0) {
      console.log('\n⚠️  Elements missing focus indicators:');
      missingFocus.forEach(item => console.log(item));
    }
    
    expect(missingFocus, 'Interactive elements should have visible focus indicators').toHaveLength(0);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check if focus is on an interactive element
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tagName: el?.tagName,
        isInteractive: ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el?.tagName || ''),
      };
    });
    
    expect(focused.isInteractive, 'Tab should move focus to interactive elements').toBe(true);
  });

  test('should have proper ARIA attributes on interactive components', async ({ page }) => {
    await page.goto('/orders');
    
    // Check FAB has proper label
    const fab = page.locator('button').filter({ hasText: /tambah/i }).first();
    if (await fab.count() > 0) {
      const ariaLabel = await fab.getAttribute('aria-label');
      expect(ariaLabel || await fab.textContent()).toBeTruthy();
    }
  });

  test('should have labels on all form inputs', async ({ page }) => {
    await page.goto('/login');
    
    const inputs = await page.locator('input').all();
    const unlabeledInputs: string[] = [];
    
    for (const input of inputs) {
      const hasLabel = await input.evaluate(el => {
        const inputEl = el as HTMLInputElement;
        // Check for associated label
        if (inputEl.labels && inputEl.labels.length > 0) return true;
        // Check for aria-label
        if (inputEl.getAttribute('aria-label')) return true;
        // Check for aria-labelledby
        if (inputEl.getAttribute('aria-labelledby')) return true;
        // Check for placeholder (fallback, not ideal)
        if (inputEl.placeholder) return true;
        return false;
      });
      
      if (!hasLabel) {
        const type = await input.getAttribute('type');
        const name = await input.getAttribute('name');
        unlabeledInputs.push(`input[type="${type}"][name="${name}"]`);
      }
    }
    
    expect(unlabeledInputs, 'All inputs should have labels or aria-label').toHaveLength(0);
  });
});
