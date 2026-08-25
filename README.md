# H-Sport — Textile Production Management System

**Sistem pengelolaan inventory, costing, dan timeline produksi untuk perusahaan tekstil/manufaktur kaos.**

---

## 🎯 Problem Statement

Client menghadapi:
1. ❌ Tidak ada laporan untung/rugi per order
2. ❌ Tidak ada pencatatan stok kain & historical pricing
3. ❌ Tidak ada tracking timeline produksi

**Solusi:** Sistem web app yang track stok, hitung HPP (FIFO), monitor progress produksi, dan generate laporan profit.

---

## 📋 Features

### ✅ **Inventory Management**
- Master data kain (nama, satuan kg)
- Batch tracking pembelian (FIFO)
- Historical pricing (harga berubah per batch)
- Low-stock alerts
- Waste tracking

### ✅ **Order Management**
- Order kaos dari customer
- Bill of Materials (BOM) — komposisi bahan per order
- Status tracking: Draft → Produksi → QC → Terkirim

### ✅ **Production Timeline**
- 5 stages: Pengukuran → Pemotongan → Jahit → Finishing → QC
- Estimasi durasi per stage (fleksibel per order)
- Actual start/end timestamps
- Progress visualization

### ✅ **Costing & Pricing**
- Material cost (FIFO, waste included in HPP)
- Labor cost (upah jahit)
- HPP = Material + Labor
- Harga jual: Cost-based markup (% atau fixed profit)
- Ongkir (shipping cost)
- **Profit = Harga Jual - HPP - Ongkir**

### ✅ **Reports**
- **Per Order:** Material breakdown, HPP, profit/loss
- **Per Period:** Total omzet, profit, margin %
- **Inventory:** Stok real-time, nilai stok
- Monthly trends (4 bulan terakhir)
- Top fabrics usage

---

## 🛠️ Tech Stack

### **Frontend + Backend (Monolith)**
- **Framework:** Next.js 14 (App Router, TypeScript)
- **UI Library:** Tailwind CSS v4 + shadcn/ui
- **Icons:** Lucide React (line icons)

### **Database**
- **Database:** PostgreSQL (via Supabase managed or self-hosted)
- **ORM:** Prisma (type-safe, migrations)

### **Design System**
- **Style:** Bookify-inspired (clean white, vibrant blue, pastel accents)
- **Components:** Flat cards, rounded corners (12px), subtle borders
- **Mobile-first:** Responsive (max-width 512px)

---

## 📂 Project Structure

```
/hsport
├── /DOCS                              # Documentation
│   ├── 01-BUSINESS-REQUIREMENTS.md    # BRD (problem, workflow, entities)
│   ├── 02-DESIGN-DECISIONS.md         # FIFO, waste, tech stack
│   ├── 03-DATABASE-SCHEMA.md          # ERD, SQL schema, sample queries
│   └── 04-UI-IMPLEMENTATION.md        # Design system, pages, components
│
└── /app                               # Next.js application
    ├── /app                           # Pages (App Router)
    │   ├── layout.tsx                 # Root layout + Bottom Nav
    │   ├── page.tsx                   # Dashboard
    │   ├── /orders                    # Orders list
    │   ├── /inventory                 # Stok kain
    │   ├── /production                # Timeline produksi
    │   └── /reports                   # Laporan profit
    ├── /components
    │   ├── bottom-nav.tsx             # Fixed bottom navigation
    │   ├── page-header.tsx            # Reusable header
    │   └── /ui                        # shadcn/ui components
    ├── /lib
    │   └── utils.ts                   # Helpers
    ├── globals.css                    # Design tokens
    └── package.json
```

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ (LTS)
- npm 9+

### **Installation**

```bash
# Clone repo (atau sudah ada di /Users/nuralan/Personal/sanbox/hsport)
cd /Users/nuralan/Personal/sanbox/hsport/app

# Install dependencies
npm install

# Start dev server
npm run dev
```

**Access:** http://localhost:3000

---

## 📱 Pages (UI Prototype)

### 1. **Dashboard** (`/`)
- Stats cards: Stok kain, Profit bulan ini, Order aktif
- Recent orders (3 terbaru)
- Low-stock alerts

### 2. **Orders** (`/orders`)
- List semua order (Draft, Produksi, QC, Terkirim)
- Status badges, customer, qty, profit

### 3. **Inventory** (`/inventory`)
- List kain dengan stok real-time
- Low-stock warnings (reorder point)
- Avg price, last purchase date

### 4. **Production** (`/production`)
- Timeline per order (5 stages)
- Status: Completed, In Progress, Not Started
- Duration tracking

### 5. **Reports** (`/reports`)
- Gross profit (bulan ini)
- Monthly trend (4 bulan)
- Top fabrics usage

---

## 🎨 Design System

### **Colors**
- **Primary:** Vibrant blue (`oklch(0.55 0.22 250)`)
- **Success:** Mint green pastel
- **Warning:** Peach pastel
- **Background:** Pure white
- **Border:** Very subtle gray

