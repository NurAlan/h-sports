# ADR-0004: Pemilihan Batch Manual di BOM, Auto-Costing Sync, dan Penghapusan Inventory

**Date:** 2026-09-02
**Status:** Accepted

## Context

Sebelumnya, alur pemilihan kain di BOM menghitung harga rata-rata (*weighted average*) dari sisa stok warna kain dan mengasumsikan input persentase waste (serta membatasi hanya 1 baris per warna kain per order).
Selain itu, ketika BOM diubah, data `OrderCosting` tidak tersinkronisasi secara otomatis sampai user membuka kalkulator costing manual.
Pada menu Inventory, belum ada fitur untuk menghapus kain atau warna yang belum pernah digunakan dalam pesanan/produksi.

## Decision

1. **Pemilihan Bahan Manual per Batch (Stok)**:
   - User memilih jenis kain → warna → batch pembelian spesifik (tanggal pembelian & harga kain) → jumlah satuan (kg).
   - Input persentase waste dihilangkan (`wastePct = 0`, `qtyActual = qtyRequired`).
   - Harga kain `pricePerKg` diambil murni dari batch yang dipilih (bukan average).
   - Mendukung pemilihan multi-batch untuk warna yang sama pada 1 order (misal 5 kg dari Batch A dan 7 kg dari Batch B).
   - Constraint database diubah dari `@@unique([orderId, fabricColorId])` menjadi `@@unique([orderId, batchId])`.

2. **Auto-Costing Sync & Confirmation**:
   - Setiap kali bahan di BOM ditambah, diedit, atau dihapus, server otomatis memperbarui `OrderCosting.materialCost` dan menghitung ulang HPP, selling price, serta profit berdasarkan metode pricing yang aktif.
   - UI langsung membuka modal dialog Costing secara otomatis agar user dapat memverifikasi dan mengonfirmasi harga jual akhir.

3. **Fitur Hapus di Menu Inventory (Menu Titik Tiga)**:
   - Titik tiga pada kartu Master Kain di `/inventory`: Opsi "Hapus Kain". Ditolak jika kain memiliki item di pesanan (termasuk status Draft) atau produksi.
   - Titik tiga pada Warna di `/inventory/[id]`: Opsi "Hapus Warna". Ditolak jika warna terikat pada BOM pesanan (Draft/Produksi).
   - Titik tiga pada Batch di `/inventory/[id]`: Opsi "Hapus Batch". Validasi ketat: jika batch sedang ada di BOM pesanan Draft, user harus menghapusnya dari BOM terlebih dahulu sebelum batch dapat dihapus.

4. **Visibilitas Batch**:
   - Kartu BOM di halaman detail order menampilkan informasi batch secara jelas: Tanggal Pembelian, Supplier, dan Harga/kg.
