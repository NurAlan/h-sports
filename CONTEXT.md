# H-Sport — Domain Glossary

> Kamus istilah domain bisnis H-Sport. Gunakan vocabulary ini di semua issue title, kode, komentar, dan dokumentasi. Jangan gunakan sinonim yang tidak terdaftar.

---

## Entitas Inti

**Fabric** (Kain)
Master data jenis kain. Contoh: "Cotton Combed 30s". Setiap Fabric punya `reorderPoint` sebagai ambang batas stok menipis. Fabric yang sudah memiliki batch pembelian tidak bisa dihapus.

**FabricBatch** (Batch Pembelian)
Satu transaksi pembelian kain. Setiap batch menyimpan `qtyPurchased`, `qtyRemaining`, `pricePerKg`, dan `purchaseDate`. Sistem FIFO mengalokasikan dari batch tertua.

**Order**
Pesanan kaos dari customer. Status lifecycle: `draft` → `in_production` → `qc` → `shipped`. Order tanpa status `shipped` tidak masuk laporan profit.

**BOM** / **BomItem** (Bill of Materials / Komposisi Bahan)
Daftar kain yang dibutuhkan untuk satu Order. Setiap item menyimpan `qtyRequired` (kebutuhan bersih), `wastePct` (persentase sisa potongan), dan `qtyActual = qtyRequired × (1 + wastePct/100)`. Stok dikurangi sebesar `qtyActual`, bukan `qtyRequired`.

**ProductionTimeline** (Timeline Produksi)
5 stage produksi per Order: `pengukuran`, `pemotongan`, `jahit`, `finishing`, `qc`. Status per stage: `not_started` → `in_progress` → `completed`. Syarat maju ke QC: semua stage non-QC `completed`. Syarat Selesai: stage QC `completed`.

**OrderCosting** (Costing)
Data HPP dan harga jual per Order. `hpp = materialCost + laborCost`. Dua metode harga jual: `markup` (HPP × (1 + markupPct/100)) atau `fixed_profit` (HPP + fixedProfit). `profit = sellingPrice - hpp - shippingCost`.

**BatchUsage** (Pemakaian Batch)
Catatan FIFO deduction: batch mana yang dikurangi berapa kg untuk order tertentu. Dibuat saat Order berubah status ke `in_production`.

**MonthlySummary** (Ringkasan Bulanan)
Tabel precompute untuk chart historis. *Tidak dipakai untuk dashboard real-time* — dashboard dan laporan menghitung langsung dari `orders + costing` yang berstatus `shipped`.

---

## Konsep Bisnis

**HPP** (Harga Pokok Produksi)
`materialCost + laborCost`. Tidak termasuk ongkir.

**Material Cost**
`qtyActual × pricePerKg` — menggunakan harga rata-rata FIFO dari sisa stok batch.

**Waste**
Sisa potongan kain. Masuk HPP (Opsi A). Dicatat sebagai `wastePct` di BomItem.

**FIFO Deduction**
Proses pengurangan stok saat Order masuk `in_production`. Batch tertua dikurangi dulu. Jika stok tidak cukup, sistem menolak dengan error 400.

**Profit**
`sellingPrice - hpp - shippingCost`. Hanya dihitung untuk Order berstatus `shipped`.

**Low Stock**
Kondisi saat `stock > 0` dan `stock ≤ reorderPoint`. Kain dengan stok 0 (belum pernah dibeli) tidak dianggap low stock.

---

## Status Order

| Status | Label UI | Transisi |
|--------|----------|----------|
| `draft` | Draft | → `in_production` (bebas, asalkan stok cukup) |
| `in_production` | Produksi | → `qc` (semua stage produksi completed) |
| `qc` | QC | → `shipped` (stage qc completed) |
| `shipped` | Selesai | — (terminal) |

---

## Istilah yang Dihindari

- ❌ "sold" → gunakan `shipped`
- ❌ "product" → gunakan `Order` atau `BomItem`
- ❌ "inventory" (untuk jenis kain) → gunakan `Fabric`
- ❌ "stock" → gunakan `qtyRemaining` atau `stok` (bahasa Indonesia, konteks UI)
- ❌ "cost" tanpa qualifier → spesifikasikan: `materialCost`, `laborCost`, `hpp`, atau `shippingCost`
