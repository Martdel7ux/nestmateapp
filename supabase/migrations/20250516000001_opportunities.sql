-- ── Opportunity module migration ──────────────────────────────────────────────

CREATE TYPE opportunity_type AS ENUM ('event', 'job', 'internship', 'volunteering');
CREATE TYPE opp_location_type AS ENUM ('in_person', 'remote', 'hybrid');
CREATE TYPE opp_employment_type AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'volunteer');
CREATE TYPE opp_notify_frequency AS ENUM ('instant', 'daily', 'weekly');

CREATE TABLE IF NOT EXISTS opportunities (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type            opportunity_type NOT NULL,
  title           text NOT NULL,
  description     text,
  organization    text,
  location        text,
  location_type   opp_location_type DEFAULT 'in_person',
  url             text,
  image_url       text,
  source          text DEFAULT 'manual',
  source_id       text,
  starts_at       timestamptz,
  ends_at         timestamptz,
  salary_min      numeric,
  salary_max      numeric,
  salary_currency text DEFAULT 'EUR',
  employment_type opp_employment_type,
  tags            text[] DEFAULT '{}',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE (source, source_id)
);

CREATE TABLE IF NOT EXISTS user_opportunity_saves (
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE CASCADE,
  saved_at       timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, opportunity_id)
);

CREATE TABLE IF NOT EXISTS user_opportunity_preferences (
  user_id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  interested_types   text[] DEFAULT ARRAY['event','job','internship','volunteering'],
  interested_tags    text[] DEFAULT '{}',
  location           text,
  remote_ok          boolean DEFAULT true,
  notify_email       boolean DEFAULT true,
  notify_inapp       boolean DEFAULT true,
  notify_frequency   opp_notify_frequency DEFAULT 'daily',
  updated_at         timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS discover_notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type            text NOT NULL DEFAULT 'new_opportunity',
  title           text NOT NULL,
  body            text,
  link            text,
  opportunity_id  uuid REFERENCES opportunities(id) ON DELETE SET NULL,
  read_at         timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER opportunities_updated_at BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER preferences_updated_at BEFORE UPDATE ON user_opportunity_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_opportunity_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_opportunity_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE discover_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read opportunities" ON opportunities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role write opportunities" ON opportunities
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users manage own saves" ON user_opportunity_saves
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own preferences" ON user_opportunity_preferences
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own discover_notifications" ON discover_notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users update own discover_notifications" ON discover_notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role insert discover_notifications" ON discover_notifications
  FOR INSERT TO service_role WITH CHECK (true);
