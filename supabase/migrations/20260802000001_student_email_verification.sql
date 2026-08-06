-- Student email verification: emailed one-time code + a public "verified" badge.
--
-- Data model:
--   profiles.student_verified_at         → public trust signal (others can see it)
--   profiles_private.student_email       → owner-only, the verified address
--   student_email_verifications          → service-role only (holds the code hash)

alter table public.profiles
  add column if not exists student_verified_at timestamptz;

alter table public.profiles_private
  add column if not exists student_email text;

-- Pending codes. Only the verify-student-email edge function (service role,
-- which bypasses RLS) reads or writes this — clients never touch it directly.
create table if not exists public.student_email_verifications (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  email       text not null,
  university  text,
  code_hash   text not null,
  expires_at  timestamptz not null,
  attempts    integer not null default 0,
  verified_at timestamptz,
  created_at  timestamptz not null default timezone('utc', now()),
  updated_at  timestamptz not null default timezone('utc', now())
);

alter table public.student_email_verifications enable row level security;
-- Intentionally NO policies: RLS denies all client access. The edge function
-- uses the service role (which bypasses RLS) to manage rows; clients learn
-- their status from profiles.student_verified_at / profiles_private.student_email.
