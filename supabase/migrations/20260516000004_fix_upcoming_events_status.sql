-- Fix: get_upcoming_events was returning unpublished/draft events.
-- Add status filter so only published events appear on the home page.

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
      (uos.opportunity_id IS NOT NULL) AS is_favourited,
      CASE
        WHEN uos.opportunity_id IS NOT NULL THEN 1
        WHEN EXISTS (
          SELECT 1 FROM user_opportunity_preferences up
          WHERE up.user_id = p_user_id
            AND o.tags && up.interested_tags
        )                              THEN 2
        WHEN EXISTS (
          SELECT 1 FROM profiles pr
          WHERE pr.id = p_user_id
            AND pr.city IS NOT NULL
            AND o.location ILIKE '%' || pr.city || '%'
        )                              THEN 3
        ELSE                                4
      END AS priority
    FROM      opportunities o
    LEFT JOIN user_opportunity_saves uos
           ON uos.opportunity_id = o.id
          AND uos.user_id        = p_user_id
    WHERE o.type      = 'event'
      AND o.starts_at > now()
      AND (o.status = 'published' OR o.status IS NULL)
    ORDER BY priority ASC, o.starts_at ASC
    LIMIT p_limit
  ) ranked;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN '[]'::jsonb;
END;
$$;

GRANT EXECUTE ON FUNCTION get_upcoming_events(uuid, int) TO authenticated;
