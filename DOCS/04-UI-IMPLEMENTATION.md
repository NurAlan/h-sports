# H-Sport: UI Implementation Documentation

**Tech Stack:** Next.js 14 + TypeScript + Tailwind CSS v4 + shadcn/ui  
**Design System:** Bookify-style (clean white, vibrant blue, pastel accents)  
**Status:** ✅ Prototype dengan dummy data (UI-only, belum ada API)

---

## Design System

### Color Palette (CSS Variables)

```css
/* Primary */
--primary: oklch(0.55 0.22 250);        /* Vibrant blue #2563EB-ish */
--primary-foreground: oklch(1 0 0);     /* White on blue */

/* Background */
--background: oklch(1 0 0);             /* Pure white */
--foreground: oklch(0.2 0 0);           /* Dark text */

/* Card */
--card: oklch(1 0 0);                   /* White cards */
--border: oklch(0.93 0 0);              /* Very subtle gray border */

/* Semantic Colors */
--success: oklch(0.85 0.12 160);        /* Mint green pastel */
--warning: oklch(0.85 0.12 40);         /* Peach/coral pastel */
--destructive: oklch(0.577 0.245 27.325); /* Red */

/* Border Radius */
--radius: 0.75rem;                      /* 12px rounded corners */
```

### Typography

- **Font:** Inter (via next/font/google)
- **Heading:** 2xl (24px) bold
- **Body:** sm (14px) medium
- **Label:** xs (12px) text-muted-foreground

### Component Style

- **Cards:** White background, rounded corners (12px), subtle border, **no heavy shadow** (flat design)
- **Buttons:** Primary blue, rounded, clean
- **Badges:** Pastel backgrounds (blue/green/yellow) dengan text colored
- **Icons:** Line icons (Lucide React, strokeWidth 2)

---

## Folder Structure

```
/hsport
├── /DOCS                   # Business requirements, schema, design decisions
├── /app                    # Next.js application
│   ├── /app                # Pages (App Router)
│   │   ├── layout.tsx      # Root layout (Bottom Nav)
│   │   ├── page.tsx        # Dashboard (Home)
│   │   ├── /orders
│   │   │   └── page.tsx    # Orders list
│   │   ├── /inventory
│   │   │   └── page.tsx    # Inventory (stok kain)
│   │   ├── /production
│   │   │   └── page.tsx    # Production timeline
│   │   └── /reports
│   │       └── page.tsx    # Reports (profit, trends)
│   ├── /components
│   │   ├── bottom-nav.tsx  # Fixed bottom navigation
│   │   ├── page-header.tsx # Reusable page header
│   │   └── /ui             # shadcn/ui base components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── badge.tsx
│   │       ├── input.tsx
│   │       └── ...
│   ├── /lib
│   │   └── utils.ts        # cn() helper (classnames merge)
│   ├── globals.css         # Tailwind + design tokens
│   └── package.json
```

---

## Pages Implemented

### 1. **Dashboard (Home)** — `/`

**Purpose:** Overview bisnis hari ini

**Sections:**
- **Stats Cards** (3 cards):
  - Stok Kain (127.5 kg, +12.3 kg minggu ini)
  - Profit Bulan Ini (Rp 8,450,000, Margin 23.5%)
  - Order Aktif (7 order, 2 di stage QC)
  
- **Order Terbaru** (list):
  - Order ID, customer, qty, status badge, stage, profit
  
- **Stok Menipis** (alert card):
  - Kain dengan stok < reorder point (warning background)

**Dummy Data:**
- 3 stats
- 3 recent orders
- 2 low-stock fabrics

---

### 2. **Orders** — `/orders`

**Purpose:** Daftar pesanan kaos

**Features:**
- **Action Button:** Floating Add button (top-right, primary blue)
- **Order Cards:**
  - Order ID + status badge (Draft/Produksi/QC/Terkirim)
  - Customer name
  - Qty (pcs) + order date
  - Profit (green text)
  - Stage indicator

**Dummy Data:**
- 4 orders (draft, in_production, qc, shipped)

---

### 3. **Inventory** — `/inventory`

**Purpose:** Stok kain & pembelian

**Features:**
- **Action Button:** Add new fabric purchase
- **Fabric Cards:**
  - Fabric name + low-stock icon (warning jika <= reorder point)
  - Avg price per kg
  - Last purchase date
  - Stock qty (large, bold)
  - Reorder badge (jika low stock)

**Dummy Data:**
- 4 fabrics (Cotton 30s, Polyester, Cotton 24s, Spandex)
- 2 low-stock items (warning background)

---

### 4. **Production** — `/production`

**Purpose:** Timeline produksi order

**Features:**
- **Order Cards** dengan stage timeline:
  - Order ID + customer
  - 5 stages: Pengukuran → Pemotongan → Jahit → Finishing → QC
  - Stage status icons:
    - ✅ Completed (green)
    - 🕐 In Progress (blue)
    - ⭕ Not Started (gray)
  - Duration/estimasi per stage
  - Status badge (Selesai/Sedang Dikerjakan/Belum Dimulai)

**Dummy Data:**
- 2 active orders dengan progress berbeda

---

### 5. **Reports** — `/reports`

**Purpose:** Laporan profit & trends

**Sections:**
- **Summary Cards** (2 small cards):
  - Total Order bulan ini (12)
  - Total Omzet (Rp 18.45jt)

- **Gross Profit Card** (gradient primary):
  - Profit (Rp 4.33jt)
  - Margin % (23.5%)
  - Trend (+5.4%)
  - Breakdown: HPP vs Revenue

- **Monthly Trend** (4 bulan):
  - Bulan, profit, margin, revenue

