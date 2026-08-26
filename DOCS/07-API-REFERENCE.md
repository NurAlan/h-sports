# H-Sport: API Reference

**Base URL:** `/api/`  
**Auth:** Semua endpoint memerlukan session Supabase (cookie `hsport-session`).  
**Content-Type:** `application/json`  

---

## Auth

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `POST /auth/callback` | GET | Exchange OAuth code → session (internal, dipanggil Google) |

---

## Fabrics (Kain)

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/fabrics` | GET | List semua kain (termasuk usage count) |
| `/api/fabrics` | POST | Tambah kain baru |
| `/api/fabrics/[id]` | PATCH | Edit nama/unit/reorderPoint |
| `/api/fabrics/[id]` | DELETE | Hapus kain (hanya jika belum dipakai) |

**POST /api/fabrics**
```json
{ "name": "Cotton Carded 32s", "unit": "kg", "reorderPoint": 5 }
```

**PATCH /api/fabrics/[id]**
```json
{ "name": "Cotton Combed 30s (Baru)", "unit": "kg" }
```

---

## Fabric Batches (Pembelian)

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/fabric-batches?fabricId=x` | GET | Riwayat batch per kain |
| `/api/fabric-batches` | POST | Tambah pembelian (batch baru) |
| `/api/fabric-batches/[id]` | PATCH | Edit data batch |

**POST /api/fabric-batches**
```json
{ "fabricId": "xxx", "supplierName": "Supplier A", "purchaseDate": "2026-08-01", "qtyPurchased": 20, "pricePerKg": 50000 }
```

---

## Orders

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/orders?status=&search=` | GET | List order (filter + search) |
| `/api/orders` | POST | Buat order baru |
| `/api/orders/[id]` | GET | Detail order (BOM + timeline + costing) |
| `/api/orders/[id]` | PATCH | Update status (draft → produksi → qc → shipped) |
| `/api/orders/[id]` | DELETE | Hapus order |

**PATCH /api/orders/[id] — Update Status (dengan FIFO trigger)**
```json
{ "status": "in_production" }
```
> ⚠️ Saat pindah ke `in_production`: sistem akan menjalankan **FIFO deduction** — mengurangi stok batch tertua sesuai BOM. Jika stok tidak cukup, return error 400.

---

## BOM (Bill of Materials)

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/orders/[id]/bom` | GET | List bahan order |
| `/api/orders/[id]/bom` | POST | Tambah bahan ke BOM |

**POST /api/orders/[id]/bom**
```json
{ "fabricId": "xxx", "qtyRequired": 10, "wastePercentage": 10 }
```
> Harga diambil dari **rata-rata FIFO** (weighted dari sisa stok batch). Stok dicek — jika tidak cukup, return error 400.

---

## Production Timeline

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/orders/[id]/timeline` | GET | List stages produksi |
| `/api/orders/[id]/timeline` | POST | Simpan stages (replace all) |

**POST /api/orders/[id]/timeline**
```json
{ "stages": [
  { "stageName": "Pengukuran", "status": "completed", "estimatedHrs": 2 },
  { "stageName": "Pemotongan", "status": "completed", "estimatedHrs": 4 },
  { "stageName": "Jahit", "status": "in_progress", "estimatedHrs": 12 },
  { "stageName": "Finishing", "status": "not_started", "estimatedHrs": 3 },
  { "stageName": "QC", "status": "not_started", "estimatedHrs": 1 }
] }
```

---

## Costing

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/orders/[id]/costing` | GET | Data costing |
| `/api/orders/[id]/costing` | PUT | Simpan/update costing |

**PUT /api/orders/[id]/costing**
```json
{ "laborCost": 500000, "pricingMethod": "markup", "markupPct": 30, "shippingCost": 50000 }
```
> Material cost dihitung server-side dari BOM. HPP = material + labor. Profit = selling price - HPP - shipping.

---

## Dashboard & Reports

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/dashboard` | GET | Summary: monthly summaries, total stok, low stock, active orders |
| `/api/reports?start=2026-08-01&end=2026-08-31` | GET | Laporan: summary + orders + monthly summaries |
| `/api/production` | GET | Order aktif + timeline (untuk halaman production) |

---

## ⚖️ FIFO Deduction Logic (lib/fifo.ts)

```
Order masuk "Produksi"
  → BOM items (qty_actual)
  → Cari batch tertua (purchaseDate ASC)
  → Ambil stok dari batch tertua, kurangi sisa batch
  → Catat di batch_usage
  → Jika stok batch habis, lanjut ke batch berikutnya
  → Jika total stok tidak cukup → error 400
```

---

## ✅ Checklist Integrasi UI → API

- [ ] Ganti `lib/mock-data.ts` → panggil API via `fetch` atau `useSWR`/`react-query`
- [ ] Form submit → `POST` / `PATCH` API
- [ ] Hapus item → `DELETE` API
- [ ] State loading + error handling
- [ ] Hapus `lib/mock-data.ts` setelah semua ter-wire