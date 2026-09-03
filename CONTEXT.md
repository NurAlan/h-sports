# H-Sport — Domain Glossary

> Kamus istilah domain bisnis H-Sport. Gunakan vocabulary ini di semua issue title, kode, komentar, dan dokumentasi. Jangan gunakan sinonim yang tidak terdaftar.

---

## Entitas Inti

**Fabric** (Kain)
Master data jenis kain. Contoh: "Cotton Combed 30s". Setiap Fabric punya `reorderPoint` sebagai ambang batas stok menipis. Fabric yang sudah memiliki FabricColor tidak bisa dihapus.

**FabricColor** (Warna Kain)
Warna spesifik dari satu Fabric. Contoh: Cotton Combed 30s → Putih, Hitam, Merah. Warna lahir dari pembelian pertama — tidak ada master warna terpisah. Stok dan BOM beroperasi pada level FabricColor, bukan Fabric. `colorName` adalah text bebas.

**FabricBatch** (Batch Pembelian)
Satu transaksi pembelian kain per warna. FK ke `fabricColorId`. Setiap batch menyimpan `qtyPurchased`, `qtyRemaining`, `pricePerKg`, dan `purchaseDate`. User memilih batch secara manual saat membuat BOM.

**Order**
Pesanan kaos dari customer. Status lifecycle: `draft` → `in_production` → `qc` → `shipped`. Order tanpa status `shipped` tidak masuk laporan profit.

**BOM** / **BomItem** (Bill of Materials / Komposisi Bahan)
Daftar batch kain yang dibutuhkan untuk satu Order. Setiap item memilih `batchId` spesifik (menyimpan tanggal pembelian dan harga per kg). Constraint `@@unique([orderId, batchId])` memungkinkan multi-batch untuk warna kain yang sama. Display di UI: `{fabricName} — {colorName}` beserta info tanggal batch pembelian dan harga/kg.

**ProductionTimeline** (Timeline Produksi)
5 stage produksi per Order: `pengukuran`, `pemotongan`, `jahit`, `finishing`, `qc`. Status per stage: `not_started` → `in_progress` → `completed`. Syarat maju ke QC: semua stage non-QC `completed`. Syarat Selesai: stage QC `completed`.

**OrderCosting** (Costing)
Data HPP dan harga jual per Order. `hpp = materialCost + laborCost`. Dua metode harga jual: `markup` (HPP × (1 + markupPct/100)) atau `fixed_profit` (HPP + fixedProfit). `profit = sellingPrice - hpp - shippingCost`. Tersinkronisasi otomatis setiap kali BOM berubah.

**BatchUsage** (Pemakaian Batch)
Audit trail untuk tracking: batch mana yang dikurangi berapa kg untuk order tertentu. Dibuat saat Order berubah status ke `in_production`, berdasarkan batch yang sudah dipilih user di BOM.

**MonthlySummary** (Ringkasan Bulanan)
Tabel precompute untuk chart historis. *Tidak dipakai untuk dashboard real-time* — dashboard dan laporan menghitung langsung dari `orders + costing` yang berstatus `shipped`.

---

## Konsep Bisnis

**HPP** (Harga Pokok Produksi)
`materialCost + laborCost`. Tidak termasuk ongkir.

**Material Cost**
`qtyRequired × pricePerKg` — dihitung dari harga batch pembelian spesifik yang dipilih manual oleh user pada saat menyusun BOM (bukan averaging).

**Waste**
Input persentase waste dihilangkan pada alur pemilihan BOM baru (`qtyActual = qtyRequired`).

**Batch Selection**
User memilih batch secara manual saat membuat BOM. Setiap BOM item terikat ke `batchId` spesifik. Saat order masuk produksi, stok dipotong dari batch yang sudah dipilih tersebut.

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

## Laporan

**Laporan**
Tampilan agregat lintas periode (bulanan / rentang tanggal) untuk pengambilan keputusan. Berbeda dari layar operasional real-time (detail Order, Timeline). Sumber data: `Order` + `OrderCosting` + `ProductionTimeline`, dihitung real-time via Prisma (bukan `MonthlySummary`).

**Laporan Produksi**
Sub-jenis laporan yang memaparkan `pipeline` order per status, `on-time rate`, `antrian QC`, serta `omzet` & `profit` produksi dalam rentang tanggal. Berbeda dari `/production` (Timeline produksi real-time). Route terpisah: `/reports/produksi`.

**On-time**
Order dianggap on-time bila `status = shipped` DAN `actualEnd ≤ deadline`. `actualEnd` = nilai `actualEnd` terbesar antar stage di `ProductionTimeline`. Bila belum `shipped`, on-time = `null` (tidak dihitung ke dalam rate).

**Pipeline**
Distribusi order per `status` (`draft` / `in_production` / `qc` / `shipped`) dalam rentang tanggal laporan.

**Antrian QC**
Jumlah order berstatus `qc` (menunggu masuk QC) dalam rentang tanggal laporan.

**Date-range filter**
Semua metrik laporan difilter oleh `orderDate` antara `start` dan `end` (param `?start=&end=` di API laporan).

---

## Laporan

**Reports Hub**
Pintu masuk tunggal semua laporan di `/reports`, dengan sub-navigasi tab:
**Keuangan** | **Produksi** | **Customer**. Tab switch tanpa reload; filter
periode (`PeriodFilter`) dibagikan ke semua tab.

**Laporan Keuangan** (tab "Keuangan")
Agregat profit: KPI (Omzet/HPP/Profit/Margin) dengan sparkline + delta vs periode
lalu, tren Profit & Margin (6 bulan), dan tabel detail order. Order dengan
`profit < 0` ditandai baris merah (rugi). Tidak memuat card "Top Customer" maupun
"Kain Terbanyak Dipakai" — keduanya dipindah ke tab lain.

**Laporan Produksi** (tab "Produksi", route `/reports/produksi`)
Pipeline, on-time, progres stage, serta **Kain Terbanyak Dipakai** (agregat
`BomItem` per `fabricId` dalam rentang tanggal). Lihat juga entri Laporan Produksi
di bawah.

**Laporan Customer** (tab "Customer")
Breakdown customer berdasarkan profit: share %, jumlah order, dan total profit
(diurut profit tertinggi).

---

## Istilah yang Dihindari

- ❌ "sold" → gunakan `shipped`
- ❌ "product" → gunakan `Order` atau `BomItem`
- ❌ "inventory" (untuk jenis kain) → gunakan `Fabric`
- ❌ "stock" → gunakan `qtyRemaining` atau `stok` (bahasa Indonesia, konteks UI)
- ❌ "cost" tanpa qualifier → spesifikasikan: `materialCost`, `laborCost`, `hpp`, atau `shippingCost`

**Biaya Lain** (OtherCost)
Biaya produksi di luar material kain dan upah, seperti sablon, resleting, dan aksesoris lainnya. Disimpan per-item di tabel `OrderCostItem` (label, amount, keterangan) dan totalnya di-bake ke `OrderCosting.otherCostTotal`. Masuk ke HPP sehingga markup berlaku atas biaya lain.

**OrderCostItem** (Item Biaya Lain)
Satu baris biaya lain dalam satu Order. Berisi `label`, `amount` (nominal total), dan `keterangan` opsional.
