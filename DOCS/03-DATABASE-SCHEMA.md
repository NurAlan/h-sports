# H-Sport: Database Schema Design

**Database:** PostgreSQL (via Supabase or self-hosted)  
**ORM:** Prisma  
**Design Method:** FIFO inventory costing, waste tracking, production timeline

---

## Entity Relationship Diagram (ERD)

```
┌─────────────────┐
│ fabrics         │ ← Master data kain
│─────────────────│
│ id              │ PK
│ name            │ e.g., "Cotton Combed 30s"
│ unit            │ "kg" (fixed untuk fase 1)
│ created_at      │
└─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│ fabric_batches  │ ← Per pembelian = 1 batch (FIFO tracking)
│─────────────────│
│ id              │ PK
│ fabric_id       │ FK → fabrics.id
│ supplier_name   │ (optional, text sederhana)
│ purchase_date   │
│ qty_purchased   │ (kg)
│ qty_remaining   │ (kg, berkurang saat dipakai)
│ price_per_kg    │ (Rp, snapshot harga saat beli)
│ created_at      │
└─────────────────┘
         │
         │ N:M (via bom_items)
         ▼
┌─────────────────┐
│ orders          │ ← Order kaos dari customer
│─────────────────│
│ id              │ PK
│ order_number    │ "ORD-20260825-001" (unique)
│ customer_name   │
│ customer_contact│
│ qty_items       │ (jumlah kaos)
│ specification   │ (ukuran, warna, desain — text/JSON)
│ status          │ 'draft' | 'in_production' | 'qc' | 'shipped' | 'cancelled'
│ order_date      │
│ created_at      │
│ updated_at      │
└─────────────────┘
         │
         │ 1:1
         ▼
┌─────────────────┐
│ bom             │ ← Bill of Materials (komposisi bahan per order)
│─────────────────│
│ id              │ PK
│ order_id        │ FK → orders.id (unique)
│ created_at      │
└─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│ bom_items       │ ← Detail bahan per order (1 order bisa pakai multiple kain)
│─────────────────│
│ id              │ PK
│ bom_id          │ FK → bom.id
│ fabric_id       │ FK → fabrics.id
│ qty_required    │ (kg, kebutuhan bersih)
│ waste_percentage│ (%, e.g., 10.0 = 10%)
│ qty_actual      │ (kg, = qty_required × (1 + waste_percentage/100))
│ price_per_kg    │ (Rp, snapshot dari batch FIFO saat alokasi)
│ material_cost   │ (Rp, = qty_actual × price_per_kg)
│ created_at      │
└─────────────────┘
         │
         │ N:M (tracking batch usage — opsional untuk audit)
         ▼
┌─────────────────┐
│ batch_usage     │ ← Audit: batch mana saja yang dipakai untuk order ini
│─────────────────│
│ id              │ PK
│ bom_item_id     │ FK → bom_items.id
│ fabric_batch_id │ FK → fabric_batches.id
│ qty_used        │ (kg, berapa dari batch ini yang dipakai)
│ created_at      │
└─────────────────┘

┌─────────────────┐
│ production_     │ ← Timeline produksi (per order, per stage)
│ timelines       │
│─────────────────│
│ id              │ PK
│ order_id        │ FK → orders.id
│ stage_name      │ 'pengukuran' | 'pemotongan' | 'jahit' | 'finishing' | 'qc'
│ stage_order     │ (1, 2, 3, 4, 5) untuk sorting
│ status          │ 'not_started' | 'in_progress' | 'completed'
│ estimated_hrs   │ (hours, owner set manual)
│ actual_start    │ (timestamp, null jika not started)
│ actual_end      │ (timestamp, null jika not completed)
│ notes           │ (optional, catatan issue/delay)
│ created_at      │
│ updated_at      │
└─────────────────┘

┌─────────────────┐
│ order_costing   │ ← Costing & pricing per order (1:1 dengan orders)
│─────────────────│
│ id              │ PK
│ order_id        │ FK → orders.id (unique)
│ material_cost   │ (Rp, total dari bom_items.material_cost)
│ labor_cost      │ (Rp, upah jahit — manual input)
│ hpp             │ (Rp, = material_cost + labor_cost)
│ pricing_method  │ 'markup' | 'fixed_profit'
│ markup_pct      │ (%, e.g., 30.0 jika pricing_method = 'markup')
│ fixed_profit    │ (Rp, jika pricing_method = 'fixed_profit')
│ selling_price   │ (Rp, calculated or manual override)
│ shipping_cost   │ (Rp, ongkir)
│ profit          │ (Rp, = selling_price - hpp - shipping_cost)
│ profit_margin   │ (%, = profit / selling_price × 100)
│ created_at      │
│ updated_at      │
└─────────────────┘
```

