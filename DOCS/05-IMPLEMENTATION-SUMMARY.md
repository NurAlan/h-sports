# H-Sport — Implementation Summary

**Status:** ✅ UI Prototype + Auth (Supabase) + API Routes (Prisma) + In-App Tutorial  
**Dev Server:** http://localhost:3000  
**Production:** https://h-sports-zeta.vercel.app  
**Tech Stack:** Next.js 14 + TypeScript + Tailwind CSS v4 + shadcn/ui + Recharts + Prisma + Supabase

---

## 📱 Halaman (12 halaman)

| Halaman | Route | Status | Fitur Utama |
|---------|-------|--------|-------------|
| **Login** | `/login` | ✅ | Logo, username/password, Google sign-in, mock auth cookie |
| **Dashboard** | `/` | ✅ | Hero profit card, area chart omzet vs profit, donut stok, stat compact, deadline list, stok menipis merah |
| **Orders** | `/orders` | ✅ | List compact, warna deadline (oranye/merah/merah gelap/hijau selesai), filter status, search nama, sort deadline, hapus order |
| **Order Detail** | `/orders/[id]` | ✅ | Info order + deadline, BOM (komposisi bahan + tambah), timeline produksi (update stage), costing calculator (HPP, harga jual, profit) |
| **Inventory** | `/inventory` | ✅ | Grid 2 kolom compact, search nama, low-stock merah, FAB tambah pembelian |
| **Inventory Detail** | `/inventory/[id]` | ✅ | Riwayat harga per batch, sisa bahan per batch + progress bar, edit batch |
| **Production** | `/production` | ✅ | Progress bar, warna deadline, estimasi vs aktual, ETA, BOM ringkas, link detail, update timeline dialog |
| **Reports** | `/reports` | ✅ | Preset periode (bulan ini/lalu/3 bulan), date range, summary cards + perbandingan vs periode lalu, bar chart omzet vs HPP, tabel detail + sorting (9 kolom), export CSV real, top ranking customer & kain |
| **Profile** | `/profile` | ✅ | 3 menu: Pengaturan Profil, Master Fabric, Laporan + tombol Logout fungsional |
| **Profile Settings** | `/profile/settings` | ✅ | Form: nama pemilik, nama usaha, email, telepon |
| **Master Fabric** | `/profile/fabrics` | ✅ | CRUD jenis kain (24 jenis), search, edit, hapus dengan aturan bisnis (kain ber-riwayat tidak bisa dihapus), dialog konfirmasi |
| **Reports** | `/reports` | ✅ | (akses dari Profile → Laporan atau bottom nav dulu — sekarang via Profile) |

---

## 🧩 Komponen

### Dialogs (5)
| Dialog | File | Fields |
|--------|------|--------|
| Create Order | `create-order-dialog.tsx` | Customer, kontak, qty, spesifikasi, tanggal order, deadline |
| Add Fabric Purchase | `add-fabric-purchase-dialog.tsx` | Jenis kain (24 dari katalog), supplier, tanggal, qty kg, harga/kg |
| Add BOM Item | `add-bom-item-dialog.tsx` | Jenis kain (24), qty bersih, waste %, live preview biaya + cek stok |
| Update Timeline | `update-timeline-dialog.tsx` | 5 stages: status per stage (Belum/Sedang/Selesai) |
| Costing Calculator | `costing-calculator-dialog.tsx` | Material cost (readonly BOM), upah jahit, markup/fixed profit, ongkir, live HPP + profit + margin |

### Reusable Components
- ✅ `bottom-nav.tsx` — 5 menu (Home, Orders, Inventory, Production, Profile) + prefix match
- ✅ `bottom-nav-wrapper.tsx` — sembunyikan nav di `/login`
- ✅ `fab.tsx` — Floating Action Button (z-[100], bottom-24)
- ✅ `page-header.tsx` — Title + subtitle + action
- ✅ `toast-provider.tsx` — Toast system (4 varian, auto-dismiss 3s, stack 3)
- ✅ `dashboard/revenue-chart.tsx` — Area chart (recharts)
- ✅ `dashboard/stock-donut.tsx` — Donut chart komposisi stok
- ✅ `reports/period-filter.tsx` — Preset periode + date range filter
- ✅ `reports/comparison-bar-chart.tsx` — Bar chart omzet vs HPP

### UI Components (native — Base UI dihapus)
- Button, Card, Badge, Input, Label, Textarea, Select, Dialog, Separator, Avatar

