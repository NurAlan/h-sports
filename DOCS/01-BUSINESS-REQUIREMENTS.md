# H-Sport: Business Requirements Document (BRD)

**Tanggal:** 25 Agustus 2026  
**Status:** ✅ Final — Design dikunci & UI prototype selesai (API pending)  
**Stakeholder:** Owner (single user, prototype phase)

---

## 1. Problem Statement

Client (perusahaan tekstil skala kecil) menghadapi masalah pencatatan dan visibilitas:

1. ❌ **Tidak ada laporan untung/rugi** per order kaos
2. ❌ **Tidak ada pencatatan pembelian & stok kain** (historical pricing, waste)
3. ❌ **Tidak ada tracking progress produksi** (timeline per stage)

Akibatnya:
- Owner tidak tahu apakah order tertentu menghasilkan profit atau loss
- Tidak bisa track berapa sisa stok kain yang tersedia
- Tidak bisa estimasi kapan order selesai

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
┌─────────────┐
│ Terima Order│ ← Customer pesan kaos (qty, spesifikasi)
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│ Cek/Beli Stok Kain      │ ← Jika stok tidak cukup, catat pembelian baru
│ (Procurement)           │   (kg, harga kulak, supplier, tanggal)
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Buat Komposisi/BOM      │ ← Tentukan bahan per kaos:
│ (Bill of Materials)     │   - Kain A: 0.3 kg @ Rp X/kg
│                         │   - Kain B: 0.1 kg @ Rp Y/kg
│                         │   - Benang, label, dll (opsional)
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Produksi (Timeline)     │ ← Stages:
│                         │   1. Pengukuran
│                         │   2. Pemotongan
│                         │   3. Jahit (upah: Rp Z)
│                         │   4. Finishing
│                         │   5. QC
│                         │   ⏱️ Durasi per stage fleksibel (owner set manual)
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Hitung HPP + Harga Jual │ ← HPP = Material Cost + Labor Cost
│                         │   Harga Jual = HPP × Markup% OR HPP + Fixed Profit
│                         │   Ongkir ditambahkan ke harga final
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Kirim & Catat Profit    │ ← Profit = Harga Jual - HPP - Ongkir
└─────────────────────────┘
```

---

## 4. Key Entities (Domain Model - High Level)

### 4.1. **Kain (Fabric)**
- Nama kain (e.g., "Cotton Combed 30s", "Polyester PE")
- Satuan: **kg**
- **Historical Pricing:** Harga bisa beda per batch pembelian
- **Waste Tracking:** Catat sisa/loss saat pemotongan

### 4.2. **Pembelian Kain (Procurement)**
- Tanggal beli
- Kain (referensi ke master kain)
- Qty (kg)
- Harga per kg (snapshot harga saat beli)
- Supplier (opsional, bisa ditambahkan nanti)
- **Impact:** Menambah stok kain

### 4.3. **Order Kaos**
- Customer (nama/kontak)
- Tanggal order
- Qty kaos
- Model/Spesifikasi (ukuran, warna, desain)
- Status: `Draft → In Production → QC → Shipped`

### 4.4. **Bill of Materials (BOM)**
- Per order, tentukan komposisi:
  - Kain A: X kg (ambil dari stok, harga kulak saat itu)
  - Kain B: Y kg
  - Bahan lain (benang, label) - opsional
- **Waste %** (sisa potongan yang tidak terpakai)

### 4.5. **Timeline Produksi**
- Per order, catat stage:
  1. Pengukuran (start, end, durasi estimasi)
  2. Pemotongan (start, end)
  3. Jahit (start, end, **upah jahit: Rp**)
  4. Finishing (start, end)
  5. QC (start, end)
- Status per stage: `Not Started → In Progress → Done`

### 4.6. **Costing & Pricing**
- **Material Cost** = Σ (qty kain × harga kulak saat ambil dari stok)
- **Labor Cost** = upah jahit (per order atau per pcs)
- **HPP (Cost of Goods Sold)** = Material + Labor
- **Harga Jual:**
  - **Opsi A:** HPP × (1 + Markup%)  
    _Contoh: HPP Rp 50,000 × 1.3 = Rp 65,000_
  - **Opsi B:** HPP + Fixed Profit  
    _Contoh: HPP Rp 50,000 + Rp 15,000 = Rp 65,000_
- **Ongkir** (shipping cost) - owner input manual
- **Profit** = Harga Jual - HPP - Ongkir

### 4.7. **Laporan (Reporting)**
- **Per Order:**
  - Material breakdown (kain A: Rp X, kain B: Rp Y)
  - Labor cost
  - HPP
  - Harga jual
  - Profit/Loss
- **Per Period (bulan/tahun):**
  - Total omzet (revenue)
  - Total HPP
  - Gross profit
  - Profit margin %
- **Inventory:**
  - Stok kain real-time (kg tersedia)
  - Nilai stok (qty × avg harga kulak)

---

## 5. Business Rules

1. **Stok kain berkurang** saat BOM di-assign ke order (actual usage)
2. **Waste dicatat** sebagai loss (mengurangi stok tanpa masuk ke HPP, atau masuk ke HPP tergantung keputusan akuntansi)
3. **Historical pricing:** Harga kain per order diambil dari harga kulak terakhir (FIFO) atau weighted average (pilihan owner)
4. **Timeline fleksibel:** Estimasi durasi per stage bisa di-set manual per order
5. **Profit target:** Owner bisa set markup% default (e.g., 30%) atau override per order

---

## 6. Success Metrics

- ✅ Owner bisa lihat **profit per order** dalam < 1 menit
- ✅ **Stok kain akurat** (tidak over-promise order karena stok habis)
- ✅ **Timeline produksi visible** (owner tahu bottleneck di stage mana)
- ✅ **Laporan bulanan otomatis** (omzet, profit, margin)

---

## 7. Out of Scope (Phase 1)

- Multi-user / role management
- Supplier management (bisa tambah nama supplier, tapi tidak ada PO workflow)
- Customer CRM (hanya catat nama/kontak sederhana)
- Inventory reorder alert (bisa ditambahkan nanti)
- Integrasi payment gateway / invoicing

---

## 8. Next Steps

1. ✅ **Finalisasi domain model** (entities & relationships)
2. ⏳ **Database schema design** (PostgreSQL / SQLite)
3. ⏳ **API design** (REST endpoints)
4. ⏳ **Tech stack decision** (backend framework, frontend)
5. ⏳ **UI/UX wireframe** (screen flow)
6. ⏳ **Implementation timeline**

---

**Catatan untuk diskusi:**
- Apakah waste masuk ke HPP atau dicatat terpisah?
- Metode costing: FIFO, weighted average, atau snapshot harga saat order?
- UI preference: web app (mobile-friendly) atau desktop app?
