-- ============================================================================
-- Admin Event Curation
-- ============================================================================

-- 1. Extend opportunities for curation workflow
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS status     text    DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS curated_by uuid    REFERENCES auth.users,
  ADD COLUMN IF NOT EXISTS source_url text;

-- Apply check constraint (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'opportunities' AND constraint_name = 'opportunities_status_check'
  ) THEN
    ALTER TABLE opportunities
      ADD CONSTRAINT opportunities_status_check
        CHECK (status IN ('draft', 'published', 'unpublished', 'flagged'));
  END IF;
END;
$$;

-- Backfill any NULLs (DEFAULT handles new rows but existing NULLs need UPDATE)
UPDATE opportunities SET status = 'published' WHERE status IS NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_status     ON opportunities (status);
CREATE INDEX IF NOT EXISTS idx_opportunities_source_url ON opportunities (source_url)
  WHERE source_url IS NOT NULL;

-- ============================================================================
-- Admin write policy on opportunities
-- ============================================================================
DO $$
BEGIN
  -- Enable RLS if not already on
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN   pg_namespace n ON n.oid = c.relnamespace
    WHERE  c.relname = 'opportunities'
      AND  n.nspname = 'public'
      AND  c.relrowsecurity
  ) THEN
    ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Public read policy
  BEGIN
    CREATE POLICY "opp_public_select" ON opportunities
      FOR SELECT USING (status = 'published' OR status IS NULL);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  -- Admin full access policy
  BEGIN
    CREATE POLICY "opp_admin_all" ON opportunities
      FOR ALL USING (
        auth.uid() IS NOT NULL
        AND (auth.jwt() ->> 'email') = ANY(ARRAY['martinahoto4@gmail.com'])
      )
      WITH CHECK (
        auth.uid() IS NOT NULL
        AND (auth.jwt() ->> 'email') = ANY(ARRAY['martinahoto4@gmail.com'])
      );
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END;
$$;

-- ============================================================================
-- opportunity_suggestions — user-submitted event tips
-- ============================================================================
CREATE TABLE IF NOT EXISTS opportunity_suggestions (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by             uuid        REFERENCES auth.users,
  url                      text,
  note                     text,
  status                   text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason         text,
  reviewed_by              uuid        REFERENCES auth.users,
  reviewed_at              timestamptz,
  resulting_opportunity_id uuid        REFERENCES opportunities,
  created_at               timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  ALTER TABLE opportunity_suggestions ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "suggestions_user_insert" ON opportunity_suggestions
    FOR INSERT WITH CHECK (auth.uid() = submitted_by);
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "suggestions_user_select" ON opportunity_suggestions
    FOR SELECT USING (auth.uid() = submitted_by);
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "suggestions_admin_all" ON opportunity_suggestions
    FOR ALL USING (
      auth.uid() IS NOT NULL
      AND (auth.jwt() ->> 'email') = ANY(ARRAY['martinahoto4@gmail.com'])
    )
    WITH CHECK (
      auth.uid() IS NOT NULL
      AND (auth.jwt() ->> 'email') = ANY(ARRAY['martinahoto4@gmail.com'])
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

-- ============================================================================
-- Rate-limit: 5 suggestions per user per 24 hours
-- ============================================================================
CREATE OR REPLACE FUNCTION check_suggestion_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM   opportunity_suggestions
    WHERE  submitted_by = NEW.submitted_by
      AND  created_at   > NOW() - INTERVAL '1 day'
  ) >= 5 THEN
    RAISE EXCEPTION 'rate_limit_exceeded'
      USING HINT = 'You may submit at most 5 event suggestions per day.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_suggestion_rate_limit ON opportunity_suggestions;
CREATE TRIGGER trg_suggestion_rate_limit
  BEFORE INSERT ON opportunity_suggestions
  FOR EACH ROW EXECUTE FUNCTION check_suggestion_rate_limit();
