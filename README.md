# H-Sport — Textile Production Management System

**Sistem pengelolaan inventory, costing, dan timeline produksi untuk perusahaan tekstil/manufaktur kaos.**

---

## 🎯 Problem Statement

Client menghadapi:
1. ❌ Tidak ada laporan untung/rugi per order
2. ❌ Tidak ada pencatatan stok kain & historical pricing
3. ❌ Tidak ada tracking timeline produksi

**Solusi:** Sistem web app yang track stok (FIFO), hitung HPP, monitor progress produksi, dan generate laporan profit.

---

## ✅ Features (Terimplementasi)

### 📦 Inventory Management
- ✅ Master data kain global (24 jenis) + CRUD (tambah/edit/hapus)
- ✅ Batch tracking pembelian (FIFO, historical pricing)
- ✅ Riwayat harga per batch + edit batch
- ✅ Sisa stok per batch + progress bar
- ✅ Low-stock alerts (merah)
- ✅ Search nama kain

### 📋 Order Management
- ✅ Buat order kaos (dengan deadline)
- ✅ Detail order: BOM, timeline, costing
- ✅ BOM (Bill of Materials) — komposisi bahan + waste%
- ✅ Filter status, search, sort by deadline
- ✅ Warna card berdasarkan deadline (oranye/merah/merah gelap/hijau)
- ✅ Hapus order (dialog konfirmasi)

### ⚙️ Production Timeline
- ✅ 5 stages: Pengukuran → Pemotongan → Jahit → Finishing → QC
- ✅ Progress bar keseluruhan
- ✅ Estimasi vs aktual (deteksi keterlambatan)
- ✅ ETA + deadline coloring
- ✅ Update status stage

### 💰 Costing & Pricing
- ✅ Material cost (FIFO, waste masuk HPP)
- ✅ Labor cost (upah jahit)
- ✅ HPP = Material + Labor
- ✅ Harga jual: markup % atau fixed profit
- ✅ Ongkir → **Profit = Harga Jual - HPP - Ongkir**

### 📊 Laporan
- ✅ Summary cards (omzet, HPP, profit, margin) + perbandingan periode
- ✅ Bar chart omzet vs HPP (6 bulan)
- ✅ Tabel detail order (9 kolom, sorting)
- ✅ Filter periode (preset + date range)
- ✅ Export CSV (real) + PDF (mock)
- ✅ Top customer + top fabric

### 🏠 Dashboard
- ✅ Hero profit card + trend
- ✅ Area chart omzet vs profit (6 bulan)
- ✅ Donut chart komposisi stok
- ✅ Order mendekati deadline + stok menipis

### 🔐 Auth
- ✅ Halaman login (username/password + Google button)
- ✅ Mock auth cookie + middleware proteksi
- ✅ Logout fungsional

---

## 🛠️ Tech Stack

### Frontend + Backend (Monolith)
- **Framework:** Next.js 14 (App Router, TypeScript)
- **UI:** Tailwind CSS v4 + shadcn/ui (native components — Base UI dihapus)
- **Charts:** Recharts (Area, Bar, Pie)
- **Icons:** Lucide React
- **Toast:** Custom ToastProvider (context)

### Database (belum — roadmap)
- **Database:** PostgreSQL (via Supabase managed / self-hosted)
- **ORM:** Prisma
- **Auth real:** NextAuth / Supabase Auth

### Design System
- Bookify-inspired: clean white/gray-50, vibrant blue, pastel accents
- Card shadows, mobile-first (max 512px)
- Tombol aman menyala (Batal), destruktif outline

---

## 🚀 Getting Started

```bash
cd /Users/nuralan/Personal/sanbox/hsport/app
npm install
npm run dev
```

**Access:** http://localhost:3000 (login dulu — username/password apa pun)

---

## 📱 Halaman

| Route | Halaman |
|-------|---------|
| `/login` | Login (mock auth) |
| `/` | Dashboard (hero, chart, donut, deadline, stok) |
| `/orders` | Orders (search, filter, sort, warna deadline, hapus) |
| `/orders/[id]` | Detail order (BOM, timeline, costing) |
| `/inventory` | Inventory (grid compact, search) |
| `/inventory/[id]` | Riwayat harga + sisa bahan + edit batch |
| `/production` | Timeline produksi (progress, ETA, estimasi vs aktual) |
| `/reports` | Laporan (periode, tabel, chart, export) |
| `/profile` | Menu: Pengaturan, Master Fabric, Laporan, Logout |
| `/profile/settings` | Pengaturan profil |
| `/profile/fabrics` | CRUD master fabric |

---

## 📂 Project Structure

```
/hsport
├── /DOCS                  # Dokumentasi (BRD, design, schema, UI, summary)
├── README.md
└── /app (Next.js)
    ├── middleware.ts       # Auth middleware
    ├── vercel.json
    ├── app/                # Pages (12 halaman)
    ├── components/         # UI + dialogs + toast + charts
    ├── lib/
    │   ├── master-data.ts  # Katalog 24 jenis kain (global)
    │   ├── mock-data.ts    # Semua data mock (orders, batches, BOM, costing)
    │   └── utils.ts        # Helpers
    └── public/
```

---

## 🗄️ Database Schema (Planned)

**Entities:** `fabrics`, `fabric_batches`, `orders`, `bom`, `bom_items`, `batch_usage`, `production_timelines`, `order_costing`

**Method:** FIFO inventory costing, waste masuk HPP  
**Detail:** `/DOCS/03-DATABASE-SCHEMA.md`

---

## 🚦 Roadmap

### Fase 1: Database & API (berikutnya)
- [ ] Prisma setup + schema
- [ ] Supabase / PostgreSQL connection
- [ ] API Routes: fabrics, fabric-batches, orders, bom, production-timelines, order-costing
- [ ] Connect UI → API (ganti mock data)

### Fase 2: UX Enhancements
- [ ] Loading skeletons
- [ ] Update status order (Draft → Produksi → QC → Selesai)
- [ ] Pagination

### Fase 3: Advanced
- [ ] Export PDF
- [ ] Dark mode
- [ ] Auth real (NextAuth/Supabase)
- [ ] Realtime updates
- [ ] PWA offline

---

## 📊 Status

| Aspek | Status |
|-------|--------|
| UI Prototype | ✅ Selesai (12 halaman, 5 dialog) |
| Mock auth | ✅ Cookie + middleware |
| Build | ✅ 0 error TypeScript |
| Deploy | ✅ https://h-sports-zeta.vercel.app (auto-deploy) |
| Database | ⏳ Belum (roadmap Fase 1) |
| API | ⏳ Belum (roadmap Fase 1) |

---

## 📄 Documentation

- **BRD:** `DOCS/01-BUSINESS-REQUIREMENTS.md`
- **Design Decisions:** `DOCS/02-DESIGN-DECISIONS.md`
- **Database Schema:** `DOCS/03-DATABASE-SCHEMA.md`
- **UI Implementation:** `DOCS/04-UI-IMPLEMENTATION.md`
- **Implementation Summary:** `DOCS/05-IMPLEMENTATION-SUMMARY.md`

---

## 👤 User Persona

**Owner (single user):** Operator tunggal (gudang + produksi + akuntansi + sales).  
Kebutuhan: tahu stok, hitung HPP, track progress, lihat profit.  
Goal: **Profit per order visible dalam < 1 menit.**

---

**Repo:** github.com/NurAlan/h-sports  
**Prod:** https://h-sports-zeta.vercel.app