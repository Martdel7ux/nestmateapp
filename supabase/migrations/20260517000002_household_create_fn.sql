-- Atomic household creation: insert household + add creator as owner in one
-- SECURITY DEFINER call so the SELECT return isn't blocked by the member check.
CREATE OR REPLACE FUNCTION create_household_for_user(
  p_name            text,
  p_address         text,
  p_currency        text,
  p_invite_code     text,
  p_invite_expires  timestamptz
)
RETURNS households
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household households;
BEGIN
  INSERT INTO households (name, address, currency, invite_code, invite_expires_at, created_by)
  VALUES (p_name, p_address, p_currency, p_invite_code, p_invite_expires, auth.uid())
  RETURNING * INTO v_household;

  INSERT INTO household_members (household_id, user_id, role)
  VALUES (v_household.id, auth.uid(), 'owner');

  RETURN v_household;
END;
$$;

GRANT EXECUTE ON FUNCTION create_household_for_user TO authenticated;
