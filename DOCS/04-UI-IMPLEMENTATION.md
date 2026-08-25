# H-Sport: UI Implementation Documentation

**Tech Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui + Recharts  
**Design System:** Bookify-inspired (vibrant blue, pastel accents, card shadows)  
**Status:** ✅ Prototype lengkap (UI-only, mock data, mock auth)

---

## Design System

### Color Palette (CSS Variables — globals.css)

```css
/* Primary */
--primary: oklch(0.55 0.22 250);        /* Vibrant blue */
--primary-foreground: oklch(1 0 0);     /* White on blue */

/* Background */
--background: oklch(1 0 0);             /* Pure white */
--foreground: oklch(0.2 0 0);           /* Dark text */

/* Semantic */
--border: oklch(0.93 0 0);              /* Subtle gray */
--ring: oklch(0.55 0.22 250);           /* Focus = primary */
--destructive: oklch(0.577 0.245 27.325); /* Red */
--radius: 0.75rem;                      /* 12px */
```

### Background & Card Colors

- **Halaman:** `bg-gray-50` (agar card terlihat kontras)
- **Card normal:** `bg-white border-gray-300` + `card-shadow-lg`
- **Card status pastel:** `bg-blue-100 / green-100 / orange-100 / red-100 / red-300` + border senada

### Shadow (globals.css `@layer components`)

```css
.card-shadow {
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}
.card-shadow-lg {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}
```

### Typography
- **Font:** Inter (via `next/font/google`, variable `--font-sans`)
- **Heading:** 2xl bold (page), base bold (card title)
- **Body:** sm (14px), xs (12px) untuk meta
- **Label:** xs muted uppercase pada stat card

---

## Halaman & Fitur

### 1. Login (`/login`)
- Full-screen centered, tanpa bottom nav
- Logo: icon kaos dalam kotak biru rounded + nama "H-Sport" + tagline
- Form: username, password (dengan toggle 👁), tombol Sign In
- Tombol "Sign in with Google" (icon resmi 4 warna)
- Mock auth: set cookie `hsport-auth=1` → redirect ke halaman tujuan
- Dibungkus `Suspense` (useSearchParams untuk `?next=`)

### 2. Dashboard (`/`)
- **Hero card:** profit bulan ini (gradient biru `from-blue-500 to-blue-700`), trend %, margin, omzet, HPP
- **Area chart** omzet vs profit 6 bulan (recharts, gradient fill, tooltip custom)
- **Stat compact 2 kolom:** stok kain total kg, order aktif
- **Donut chart** komposisi stok per jenis kain (legend + % + total)
- **Order mendekati deadline:** list + badge sisa hari (warna)
- **Stok menipis:** card merah `bg-red-100 border-red-300 border-2`

### 3. Orders (`/orders`)
- **Search bar** paling atas (icon, tombol clear ✕)
- **Sort select:** Deadline ↑/↓, Terbaru, Terlama
- **Filter chips:** Semua, Draft, Produksi, QC, Selesai (dengan count)
- **Result count** + tombol "Reset filter"
- **Card compact** dengan warna deadline:
  - `bg-red-300` — lewat deadline
  - `bg-red-100` — deadline ≤ 1 hari
  - `bg-orange-100` — deadline < 3 hari
  - `bg-green-100` — selesai
  - `bg-gray-200` — aman
- **Tombol hapus** (🗑) per card → dialog konfirmasi (Batal menyala biru, Ya Hapus outline merah)
- Klik card → detail order

### 4. Order Detail (`/orders/[id]`)
- Back link + header order (nomor, status badge, customer, kontak, qty, tanggal, **deadline + badge sisa hari**)
- **Komposisi Bahan (BOM):** list bahan (nama, qty, waste%, harga, cost), total material cost, tombol "Tambah" → dialog
- **Timeline Produksi:** 5 stages dengan icon status + durasi, tombol "Update" → dialog
- **Costing & Harga Jual:** material cost, upah jahit, HPP, markup, ongkir, harga jual, profit + margin; tombol "Hitung Ulang" → dialog

### 5. Inventory (`/inventory`)
- **Search** nama bahan
- **Grid 2 kolom** card compact (nama, stok besar, avg price, tanggal beli terakhir, reorder badge)
- Card `h-full` + footer `mt-auto` — tinggi konsisten antar card
- Low stock: `bg-red-100 border-red-300`
- FAB → dialog tambah pembelian

### 6. Inventory Detail (`/inventory/[id]`)
- **Header:** total stok, harga rata-rata (weighted), nilai stok, warning reorder
- **Riwayat Harga:** per batch (tanggal, supplier, qty, harga/kg) + tombol **✏️ edit**
- **Sisa Bahan per Batch:** sisa vs beli, progress bar, badge status (Habis/Tipis/Menipis/Aman)
- **Edit batch dialog:** supplier, tanggal, qty beli, sisa stok, harga/kg → update state + toast

### 7. Production (`/production`)
- Order aktif (in_production + qc) diurutkan deadline terdekat
- Card: header (order, status, deadline badge), **progress bar** (warna by %), stages dengan **estimasi vs aktual** (on-track hijau / terlambat merah), footer ETA (deadline + sisa jam) + BOM ringkas
- Klik card → dialog update timeline