- **Top Fabrics Usage**:
  - Fabric name, usage (kg), cost

**Dummy Data:**
- Summary: 12 orders, Rp 18.45jt revenue, Rp 4.33jt profit
- 4 months trend
- 3 top fabrics

---

## Bottom Navigation

**Fixed position** (bottom: 0, z-50)

**Menu Items:**
1. **Home** (🏠) → `/`
2. **Orders** (📦) → `/orders`
3. **Inventory** (📊) → `/inventory`
4. **Production** (⚙️) → `/production`
5. **Reports** (📈) → `/reports`

**Behavior:**
- Active state: primary blue color + bold icon
- Inactive: muted gray
- Line icons (Lucide React)
- Label text below icon (xs)

---

## Reusable Components

### `<PageHeader>`
```tsx
<PageHeader
  title="Dashboard"
  subtitle="Overview bisnis hari ini"
  action={<Button>Add</Button>}  // optional
/>
```

### `<BottomNav>`
- Auto-detect active route via `usePathname()`
- Fixed bottom position
- Max-width 512px (mobile-optimized)

### shadcn/ui Components Used
- `<Button>` — Primary action buttons
- `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardContent>` — Container
- `<Badge>` — Status indicators
- `<Input>` — Form inputs (belum dipakai)
- `<Avatar>` — User avatar (belum dipakai)
- `<Separator>` — Dividers (belum dipakai)

---

## Responsive Design

**Mobile-First:**
- Max-width container: `max-w-lg` (512px)
- Bottom nav: fixed, height 64px
- Content padding-bottom: `pb-20` (agar tidak tertutup bottom nav)
- Cards: full-width dengan spacing 12px (`space-y-3`)

**Desktop:**
- Content centered dengan max-width
- Bottom nav tetap centered
- No sidebar (untuk fase 1)

---

## Color Usage Examples

### Status Badges
```tsx
// Draft
<Badge className="bg-gray-100 text-gray-700">Draft</Badge>

// In Production
<Badge className="bg-blue-100 text-blue-700">Produksi</Badge>

// QC
<Badge className="bg-yellow-100 text-yellow-700">QC</Badge>

// Shipped
<Badge className="bg-green-100 text-green-700">Terkirim</Badge>
```

### Warning/Alert Cards
```tsx
<Card className="border-warning/30 bg-warning/5">
  {/* Low stock content */}
</Card>
```

### Profit Text
```tsx
<p className="text-green-600 font-semibold">
  Rp 347,500
</p>
```

---

## Next Steps (API Integration)

### Phase 1: Setup Backend
1. **Prisma Schema** (translate dari SQL design)
2. **Supabase Connection** (PostgreSQL)
3. **Generate Prisma Client** + migrations

### Phase 2: API Routes (Next.js API)
```
/app/api
├── /fabrics
│   ├── route.ts          # GET (list), POST (create)
│   └── [id]/route.ts     # GET, PATCH, DELETE
├── /fabric-batches
├── /orders
├── /bom
├── /production-timelines
└── /order-costing
```

### Phase 3: Connect UI → API
- Replace dummy data dengan `fetch()` calls
- Add loading states (skeleton components)
- Add error handling (toast notifications)
- Add forms (create order, purchase fabric, etc.)

### Phase 4: Advanced Features
- Order detail page (`/orders/[id]`)
- BOM builder (komposisi bahan)
- Timeline progress tracker (drag & drop?)
- Costing calculator (interactive)
- Search & filters
- Export reports (PDF/Excel)

---

## Development Commands

```bash
# Start dev server
cd /Users/nuralan/Personal/sanbox/hsport/app
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Add shadcn/ui components
npx shadcn@latest add <component-name>

# Run type check
npm run type-check  # (perlu tambahkan script di package.json)
```

---

## Access URL

- **Local:** http://localhost:3000
- **Network:** http://127.0.2.2:3000 (untuk testing di mobile di network yang sama)

---

## Design Consistency Checklist

✅ **Colors:**
- Primary blue untuk interactive elements (button, active nav, links)
- White background + subtle gray borders
- Pastel accents untuk status (green success, peach warning)

✅ **Typography:**
- Headings: 2xl bold
- Body: sm medium
- Labels: xs muted

✅ **Spacing:**
- Cards: 3 (12px) spacing
- Padding: 4-6 (16-24px) internal
- Container: px-4 (16px) horizontal

✅ **Borders:**
- Rounded: 12px (--radius: 0.75rem)
- Border color: subtle gray (oklch(0.93 0 0))

✅ **Icons:**
- Line style (strokeWidth: 2)
- Size: h-5 w-5 (20px) untuk nav, h-4 w-4 (16px) untuk inline

---

## Known Limitations (Prototype Phase)

- ❌ No authentication (single user assumed)
- ❌ No API integration (dummy data hardcoded)
- ❌ No form validation
- ❌ No loading/error states
- ❌ No pagination (list items limited)
- ❌ No real-time updates
- ❌ No search/filter
- ❌ No dark mode (light only)
- ❌ No offline support

---

## Screenshots (Manual Testing)

**To verify UI:**
1. Open http://localhost:3000
2. Check Dashboard → stats cards, recent orders, low-stock alert
3. Navigate bottom nav → verify active state
4. Check Orders → list dengan status badges
5. Check Inventory → low-stock warning backgrounds
6. Check Production → timeline dengan stage icons
7. Check Reports → profit card, trends, top fabrics

**Expected:**
- Mobile-optimized layout (max 512px width)
- Bottom nav fixed, active item highlighted
- Clean white cards dengan subtle borders
- No visual glitches, proper spacing

---

**Status:** UI prototype selesai, siap untuk user testing & API integration planning.
