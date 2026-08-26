# ADR-0001: FabricColor sebagai entitas terpisah antara Fabric dan FabricBatch

**Date:** 2026-08-26
**Status:** Accepted

## Context

Client meminta kain memiliki atribut warna. Satu jenis kain (misal Cotton Combed 30s)
bisa punya banyak warna (Putih, Hitam, Merah). Stok, pembelian, dan BOM harus
beroperasi pada level warna — bukan hanya level jenis kain.

## Decision

Tambah model `FabricColor` di antara `Fabric` dan `FabricBatch`:

```
Fabric (1) → (N) FabricColor (1) → (N) FabricBatch
                      ↑
               BomItem.fabricColorId
```

### Model `FabricColor`
- `id` — cuid
- `fabricId` — FK ke Fabric
- `colorName` — text bebas (input oleh user saat pertama kali beli)
- `isActive` — boolean
- Warna **lahir dari pembelian pertama** — tidak ada master warna terpisah

### FabricBatch (diubah)
- FK: `fabricColorId` (bukan `fabricId`)
- Satu batch = satu pembelian warna tertentu

### BomItem (diubah)
- FK: `fabricColorId` (bukan `fabricId`)
- Display di UI: `{fabricName} — {colorName}` (contoh: "Cotton Combed 30s — Putih")

### FIFO
- Beroperasi per `FabricColor`
- Batch warna berbeda tidak saling menggantikan

## UI Impact

**Inventory page (list):** Grid per `Fabric` — tampilkan total stok semua warna
**Inventory detail:** List rows per `FabricColor` — `Putih: 20 kg`, `Hitam: 15 kg`
**Dialog BOM:** Hierarki 2 level — pilih Fabric → pilih FabricColor
**Dialog Tambah Pembelian:** Input `colorName` (text bebas) + pilih Fabric

## Migration

Reset DB (project masih development) — tidak ada migrasi data lama.
`FABRIC_CATALOG` di `lib/master-data.ts` tetap (24 jenis kain), tidak berubah.

## Alternatives considered

- Warna sebagai field di `FabricBatch`: ditolak — tidak bisa track stok per warna tanpa aggregate
- Master list warna: ditolak — terlalu banyak variasinya, input bebas lebih praktis
- Warna sebagai field di `Fabric`: ditolak — satu Fabric bisa punya banyak warna dengan stok berbeda
