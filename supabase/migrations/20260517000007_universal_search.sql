-- ============================================================================
-- Universal Search
-- Adds FTS to opportunities + properties, and creates the universal_search RPC
-- ============================================================================

-- ── FTS on opportunities ──────────────────────────────────────────────────
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

UPDATE public.opportunities SET
  search_vector = to_tsvector('simple',
    coalesce(title, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(organization, '') || ' ' ||
    coalesce(location, '') || ' ' ||
    coalesce(array_to_string(tags, ' '), '')
  );

CREATE INDEX IF NOT EXISTS idx_opportunities_search
  ON public.opportunities USING GIN (search_vector);

CREATE OR REPLACE FUNCTION opportunities_search_vector_trigger()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(NEW.organization, '') || ' ' ||
    coalesce(NEW.location, '') || ' ' ||
    coalesce(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_opportunities_search_vector ON public.opportunities;
CREATE TRIGGER trg_opportunities_search_vector
  BEFORE INSERT OR UPDATE OF title, description, organization, location, tags
  ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION opportunities_search_vector_trigger();

-- ── FTS on properties ─────────────────────────────────────────────────────
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

UPDATE public.properties SET
  search_vector = to_tsvector('simple',
    coalesce(title, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(city::text, '') || ' ' ||
    coalesce(address, '')
  );

CREATE INDEX IF NOT EXISTS idx_properties_search
  ON public.properties USING GIN (search_vector);

CREATE OR REPLACE FUNCTION properties_search_vector_trigger()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(NEW.city::text, '') || ' ' ||
    coalesce(NEW.address, '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_properties_search_vector ON public.properties;
CREATE TRIGGER trg_properties_search_vector
  BEFORE INSERT OR UPDATE OF title, description, city, address
  ON public.properties
  FOR EACH ROW EXECUTE FUNCTION properties_search_vector_trigger();

-- ── universal_search RPC ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION universal_search(p_user_id uuid, p_query text, p_limit int DEFAULT 5)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q tsquery := plainto_tsquery('simple', p_query);
  results json;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  WITH
    events_q AS (
      SELECT
        'opportunity'    AS type,
        id::text         AS id,
        title,
        coalesce(organization, location, '') AS subtitle,
        image_url        AS thumbnail_url,
        '/discover/' || id::text AS href,
        type::text       AS badge,
        ts_rank(search_vector, q) AS score
      FROM opportunities
      WHERE search_vector @@ q
      ORDER BY score DESC
      LIMIT p_limit
    ),
    notes_q AS (
      SELECT
        'note'           AS type,
        id::text         AS id,
        title,
        ''               AS subtitle,
        NULL::text       AS thumbnail_url,
        '/study/notes/' || id::text AS href,
        'Note'           AS badge,
        ts_rank(search_vector, q) AS score
      FROM notes
      WHERE (owner_id = p_user_id OR visibility = 'public')
        AND search_vector @@ q
      ORDER BY score DESC
      LIMIT p_limit
    ),
    properties_q AS (
      SELECT
        'property'       AS type,
        id::text         AS id,
        title,
        coalesce(city::text, '') || coalesce(', ' || address, '') AS subtitle,
        (image_urls)[1]  AS thumbnail_url,
        '/properties'    AS href,
        'Property'       AS badge,
        ts_rank(search_vector, q) AS score
      FROM properties
      WHERE is_approved = true
        AND search_vector @@ q
      ORDER BY score DESC
      LIMIT p_limit
    ),
    documents_q AS (
      SELECT
        'document'       AS type,
        id::text         AS id,
        title,
        category         AS subtitle,
        thumbnail_path   AS thumbnail_url,
        '/documents/' || id::text AS href,
        'Document'       AS badge,
        ts_rank(search_vector, q) AS score
      FROM documents
      WHERE deleted_at IS NULL
        AND (
          owner_id = p_user_id
          OR (
            visibility = 'household'
            AND shared_household_id IN (
              SELECT household_id FROM household_members
              WHERE user_id = p_user_id AND left_at IS NULL
            )
          )
        )
        AND search_vector @@ q
      ORDER BY score DESC
      LIMIT p_limit
    )
  SELECT json_build_object(
    'opportunities', (SELECT json_agg(events_q)     FROM events_q),
    'notes',         (SELECT json_agg(notes_q)       FROM notes_q),
    'properties',    (SELECT json_agg(properties_q)  FROM properties_q),
    'documents',     (SELECT json_agg(documents_q)   FROM documents_q),
    'query',         p_query
  ) INTO results;

  RETURN results;
END;
$$;

GRANT EXECUTE ON FUNCTION universal_search(uuid, text, int) TO authenticated;
