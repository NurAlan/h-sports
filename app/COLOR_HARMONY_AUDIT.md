# H-Sport Color Harmony Audit
**Date:** 2024
**Scope:** Dashboard → Production → Orders → Inventory

## Executive Summary

**Status:** ❌ **MULTIPLE COLOR CLASHES DETECTED**

The application uses **inconsistent color systems** across pages, creating visual confusion and cognitive load. Major issues:

1. **Blue/Sky color conflict** - `sky-*` and `blue-*` used interchangeably
2. **Teal intrusion** - Production uses `teal-600` for progress bars (no other page uses teal)
3. **Violet vs Purple** - Orders page uses `violet-*` (unique to that page)
4. **Green inconsistency** - Mix of `emerald-*` and `green-*` throughout

---

## Color Palette Analysis

### Dashboard (app/page.tsx)
**Colors used:**
- ✅ **Stone** (neutral base) - `stone-*` - CONSISTENT
- ✅ **Amber** - `amber-50`, `amber-600` (CTA button) - CONSISTENT  
- ❌ **Teal** - `bg-teal-50` (icon background) - INCONSISTENT (only here + Production)
- ❌ **Sky** - `bg-sky-50` (icon background) - INCONSISTENT (conflicts with Orders' sky-600/700)
- ✅ **Red** - `red-50`, `red-100`, `red-200`, `red-600` (alerts, overdue) - CONSISTENT
- ✅ **Emerald** - Implied for success states - CONSISTENT

**Issues:**
1. Dashboard uses **`bg-teal-50`** and **`bg-sky-50`** for icon backgrounds - these are too close to each other and conflict with Production/Orders
2. Button uses `amber-600` but no other amber usage on dashboard (except the icon bg)

---

### Production (app/production/page.tsx)
**Colors used:**
- ✅ **Emerald** - `emerald-50/200/500/600/700` (shipped, completed) - CONSISTENT
- ✅ **Red** - `red-50/200/600/700` (overdue) - CONSISTENT
- ✅ **Orange** - `orange-50/200/500/700` (urgent deadline) - CONSISTENT
- ✅ **Amber** - `amber-50/200/500/700` (warning deadline) - CONSISTENT
- ❌ **Sky** - `sky-600/700`, `bg-sky-50 border-sky-200` (in_progress stage) - INCONSISTENT
- ❌ **Teal** - `bg-teal-600` (progress bar 50-74%) - **MAJOR CLASH**
- ✅ **Stone** - `stone-100/200/300/400` (neutral, default) - CONSISTENT

**Issues:**
1. **TEAL INTRUSION:** Progress bars use `bg-teal-600` for 50-74% completion. NO OTHER PAGE uses teal except Dashboard's tiny icon bg. This creates a jarring visual break.
2. **Sky usage:** `sky-600` for in_progress conflicts with Orders page which uses `sky-50/200/600/700` extensively
3. **Progress bar color logic:**
   - 75%+ → `emerald-500` ✅
   - 50-74% → `teal-600` ❌ (should be `emerald-400` or `amber-500`)
   - 25-49% → `amber-500` ✅
   - 0-24% → `stone-400` ✅

---

### Orders (app/orders/page.tsx)
**Colors used:**
- ✅ **Stone** - `stone-100/200/300/600` (draft status, neutral) - CONSISTENT
- ❌ **Sky** - `sky-50/200/600/700` (in_production status) - CONFLICTS WITH PRODUCTION
- ❌ **Violet** - `violet-50/200/600/700` (QC status) - **UNIQUE TO ORDERS ONLY**
- ✅ **Emerald** - `emerald-50/200/500/600/700` (shipped/completed) - CONSISTENT
- ✅ **Red** - `red-50/200/600/700` (overdue, delete actions) - CONSISTENT
- ✅ **Orange** - `orange-50/200/500/700` (urgent deadline) - CONSISTENT
- ✅ **Amber** - `amber-50/200/700` (warning deadline) - CONSISTENT

**Issues:**
1. **VIOLET INTRUSION:** QC status uses `violet-50/200/600/700`. Violet appears NOWHERE else in the app. This should use a color already in the palette.
2. **Sky overload:** in_production status uses full sky range, conflicts with Production page's sky usage

**Status config:**
```tsx
draft: bg-stone-100 text-stone-600 border-stone-300        // ✅ OK
in_production: bg-sky-50 text-sky-700 border-sky-200       // ❌ CLASH
qc: bg-violet-50 text-violet-700 border-violet-200         // ❌ ISOLATED COLOR
shipped: bg-emerald-50 text-emerald-700 border-emerald-200 // ✅ OK
```

---

### Inventory (app/inventory/page.tsx)
**Colors used:**
- ✅ **Stone** - `stone-100/200/400/50` (neutral, cards) - CONSISTENT
- ✅ **Red** - `red-50/200/300/400/600/700` (low stock alerts, delete) - CONSISTENT

**Issues:**
- ✅ **NO COLOR CLASHES** - Inventory is the cleanest page
- Uses only stone (neutral) and red (alerts/danger)
- However, lacks visual variety compared to other pages

---

## lib/status-config.ts Analysis

**Config file uses DIFFERENT colors than pages:**

```tsx
ORDER_STATUS: {
  draft: "bg-secondary text-secondary-foreground"          // ✅ Neutral
  in_production: "bg-blue-100 text-blue-700"               // ❌ USES BLUE (pages use SKY)
  qc: "bg-amber-100 text-amber-700"                        // ❌ MISMATCH (pages use VIOLET)
  shipped: "bg-green-100 text-green-700"                   // ❌ USES GREEN (pages use EMERALD)
}
```

**CRITICAL ISSUES:**
1. Config says `blue-*` but pages use `sky-*`
2. Config says `amber-*` for QC but Orders page uses `violet-*`
3. Config says `green-*` but pages use `emerald-*`

This config appears **unused** or **out of sync** with actual implementation.

---

## Color Clash Map

| Color Family | Dashboard | Production | Orders | Inventory | Status |
|-------------|-----------|------------|--------|-----------|---------|
| **stone** (neutral) | ✅ Primary | ✅ Primary | ✅ Primary | ✅ Primary | ✅ CONSISTENT |
| **red** (danger/overdue) | ✅ Alerts | ✅ Overdue | ✅ Overdue | ✅ Low stock | ✅ CONSISTENT |
| **emerald** (success) | ✅ Implied | ✅ Shipped | ✅ Shipped | - | ✅ CONSISTENT |
| **amber** (warning) | ⚠️ Button only | ✅ Warning deadline | ✅ Warning deadline | - | ⚠️ UNDERUSED |
| **orange** (urgent) | - | ✅ Urgent deadline | ✅ Urgent deadline | - | ✅ CONSISTENT |
| **sky** (in progress) | ❌ Icon bg | ❌ In progress | ❌ In production | - | ❌ **CLASH** |
| **teal** | ❌ Icon bg | ❌ Progress bar | - | - | ❌ **CLASH** |
| **violet** | - | - | ❌ QC status | - | ❌ **ISOLATED** |
| **blue** (config) | - | - | - | - | ❌ **UNUSED** |
| **green** (config) | - | - | - | - | ❌ **UNUSED** |

---

## Specific Color Conflicts

### 1. **Sky vs Blue Confusion**
- **Production:** Uses `sky-600/700` for in_progress stages
- **Orders:** Uses `sky-50/200/600/700` for in_production status
- **Dashboard:** Uses `sky-50` for icon backgrounds
- **Problem:** Sky is overloaded across 3 contexts (icon, stage, status)
- **Config says:** `blue-100/700` (but nobody uses it)

### 2. **Teal Intrusion**
- **Production:** Uses `teal-600` for 50-74% progress bars
- **Dashboard:** Uses `teal-50` for one icon background
- **Problem:** Teal appears in only 2 places, both minor. Creates visual noise.
- **Solution:** Remove teal entirely, use existing colors

### 3. **Violet Isolation**
- **Orders:** Uses `violet-*` for QC status ONLY
- **Problem:** Violet appears nowhere else. User learns a color that's useless elsewhere.
- **Config says:** `amber-100/700` for QC (but page ignores it)

### 4. **Emerald vs Green**
- **Pages:** Use `emerald-*` consistently
- **Config:** Says `green-100/700`
- **Problem:** Naming inconsistency, config ignored

---

## Recommended Color System

### Core Palette (MUST USE ONLY THESE)

1. **Stone** (`stone-*`) - Neutral base, cards, disabled states
2. **Red** (`red-*`) - Danger, overdue, delete, critical alerts
3. **Orange** (`orange-*`) - Urgent (≤1 day deadline)
4. **Amber** (`amber-*`) - Warning (2-3 days deadline), CTAs
5. **Emerald** (`emerald-*`) - Success, completed, shipped, safe
6. **Indigo** (`indigo-*`) - NEW: In progress states (replace sky/blue)

### Banned Colors
- ❌ **Sky** - remove entirely (replace with indigo)
- ❌ **Teal** - remove entirely (replace with emerald/amber)
- ❌ **Violet** - remove entirely (replace with indigo)
- ❌ **Blue** - already unused, keep it that way
- ❌ **Green** - replace with emerald

---

## Proposed Fixes

### Fix 1: Standardize "In Progress" Color
**Current:**
- Production: `sky-600/700` for in_progress stages
- Orders: `sky-50/200/600/700` for in_production status

**Fix:** Use **`indigo-*`** for ALL in-progress states
```tsx
// Production
case "in_progress":
  return <Clock className="h-4 w-4 text-indigo-600 motion-safe:animate-pulse" />;

// Orders statusConfig
in_production: {
  badgeClass: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  iconClass: "bg-indigo-600 text-white",
  textClass: "text-indigo-700",
}
```

### Fix 2: Remove Teal from Progress Bars
**Current:**
```tsx
function getProgressColor(pct: number) {
  if (pct >= 75) return "bg-emerald-500";
  if (pct >= 50) return "bg-teal-600";        // ❌ TEAL
  if (pct >= 25) return "bg-amber-500";
  return "bg-stone-400";
}
```

**Fix:** Progressive emerald scale
```tsx
function getProgressColor(pct: number) {
  if (pct >= 75) return "bg-emerald-500";      // ✅ Success
  if (pct >= 50) return "bg-emerald-400";      // ✅ Good progress
  if (pct >= 25) return "bg-amber-500";        // ⚠️ Warning
  return "bg-stone-400";                       // Minimal
}
```

### Fix 3: Replace Violet with Indigo
**Current:**
```tsx
qc: {
  badgeClass: "bg-violet-50 text-violet-700 border border-violet-200",  // ❌ VIOLET
  iconClass: "bg-violet-600 text-white",
  textClass: "text-violet-700",
}
```

**Fix:**
```tsx
qc: {
  badgeClass: "bg-indigo-50 text-indigo-700 border border-indigo-200",   // ✅ INDIGO
  iconClass: "bg-indigo-600 text-white",
  textClass: "text-indigo-700",
}
```

### Fix 4: Remove Sky/Teal from Dashboard Icons
**Current:**
```tsx
iconColorClass="bg-teal-50"  // ❌ TEAL
iconColorClass="bg-sky-50"   // ❌ SKY
iconColorClass="bg-amber-50" // ✅ OK
```

**Fix:** Use semantic colors that match the card purpose
```tsx
// Orders card → use indigo (matches in_production)
iconColorClass="bg-indigo-50"

// Production card → use amber (matches warning/active work)
iconColorClass="bg-amber-50"

// Overdue card → keep red
iconColorClass="bg-red-100"
```

### Fix 5: Update status-config.ts
```tsx
export const ORDER_STATUS: Record<string, StatusConfig> = {
  draft: { 
    label: "Draft", 
    className: "bg-stone-100 text-stone-600 border border-stone-300" 
  },
  in_production: { 
    label: "Produksi", 
    className: "bg-indigo-50 text-indigo-700 border border-indigo-200"  // ✅ INDIGO
  },
  qc: { 
    label: "QC", 
    className: "bg-indigo-50 text-indigo-700 border border-indigo-200"  // ✅ INDIGO
  },
  shipped: { 
    label: "Selesai", 
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200"  // ✅ EMERALD
  },
};
```

---

## Color Usage Rules (Enforce Going Forward)

### Semantic Mapping
1. **Stone** - Draft, neutral, disabled, placeholder
2. **Red** - Overdue, danger, delete, critical
3. **Orange** - Urgent deadline (≤1 day)
4. **Amber** - Warning deadline (2-3 days), CTAs, active work
5. **Emerald** - Success, completed, shipped, safe, high progress
6. **Indigo** - In progress, QC, active processing

### Deadline Color Logic (MUST BE CONSISTENT)
```tsx
// Border-left accent on cards
if (isShipped) return "border-l-emerald-500";
if (days < 0) return "border-l-red-600";       // Overdue
if (days <= 1) return "border-l-orange-500";   // Urgent
if (days < 3) return "border-l-amber-500";     // Warning
return "border-l-stone-400";                   // Safe

// Badge backgrounds
if (isShipped) return "bg-emerald-50 text-emerald-700 border-emerald-200";
if (days < 0) return "bg-red-50 text-red-700 border-red-200";
if (days <= 1) return "bg-orange-50 text-orange-700 border-orange-200";
if (days < 3) return "bg-amber-50 text-amber-700 border-amber-200";
return "bg-stone-100 text-stone-600 border-stone-200";
```

### Progress Bar Logic (MUST BE CONSISTENT)
```tsx
if (pct >= 75) return "bg-emerald-500";   // Success zone
if (pct >= 50) return "bg-emerald-400";   // Good progress
if (pct >= 25) return "bg-amber-500";     // Warning zone
return "bg-stone-400";                    // Minimal progress
```

---

## Visual Hierarchy Impact

### Before (Current State)
- User sees: stone, red, orange, amber, emerald, **sky**, **teal**, **violet**
- **8 color families** across 4 pages
- Cognitive load: HIGH
- Visual consistency: BROKEN

### After (Proposed)
- User sees: stone, red, orange, amber, emerald, **indigo**
- **6 color families** across 4 pages
- Cognitive load: REDUCED
- Visual consistency: STRONG

---

## Testing Checklist

After fixes, verify:

- [ ] Dashboard stat cards use only: stone, red, amber, indigo, emerald
- [ ] Production page uses only: stone, red, orange, amber, emerald, indigo
- [ ] Orders page uses only: stone, red, orange, amber, emerald, indigo
- [ ] Inventory page uses only: stone, red
- [ ] NO instances of: `sky-*`, `teal-*`, `violet-*`, `blue-*`, `green-*`
- [ ] Progress bars use: emerald-500/400, amber-500, stone-400
- [ ] In-progress states use: indigo-50/200/600/700 consistently
- [ ] Deadline badges use consistent 5-tier system
- [ ] status-config.ts matches actual page implementations

---

## Priority

**P0 - Critical:**
1. Remove teal from progress bars (Production)
2. Replace violet with indigo (Orders QC status)
3. Replace sky with indigo (Production + Orders in_progress)

**P1 - High:**
4. Update Dashboard icon backgrounds (remove teal/sky)
5. Sync status-config.ts with actual colors

**P2 - Medium:**
6. Add visual regression tests for color consistency

---

## Files to Modify

1. `app/app/page.tsx` - Dashboard icon backgrounds
2. `app/app/production/page.tsx` - Progress bar colors, stage icons
3. `app/app/orders/page.tsx` - Status config object
4. `app/lib/status-config.ts` - ORDER_STATUS definitions
5. `app/tests/visual/color-harmony.spec.ts` - Update detection rules

---

**End of Audit**