---

## 🔐 Auth & Middleware

- **Mock auth** via cookie (`hsport-auth=1`)
- **Middleware** (`middleware.ts`) — proteksi semua halaman kecuali `/login`
- Login sukses → set cookie (24 jam) → redirect ke halaman tujuan (`?next=`)
- Logout → hapus cookie → redirect `/login`
- Siap diganti NextAuth/Supabase

---

## 🗄️ Data & State

### Global Master Data
- `lib/master-data.ts` — `FABRIC_CATALOG` (24 jenis kain, id stabil, siap schema API)
- `lib/mock-data.ts` — semua data mock: 7 orders, 4 fabrics, 8 batches, 5 stages per order, 6 months stats, 7 costings, 4 BOM items
- `lib/utils.ts` — helpers: `cn`, `formatRupiah`, `formatDate`, `daysUntil`, `daysLeftLabel`, `shiftMonth`

### State Management
- Semua state lokal (useState, useMemo) — belum ada global store
- Hapus/edit data: state lokal (mock), siap ganti ke API call

---

## 🎨 Design System

| Aspek | Value |
|-------|-------|
| **Primary** | Vibrant blue (`oklch(0.55 0.22 250)`) |
| **Background** | `gray-50` (halaman), white/kartu berwarna pastel |
| **Shadow** | `card-shadow`, `card-shadow-lg` (CSS layer) |
| **Border** | `gray-300` untuk card normal, varian warna per status |
| **Font** | Inter (via next/font) |
| **Icons** | Lucide React (line icons) |
| **Charts** | Recharts (AreaChart, BarChart, PieChart) |

### Warna Semantik
| Status | Background | Border | Text |
|--------|-----------|--------|------|
| Aman / default | `bg-white` / `bg-gray-200` | `gray-300` | dark |
| Stok / status biru | `bg-blue-100` | `blue-300` | `blue-700` |
| Profit / selesai | `bg-green-100` | `green-300` | `green-700` |
| Warning / deadline < 3 | `bg-orange-100` | `orange-300` | `orange-700` |
| Urgent / deadline 1 hari | `bg-red-100` | `red-300` | `red-700` |
| Danger / lewat deadline | `bg-red-300` | `red-500` | `text-white` (badge) |
| Low stock | `bg-red-100` | `red-300` | `red-600` |

---

## 📋 Fitur Bisnis Terimplementasi

### Manajemen Stok
- ✅ Daftar jenis kain global (24) + CRUD
- ✅ Pembelian kain (batch) — tambah, edit
- ✅ Riwayat harga per batch (FIFO)
- ✅ Sisa stok per batch + progress bar
- ✅ Low-stock alerts (merah, reorder point)
- ✅ Search nama kain

### Manajemen Order
- ✅ Buat order (dengan deadline)
- ✅ Detail order: BOM (komposisi bahan), Timeline, Costing
- ✅ BOM: tambah bahan (dengan waste%), cek stok real-time
- ✅ Timeline: 5 stages, update status per stage
- ✅ Costing: HPP, markup/fixed profit, ongkir, live profit
- ✅ Filter status (Draft/Produksi/QC/Selesai)
- ✅ Search + sort (deadline, tanggal)
- ✅ Warna card berdasarkan deadline
- ✅ Hapus order

### Manajemen Produksi
- ✅ Progress bar keseluruhan per order
- ✅ Estimasi vs aktual per stage (on-track/delay)
- ✅ ETA + deadline coloring
- ✅ BOM ringkas per order
- ✅ Sortir prioritas (deadline terdekat)

### Laporan & Profit
- ✅ Summary cards (omzet, HPP, profit, margin) + perbandingan vs periode lalu
- ✅ Bar chart omzet vs HPP (6 bulan)
- ✅ Tabel detail order (9 kolom, sorting)
- ✅ Filter periode (preset + date range)
- ✅ Export CSV (real download)
- ✅ Top customers + top fabrics ranking

### Autentikasi
- ✅ Halaman login
- ✅ Mock auth (cookie-based)
- ✅ Middleware proteksi
- ✅ Logout fungsional
- ✅ Bottom nav sembunyi di login

---

## 🚦 Roadmap (status terkini)

