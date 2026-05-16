-- Re-target notes.owner_id FK from auth.users → public.profiles so PostgREST
-- can resolve the owner:profiles!owner_id join used in study-api.ts.
-- profiles.id == auth.users.id (the handle_new_user trigger enforces this),
-- so no data migration is needed — only the constraint target changes.

ALTER TABLE notes
  DROP CONSTRAINT IF EXISTS notes_owner_id_fkey;

ALTER TABLE notes
  ADD CONSTRAINT notes_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
