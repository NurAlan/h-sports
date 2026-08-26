# H-Sport: Design Decisions

**Tanggal:** 25 Agustus 2026
**Status:** ✅ LOCKED & IMPLEMENTED

---

## 1. Waste Treatment: Masuk HPP (Opsi A)

**Decision:** Waste dihitung sebagai bagian dari material cost.

```
qty_actual = qty_required × (1 + waste_percentage / 100)
material_cost = qty_actual × price_per_kg
```

Stok berkurang sebesar `qty_actual`. HPP memakai `qty_actual × harga_kulak`.

---

## 2. Inventory Costing: FIFO

**Decision:** Material cost per order dihitung dari batch paling lama.

- Tabel `fabric_batches`: 1 pembelian = 1 batch
- Saat order masuk produksi: sort batch by `purchase_date ASC`, alokasikan dari tertua
- Dicatat di tabel `batch_usage`
- Jika total stok tidak cukup → error 400 (ditampilkan sebagai peringatan di UI sebelum klik)

---

## 3. Tech Stack (Actual)

| Layer | Pilihan |
|-------|---------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 6.19.3 |
| UI | Tailwind CSS v4 + shadcn/ui + Radix UI |
| Auth | Supabase Auth (Google OAuth + email/password) |
| Charts | Recharts |
| Deployment | Vercel (h-sports-zeta.vercel.app) |
| Design | Mobile-first, Inter font, bg gray-50, primary vibrant blue |

**Catatan:**
- `shadcn/ui` Base UI komponen (Button/Dialog/Input) diganti native HTML/Radix di beberapa tempat karena klik/state rusak di mobile
- `shadcn v4` dipakai, bukan v3
- Next.js 16 (bukan 14 seperti rencana awal)

---

## 4. Folder Structure (Actual)

```
hsport/
├── AGENTS.md
├── CONTEXT.md
├── DOCS/
│   ├── 01-BUSINESS-REQUIREMENTS.md
│   ├── 02-DESIGN-DECISIONS.md
│   ├── 03-DATABASE-SCHEMA.md
│   ├── 04-UI-IMPLEMENTATION.md
│   ├── 05-IMPLEMENTATION-SUMMARY.md
│   ├── 06-MIGRATION-PLAN.md
│   ├── 07-API-REFERENCE.md
│   └── agents/
│       ├── domain.md
│       ├── issue-tracker.md
│       └── triage-labels.md
└── app/                         ← Next.js app root
    ├── app/                     ← App Router pages + API routes
    │   ├── api/
    │   │   ├── fabrics/
    │   │   ├── fabric-batches/
    │   │   ├── orders/[id]/bom/
    │   │   ├── orders/[id]/timeline/
    │   │   ├── orders/[id]/costing/
    │   │   ├── dashboard/
    │   │   ├── reports/
    │   │   ├── production/
    │   │   └── inventory/
    │   ├── orders/[id]/
    │   ├── inventory/[id]/
    │   ├── production/
    │   ├── reports/
    │   └── profile/fabrics/
    ├── components/
    │   ├── dialogs/             ← 5 dialog utama
    │   ├── dashboard/           ← RevenueChart, StockDonut
    │   ├── reports/             ← ComparisonBarChart
    │   ├── ui/                  ← shadcn/ui + CurrencyInput
    │   └── skeletons.tsx
    ├── lib/
    │   ├── api.ts               ← client fetch helper
    │   ├── api-auth.ts          ← requireUser() helper
    │   ├── fifo.ts              ← FIFO deduction logic
    │   ├── prisma.ts            ← singleton PrismaClient
    │   ├── master-data.ts       ← FABRIC_CATALOG (24 kain)
    │   └── utils.ts
    └── prisma/
        ├── schema.prisma
        └── seed.ts
```

---

## 5. Database Connection

- `DATABASE_URL` = transaction pooler port **5432** (bukan 6543), tanpa tanda kutip `"`
- `DIRECT_URL` = direct connection untuk migration
- Prisma commands: `npm run db:push`, `npm run db:seed` — **jangan `npx prisma`** (memilih Prisma 8 RC)

---

## 6. Auth Architecture

- Supabase Auth menangani `auth.users`
- Prisma menangani semua query bisnis
- `requireUser()` di `lib/api-auth.ts` verifikasi session di setiap Route Handler
- Signup dimatikan — hanya email terdaftar yang bisa login

---

## 7. Dashboard Data

**Decision:** Dashboard dan laporan menghitung **langsung dari tabel `orders`** (bukan `monthly_summaries`).

Rationale: `monthly_summaries` tidak pernah diisi otomatis. Data realtime lebih akurat.

Profit hanya dihitung untuk Order berstatus `shipped`.

---

## 8. Status Workflow Validasi

- **Masuk QC**: semua stage produksi (non-QC) harus `completed`
- **Tandai Selesai**: stage QC harus `completed`
- **Mulai Produksi**: stok harus cukup (FIFO check sebelum deduction)