---

## Tables Detail

### 1. `fabrics` (Master Kain)

| Column     | Type         | Constraints          | Description                  |
|------------|--------------|----------------------|------------------------------|
| id         | UUID         | PK                   | Primary key                  |
| name       | VARCHAR(255) | NOT NULL, UNIQUE     | Nama kain (e.g., "Cotton Combed 30s") |
| unit       | VARCHAR(10)  | NOT NULL, DEFAULT 'kg' | Satuan (fixed "kg" untuk fase 1) |
| created_at | TIMESTAMP    | NOT NULL, DEFAULT NOW() | Tanggal dibuat             |

**Indexes:**
- PK: `id`
- Unique: `name`

---

### 2. `fabric_batches` (Batch Pembelian Kain — FIFO Tracking)

| Column         | Type         | Constraints              | Description                          |
|----------------|--------------|--------------------------|--------------------------------------|
| id             | UUID         | PK                       | Primary key                          |
| fabric_id      | UUID         | FK → fabrics.id, NOT NULL | Referensi ke kain                   |
| supplier_name  | VARCHAR(255) | NULL                     | Nama supplier (opsional, text bebas) |
| purchase_date  | DATE         | NOT NULL                 | Tanggal beli                         |
| qty_purchased  | DECIMAL(10,3)| NOT NULL, CHECK > 0      | Qty beli (kg)                        |
| qty_remaining  | DECIMAL(10,3)| NOT NULL, CHECK >= 0     | Qty tersisa (berkurang saat dipakai) |
| price_per_kg   | DECIMAL(12,2)| NOT NULL, CHECK > 0      | Harga kulak per kg (Rp)              |
| created_at     | TIMESTAMP    | NOT NULL, DEFAULT NOW()  | Tanggal record dibuat                |

**Indexes:**
- PK: `id`
- FK: `fabric_id` → `fabrics(id)` ON DELETE RESTRICT
- Index: `(fabric_id, purchase_date ASC)` untuk FIFO query

**Business Rules:**
- `qty_remaining` <= `qty_purchased` (enforced via app logic or trigger)
- Saat alokasi ke order, `qty_remaining` berkurang

---

### 3. `orders` (Order Kaos)

| Column           | Type         | Constraints                  | Description                          |
|------------------|--------------|------------------------------|--------------------------------------|
| id               | UUID         | PK                           | Primary key                          |
| order_number     | VARCHAR(50)  | NOT NULL, UNIQUE             | "ORD-20260825-001" (generated)       |
| customer_name    | VARCHAR(255) | NOT NULL                     | Nama customer                        |
| customer_contact | VARCHAR(255) | NULL                         | Telp/email customer                  |
| qty_items        | INTEGER      | NOT NULL, CHECK > 0          | Jumlah kaos                          |
| specification    | TEXT         | NULL                         | Ukuran, warna, desain (JSON atau text) |
| status           | VARCHAR(20)  | NOT NULL, DEFAULT 'draft'    | 'draft', 'in_production', 'qc', 'shipped', 'cancelled' |
| order_date       | DATE         | NOT NULL                     | Tanggal order                        |
| created_at       | TIMESTAMP    | NOT NULL, DEFAULT NOW()      | Tanggal record dibuat                |
| updated_at       | TIMESTAMP    | NOT NULL, DEFAULT NOW()      | Tanggal terakhir diupdate            |

**Indexes:**
- PK: `id`
- Unique: `order_number`
- Index: `order_date DESC` untuk laporan

**Status Flow:**
- `draft` → `in_production` → `qc` → `shipped`
- `cancelled` (bisa dari draft atau in_production)

