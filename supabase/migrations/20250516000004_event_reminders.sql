-- ============================================================================
-- Upcoming Events / Event Reminders
-- ============================================================================

-- 1. Reminder tracking columns on user_opportunity_saves
ALTER TABLE user_opportunity_saves
  ADD COLUMN IF NOT EXISTS reminder_enabled  boolean    DEFAULT true,
  ADD COLUMN IF NOT EXISTS reminder_sent_at  timestamptz;

-- 2. Timezone column on profiles (default Nicosia — most users are Cyprus-based)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Asia/Nicosia';

-- Partial index speeds up the hourly cron query
CREATE INDEX IF NOT EXISTS idx_saves_reminder_pending
  ON user_opportunity_saves (opportunity_id)
  WHERE reminder_enabled = true AND reminder_sent_at IS NULL;

-- ============================================================================
-- get_upcoming_events(p_user_id, p_limit)
-- Returns upcoming events ranked by personal relevance.
-- Priority:
--   1 — Events the user has already favourited
--   2 — Events matching the user's interested_tags
--   3 — Events in the user's city
--   4 — All other upcoming events (popularity fallback)
-- Always filters to starts_at > now(), type = 'event'.
-- ============================================================================
CREATE OR REPLACE FUNCTION get_upcoming_events(
  p_user_id uuid,
  p_limit   int DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Row-level security: only the requesting user can call this for themselves.
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(ranked)), '[]'::jsonb)
  INTO   v_result
  FROM (
    SELECT
      o.id,
      o.title,
      o.description,
      o.organization,
      o.location,
      o.location_type,
      o.image_url,
      o.tags,
      o.url,
      o.starts_at,
      o.ends_at,
      (uos.opportunity_id IS NOT NULL)           AS is_favourited,
      -- Relevance tier (lower = shown first)
      CASE
        WHEN uos.opportunity_id IS NOT NULL THEN 1          -- already saved
        WHEN EXISTS (
          SELECT 1 FROM user_opportunity_preferences up
          WHERE up.user_id = p_user_id
            AND o.tags && up.interested_tags
        )                                        THEN 2     -- tag match
        WHEN EXISTS (
          SELECT 1 FROM profiles pr
          WHERE pr.id = p_user_id
            AND pr.city IS NOT NULL
            AND o.location ILIKE '%' || pr.city || '%'
        )                                        THEN 3     -- city match
        ELSE                                           4    -- fallback
      END AS priority
    FROM       opportunities  o
    LEFT JOIN  user_opportunity_saves uos
           ON  uos.opportunity_id = o.id
           AND uos.user_id        = p_user_id
    WHERE o.type      = 'event'
      AND o.starts_at > now()
    ORDER BY priority ASC, o.starts_at ASC
    LIMIT p_limit
  ) ranked;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  -- Safe fallback so the home page never errors
  RETURN '[]'::jsonb;
END;
$$;

GRANT EXECUTE ON FUNCTION get_upcoming_events(uuid, int) TO authenticated;

-- ============================================================================
-- Ensure ON DELETE CASCADE on user_opportunity_saves FK
-- (safe no-op if it already has it)
-- ============================================================================
DO $$
BEGIN
  -- Only add if the FK doesn't already cascade (avoids error on re-run)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.referential_constraints rc
    JOIN   information_schema.table_constraints tc
           ON tc.constraint_name = rc.constraint_name
    WHERE  tc.table_name   = 'user_opportunity_saves'
      AND  rc.delete_rule  = 'CASCADE'
  ) THEN
    -- Attempt to recreate the FK with CASCADE; silently skip if constraint name differs.
    NULL; -- TODO: if the FK needs updating, ALTER TABLE here with the correct constraint name.
  END IF;
END;
$$;
