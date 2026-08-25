# H-Sport: Design Decisions

**Tanggal:** 25 Agustus 2026  
**Status:** LOCKED ✅ — Sudah diimplementasikan di UI prototype (mock data)

---

## 1. Accounting Method

### **Waste Treatment: Masuk HPP (Opsi A)**

**Decision:**
- Waste/sisa potongan **dihitung sebagai bagian dari material cost**
- Formula: `Material Cost = (qty_used + waste_qty) × harga_kulak`

**Rationale:**
- Profit lebih akurat karena waste = real cost
- Owner tahu cost sesungguhnya per order
- Harga jual reflect true material consumption

**Implementation:**
- BOM (Bill of Materials) mencatat:
  - `qty_required` (kebutuhan bersih)
  - `waste_percentage` (%)
  - `qty_actual = qty_required × (1 + waste_percentage)`
- Stok berkurang sebesar `qty_actual`
- HPP pakai `qty_actual × harga_kulak`

---

## 2. Inventory Costing Method

### **FIFO (First In First Out)**

**Decision:**
- Material cost per order dihitung dari **batch paling lama** (first purchased, first used)
- Track stock movement per batch

**Rationale:**
- Lebih real untuk stok fisik (barang lama dipakai dulu)
- Owner bisa track batch mana yang sudah dipakai
- Sesuai dengan praktek gudang fisik

**Implementation:**
- Tabel `fabric_batches`: per pembelian = 1 batch
- Kolom: `batch_id`, `fabric_id`, `purchase_date`, `qty_purchased`, `qty_remaining`, `price_per_kg`
- Saat ambil kain untuk order:
  1. Sort batch by `purchase_date ASC`
  2. Alokasikan dari batch paling lama sampai kebutuhan terpenuhi
  3. Update `qty_remaining` per batch
- Jika 1 batch tidak cukup, ambil dari batch berikutnya (multiple batches per order)

**Alternative (future):**
- Weighted average (lebih simpel, tapi less accurate untuk stok fisik)

---

## 3. Tech Stack

### **Web App: Next.js (React) Monolith**

**Stack:**
- **Framework:** Next.js 14+ (App Router)
- **Frontend:** React 18+, TypeScript
- **Backend:** Next.js API Routes (serverless functions)
- **Database:** PostgreSQL (via Supabase)
- **ORM:** Prisma (type-safe, migration management)
- **UI Library:** Tailwind CSS + shadcn/ui (optional)
- **Auth:** NextAuth.js (future, single user MVP tidak butuh auth)
- **Deployment:** Vercel (start) → self-hosted VPS (scale)

**Folder Structure:**
```
/hsport
├── /src
│   ├── /app
│   │   ├── /api              # API routes (REST endpoints)
│   │   ├── /dashboard        # UI pages
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── /components           # React components
│   ├── /lib                  # Utils, db client, helpers
│   └── /types                # TypeScript types
├── /prisma
│   ├── schema.prisma         # Database schema
│   └── /migrations           # SQL migration files
├── /public                   # Static assets
├── package.json
├── tsconfig.json
└── next.config.js
```

**Why Next.js?**
- ✅ SSR + CSR (fast initial load, reactive UI)
- ✅ API routes built-in (no separate backend server)
- ✅ TypeScript native
- ✅ Deploy mudah (Vercel 1-click)
- ✅ Mobile-friendly (responsive by default)

---

## 4. Database

### **PostgreSQL via Supabase**

**Decision:**
- Start: **Supabase** (managed PostgreSQL)
- Scale: **Self-hosted PostgreSQL** (jika Supabase terlalu mahal)

**Rationale:**
- Supabase free tier: 500 MB database, 2 GB bandwidth/month (cukup untuk prototype)
- Instant REST API (optional, bisa pakai Prisma saja)
- Built-in auth, realtime (future features)
- Jika scaling: export database → migrasi ke self-hosted (PostgreSQL portable)

**Connection:**
- Supabase: `postgresql://user:pass@db.supabase.co:5432/postgres`
- Self-hosted: `postgresql://user:pass@localhost:5432/hsport`
- Prisma ORM: abstraksi, tidak ada vendor lock-in

---

## 5. Pricing Strategy

### **Cost-Based Markup (Flexible)**

**Formula:**

**Option A: Percentage Markup (default)**
```
HPP = Material Cost + Labor Cost
Harga Jual = HPP × (1 + Markup%)
Profit = Harga Jual - HPP - Ongkir
```

**Option B: Fixed Profit (override per order)**
```
Harga Jual = HPP + Fixed Profit
Profit = Fixed Profit - Ongkir
```

**Implementation:**
- Owner set `default_markup_percentage` (e.g., 30%)
- Per order, bisa override:
  - `pricing_method`: `'markup'` | `'fixed_profit'`
  - `markup_percentage` (jika markup)
  - `fixed_profit` (jika fixed)
- Shipping cost (`ongkir`) dikurangi dari profit (bukan markup dari HPP)

---

## 6. Timeline Tracking

### **Production Stages (Flexible Duration)**

**Stages:**
1. Pengukuran (measurement)
2. Pemotongan (cutting)
3. Jahit (sewing) — ada **upah jahit** (labor cost)
4. Finishing (ironing, packaging)
5. QC (quality control)

**Status per stage:**
- `not_started` → `in_progress` → `completed`

**Duration:**
- Owner set `estimated_duration` (hours/days) per stage per order
- Catat `actual_start_time`, `actual_end_time`
- Hitung `actual_duration` = end - start

**Implementation:**
- Tabel `production_timelines`:
  - `order_id`, `stage_name`, `status`, `estimated_duration`, `actual_start`, `actual_end`
- UI: Gantt chart / kanban board (future)

---

## 7. Labor Cost

**Scope:**
- **Upah jahit** per order (manual input saat stage "Jahit")
- **Ongkir** per order (manual input saat kirim)

**Out of scope (Phase 1):**
- Listrik (gabung rumah, tidak bisa dipisah)
- Overhead lain (rent, maintenance) — bisa ditambahkan nanti sebagai fixed cost per bulan

---

## 8. Reporting

### **Laporan yang Dibutuhkan:**

**Per Order:**
- Material breakdown (kain A: X kg @ Rp Y = Rp Z)
- Labor cost (upah jahit)
- HPP (total material + labor)
- Harga jual (calculated or override)
- Ongkir
- **Profit/Loss** = Harga jual - HPP - Ongkir
- Profit margin % = (Profit / Harga jual) × 100

**Per Period (bulan/tahun):**
- Total orders
- Total revenue (omzet)
- Total HPP
- Total ongkir
- **Gross profit** = Revenue - HPP - Ongkir
- Profit margin % = (Gross profit / Revenue) × 100

**Inventory:**
- Per kain: stok tersedia (kg)
- Nilai stok (qty × avg price atau FIFO last batch price)
- Alerts: stok menipis (future)

---

## 9. Out of Scope (Phase 1)

- Multi-user / role-based access control
- Customer CRM (hanya nama/kontak sederhana)
- Supplier management (hanya catat nama supplier, tidak ada PO workflow)
- Payment tracking (invoice, payment status)
- Inventory reorder alerts (manual check stok)
- Mobile app (web responsive cukup)

---

## 10. Next Steps

- ✅ Design decisions locked
- ⏳ **ERD (Entity Relationship Diagram)**
- ⏳ **Database Schema (Prisma schema.prisma)**
- ⏳ **API Contract (REST endpoints)**
- ⏳ **UI Wireframe (screen flow)**
- ⏳ **Implementation timeline**

---

**Approved by:** Owner (Alan)  
**Ready for:** Database schema design
