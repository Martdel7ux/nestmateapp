-- Student marketplace + curated perks/discounts for the v2 redesign.

-- ── Marketplace listings ────────────────────────────────────────────────────
create table if not exists public.marketplace_listings (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references public.profiles (id) on delete cascade,
  title       text not null,
  description text,
  price       numeric(10, 2) not null default 0 check (price >= 0),
  category    text not null default 'other',
  image_url   text,
  city        public.cyprus_city,
  status      text not null default 'active' check (status in ('active', 'sold')),
  created_at  timestamptz not null default timezone('utc', now())
);

alter table public.marketplace_listings enable row level security;

-- Browsable by any authenticated (verified) student; managed only by the seller.
drop policy if exists "market_select_active" on public.marketplace_listings;
create policy "market_select_active" on public.marketplace_listings
  for select to authenticated using (status = 'active' or seller_id = auth.uid());

drop policy if exists "market_insert_own" on public.marketplace_listings;
create policy "market_insert_own" on public.marketplace_listings
  for insert to authenticated with check (seller_id = auth.uid());

drop policy if exists "market_update_own" on public.marketplace_listings;
create policy "market_update_own" on public.marketplace_listings
  for update to authenticated using (seller_id = auth.uid()) with check (seller_id = auth.uid());

drop policy if exists "market_delete_own" on public.marketplace_listings;
create policy "market_delete_own" on public.marketplace_listings
  for delete to authenticated using (seller_id = auth.uid());

create index if not exists idx_market_created on public.marketplace_listings (created_at desc);

-- ── Student perks / discounts (curated) ─────────────────────────────────────
create table if not exists public.student_perks (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  discount    text not null,
  category    text,
  city        public.cyprus_city,
  url         text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default timezone('utc', now())
);

alter table public.student_perks enable row level security;

-- Everyone reads active perks; only admins manage them (curated, like events).
drop policy if exists "perks_select_active" on public.student_perks;
create policy "perks_select_active" on public.student_perks
  for select to authenticated using (is_active);

drop policy if exists "perks_admin_write" on public.student_perks;
create policy "perks_admin_write" on public.student_perks
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
