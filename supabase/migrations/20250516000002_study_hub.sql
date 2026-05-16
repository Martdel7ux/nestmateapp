-- Study Hub migration
-- ENUMs
CREATE TYPE user_course_status AS ENUM ('currently_taking','completed','planning_to_take');
CREATE TYPE note_visibility AS ENUM ('private','group','public');
CREATE TYPE study_group_role AS ENUM ('owner','admin','member');
CREATE TYPE study_message_conv_type AS ENUM ('group','direct');
CREATE TYPE mentor_request_status AS ENUM ('pending','accepted','declined');
CREATE TYPE report_status AS ENUM ('pending','reviewed','resolved');

-- courses
CREATE TABLE IF NOT EXISTS courses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text,
  title       text NOT NULL,
  university  text,
  department  text,
  description text,
  is_approved boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (university, code)
);

-- user_courses
CREATE TABLE IF NOT EXISTS user_courses (
  user_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  status    user_course_status NOT NULL DEFAULT 'currently_taking',
  grade     text,
  year      text,
  is_mentor boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, course_id)
);

-- study_groups (defined before notes because notes reference it)
CREATE TABLE IF NOT EXISTS study_groups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  course_id   uuid REFERENCES courses(id) ON DELETE SET NULL,
  is_private  boolean DEFAULT true,
  max_members int DEFAULT 10,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now()
);

-- study_group_members
CREATE TABLE IF NOT EXISTS study_group_members (
  group_id  uuid REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role      study_group_role DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- notes
CREATE TABLE IF NOT EXISTS notes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id       uuid REFERENCES courses(id) ON DELETE SET NULL,
  title           text NOT NULL,
  content         text DEFAULT '',
  visibility      note_visibility DEFAULT 'private',
  group_id        uuid REFERENCES study_groups(id) ON DELETE SET NULL,
  tags            text[] DEFAULT '{}',
  attachment_urls text[] DEFAULT '{}',
  search_vector   tsvector,
  upvote_count    int DEFAULT 0,
  view_count      int DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- GIN index for full-text search
CREATE INDEX notes_search_idx ON notes USING GIN(search_vector);

-- Trigger to update search_vector
CREATE OR REPLACE FUNCTION notes_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_search_vector_trigger
  BEFORE INSERT OR UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION notes_search_vector_update();

-- Trigger to keep updated_at current
-- Note: update_updated_at() function was already created in 20250516000001_opportunities.sql
CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- note_upvotes
CREATE TABLE IF NOT EXISTS note_upvotes (
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id    uuid REFERENCES notes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, note_id)
);

-- Trigger to maintain upvote_count
CREATE OR REPLACE FUNCTION update_note_upvote_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE notes SET upvote_count = upvote_count + 1 WHERE id = NEW.note_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE notes SET upvote_count = GREATEST(0, upvote_count - 1) WHERE id = OLD.note_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER note_upvote_count_trigger
  AFTER INSERT OR DELETE ON note_upvotes
  FOR EACH ROW EXECUTE FUNCTION update_note_upvote_count();

-- direct_conversations
CREATE TABLE IF NOT EXISTS direct_conversations (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (LEAST(user_a_id::text, user_b_id::text), GREATEST(user_a_id::text, user_b_id::text))
);

-- study_messages (renamed from 'messages' to avoid conflict with existing messages table)
CREATE TABLE IF NOT EXISTS study_messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   uuid NOT NULL,
  conversation_type study_message_conv_type NOT NULL,
  sender_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content           text NOT NULL DEFAULT '',
  attachment_url    text,
  created_at        timestamptz DEFAULT now(),
  edited_at         timestamptz,
  deleted_at        timestamptz
);

CREATE INDEX study_messages_conv_idx ON study_messages(conversation_id, created_at);

-- message_reads
CREATE TABLE IF NOT EXISTS study_message_reads (
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL,
  last_read_at    timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, conversation_id)
);

-- mentor_requests
CREATE TABLE IF NOT EXISTS mentor_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  mentor_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id    uuid REFERENCES courses(id) ON DELETE CASCADE,
  message      text,
  status       mentor_request_status DEFAULT 'pending',
  created_at   timestamptz DEFAULT now(),
  responded_at timestamptz
);

-- blocked_users (for moderation)
CREATE TABLE IF NOT EXISTS study_blocked_users (
  blocker_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- reports (for moderation)
CREATE TABLE IF NOT EXISTS study_reports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content_type text,
  content_id   uuid,
  reason       text NOT NULL,
  status       report_status DEFAULT 'pending',
  created_at   timestamptz DEFAULT now()
);