---

### 4. `bom` (Bill of Materials)

| Column     | Type      | Constraints          | Description                  |
|------------|-----------|----------------------|------------------------------|
| id         | UUID      | PK                   | Primary key                  |
| order_id   | UUID      | FK → orders.id, NOT NULL, UNIQUE | 1 order = 1 BOM |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Tanggal dibuat            |

**Indexes:**
- PK: `id`
- FK: `order_id` → `orders(id)` ON DELETE CASCADE
- Unique: `order_id`

---

### 5. `bom_items` (Detail Bahan per Order)

| Column          | Type          | Constraints              | Description                          |
|-----------------|---------------|--------------------------|--------------------------------------|
| id              | UUID          | PK                       | Primary key                          |
| bom_id          | UUID          | FK → bom.id, NOT NULL    | Referensi ke BOM                     |
| fabric_id       | UUID          | FK → fabrics.id, NOT NULL | Kain yang dipakai                   |
| qty_required    | DECIMAL(10,3) | NOT NULL, CHECK > 0      | Kebutuhan bersih (kg)                |
| waste_percentage| DECIMAL(5,2)  | NOT NULL, DEFAULT 0, CHECK >= 0 | Waste % (e.g., 10.0 = 10%)  |
| qty_actual      | DECIMAL(10,3) | NOT NULL, CHECK > 0      | Qty actual = qty_required × (1 + waste_percentage/100) |
| price_per_kg    | DECIMAL(12,2) | NOT NULL, CHECK > 0      | Snapshot harga FIFO saat alokasi (Rp) |
| material_cost   | DECIMAL(12,2) | NOT NULL, CHECK >= 0     | = qty_actual × price_per_kg (Rp)     |
| created_at      | TIMESTAMP     | NOT NULL, DEFAULT NOW()  | Tanggal dibuat                       |

**Indexes:**
- PK: `id`
- FK: `bom_id` → `bom(id)` ON DELETE CASCADE
- FK: `fabric_id` → `fabrics(id)` ON DELETE RESTRICT
- Index: `bom_id` untuk aggregasi material_cost

**Calculated Fields:**
- `qty_actual = qty_required × (1 + waste_percentage/100)` — calculated saat insert/update
- `material_cost = qty_actual × price_per_kg` — calculated saat insert/update

---

### 6. `batch_usage` (Audit: Batch Usage per BOM Item) — Optional

| Column          | Type          | Constraints              | Description                          |
|-----------------|---------------|--------------------------|--------------------------------------|
| id              | UUID          | PK                       | Primary key                          |
| bom_item_id     | UUID          | FK → bom_items.id, NOT NULL | BOM item yang pakai batch ini     |
| fabric_batch_id | UUID          | FK → fabric_batches.id, NOT NULL | Batch mana yang dipakai       |
| qty_used        | DECIMAL(10,3) | NOT NULL, CHECK > 0      | Berapa kg dari batch ini yang dipakai |
| created_at      | TIMESTAMP     | NOT NULL, DEFAULT NOW()  | Tanggal alokasi                      |

**Indexes:**
- PK: `id`
- FK: `bom_item_id` → `bom_items(id)` ON DELETE CASCADE
- FK: `fabric_batch_id` → `fabric_batches(id)` ON DELETE RESTRICT
- Index: `fabric_batch_id` untuk audit stok

**Purpose:**
- Audit trail: tahu batch mana yang dipakai untuk order tertentu
- Jika 1 BOM item pakai multiple batches (batch pertama tidak cukup), ada multiple rows
- Total `qty_used` untuk 1 `bom_item_id` harus = `bom_items.qty_actual`

---

### 7. `production_timelines` (Timeline Produksi)

