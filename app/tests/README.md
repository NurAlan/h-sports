# H-Sport Test Suite

Comprehensive Playwright test suite for H-Sport application covering functional flows, visual regression, accessibility, and responsive design.

## Test Structure

```
tests/
├── auth/               # Authentication flows
│   └── login.spec.ts
├── flows/              # Main application flows
│   ├── orders.spec.ts
│   ├── production.spec.ts
│   ├── inventory.spec.ts
│   ├── reports.spec.ts
│   └── profile.spec.ts
├── visual/             # Visual regression tests
│   └── color-harmony.spec.ts  # 🎨 Detects clashing colors (orange+blue, etc)
├── accessibility/      # WCAG & responsive tests
│   ├── wcag.spec.ts
│   └── responsive.spec.ts
└── helpers/
    └── auth.ts         # Authentication utilities
```

## Running Tests

### All Tests
```bash
npm test
```

### Test UI (Interactive Mode)
```bash
npm run test:ui
```

### Specific Test Suites
```bash
# Authentication tests
npm run test:auth

# Functional flow tests
npm run test:flows

# Visual regression tests (color harmony detection)
npm run test:visual

# Accessibility tests
npm run test:a11y

# Color harmony only (detects orange+blue clashes)
npm run test:color-harmony
```

### Debugging
```bash
# Run with browser visible
npm run test:headed

# Debug mode (step through tests)
npm run test:debug

# View last test report
npm run test:report
```

## Test Coverage

### 1. Authentication (`tests/auth/`)
- ✅ Login with valid credentials
- ✅ Error handling for invalid credentials
- ✅ Form validation
- ✅ Password visibility toggle
- ✅ Logout flow

### 2. Functional Flows (`tests/flows/`)

#### Orders
- ✅ Display orders dashboard
- ✅ Create new order via FAB
- ✅ Filter by status
- ✅ Search functionality
- ✅ Navigate to order detail
- ✅ Delete order with confirmation dialog

#### Production
- ✅ Display production dashboard
- ✅ Progress bars with proper ARIA attributes
- ✅ Timeline update dialog
- ✅ Navigation to order details

#### Inventory
- ✅ Display inventory dashboard
- ✅ Search inventory items
- ✅ Navigate to fabric details
- ✅ Add fabric purchase dialog
- ✅ Delete fabric with confirmation

#### Reports
- ✅ Display reports dashboard
- ✅ **Accessible tab navigation** (role="tablist", aria-selected)
- ✅ Switch between report tabs
- ✅ Date range filtering
- ✅ Status filtering

#### Profile
- ✅ Display profile page
- ✅ Navigate to settings
- ✅ Navigate to master fabrics
- ✅ Open global tour dialog
- ✅ Verify distinct icons (no duplicates)

### 3. Visual Regression (`tests/visual/`)

#### 🎨 Color Harmony Detection
Automatically detects **clashing color combinations**:

- 🚨 **Orange + Blue** (highly visible clash)
- 🚨 **Red + Green** (accessibility concern)
- ⚠️  **Complementary colors** with high saturation
- ⚠️  **Opposite hues** (150-210° apart on color wheel)

**How it works:**
1. Extracts all colors from buttons, badges, cards, text
2. Calculates RGB distances and HSV hue differences
3. Detects specific problematic combinations
4. Reports exact hex values and element types

**Example output:**
```
❌ Color clashes detected on Dashboard:
🚨 ORANGE + BLUE CLASH: #FF8C00 (button.primary) + #1E90FF (badge.status)
⚠️  COMPLEMENTARY CLASH: #D97706 (card.bg) + #0EA5E9 (text.accent)
```

### 4. Accessibility (`tests/accessibility/`)

#### WCAG Compliance
- ✅ **Color contrast ratios** (4.5:1 for body, 3:1 for large text)
- ✅ **Focus indicators** on interactive elements
- ✅ **Keyboard navigation** (Tab key flow)
- ✅ **ARIA attributes** (labels, roles, states)
- ✅ **Form labels** on all inputs

#### Responsive Design
- ✅ **No horizontal overflow** on mobile
- ✅ **Bottom navigation** visibility
- ✅ **Touch targets** (min 44x44px)
- ✅ **Card stacking** on mobile
- ✅ **FAB positioning**
- ✅ **Form accessibility** across breakpoints

## Test Credentials

```
Email: wahyunuralan@gmail.com
Password: passwords
```

## Configuration

Tests are configured in `playwright.config.ts`:

- **Base URL:** `http://localhost:3000`
- **Browser:** Chromium (desktop) + iPhone 13 (mobile)
- **Retries:** 2 (CI only)
- **Video:** Retained on failure
- **Screenshots:** On failure only
- **Dev Server:** Auto-starts before tests

## CI/CD Integration

The test suite is ready for CI/CD:

```yaml
# Example GitHub Actions
- name: Install dependencies
  run: npm ci && npx playwright install --with-deps chromium

- name: Run tests
  run: npm test

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Writing New Tests

### Use the auth helper
```typescript
import { test, expect } from '../helpers/auth';

test('my test', async ({ authenticatedPage: page }) => {
  // Already logged in!
  await page.goto('/orders');
  // ...
});
```

### Color harmony tests
Add new pages to color harmony suite:
```typescript
test('New page - should not have clashing colors', async ({ page }) => {
  await page.goto('/new-page');
  
  const colors = await extractColors(page, 'button, .badge, .card');
  const clashes = detectClashingCombinations(colors);
  
  expect(clashes).toHaveLength(0);
});
```

## Known Issues & Fixes Applied

✅ **Fixed:** Hard-coded dates 2026 in reports  
✅ **Fixed:** `window.location.reload()` after order creation  
✅ **Fixed:** `window.confirm()` → proper dialog confirmations  
✅ **Fixed:** Missing ARIA attributes on progress bars  
✅ **Fixed:** Tab navigation without proper roles  
✅ **Fixed:** Duplicate icons in profile menu  
✅ **Fixed:** Missing reduced-motion guards on animations  
✅ **Fixed:** Inconsistent color usage (green vs emerald)  

## Next Steps

1. Run the full test suite: `npm test`
2. Check color harmony specifically: `npm run test:color-harmony`
3. Review HTML report: `npm run test:report`
4. Fix any detected color clashes
5. Integrate into CI/CD pipeline

---

**Note:** The color harmony tests will **fail** if orange+blue or other clashing combinations are detected. This is intentional - fix the colors, don't skip the test.