### 8. Reports (`/reports`)
- **Period filter:** preset (Bulan Ini, Bulan Lalu, 3 Bulan, Kustom) + date range
- **Summary cards 2×2** (omzet, HPP, profit, margin) dengan **perbandingan vs periode lalu**
- **Bar chart** omzet vs HPP 6 bulan
- **Tabel detail** 9 kolom (tanggal, order, customer, qty, omzet, HPP, profit, margin, status) + **sorting** klik header
- **Export:** CSV (download real, Excel-compatible) + PDF (mock)
- **Top ranking:** customer teratas (by profit) + kain terbanyak dipakai

### 9. Profile (`/profile`)
- 3 menu cards: Pengaturan Profil, Master Fabric, Laporan + tombol **Logout** fungsional (hapus cookie → redirect /login)

### 10. Profile Settings (`/profile/settings`)
- Form: nama pemilik, nama usaha, email, telepon → toast sukses

### 11. Master Fabric (`/profile/fabrics`)
- CRUD jenis kain: list 24 jenis (dari FABRIC_CATALOG), search
- Dialog tambah/edit (nama, satuan)
- Dialog konfirmasi hapus — **aturan bisnis:** kain yang punya riwayat pembelian/BOM tidak bisa dihapus (toast error)
- Tombol dialog: **Batal = primary menyala**, aksi destruktif = outline

---

## Toast System

- `components/toast/toast-provider.tsx`
- Context + `useToast()` hook: `toast.success/error/warning/info`
- Render: fixed top, z-[200], max 3 stack, auto-dismiss 3 detik, tombol close
- Terpasang di: create-order, add-fabric-purchase, add-bom-item, update-timeline, costing-calculator, profile settings, delete order, delete fabric, login, logout

---

## Auth (Mock)

- `middleware.ts`: proteksi semua route kecuali `/login`
  - Tanpa cookie `hsport-auth=1` → redirect `/login?next=<path>`
  - Sudah login buka `/login` → redirect `/`
- Login: set cookie (24 jam) → redirect balik ke `next`
- Logout: hapus cookie → redirect `/login`
- `bottom-nav-wrapper.tsx`: nav disembunyikan di `/login`

---

## Bottom Navigation

```tsx
const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Package, label: "Orders", href: "/orders" },
  { icon: Warehouse, label: "Inventory", href: "/inventory" },
  { icon: Settings, label: "Production", href: "/production" },
  { icon: User, label: "Profile", href: "/profile" },
];
```
- Active state: exact match untuk `/`, prefix match untuk sub-halaman (`/profile/settings` mengaktifkan Profile)
- Fixed bottom, z-50, max-w-lg centered

---

## Data & State

### lib/master-data.ts
```ts
export const FABRIC_CATALOG: MasterFabric[] // 24 jenis kain, id slug stabil
export function getFabricCatalogById(id)
export function getFabricCatalogName(id)
```

### lib/mock-data.ts
- `fabrics` — 4 kain dengan stok (id = id katalog)
- `fabricBatches` — 8 batch pembelian
- `bomItems` — 4 BOM items
- `orderTimelines` — stages per order (dengan actualHrs)
- `orderCostings` — 7 costing (order 1-7)
- `monthlyStats` — 6 bulan omzet/HPP/profit
- `orders` — 7 order (dengan deadline)
- Helpers: `getFabricStock`, `getFabricAvgPrice`, `getFabricLastPurchase`, `getOrderById`, `getBOMForOrder`, `getTimelineForOrder`, `getCostingForOrder`

### lib/utils.ts
- `cn`, `formatRupiah`, `formatDate`, `daysUntil`, `daysLeftLabel`, `shiftMonth`

---

## Komponen UI (semua native/Radix — Base UI dihapus)

| Komponen | Implementasi | Catatan |
|----------|-------------|---------|
| Button | `<button>` native + cva | type default "button" |
| Input | `<input>` native | |
| Textarea | `<textarea>` native | |
| Label | `<label>` native | |
| Select | native `<select>` tersembunyi + display visual | hybrid, placeholder & nilai selalu tampil |
| Dialog | Radix UI (`@radix-ui/react-dialog`) | portal, overlay, animasi |
| Card | shadcn (ring + custom shadow) | |
| Badge | shadcn | |
| Separator, Avatar | shadcn | |

**Catatan:** Base UI (`@base-ui/react/*`) dihapus karena bermasalah dengan interaksi di mobile browser (klik & controlled state tidak bekerja).

---

## Konfigurasi

### next.config.ts
```ts
allowedDevOrigins: [
  "192.168.*.*", "100.*.*.*", "10.*.*.*",
  "172.16.*.*" ... "172.31.*.*",
]
```
Catatan: wildcard tunggal (`*`/`**`) tidak diizinkan Next.js — harus per-segment.

### vercel.json
```json
{ "framework": "nextjs", "buildCommand": "next build", "installCommand": "npm install", "outputDirectory": ".next" }
```
Vercel: **root directory = `app`**

---

## Perintah

```bash
cd /Users/nuralan/Personal/sanbox/hsport/app
npm run dev          # dev server :3000
npm run build        # production build
npm start            # serve build
npx shadcn@latest add <component>
```

---

## Checklist Desain

✅ Card selalu kontras dengan background (bg-gray-50 + shadow + border)  
✅ Low-stock & warning = merah (konsisten di semua halaman)  
✅ Card compact + drill-down ke detail  
✅ Tombol aman (Batal) menyala, tombol destruktif outline  
✅ Mobile-first (max-w-lg 512px)  
✅ Native components (kompatibel semua browser mobile)  
✅ Toast feedback untuk semua aksi  
✅ Siap wire API (semua data via mock-data terpusat)