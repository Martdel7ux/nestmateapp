-- CONTRACT phase of the profiles PII split (see 20260608000001).
--
-- ⚠️ Run this ONLY after the new frontend (web + native) is deployed everywhere
-- and old app versions are no longer in active use. Dropping these columns while
-- an old client is running will break consent + location writes for that client.
--
-- This closes the original vulnerability: the home address (street_address,
-- postal_code) and consent timestamps stop being readable from the
-- world-readable `profiles` table.

-- Re-sync any values written to the old columns by old clients during the
-- transition window, so nothing is lost when the columns are dropped.
insert into public.profiles_private
  (id, accepted_terms_at, accepted_privacy_at, accepted_cookies_at, street_address, postal_code)
select
  id, accepted_terms_at, accepted_privacy_at, accepted_cookies_at, street_address, postal_code
from public.profiles
on conflict (id) do update set
  accepted_terms_at   = coalesce(public.profiles_private.accepted_terms_at,   excluded.accepted_terms_at),
  accepted_privacy_at = coalesce(public.profiles_private.accepted_privacy_at, excluded.accepted_privacy_at),
  accepted_cookies_at = coalesce(public.profiles_private.accepted_cookies_at, excluded.accepted_cookies_at),
  street_address      = coalesce(public.profiles_private.street_address,      excluded.street_address),
  postal_code         = coalesce(public.profiles_private.postal_code,         excluded.postal_code);

alter table public.profiles
  drop column if exists accepted_terms_at,
  drop column if exists accepted_privacy_at,
  drop column if exists accepted_cookies_at,
  drop column if exists street_address,
  drop column if exists postal_code;