### ✅ Selesai
- [x] Auth Supabase (Google OAuth + password, signup off, middleware)
- [x] API Routes lengkap (14 endpoint) — lihat `DOCS/07-API-REFERENCE.md`
- [x] Prisma ORM + schema (8 model) + FIFO logic
- [x] In-App Tutorial (tombol "Panduan" di semua menu)
- [x] Deploy Vercel (auto-deploy)

### 🔴 Dalam Proses: Wire UI → API
- [x] Dashboard → `/api/dashboard`
- [x] Orders list → `/api/orders`
- [ ] Inventory grid → `/api/inventory`
- [ ] Inventory detail → `/api/fabric-batches`
- [ ] Production → `/api/production`
- [ ] Reports → `/api/reports`
- [ ] Order detail → `/api/orders/[id]`
- [ ] Master Fabric → `/api/fabrics`
- [ ] Dialogs (POST/PATCH/PUT)
- [ ] Hapus `lib/mock-data.ts` setelah semua ter-wire

### 🟡 Fase 2: UX Enhancements
- [ ] Loading skeletons (sebagian sudah: dashboard, orders)
- [ ] Pagination untuk list panjang

### 🔵 Fase 3: Advanced
- [ ] Export PDF
- [ ] Dark mode
- [ ] Realtime updates
- [ ] PWA offline

---

## 📁 Struktur File (Final)

```
/hsport
├── /DOCS
│   ├── 01-BUSINESS-REQUIREMENTS.md
│   ├── 02-DESIGN-DECISIONS.md
│   ├── 03-DATABASE-SCHEMA.md
│   ├── 04-UI-IMPLEMENTATION.md
│   └── 05-IMPLEMENTATION-SUMMARY.md
├── .gitignore
├── README.md
└── /app (Next.js 14)
    ├── middleware.ts              # Auth middleware
    ├── vercel.json
    ├── next.config.ts
    ├── package.json
    ├── app/
    │   ├── layout.tsx             # Root layout (ToastProvider, BottomNav)
    │   ├── globals.css            # Tailwind + design tokens
    │   ├── page.tsx               # Dashboard
    │   ├── login/page.tsx         # Login page
    │   ├── orders/page.tsx        # Orders list
    │   ├── orders/[id]/page.tsx   # Order detail
    │   ├── inventory/page.tsx     # Inventory grid
    │   ├── inventory/[id]/page.tsx# Inventory detail (riwayat + edit)
    │   ├── production/page.tsx    # Production timeline
    │   ├── reports/page.tsx       # Laporan (filter, tabel, chart, export)
    │   └── profile/
    │       ├── page.tsx           # Profile menu
    │       ├── settings/page.tsx  # Pengaturan profil
    │       └── fabrics/page.tsx   # CRUD master fabric
    ├── components/
    │   ├── bottom-nav.tsx
    │   ├── bottom-nav-wrapper.tsx
    │   ├── fab.tsx
    │   ├── page-header.tsx
    │   ├── dashboard/
    │   │   ├── revenue-chart.tsx
    │   │   └── stock-donut.tsx
    │   ├── reports/
    │   │   ├── period-filter.tsx
    │   │   └── comparison-bar-chart.tsx
    │   ├── dialogs/
    │   │   ├── add-fabric-purchase-dialog.tsx
    │   │   ├── create-order-dialog.tsx
    │   │   ├── add-bom-item-dialog.tsx
    │   │   ├── update-timeline-dialog.tsx
    │   │   └── costing-calculator-dialog.tsx
    │   ├── toast/
    │   │   └── toast-provider.tsx
    │   └── ui/
    │       ├── button.tsx, card.tsx, badge.tsx, input.tsx
    │       ├── label.tsx, textarea.tsx, select.tsx
    │       ├── dialog.tsx, separator.tsx, avatar.tsx
    ├── lib/
    │   ├── utils.ts
    │   ├── master-data.ts
    │   └── mock-data.ts
    └── public/
```

---

## 📊 Statistik Build

- **Halaman:** 12 (+ _not-found)
- **Komponen:** 24 komponen kustom
- **Dependensi baru:** recharts, @radix-ui/react-dialog, lucide-react
- **Base UI dihapus** — semua komponen interaktif native/Radix
- **Build:** ✅ Compiled successfully, 0 TypeScript errors
- **Deploy:** ✅ Vercel (auto-deploy dari GitHub)

---

**Dev:** http://localhost:3000  
**Prod:** https://h-sports-zeta.vercel.app  
**Repo:** github.com/NurAlan/h-sports