| Column        | Type         | Constraints              | Description                          |
|---------------|--------------|--------------------------|--------------------------------------|
| id            | UUID         | PK                       | Primary key                          |
| order_id      | UUID         | FK → orders.id, NOT NULL | Order yang di-track                  |
| stage_name    | VARCHAR(50)  | NOT NULL                 | 'pengukuran', 'pemotongan', 'jahit', 'finishing', 'qc' |
| stage_order   | INTEGER      | NOT NULL                 | 1, 2, 3, 4, 5 (untuk sorting)        |
| status        | VARCHAR(20)  | NOT NULL, DEFAULT 'not_started' | 'not_started', 'in_progress', 'completed' |
| estimated_hrs | DECIMAL(6,2) | NULL                     | Estimasi durasi (hours)              |
| actual_start  | TIMESTAMP    | NULL                     | Kapan stage dimulai                  |
| actual_end    | TIMESTAMP    | NULL                     | Kapan stage selesai                  |
| notes         | TEXT         | NULL                     | Catatan issue/delay                  |
| created_at    | TIMESTAMP    | NOT NULL, DEFAULT NOW()  | Tanggal dibuat                       |
| updated_at    | TIMESTAMP    | NOT NULL, DEFAULT NOW()  | Tanggal terakhir diupdate            |

**Indexes:**
- PK: `id`
- FK: `order_id` → `orders(id)` ON DELETE CASCADE
- Unique: `(order_id, stage_name)` — 1 order tidak boleh punya duplicate stage
- Index: `(order_id, stage_order)` untuk UI timeline

**Status Flow:**
- `not_started` → `in_progress` (set `actual_start = NOW()`)
- `in_progress` → `completed` (set `actual_end = NOW()`)

**Business Rules:**
- `actual_end` >= `actual_start` (enforced via CHECK constraint atau app logic)
- `actual_duration_hrs = EXTRACT(EPOCH FROM (actual_end - actual_start)) / 3600`

---

### 8. `order_costing` (Costing & Pricing per Order)

| Column         | Type          | Constraints              | Description                          |
|----------------|---------------|--------------------------|--------------------------------------|
| id             | UUID          | PK                       | Primary key                          |
| order_id       | UUID          | FK → orders.id, NOT NULL, UNIQUE | 1 order = 1 costing record |
| material_cost  | DECIMAL(12,2) | NOT NULL, DEFAULT 0      | Total material cost (Rp, sum dari bom_items) |
| labor_cost     | DECIMAL(12,2) | NOT NULL, DEFAULT 0      | Upah jahit (Rp, manual input)        |
| hpp            | DECIMAL(12,2) | NOT NULL, DEFAULT 0      | HPP = material_cost + labor_cost     |
| pricing_method | VARCHAR(20)   | NOT NULL, DEFAULT 'markup' | 'markup' atau 'fixed_profit'       |
| markup_pct     | DECIMAL(5,2)  | NULL                     | Markup % (e.g., 30.0 jika pricing_method = 'markup') |
| fixed_profit   | DECIMAL(12,2) | NULL                     | Fixed profit (Rp, jika pricing_method = 'fixed_profit') |
| selling_price  | DECIMAL(12,2) | NOT NULL, DEFAULT 0      | Harga jual (Rp, calculated or override) |
| shipping_cost  | DECIMAL(12,2) | NOT NULL, DEFAULT 0      | Ongkir (Rp)                          |
| profit         | DECIMAL(12,2) | NOT NULL, DEFAULT 0      | Profit = selling_price - hpp - shipping_cost |
| profit_margin  | DECIMAL(5,2)  | NULL                     | Profit margin % = profit / selling_price × 100 |
| created_at     | TIMESTAMP     | NOT NULL, DEFAULT NOW()  | Tanggal dibuat                       |
| updated_at     | TIMESTAMP     | NOT NULL, DEFAULT NOW()  | Tanggal terakhir diupdate            |

**Indexes:**
- PK: `id`
- FK: `order_id` → `orders(id)` ON DELETE CASCADE
- Unique: `order_id`

**Calculated Fields (App Logic):**

**Material Cost:**
```sql
SELECT SUM(material_cost) FROM bom_items WHERE bom_id = (SELECT id FROM bom WHERE order_id = ?)
```

**HPP:**
```
hpp = material_cost + labor_cost
```

**Selling Price:**
- Jika `pricing_method = 'markup'`:
  ```
  selling_price = hpp × (1 + markup_pct/100)
  ```
- Jika `pricing_method = 'fixed_profit'`:
  ```
  selling_price = hpp + fixed_profit
  ```

**Profit:**
```
profit = selling_price - hpp - shipping_cost
```

