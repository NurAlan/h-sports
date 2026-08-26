# H-Sport: Business Requirements Document (BRD)

**Tanggal:** 25 Agustus 2026
**Status:** ✅ Implemented — API + DB + UI selesai, deployed ke Vercel
**Stakeholder:** Owner (single user)

---

## 1. Problem Statement

Perusahaan tekstil skala kecil menghadapi masalah pencatatan dan visibilitas:

1. ❌ **Tidak ada laporan untung/rugi** per order kaos
2. ❌ **Tidak ada pencatatan pembelian & stok kain** (historical pricing, waste)
3. ❌ **Tidak ada tracking progress produksi** (timeline per stage)

---

## 2. User Persona

### **Owner (Primary User)**
- **Peran:** Operator tunggal (gudang, produksi, akuntansi, sales)
- **Kebutuhan:**
  - Tahu real-time stok kain
  - Hitung HPP (Harga Pokok Produksi) per order
  - Tentukan harga jual dengan markup/profit target
  - Monitor progress produksi
  - Lihat laporan profit per order & periode

---

## 3. Core Workflow

```
Terima Order → Cek/Beli Stok Kain → Buat BOM → Mulai Produksi
  → Update Timeline → Masuk QC → Tandai Selesai → Profit tercatat
```

Detail:
- **BOM**: menentukan kain + qty + waste% per order
- **Produksi**: 5 stage — Pengukuran, Pemotongan, Jahit, Finishing, QC
- **Stok berkurang**: saat order berubah dari `draft` → `in_production` (FIFO)
- **Profit masuk laporan**: hanya setelah status `shipped`

---

## 4. Keputusan Desain (Locked)

| Topik | Keputusan |
|-------|-----------|
| Waste treatment | Masuk HPP (Opsi A) — `qty_actual = qty_required × (1 + waste%)` |
| Inventory costing | FIFO — batch tertua dipakai dulu |
| Stok berkurang | Saat order → `in_production`, bukan saat tambah BOM |
| Auth | Supabase Auth (Google + email/password), signup OFF |
| Dashboard data | Dihitung real-time dari orders (bukan `monthly_summaries`) |

---

## 5. Fitur Phase 1 (Implemented)

- ✅ Auth Supabase (Google OAuth + email/password)
- ✅ Master kain (24 jenis, CRUD)
- ✅ Pembelian kain per batch (FIFO tracking)
- ✅ Order management (draft → produksi → QC → selesai)
- ✅ BOM per order (kain, qty, waste, material cost)
- ✅ Timeline produksi (5 stage, status per stage)
- ✅ Costing calculator (HPP, harga jual, profit)
- ✅ Dashboard (profit bulan ini, chart 6 bulan, stok donut)
- ✅ Laporan (filter periode, export CSV)
- ✅ In-app tutorial (tombol Panduan per halaman)
- ✅ Skeleton loading, FAB, bottom nav

---

## 6. Out of Scope (Phase 1)

- Multi-user / role management
- Supplier management (hanya catat nama supplier)
- Customer CRM (hanya catat nama/kontak sederhana)
- Inventory reorder alert otomatis
- Integrasi payment gateway / invoicing
