# H-Sport — Implementation Summary

**Status:** ✅ Full-stack implemented — UI + Auth + API + DB + Deploy
**Dev Server:** http://localhost:3000
**Production:** https://h-sports-zeta.vercel.app
**Repo:** github.com/NurAlan/h-sports
**Tech Stack:** Next.js 16 + TypeScript + Tailwind CSS v4 + shadcn/ui + Recharts + Prisma 6.19.3 + Supabase

---

## 📱 Halaman (12 halaman)

| Halaman | Route | Fitur Utama |
|---------|-------|-------------|
| Login | `/login` | Google OAuth + email/password, error param cleared setelah tampil |
| Dashboard | `/` | Hero profit bulan ini, chart omzet 6 bulan, donut stok kain, stat cards, deadline list, low stock alert |
| Orders | `/orders` | List + filter status + search, warna deadline, FAB buat order |
| Order Detail | `/orders/[id]` | BOM (edit/hapus/tambah), timeline produksi, costing HPP, workflow stepper (draft→produksi→QC→selesai) |
| Inventory | `/inventory` | Grid 2 kolom, hanya kain yang pernah dibeli, search, low-stock merah, FAB tambah pembelian |
| Inventory Detail | `/inventory/[id]` | Riwayat batch, progress bar sisa stok, edit batch harga, FAB tambah stok (auto-fill) |
| Production | `/production` | Order aktif (in_production/qc), progress stage, update timeline dialog |
| Reports | `/reports` | Preset periode, summary cards, bar chart omzet vs HPP, tabel detail, export CSV |
| Profile | `/profile` | Menu: Pengaturan, Master Fabric, Laporan, Logout |
| Profile Settings | `/profile/settings` | Form edit nama, usaha, email, telepon |
| Master Fabric | `/profile/fabrics` | CRUD 24 jenis kain, search, edit, hapus (proteksi jika ada riwayat) |

---

## 🧩 Dialogs (5 dialog utama)

| Dialog | File | Auto-fill |
|--------|------|-----------|
| Buat Order | `create-order-dialog.tsx` | — |
| Tambah Pembelian Kain | `add-fabric-purchase-dialog.tsx` | Jenis kain, harga, supplier dari inventory detail |
| Tambah BOM | `add-bom-item-dialog.tsx` | Hanya kain stok > 0, stok real dari DB |
| Update Timeline | `update-timeline-dialog.tsx` | currentStages dari order (sync via useEffect) |
| Costing | `costing-calculator-dialog.tsx` | Material cost dari BOM API, live kalkulasi |

**Semua dialog:** rounded-2xl floating, DialogBody (px-5), DialogFooter horizontal, loading spinner + disabled saat submit.

---

## 🗄️ Database (8 model Prisma)

| Model | Tabel | Keterangan |
|-------|-------|------------|
| Profile | `profiles` | UUID, terhubung ke auth.users Supabase |
| Fabric | `fabrics` | Master kain, cuid, reorderPoint |
| FabricBatch | `fabric_batches` | Per pembelian (FIFO), qtyRemaining |
| Order | `orders` | Status: draft/in_production/qc/shipped |
| BomItem | `bom_items` | qty_required + waste% → qty_actual |
| ProductionTimeline | `production_timelines` | 5 stage, not_started/in_progress/completed |
| OrderCosting | `order_costing` | HPP, markup/fixed_profit, shipping, profit |
| BatchUsage | `batch_usage` | FIFO deduction log (batch × order × qty_used) |
| MonthlySummary | `monthly_summaries` | Tabel precompute (tidak dipakai dashboard, untuk masa depan) |

---

## 🔌 API Routes (14 endpoint)

| Route | Methods |
|-------|---------|
| `/api/fabrics` | GET, POST |
| `/api/fabrics/[id]` | GET, PATCH, DELETE |
| `/api/fabric-batches` | GET, POST |
| `/api/fabric-batches/[id]` | PATCH |
| `/api/orders` | GET, POST |
| `/api/orders/[id]` | GET, PATCH, DELETE |
| `/api/orders/[id]/bom` | GET, POST |
| `/api/orders/[id]/bom/[bomId]` | PATCH, DELETE |
| `/api/orders/[id]/timeline` | GET, POST |
| `/api/orders/[id]/costing` | GET, PUT |
| `/api/dashboard` | GET |
| `/api/reports` | GET |
| `/api/production` | GET |
| `/api/inventory` | GET |

---

## 🔑 Key Libraries & Files

| File | Fungsi |
|------|--------|
| `lib/fifo.ts` | FIFO deduction logic (allocateFabricFIFO) |
| `lib/api-auth.ts` | requireUser() — verifikasi session per request |
| `lib/prisma.ts` | Singleton PrismaClient |
| `lib/api.ts` | Client fetch helper (api.get/post/patch/put/del) |
| `lib/master-data.ts` | FABRIC_CATALOG (24 kain, source of truth untuk seed + UI) |
| `lib/utils.ts` | formatRupiah, formatDate, daysUntil, profitColor |
| `components/skeletons.tsx` | Skeleton loading: Dashboard, Order, Fabric, Detail, Reports |
| `components/ui/currency-input.tsx` | Input nominal uang format Indonesia (500.000) |

---

## ⚙️ Setup Perintah

```bash
cd /Users/nuralan/Personal/sanbox/hsport/app
npm run dev          # dev server
npm run build        # production build
npm run db:push      # push schema ke Supabase
npm run db:seed      # seed 24 kain dari FABRIC_CATALOG
npm run db:studio    # Prisma Studio
# JANGAN: npx prisma (→ Prisma 8 RC)
```

---

## 📊 Statistik

- **Halaman:** 12 (+ _not-found)
- **API Routes:** 14 endpoint
- **Prisma Models:** 8
- **Dialog:** 5 utama + 2 inline (edit/hapus BOM)
- **Build:** ✅ Compiled successfully
- **Deploy:** ✅ Vercel auto-deploy dari GitHub push
