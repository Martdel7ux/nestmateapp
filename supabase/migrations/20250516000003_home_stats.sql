-- ============================================================================
-- Home dashboard RPCs
-- ============================================================================

-- get_home_stats: returns aggregate counts shown on the quick-action cards
CREATE OR REPLACE FUNCTION get_home_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  v_flatmate_count  int := 0;
  v_property_count  int := 0;
  v_study_group_count int := 0;
  v_unread_messages int := 0;
BEGIN
  -- Flatmate listings available for swiping (approved, not yet swiped by this user)
  SELECT COUNT(*)
  INTO v_flatmate_count
  FROM flatmate_listings fl
  WHERE fl.is_approved = true
    AND fl.user_id <> p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM flatmate_swipes fs
      WHERE fs.swiper_id = p_user_id AND fs.target_id = fl.user_id
    );

  -- Active property listings
  SELECT COUNT(*)
  INTO v_property_count
  FROM properties
  WHERE is_available = true;

  -- Study groups the user belongs to
  SELECT COUNT(*)
  INTO v_study_group_count
  FROM study_group_members
  WHERE user_id = p_user_id;

  -- Unread messages (matches only)
  SELECT COUNT(*)
  INTO v_unread_messages
  FROM messages m
  JOIN matches mt ON mt.id = m.match_id
  WHERE (mt.user1_id = p_user_id OR mt.user2_id = p_user_id)
    AND m.sender_id <> p_user_id
    AND m.is_read = false;

  RETURN jsonb_build_object(
    'flatmate_count',     v_flatmate_count,
    'property_count',     v_property_count,
    'study_group_count',  v_study_group_count,
    'unread_messages',    v_unread_messages
  );
EXCEPTION WHEN OTHERS THEN
  -- Safe fallback if any table doesn't exist yet
  RETURN jsonb_build_object(
    'flatmate_count',     0,
    'property_count',     0,
    'study_group_count',  0,
    'unread_messages',    0
  );
END;
$$;

-- get_home_suggestions: returns personalised notification-style suggestions
CREATE OR REPLACE FUNCTION get_home_suggestions(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  v_suggestions jsonb := '[]'::jsonb;
BEGIN
  -- Unread platform notifications
  SELECT jsonb_agg(
    jsonb_build_object(
      'id',    id,
      'title', title,
      'body',  body,
      'type',  type
    )
    ORDER BY created_at DESC
  )
  INTO v_suggestions
  FROM notifications
  WHERE user_id = p_user_id
    AND is_read = false
  LIMIT 5;

  RETURN COALESCE(v_suggestions, '[]'::jsonb);
EXCEPTION WHEN OTHERS THEN
  RETURN '[]'::jsonb;
END;
$$;

GRANT EXECUTE ON FUNCTION get_home_stats(uuid)       TO authenticated;
GRANT EXECUTE ON FUNCTION get_home_suggestions(uuid) TO authenticated;