-- RPC for full-text search on notes
CREATE OR REPLACE FUNCTION search_notes(query text, p_user_id uuid)
RETURNS SETOF notes AS $$
BEGIN
  RETURN QUERY
  SELECT n.* FROM notes n
  WHERE n.search_vector @@ plainto_tsquery('english', query)
    AND (
      n.visibility = 'public'
      OR n.owner_id = p_user_id
      OR (n.visibility = 'group' AND EXISTS (
        SELECT 1 FROM study_group_members sgm
        WHERE sgm.group_id = n.group_id AND sgm.user_id = p_user_id
      ))
    )
  ORDER BY ts_rank(n.search_vector, plainto_tsquery('english', query)) DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_reports ENABLE ROW LEVEL SECURITY;

-- courses: anyone authenticated can read
CREATE POLICY "Authenticated read courses" ON courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role write courses" ON courses FOR ALL TO service_role USING (true) WITH CHECK (true);

-- user_courses: own only
CREATE POLICY "Users manage own courses" ON user_courses FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated read user_courses" ON user_courses FOR SELECT TO authenticated USING (true);

-- notes
CREATE POLICY "Owner full access notes" ON notes FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Public notes readable" ON notes FOR SELECT TO authenticated
  USING (visibility = 'public');
CREATE POLICY "Group notes readable by members" ON notes FOR SELECT TO authenticated
  USING (
    visibility = 'group' AND EXISTS (
      SELECT 1 FROM study_group_members sgm
      WHERE sgm.group_id = notes.group_id AND sgm.user_id = auth.uid()
    )
  );

-- note_upvotes
CREATE POLICY "Users manage own upvotes" ON note_upvotes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated read upvotes" ON note_upvotes FOR SELECT TO authenticated USING (true);

-- study_groups
CREATE POLICY "Members read groups" ON study_groups FOR SELECT TO authenticated
  USING (
    NOT is_private OR
    EXISTS (SELECT 1 FROM study_group_members sgm WHERE sgm.group_id = study_groups.id AND sgm.user_id = auth.uid())
  );
CREATE POLICY "Owner/admin update groups" ON study_groups FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM study_group_members sgm WHERE sgm.group_id = study_groups.id AND sgm.user_id = auth.uid() AND sgm.role IN ('owner','admin'))
  );
CREATE POLICY "Authenticated create groups" ON study_groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- study_group_members
CREATE POLICY "Members read group members" ON study_group_members FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM study_group_members sgm2 WHERE sgm2.group_id = study_group_members.group_id AND sgm2.user_id = auth.uid()));
CREATE POLICY "Owner/admin manage members" ON study_group_members FOR ALL TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM study_group_members sgm WHERE sgm.group_id = study_group_members.group_id AND sgm.user_id = auth.uid() AND sgm.role IN ('owner','admin'))
  ) WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM study_group_members sgm WHERE sgm.group_id = study_group_members.group_id AND sgm.user_id = auth.uid() AND sgm.role IN ('owner','admin'))
  );

-- direct_conversations
CREATE POLICY "Participants read direct convos" ON direct_conversations FOR SELECT TO authenticated
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);
CREATE POLICY "Authenticated create direct convos" ON direct_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- study_messages: participants can read, sender can delete/edit
CREATE POLICY "Participants read study messages" ON study_messages FOR SELECT TO authenticated
  USING (
    (conversation_type = 'direct' AND EXISTS (
      SELECT 1 FROM direct_conversations dc WHERE dc.id = conversation_id AND (dc.user_a_id = auth.uid() OR dc.user_b_id = auth.uid())
    )) OR
    (conversation_type = 'group' AND EXISTS (
      SELECT 1 FROM study_group_members sgm WHERE sgm.group_id = conversation_id AND sgm.user_id = auth.uid()
    ))
  );
CREATE POLICY "Sender insert study messages" ON study_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Sender edit own study messages" ON study_messages FOR UPDATE TO authenticated USING (auth.uid() = sender_id);

-- study_message_reads
CREATE POLICY "Users manage own reads" ON study_message_reads FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- mentor_requests
CREATE POLICY "Requester/mentor read requests" ON mentor_requests FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = mentor_id);
CREATE POLICY "Requester create requests" ON mentor_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Mentor update requests" ON mentor_requests FOR UPDATE TO authenticated USING (auth.uid() = mentor_id OR auth.uid() = requester_id);

-- study_blocked_users
CREATE POLICY "Users manage own blocks" ON study_blocked_users FOR ALL TO authenticated
  USING (auth.uid() = blocker_id) WITH CHECK (auth.uid() = blocker_id);

-- study_reports
CREATE POLICY "Reporter create reports" ON study_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Reporter read own reports" ON study_reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
CREATE POLICY "Service role manage reports" ON study_reports FOR ALL TO service_role USING (true) WITH CHECK (true);
