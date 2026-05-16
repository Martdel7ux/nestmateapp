-- Fix: infinite recursion in study_group_members RLS policies
--
-- Root cause: policies on study_group_members contain EXISTS subqueries that
-- SELECT from study_group_members itself, triggering the same policy in a loop.
-- Policies on study_groups, notes, and study_messages that JOIN/subquery
-- study_group_members also hit this recursion.
--
-- Fix: SECURITY DEFINER helper functions bypass RLS when checking membership,
-- breaking every recursive cycle.

CREATE OR REPLACE FUNCTION is_group_member(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM study_group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION is_group_owner_or_admin(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM study_group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
      AND role IN ('owner', 'admin')
  );
$$;

-- ── study_groups ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Members read groups" ON study_groups;
CREATE POLICY "Members read groups" ON study_groups FOR SELECT TO authenticated
  USING (
    NOT is_private OR is_group_member(study_groups.id, auth.uid())
  );

DROP POLICY IF EXISTS "Owner/admin update groups" ON study_groups;
CREATE POLICY "Owner/admin update groups" ON study_groups FOR UPDATE TO authenticated
  USING (is_group_owner_or_admin(study_groups.id, auth.uid()));

-- ── study_group_members (the recursive table itself) ─────────────────────────

DROP POLICY IF EXISTS "Members read group members" ON study_group_members;
CREATE POLICY "Members read group members" ON study_group_members FOR SELECT TO authenticated
  USING (is_group_member(study_group_members.group_id, auth.uid()));

DROP POLICY IF EXISTS "Owner/admin manage members" ON study_group_members;
CREATE POLICY "Owner/admin manage members" ON study_group_members FOR ALL TO authenticated
  USING (
    auth.uid() = user_id OR
    is_group_owner_or_admin(study_group_members.group_id, auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id OR
    is_group_owner_or_admin(study_group_members.group_id, auth.uid())
  );

-- ── notes ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Group notes readable by members" ON notes;
CREATE POLICY "Group notes readable by members" ON notes FOR SELECT TO authenticated
  USING (
    visibility = 'group' AND is_group_member(notes.group_id, auth.uid())
  );

-- ── study_messages ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Participants read study messages" ON study_messages;
CREATE POLICY "Participants read study messages" ON study_messages FOR SELECT TO authenticated
  USING (
    (conversation_type = 'direct' AND EXISTS (
      SELECT 1 FROM direct_conversations dc
      WHERE dc.id = conversation_id
        AND (dc.user_a_id = auth.uid() OR dc.user_b_id = auth.uid())
    ))
    OR
    (conversation_type = 'group' AND is_group_member(conversation_id, auth.uid()))
  );