**Profit Margin:**
```
profit_margin = (profit / selling_price) × 100
```

---

## Sample Data Flow

### **1. Owner beli kain:**

```sql
-- Insert master kain (jika belum ada)
INSERT INTO fabrics (id, name, unit) VALUES (uuid_generate_v4(), 'Cotton Combed 30s', 'kg');

-- Insert batch pembelian
INSERT INTO fabric_batches (id, fabric_id, supplier_name, purchase_date, qty_purchased, qty_remaining, price_per_kg)
VALUES (
  uuid_generate_v4(),
  (SELECT id FROM fabrics WHERE name = 'Cotton Combed 30s'),
  'Supplier A',
  '2026-08-01',
  20.0,  -- beli 20 kg
  20.0,  -- sisa 20 kg (belum dipakai)
  50000  -- Rp 50,000/kg
);
```

### **2. Owner terima order:**

```sql
-- Insert order
INSERT INTO orders (id, order_number, customer_name, customer_contact, qty_items, specification, status, order_date)
VALUES (
  uuid_generate_v4(),
  'ORD-20260825-001',
  'Toko Baju Sejahtera',
  '08123456789',
  50,
  '{"sizes": ["M", "L", "XL"], "color": "Navy Blue"}',
  'draft',
  '2026-08-25'
);
```

### **3. Owner buat BOM (komposisi bahan):**

```sql
-- Insert BOM
INSERT INTO bom (id, order_id) VALUES (
  uuid_generate_v4(),
  (SELECT id FROM orders WHERE order_number = 'ORD-20260825-001')
);

-- Insert BOM items
-- Contoh: 1 kaos butuh 0.3 kg cotton, waste 10%
INSERT INTO bom_items (id, bom_id, fabric_id, qty_required, waste_percentage, qty_actual, price_per_kg, material_cost)
VALUES (
  uuid_generate_v4(),
  (SELECT id FROM bom WHERE order_id = (SELECT id FROM orders WHERE order_number = 'ORD-20260825-001')),
  (SELECT id FROM fabrics WHERE name = 'Cotton Combed 30s'),
  15.0,   -- butuh 15 kg bersih (50 kaos × 0.3 kg)
  10.0,   -- waste 10%
  16.5,   -- qty_actual = 15 × 1.1 = 16.5 kg
  50000,  -- harga FIFO dari batch pertama
  825000  -- material_cost = 16.5 × 50000 = Rp 825,000
);

-- Update fabric_batches.qty_remaining (FIFO)
UPDATE fabric_batches
SET qty_remaining = qty_remaining - 16.5
WHERE id = (
  SELECT id FROM fabric_batches
  WHERE fabric_id = (SELECT id FROM fabrics WHERE name = 'Cotton Combed 30s')
  ORDER BY purchase_date ASC
  LIMIT 1
);
```

### **4. Owner set timeline produksi:**

```sql
-- Insert timeline stages
INSERT INTO production_timelines (id, order_id, stage_name, stage_order, status, estimated_hrs)
VALUES
  (uuid_generate_v4(), (SELECT id FROM orders WHERE order_number = 'ORD-20260825-001'), 'pengukuran', 1, 'not_started', 2.0),
  (uuid_generate_v4(), (SELECT id FROM orders WHERE order_number = 'ORD-20260825-001'), 'pemotongan', 2, 'not_started', 4.0),
  (uuid_generate_v4(), (SELECT id FROM orders WHERE order_number = 'ORD-20260825-001'), 'jahit', 3, 'not_started', 12.0),
  (uuid_generate_v4(), (SELECT id FROM orders WHERE order_number = 'ORD-20260825-001'), 'finishing', 4, 'not_started', 3.0),
  (uuid_generate_v4(), (SELECT id FROM orders WHERE order_number = 'ORD-20260825-001'), 'qc', 5, 'not_started', 1.0);
```

### **5. Owner mulai stage "Pengukuran":**

```sql
UPDATE production_timelines
SET status = 'in_progress', actual_start = NOW()
WHERE order_id = (SELECT id FROM orders WHERE order_number = 'ORD-20260825-001')
  AND stage_name = 'pengukuran';
```

