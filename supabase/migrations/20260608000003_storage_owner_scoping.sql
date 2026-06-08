-- Harden over-permissive Storage policies.
--
-- Several private buckets had policies of the form
--   USING (bucket_id = '<bucket>' AND auth.uid() IS NOT NULL)
-- which let ANY authenticated user read/delete EVERY object in the bucket —
-- including other people's documents (passports, contracts), rent receipts, and
-- expense receipts. We re-scope them to the owner, identified by the first path
-- segment (auth.uid()/...), mirroring the convention used by the avatars,
-- property-images, verification-docs, and chat-attachments policies.

-- ── documents + document-thumbnails ─────────────────────────────────────────
-- Owner can always access; household members can READ a document explicitly
-- shared with their household (mirrors the public.documents "doc_select" policy).
drop policy if exists "docs_auth_read"   on storage.objects;
drop policy if exists "docs_auth_insert" on storage.objects;
drop policy if exists "docs_auth_delete" on storage.objects;
-- Also drop the new names so this migration is re-runnable (idempotent).
drop policy if exists "docs_owner_or_shared_read" on storage.objects;
drop policy if exists "docs_owner_insert"         on storage.objects;
drop policy if exists "docs_owner_delete"         on storage.objects;

create policy "docs_owner_or_shared_read"
on storage.objects for select
to authenticated
using (
  bucket_id in ('documents', 'document-thumbnails')
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or exists (
      select 1
      from public.documents d
      where (d.storage_path = name or d.thumbnail_path = name)
        and d.deleted_at is null
        and d.visibility = 'household'
        and d.shared_household_id is not null
        and public.is_household_member(d.shared_household_id)
    )
  )
);

create policy "docs_owner_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('documents', 'document-thumbnails')
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "docs_owner_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('documents', 'document-thumbnails')
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- ── rent-receipts (owner-only) ──────────────────────────────────────────────
drop policy if exists "rr_owner_read"   on storage.objects;
drop policy if exists "rr_owner_insert" on storage.objects;
drop policy if exists "rr_owner_delete" on storage.objects;

create policy "rr_owner_read"
on storage.objects for select
to authenticated
using (bucket_id = 'rent-receipts' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "rr_owner_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'rent-receipts' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "rr_owner_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'rent-receipts' and auth.uid()::text = (storage.foldername(name))[1]);

-- ── expense-receipts (owner-only) ───────────────────────────────────────────
drop policy if exists "receipts_member_read"   on storage.objects;
drop policy if exists "receipts_member_insert" on storage.objects;
drop policy if exists "receipts_member_delete" on storage.objects;
drop policy if exists "receipts_owner_read"    on storage.objects;
drop policy if exists "receipts_owner_insert"  on storage.objects;
drop policy if exists "receipts_owner_delete"  on storage.objects;

create policy "receipts_owner_read"
on storage.objects for select
to authenticated
using (bucket_id = 'expense-receipts' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "receipts_owner_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'expense-receipts' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "receipts_owner_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'expense-receipts' and auth.uid()::text = (storage.foldername(name))[1]);
