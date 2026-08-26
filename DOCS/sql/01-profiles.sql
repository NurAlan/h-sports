-- ============================================================
-- H-Sport: Auth & Profiles Schema (Supabase)
-- Jalankan di: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1. Tabel PROFILES — data user bisnis
--    (multi-user: role = owner / admin / staff)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  business_name text,
  phone text,
  role text not null default 'staff' check (role in ('owner','admin','staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Trigger: auto-buat profile saat user baru dibuat di auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- 4. Row Level Security
alter table public.profiles enable row level security;

-- User bisa lihat & update profil sendiri
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Owner/Admin bisa lihat semua profil (multi-user)
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('owner','admin')
    )
  );

-- 5. Sample: set role OWNER untuk user pertama Anda
--    GANTI <USER_UUID> dengan id user dari Authentication → Users
-- update public.profiles set role = 'owner' where id = '<USER_UUID>';
