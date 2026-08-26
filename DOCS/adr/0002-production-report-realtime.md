# ADR-0002: Laporan Produksi dihitung real-time via Prisma (bukan DB View)

## Status
Accepted

## Context
Laporan Produksi (`/reports/produksi`) harus menampilkan pipeline per status, on-time
rate, antrian QC, serta omzet & profit, semuanya ter-filter oleh date range. Semula
dipertimbangkan membuat PostgreSQL VIEW (`v_production_report`) yang di-query via Prisma.

## Decision
Laporan Produksi dihitung **real-time** di API (`GET /api/reports/produksi`) menggunakan
Prisma ORM: `order.findMany({ where: { orderDate: { gte, lte } }, include: { costing,
timelines } })`, lalu agregasi di aplikasi. Tidak membuat DB VIEW.

## Trade-off
- **Pro**: tidak butuh migrasi DB, langsung akurat terhadap filter `start`/`end`,
  mudah diubah (tambah metrik = ubah kode, bukan schema). Cocok karena volume order
  masih kecil.
- **Con**: agregasi di app, bukan di DB — bila volume order membesar, perlu beralih ke
  VIEW/materialized summary agar query tetap ringan.

## Alternatives considered
- PostgreSQL VIEW + model Prisma read-only: lebih efisien di skala besar, tapi butuh
  migrasi yang harus diaplikasikan ke Supabase dan menambah beban operasional.
- Pakai `MonthlySummary` yang sudah ada: tidak punya data stage/timeline, sehingga
  tidak bisa menghitung on-time & pipeline.

## Consequences
API laporan bergantung pada relasi `costing` & `timelines` yang `include` di query.
Jika suatu saat perlu performa, migrasi ke VIEW adalah langkah evolusioner yang aman.
