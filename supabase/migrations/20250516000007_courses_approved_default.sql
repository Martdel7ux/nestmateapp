-- Ensure is_approved column exists and all admin-uploaded courses are visible.
-- The app no longer filters by is_approved — courses are admin-curated directly.
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT true;

-- Backfill any existing rows that were inserted before this migration
UPDATE courses SET is_approved = true WHERE is_approved IS NULL OR is_approved = false;
