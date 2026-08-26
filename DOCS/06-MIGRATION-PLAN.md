# H-Sport: Migration Plan — Supabase Cloud → Postgres VM

**Tujuan:** Meminimalkan vendor lock-in Supabase. Arsitektur: **Prisma ORM untuk semua query bisnis, Supabase hanya untuk Auth** — sehingga pindah database = ganti connection string.

**Status:** ✅ Arsitektur dikunci — Prisma terpasang, schema siap (DOCS/sql/02-business-tables.sql)

---

## 🏗️ Arsitektur Saat Ini (Anti Lock-in)

```
┌─────────────────────────────────────────────┐
│ Next.js App                                 │
│  ├── Prisma ORM  →  query tabel BISNIS      │ ← ganti DATABASE_URL saja = pindah DB
│  │     (fabrics, orders, BOM, costing, ...) │
│  └── Supabase Auth  →  login (Google/pwd)   │ ← Satu-satunya vendor lock-in
└─────────────────────────────────────────────┘
```

| Layer | Teknologi | Vendor-locked? |
|-------|-----------|----------------|
| UI | Next.js | Tidak |
| Query DB | **Prisma ORM** | Tidak (Postgres standar) |
| Database | PostgreSQL (Supabase) | ❌ Tidak — tinggal ganti `DATABASE_URL` |
| Auth | Supabase Auth | ⚠️ **Ya** — perlu jalur keluar |

---

## 💰 Analisis Biaya Supabase

| Tier | Harga | Kapasitas |
|------|-------|-----------|
| Free | $0/bln | 500MB DB, 5GB bandwidth, 50K MAU |
| Pro | $25/bln | 8GB DB, 250GB bandwidth |

**Estimasi H-Sport (single user, ~50-100 order/bln):**
- Data: < 50MB (teks, tanpa file gambar besar)
- Bandwidth: jauh di bawah 5GB
- MAU: 1-5 user
- **Kesimpulan:** Free tier cukup untuk jangka panjang. Charge besar tidak realistis kecuali upload file/gambar dalam jumlah besar.

**Trigger pindah (jika terjadi):**
1. Tagihan > $25/bln
2. Butuh custom domain / kontrol penuh server
3. Kebutuhan bandwidth/storage besar

---

## 🛣️ 3 Jalur Migrasi

### Jalur 1: Supabase Self-Hosted (VPS Docker) — Rekomendasi
**Biaya:** ~$5-10/bln (VPS) — semua fitur tetap

```
Supabase Cloud → backup → Supabase Self-hosted (docker compose di VPS)
```

**Langkah:**
1. Setup VPS (Hetzner/DigitalOcean/Vultr, 2GB RAM cukup)
2. Install Docker + `supabase/docker` compose stack
3. Export dari cloud: `supabase db dump` (CLI)
4. Restore ke self-hosted: `supabase db push` / psql restore
5. Ganti `NEXT_PUBLIC_SUPABASE_URL` di app → URL VPS
6. Update Google Console redirect URI → URL VPS
7. Test login & data

**Keuntungan:** Auth, RLS, PostgREST semua tetap — tidak ada perubahan kode.
**Kekurangan:** Maintenance server sendiri (update, backup, monitoring).

---

### Jalur 2: Postgres VM + NextAuth (Full Custom)
**Biaya:** ~$5/bln (VPS) — kontrol penuh

```
Supabase Auth → NextAuth (Google OAuth + credentials, Prisma adapter)
Tabel auth.users/profiles → tabel users custom di Postgres VM
```

**Langkah:**
1. Setup Postgres di VPS (atau Managed DB)
2. Install NextAuth v5 + Prisma adapter
3. Buat tabel `users` + `accounts` + `sessions` (schema NextAuth)
4. Migrasi data users: export `auth.users` + `profiles` → import
5. Ganti `createClient()` Supabase → NextAuth session (di UI, login page, middleware, profile)
6. Hapus Supabase client (kecuali untuk data lama)
7. Test end-to-end

**Keuntungan:** Nol ketergantungan vendor, satu stack (Next.js + Prisma + Postgres).
**Kekurangan:** Perlu migrasi auth (~1-2 hari kerja), tangani session/refresh sendiri.

---

### Jalur 3: Hybrid (Tidak Disarankan)
Supabase Auth tetap + data bisnis di Postgres VM
- **Masalah:** 2 sumber data, query terpecah, kompleksitas naik
- **Kapan dipakai:** Hanya jika mau pindahkan data bisnis dulu, auth menyusul

---

## 📋 Langkah Preventif (Sekarang)

1. ✅ **Prisma untuk semua query bisnis** — JANGAN pakai `supabase.from("...")` untuk tabel bisnis
2. ✅ **Schema di Prisma** (source of truth) — bukan hanya di Supabase UI
3. ✅ **SQL migration versioned** di `DOCS/sql/` (01-profiles, 02-business-tables)
4. ✅ Hindari fitur eksklusif Supabase (RPC, Realtime) untuk data kritis
5. ✅ Simpan semua data user hanya di `auth.users` + `profiles` (mudah di-export)

---

## 🗄️ Backup & Restore (jika diperlukan)

### Backup dari Supabase Cloud
```bash
# Via Supabase CLI
supabase login
supabase link --project-ref <PROJECT_REF>
supabase db dump --data-only > backup-data.sql
supabase db dump > backup-schema.sql
```

### Restore ke Postgres VM
```bash
psql "postgresql://user:pass@vm:5432/hsport" < backup-schema.sql
psql "postgresql://user:pass@vm:5432/hsport" < backup-data.sql
```

### Data Auth (Jalur 2)
```sql
-- Export dari Supabase (via dashboard/SQL editor)
copy (select id, email, raw_user_meta_data from auth.users) to '/tmp/users.csv' csv header;
-- Import ke tabel users NextAuth (setelah setup)
```

---

## 📌 Ringkasan Keputusan

| Keputusan | Nilai |
|-----------|-------|
| Query bisnis | **Prisma ORM** (bukan supabase-js) |
| Auth | Supabase Auth (sementara) |
| Trigger pindah | Tagihan > $25/bln atau butuh kontrol penuh |
| Jalur utama | Supabase Self-hosted di VPS (fitur tetap) |
| Jalur final | Postgres VM + NextAuth (kontrol penuh) |

---

## ✅ Checklist Migrasi Jalur 2 (Postgres VM + NextAuth)

- [ ] Setup VPS + Postgres
- [ ] Install NextAuth v5 + Prisma adapter
- [ ] Buat tabel users/accounts/sessions
- [ ] Migrasi data auth (export/import)
- [ ] Ganti login page (Google OAuth via NextAuth)
- [ ] Ganti middleware (session NextAuth)
- [ ] Ganti UserCard & logout
- [ ] Hapus supabase-js untuk auth
- [ ] Update `DATABASE_URL` → VPS
- [ ] Test penuh + deploy
