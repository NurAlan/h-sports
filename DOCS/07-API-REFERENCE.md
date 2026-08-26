# H-Sport: API Reference

**Base URL:** `/api/`
**Auth:** Semua endpoint memerlukan session Supabase (cookie `sb-*`). Diverifikasi via `requireUser()` di `lib/api-auth.ts`.
**Content-Type:** `application/json`

---

## Fabrics (Kain)

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/fabrics` | GET | List semua kain aktif (termasuk usage count) |
| `/api/fabrics` | POST | Tambah kain baru |
| `/api/fabrics/[id]` | GET | Detail satu kain |
| `/api/fabrics/[id]` | PATCH | Edit nama/unit/reorderPoint |
| `/api/fabrics/[id]` | DELETE | Hapus kain (409 jika ada batch/BOM) |

```json
// POST /api/fabrics
{ "name": "Cotton Carded 32s", "unit": "kg", "reorderPoint": 5 }
```

---

## Fabric Batches (Pembelian)

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/fabric-batches?fabricId=x` | GET | Riwayat batch per kain |
| `/api/fabric-batches` | POST | Tambah pembelian (batch baru) |
| `/api/fabric-batches/[id]` | PATCH | Edit data batch |

```json
// POST /api/fabric-batches
{ "fabricId": "xxx", "supplierName": "Supplier A", "purchaseDate": "2026-08-01", "qtyPurchased": 20, "pricePerKg": 50000 }
```

---

## Orders

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/orders?status=&search=` | GET | List order (filter + search) |
| `/api/orders` | POST | Buat order baru |
| `/api/orders/[id]` | GET | Detail order (BOM + timeline + costing) |
| `/api/orders/[id]` | PATCH | Update status |
| `/api/orders/[id]` | DELETE | Hapus order |

**PATCH — Update Status (dengan FIFO trigger saat → in_production)**
```json
{ "status": "in_production" }
```
> ⚠️ Saat pindah ke `in_production`: FIFO deduction dijalankan. Error 400 jika stok tidak cukup.

Status flow: `draft` → `in_production` → `qc` → `shipped`

---

## BOM (Bill of Materials)

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/orders/[id]/bom` | GET | List bahan order |
| `/api/orders/[id]/bom` | POST | Tambah bahan ke BOM |
| `/api/orders/[id]/bom/[bomId]` | PATCH | Edit qty/waste bahan |
| `/api/orders/[id]/bom/[bomId]` | DELETE | Hapus bahan dari BOM |

```json
// POST /api/orders/[id]/bom
{ "fabricId": "xxx", "qtyRequired": 10, "wastePercentage": 10 }
```
> Harga diambil dari rata-rata FIFO (weighted dari sisa stok). Stok dicek saat validasi.

---

## Production Timeline

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/orders/[id]/timeline` | GET | List stages produksi |
| `/api/orders/[id]/timeline` | POST | Simpan stages (replace all) |

```json
// POST /api/orders/[id]/timeline
{ "stages": [
  { "stageName": "pengukuran", "status": "completed" },
  { "stageName": "pemotongan", "status": "completed" },
  { "stageName": "jahit", "status": "in_progress" },
  { "stageName": "finishing", "status": "not_started" },
  { "stageName": "qc", "status": "not_started" }
] }
```

---

## Costing

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/orders/[id]/costing` | GET | Data costing |
| `/api/orders/[id]/costing` | PUT | Simpan/update costing |

```json
// PUT /api/orders/[id]/costing
{ "laborCost": "500000", "pricingMethod": "markup", "markupPct": "30", "shippingCost": "50000" }
```
> Material cost dihitung server-side dari BOM. HPP = material + labor. Profit = sellingPrice - HPP - shipping.

---

## Dashboard & Reports

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/dashboard` | GET | thisMonth/lastMonth profit, summaries 6 bulan, stok, low stock, active orders |
| `/api/reports?start=&end=` | GET | Summary + orders + summaries (filter date range) |
| `/api/production` | GET | Order aktif (in_production/qc) + timeline |
| `/api/inventory` | GET | Fabrics dengan stok (hanya yg punya batch), avg price, last purchase |

> Dashboard dan reports menghitung **langsung dari orders shipped**, bukan dari `monthly_summaries`.

---

## FIFO Deduction Logic (`lib/fifo.ts`)

```
Order → in_production
  → Baca BOM items (qty_actual per kain)
  → Per kain: sort FabricBatch by purchaseDate ASC
  → Kurangi dari batch tertua sampai kebutuhan terpenuhi
  → Catat setiap potongan di BatchUsage
  → Jika total stok < kebutuhan → rollback + error 400
```

---

## Workflow Validasi Status

| Dari | Ke | Syarat |
|------|-----|--------|
| draft | in_production | Stok cukup untuk semua BomItem |
| in_production | qc | Semua stage non-QC `completed` |
| qc | shipped | Stage QC `completed` |
