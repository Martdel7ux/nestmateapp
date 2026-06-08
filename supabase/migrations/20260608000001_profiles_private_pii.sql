-- Move sensitive PII off the world-readable `profiles` table.
--
-- `profiles` is readable by every authenticated user (policy
-- "profiles_select_authenticated USING (true)") so that flatmate cards,
-- household member lists, study peers, etc. can show public profile data.
-- That blanket read also exposed each user's HOME ADDRESS (street_address,
-- postal_code) and GDPR consent timestamps to every other logged-in user.
--
-- These columns are only ever read/written for a user's OWN profile, so we
-- relocate them into `profiles_private` with an owner-only RLS policy. New
-- personal data must go here, NOT on `profiles`.

create table if not exists public.profiles_private (
  id uuid primary key references public.profiles (id) on delete cascade,
  accepted_terms_at   timestamptz,
  accepted_privacy_at timestamptz,
  accepted_cookies_at timestamptz,
  street_address      text,
  postal_code         text,
  updated_at          timestamptz not null default timezone('utc', now())
);

alter table public.profiles_private enable row level security;

-- Owner-only access. No DELETE policy needed: rows cascade when the parent
-- profile is removed during account deletion. Drop-then-create keeps this
-- migration idempotent (Postgres has no CREATE POLICY IF NOT EXISTS).
drop policy if exists "profiles_private_select_own" on public.profiles_private;
create policy "profiles_private_select_own"
on public.profiles_private for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_private_insert_own" on public.profiles_private;
create policy "profiles_private_insert_own"
on public.profiles_private for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_private_update_own" on public.profiles_private;
create policy "profiles_private_update_own"
on public.profiles_private for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Backfill from the existing public columns.
insert into public.profiles_private
  (id, accepted_terms_at, accepted_privacy_at, accepted_cookies_at, street_address, postal_code)
select
  id, accepted_terms_at, accepted_privacy_at, accepted_cookies_at, street_address, postal_code
from public.profiles
on conflict (id) do nothing;

-- NOTE: This is the "expand" half of an expand/contract migration. The old
-- columns are intentionally LEFT IN PLACE here so that clients still running
-- the previous frontend build (especially installed native apps) keep working.
-- The columns are dropped in 20260608000004_drop_profiles_pii_columns.sql,
-- which must only be run AFTER the new frontend is deployed everywhere.