### **6. Owner selesai stage "Jahit" (ada labor cost):**

```sql
-- Selesai stage jahit
UPDATE production_timelines
SET status = 'completed', actual_end = NOW()
WHERE order_id = (SELECT id FROM orders WHERE order_number = 'ORD-20260825-001')
  AND stage_name = 'jahit';

-- Update labor cost di order_costing
UPDATE order_costing
SET labor_cost = 500000  -- Rp 500,000 upah jahit
WHERE order_id = (SELECT id FROM orders WHERE order_number = 'ORD-20260825-001');
```

### **7. Owner hitung harga jual:**

```sql
-- Insert order_costing
INSERT INTO order_costing (id, order_id, material_cost, labor_cost, hpp, pricing_method, markup_pct, selling_price, profit)
VALUES (
  uuid_generate_v4(),
  (SELECT id FROM orders WHERE order_number = 'ORD-20260825-001'),
  825000,   -- material_cost dari bom_items
  500000,   -- labor_cost
  1325000,  -- hpp = 825000 + 500000
  'markup',
  30.0,     -- markup 30%
  1722500,  -- selling_price = 1325000 × 1.3
  397500    -- profit = 1722500 - 1325000 (belum ongkir)
);
```

### **8. Owner kirim (ada ongkir):**

```sql
-- Update ongkir dan profit
UPDATE order_costing
SET shipping_cost = 50000,  -- ongkir Rp 50,000
    profit = selling_price - hpp - 50000,  -- profit = 1722500 - 1325000 - 50000 = 347500
    profit_margin = ((selling_price - hpp - 50000) / selling_price) * 100  -- 20.17%
WHERE order_id = (SELECT id FROM orders WHERE order_number = 'ORD-20260825-001');

-- Update status order
UPDATE orders
SET status = 'shipped'
WHERE order_number = 'ORD-20260825-001';
```

---

## Laporan Queries

### **Laporan Per Order:**

```sql
SELECT
  o.order_number,
  o.customer_name,
  o.qty_items,
  oc.material_cost,
  oc.labor_cost,
  oc.hpp,
  oc.selling_price,
  oc.shipping_cost,
  oc.profit,
  oc.profit_margin
FROM orders o
JOIN order_costing oc ON oc.order_id = o.id
WHERE o.order_number = 'ORD-20260825-001';
```

### **Material Breakdown per Order:**

```sql
SELECT
  f.name AS fabric_name,
  bi.qty_required,
  bi.waste_percentage,
  bi.qty_actual,
  bi.price_per_kg,
  bi.material_cost
FROM bom_items bi
JOIN bom b ON b.id = bi.bom_id
JOIN orders o ON o.id = b.order_id
JOIN fabrics f ON f.id = bi.fabric_id
WHERE o.order_number = 'ORD-20260825-001';
```

### **Laporan Profit per Period:**

```sql
SELECT
  TO_CHAR(o.order_date, 'YYYY-MM') AS period,
  COUNT(o.id) AS total_orders,
  SUM(oc.selling_price) AS total_revenue,
  SUM(oc.hpp) AS total_hpp,
  SUM(oc.shipping_cost) AS total_shipping,
  SUM(oc.profit) AS gross_profit,
  AVG(oc.profit_margin) AS avg_profit_margin
FROM orders o
JOIN order_costing oc ON oc.order_id = o.id
WHERE o.status = 'shipped'
  AND o.order_date BETWEEN '2026-08-01' AND '2026-08-31'
GROUP BY TO_CHAR(o.order_date, 'YYYY-MM');
```

### **Stok Kain Real-time:**

```sql
SELECT
  f.name AS fabric_name,
  SUM(fb.qty_remaining) AS total_stock_kg,
  SUM(fb.qty_remaining * fb.price_per_kg) AS stock_value
FROM fabric_batches fb
JOIN fabrics f ON f.id = fb.fabric_id
GROUP BY f.name;
```

---

## Next Steps

- ✅ Database schema design complete
- ⏳ **Prisma schema.prisma** (translate ke Prisma ORM)
- ⏳ **API Contract** (REST endpoints)
- ⏳ **UI Wireframe**
- ⏳ **Implementation timeline**