### **Components**
- **Cards:** White, rounded 12px, flat (no heavy shadow)
- **Buttons:** Primary blue, rounded
- **Badges:** Pastel backgrounds (status indicators)
- **Icons:** Line style (Lucide React)

### **Bottom Navigation**
- Fixed bottom (z-50)
- 5 menu: Home, Orders, Inventory, Production, Reports
- Active state: primary blue + bold icon

---

## 🗄️ Database Schema (Planned)

### **Entities**
1. `fabrics` — Master kain
2. `fabric_batches` — Batch pembelian (FIFO tracking)
3. `orders` — Order kaos
4. `bom` — Bill of Materials
5. `bom_items` — Detail bahan per order
6. `batch_usage` — Audit trail (batch mana yang dipakai)
7. `production_timelines` — Timeline produksi
8. `order_costing` — Costing & pricing

**Method:** FIFO (First In First Out)  
**Waste:** Masuk ke HPP (qty_actual = qty_required × (1 + waste%))

**See:** `/DOCS/03-DATABASE-SCHEMA.md` untuk detail lengkap.

---

## 🔄 Next Steps (Implementation Roadmap)

### **Phase 1: Database Setup** (1 week)
- [ ] Setup Supabase project (atau PostgreSQL local)
- [ ] Translate SQL schema → Prisma schema
- [ ] Generate Prisma Client
- [ ] Run migrations
- [ ] Seed dummy data untuk testing

### **Phase 2: API Routes** (1 week)
- [ ] `/api/fabrics` (CRUD)
- [ ] `/api/fabric-batches` (purchase, FIFO allocation)
- [ ] `/api/orders` (CRUD, status updates)
- [ ] `/api/bom` (create BOM, calculate material cost)
- [ ] `/api/production-timelines` (update stages)
- [ ] `/api/order-costing` (calculate HPP, profit)

### **Phase 3: UI Integration** (1 week)
- [ ] Connect pages → API (replace dummy data)
- [ ] Add forms (create order, purchase fabric, etc.)
- [ ] Add loading states (skeleton)
- [ ] Add error handling (toast notifications)
- [ ] Real-time stok updates

### **Phase 4: Advanced Features** (2 weeks)
- [ ] Order detail page (`/orders/[id]`)
- [ ] BOM builder (interactive form)
- [ ] Timeline drag & drop (optional)
- [ ] Costing calculator (live preview)
- [ ] Search & filters
- [ ] Export reports (PDF/Excel)
- [ ] Dark mode (optional)

### **Phase 5: Production Ready**
- [ ] Authentication (simple login, single user)
- [ ] Backup & restore
- [ ] Deploy (Vercel atau VPS)
- [ ] User manual (Bahasa Indonesia)
- [ ] Training client

---

## 📊 Business Rules

1. **Stok berkurang** saat BOM di-assign ke order (actual usage = required + waste)
2. **FIFO allocation:** Material cost pakai batch paling lama dulu
3. **Historical pricing:** Harga per order = snapshot harga saat alokasi
4. **Profit target:** Owner bisa set markup% default atau override per order
5. **Timeline fleksibel:** Estimasi durasi per stage bisa di-set manual

---

## 🧪 Testing (Manual)

**UI Testing:**
1. Start dev server: `npm run dev`
2. Open http://localhost:3000
3. Navigate bottom nav → verify active state
4. Check setiap page: Dashboard, Orders, Inventory, Production, Reports
5. Verify: mobile layout, color consistency, spacing

**Expected Behavior:**
- Clean white cards dengan subtle borders
- Bottom nav fixed, active item primary blue
- No console errors
- Mobile-optimized (max 512px width)

---

## 📝 Documentation

- **BRD:** `/DOCS/01-BUSINESS-REQUIREMENTS.md`
- **Design Decisions:** `/DOCS/02-DESIGN-DECISIONS.md`
- **Database Schema:** `/DOCS/03-DATABASE-SCHEMA.md`
- **UI Implementation:** `/DOCS/04-UI-IMPLEMENTATION.md`

---

## 👤 User Persona

**Owner (single user, prototype phase):**
- Operator tunggal (gudang + produksi + akuntansi + sales)
- Needs: tahu stok, hitung HPP, track progress, lihat profit
- Goal: **Profit per order visible dalam < 1 menit**

---

## 🛡️ Out of Scope (Phase 1)

- Multi-user / role-based access
- Customer CRM (hanya nama/kontak sederhana)
- Supplier management (hanya catat nama supplier)
- Payment tracking (invoice, payment status)
- Inventory reorder automation
- Mobile app (web responsive cukup)

---

## 📄 License

**Internal Project** — Not open source (client work)

---

## 🤝 Contributors

- **Architect & Developer:** OpenAgentic AI (via Hermes Agent)
- **Client:** Alan (Owner H-Sport)
- **Consultation:** Software Architecture + Accounting

---

## 📞 Support

Untuk pertanyaan atau issue, hubungi Alan di Telegram.

---

**Status:** ✅ UI Prototype Complete | ⏳ API Implementation Pending
