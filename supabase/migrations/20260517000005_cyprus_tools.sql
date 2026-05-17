-- ============================================================================
-- Cyprus Tools
-- ============================================================================

-- Extend notification_type enum
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'eac_outage';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'garbage_reminder';

-- Add area + garbage reminder preference to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS area text,
  ADD COLUMN IF NOT EXISTS garbage_reminder_enabled boolean NOT NULL DEFAULT false;

-- ============================================================================
-- Helper: is_admin (if not already defined)
-- ============================================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================================
-- eac_outages
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.eac_outages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id   text UNIQUE,
  starts_at   timestamptz NOT NULL,
  ends_at     timestamptz NOT NULL,
  district    text CHECK (district IN ('nicosia','limassol','larnaca','paphos','famagusta')),
  area        text,
  streets     text[] NOT NULL DEFAULT '{}',
  reason      text,
  source_url  text,
  raw_text    text,
  scraped_at  timestamptz DEFAULT now(),
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eac_outages_starts   ON public.eac_outages (starts_at);
CREATE INDEX IF NOT EXISTS idx_eac_outages_district ON public.eac_outages (district, area);

-- ============================================================================
-- bus_routes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bus_routes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_code        text NOT NULL,
  route_name        text NOT NULL,
  university        text NOT NULL CHECK (university IN ('unic','ucy','cut','euc')),
  operator          text,
  start_point       text,
  end_point         text,
  description       text,
  typical_frequency text,
  first_departure   text,
  last_departure    text,
  fare_eur          numeric(5,2),
  notes             text,
  source_url        text,
  is_active         boolean NOT NULL DEFAULT true,
  display_order     int NOT NULL DEFAULT 100,
  updated_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bus_route_stops (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id   uuid REFERENCES public.bus_routes ON DELETE CASCADE,
  stop_order int NOT NULL,
  stop_name  text NOT NULL,
  latitude   numeric(9,6),
  longitude  numeric(9,6),
  notes      text
);

CREATE INDEX IF NOT EXISTS idx_bus_routes_uni   ON public.bus_routes (university, display_order);
CREATE INDEX IF NOT EXISTS idx_bus_stops_route  ON public.bus_route_stops (route_id, stop_order);

-- ============================================================================
-- garbage_schedules
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.garbage_schedules (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city               text NOT NULL,
  area               text NOT NULL,
  general_waste_days int[] NOT NULL DEFAULT '{}',  -- 0=Sun..6=Sat
  recycling_days     int[] NOT NULL DEFAULT '{}',
  organic_days       int[] NOT NULL DEFAULT '{}',
  bulky_waste_info   text,
  notes              text,
  source_url         text,
  updated_at         timestamptz DEFAULT now(),
  UNIQUE (city, area)
);

CREATE INDEX IF NOT EXISTS idx_garbage_city ON public.garbage_schedules (city, area);

-- ============================================================================
-- scraper_logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.scraper_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scraper    text NOT NULL,
  success    boolean NOT NULL,
  message    text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE public.eac_outages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_routes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_route_stops   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garbage_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_logs      ENABLE ROW LEVEL SECURITY;

-- Public read (any logged-in user)
DO $$ BEGIN
  CREATE POLICY "outages_read"  ON public.eac_outages       FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "bus_read"      ON public.bus_routes        FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "stops_read"    ON public.bus_route_stops   FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "garbage_read"  ON public.garbage_schedules FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "logs_read"     ON public.scraper_logs      FOR SELECT TO authenticated USING (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admin write
DO $$ BEGIN
  CREATE POLICY "outages_admin" ON public.eac_outages FOR ALL TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "bus_admin"     ON public.bus_routes  FOR ALL TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "stops_admin"   ON public.bus_route_stops FOR ALL TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "garbage_admin" ON public.garbage_schedules FOR ALL TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- Seed: Bus Routes
-- ============================================================================
INSERT INTO public.bus_routes (route_code, route_name, university, operator, start_point, end_point,
  typical_frequency, first_departure, last_departure, fare_eur, notes, source_url, display_order)
VALUES
  -- UNIC
  ('127', 'City Center → UNIC (Makedonitissa)', 'unic', 'Intercity KTEL', 'Eleftheria Square', 'UNIC Main Gate',
   'Every 30–40 min weekdays, hourly weekends', '06:30', '22:00', 1.50,
   'Buy ticket on board. Free for UNIC students with valid ID on campus shuttle.',
   'https://www.osypa.com.cy', 1),
  ('UNIC-S', 'UNIC Campus Shuttle', 'unic', 'UNIC', 'Makedonitissa Terminal', 'UNIC Campus',
   'Every 20 min during semester (07:30–20:00)', '07:30', '20:00', 0.00,
   'Free for all UNIC students with valid student card. Does not operate on public holidays.',
   'https://www.unic.ac.cy/campus-life', 2),

  -- UCY
  ('72', 'City Center → UCY (Aglantzia)', 'ucy', 'Intercity KTEL', 'Eleftheria Square', 'UCY Main Campus',
   'Every 30 min weekdays, every 60 min weekends', '06:45', '21:30', 1.50,
   'Stops at Nicosia General Hospital and several Aglantzia neighborhoods.',
   'https://www.osypa.com.cy', 1),
  ('61', 'Troodos Sq → UCY via Engomi', 'ucy', 'Intercity KTEL', 'Troodos Square', 'UCY Campus',
   'Every 40 min weekdays only', '07:00', '19:00', 1.50,
   'Useful from Engomi/Strovolos area. Check live schedule as it varies.',
   'https://www.osypa.com.cy', 2),

  -- CUT
  ('30', 'Limassol Center → CUT', 'cut', 'EMEL', 'Limassol Old Port', 'CUT Campus (Athinon Ave)',
   'Every 20 min weekdays, every 30 min weekends', '06:00', '23:00', 1.50,
   'EMEL smart card gives 20% discount. Day pass €5. Runs along the coastal road.',
   'https://emel.com.cy', 1),
  ('14', 'Limassol Center → CUT via Ayia Zoni', 'cut', 'EMEL', 'Limassol Bus Terminal', 'CUT Gate',
   'Every 30 min weekdays', '07:00', '21:00', 1.50,
   'Alternative route through residential areas — useful from eastern Limassol.',
   'https://emel.com.cy', 2),
  ('CUT-S', 'CUT Campus Shuttle', 'cut', 'CUT', 'Limassol Center Pickup', 'CUT Campus',
   'Morning + afternoon runs during semester', '08:00', '18:00', 0.00,
   'Check CUT student portal for semester schedule. Free for registered students.',
   'https://www.cut.ac.cy/services/transport', 3),

  -- EUC (shares area with UNIC — both in Engomi, Nicosia)
  ('127', 'City Center → EUC (Engomi)', 'euc', 'Intercity KTEL', 'Eleftheria Square', 'EUC / Diogenes St',
   'Every 30–40 min weekdays, hourly weekends', '06:30', '22:00', 1.50,
   'Same route as UNIC route 127 — EUC is a short walk from the Makedonitissa stop.',
   'https://www.osypa.com.cy', 1),
  ('EUC-S', 'EUC Campus Shuttle', 'euc', 'EUC', 'Nicosia Center', 'EUC Campus',
   'Twice daily during semester (morning + afternoon)', '08:00', '17:00', 0.00,
   'Free for EUC students. Check EUC student services for exact pickup points.',
   'https://www.euc.ac.cy', 2)
ON CONFLICT DO NOTHING;

-- Stops for Route 127 (UNIC)
WITH r AS (SELECT id FROM public.bus_routes WHERE route_code = '127' AND university = 'unic' LIMIT 1)
INSERT INTO public.bus_route_stops (route_id, stop_order, stop_name, latitude, longitude)
SELECT r.id, s.ord, s.name, s.lat, s.lon FROM r,
(VALUES
  (1, 'Eleftheria Square',         35.16766, 33.36416),
  (2, 'Athalassa Ave / Diagorou',  35.16523, 33.35714),
  (3, 'Strovolos Ave Junction',    35.16201, 33.34892),
  (4, 'Makedonitissa Terminal',    35.16561, 33.32664),
  (5, 'UNIC Main Gate',            35.16570, 33.32504)
) AS s(ord, name, lat, lon)
ON CONFLICT DO NOTHING;

-- Stops for Route 72 (UCY)
WITH r AS (SELECT id FROM public.bus_routes WHERE route_code = '72' AND university = 'ucy' LIMIT 1)
INSERT INTO public.bus_route_stops (route_id, stop_order, stop_name, latitude, longitude)
SELECT r.id, s.ord, s.name, s.lat, s.lon FROM r,
(VALUES
  (1, 'Eleftheria Square',        35.16766, 33.36416),
  (2, 'Nicosia General Hospital', 35.15834, 33.37219),
  (3, 'Aglantzia Centre',         35.14851, 33.39641),
  (4, 'UCY Sports Centre Stop',   35.14418, 33.41046),
  (5, 'UCY Main Campus Gate',     35.14350, 33.41160)
) AS s(ord, name, lat, lon)
ON CONFLICT DO NOTHING;

-- Stops for Route 30 (CUT)
WITH r AS (SELECT id FROM public.bus_routes WHERE route_code = '30' AND university = 'cut' LIMIT 1)
INSERT INTO public.bus_route_stops (route_id, stop_order, stop_name, latitude, longitude)
SELECT r.id, s.ord, s.name, s.lat, s.lon FROM r,
(VALUES
  (1, 'Limassol Old Port',          34.67186, 33.04355),
  (2, 'Limassol Marina',            34.67521, 33.05212),
  (3, 'Gladstonos St',              34.67761, 33.04891),
  (4, 'Makarios Ave / CUT junction',34.68421, 33.02756),
  (5, 'CUT Main Campus',            34.68570, 33.02604)
) AS s(ord, name, lat, lon)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Seed: Garbage Schedules (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
-- ============================================================================
INSERT INTO public.garbage_schedules
  (city, area, general_waste_days, recycling_days, organic_days, bulky_waste_info, notes)
VALUES
  -- Nicosia
  ('nicosia', 'Strovolos',    ARRAY[1,4], ARRAY[2],   ARRAY[3],   'Call 22-403-000 for bulk collection appointment', 'Strovolos Municipality'),
  ('nicosia', 'Engomi',       ARRAY[1,3,5], ARRAY[4], ARRAY[]::integer[],    'Call 22-353-565 for bulk waste', 'Engomi Municipality'),
  ('nicosia', 'Aglantzia',    ARRAY[2,5], ARRAY[1],   ARRAY[3],   'Call 22-407-900 for bulk items', 'Aglantzia Municipality'),
  ('nicosia', 'Lakatamia',    ARRAY[1,4], ARRAY[3],   ARRAY[]::integer[],    'Call 22-382-750 for large items', 'Lakatamia Municipality'),
  ('nicosia', 'Latsia',       ARRAY[2,5], ARRAY[4],   ARRAY[]::integer[],    'Call 22-375-270 for bulk waste', 'Latsia Municipality'),
  ('nicosia', 'Old Town',     ARRAY[1,3,5], ARRAY[2], ARRAY[3],   'Call Nicosia Municipality 22-797-000', 'Nicosia Municipality center'),
  ('nicosia', 'Agios Dometios',ARRAY[1,4], ARRAY[2],  ARRAY[]::integer[],    'Call 22-776-000', 'Agios Dometios Municipality'),
  -- Limassol
  ('limassol', 'Mesa Geitonia',   ARRAY[1,4], ARRAY[3], ARRAY[2], 'Call 25-862-600 for bulk collection', 'Limassol Municipality'),
  ('limassol', 'Agios Athanasios',ARRAY[2,5], ARRAY[1], ARRAY[]::integer[],  'Call 25-383-000', 'Agios Athanasios Municipality'),
  ('limassol', 'Germasogeia',     ARRAY[1,3,5], ARRAY[4], ARRAY[]::integer[],'Call 25-325-024 for appointments', 'Germasogeia Municipality'),
  ('limassol', 'Town Center',     ARRAY[1,3,5], ARRAY[4], ARRAY[2],'Call 25-862-600', 'Limassol Municipality central'),
  ('limassol', 'Polemidia',       ARRAY[2,5], ARRAY[1], ARRAY[]::integer[],  'Call 25-585-600', 'Polemidia Municipality'),
  -- Larnaca
  ('larnaca', 'Town Center',   ARRAY[1,3,5], ARRAY[4], ARRAY[2],  'Call 24-657-801', 'Larnaca Municipality'),
  ('larnaca', 'Aradippou',     ARRAY[2,6],   ARRAY[5], ARRAY[]::integer[],   'Call 24-843-700 for bulk items', 'Aradippou Municipality'),
  ('larnaca', 'Livadia',       ARRAY[1,4],   ARRAY[3], ARRAY[]::integer[],   'Call 24-432-432', 'Livadia Municipality'),
  ('larnaca', 'Oroklini',      ARRAY[2,5],   ARRAY[1], ARRAY[]::integer[],   'Call 24-535-007', 'Oroklini Community Council'),
  -- Paphos
  ('paphos', 'Town Center',   ARRAY[1,3,5], ARRAY[4], ARRAY[2],   'Call 26-820-400', 'Paphos Municipality'),
  ('paphos', 'Universal',     ARRAY[2,5],   ARRAY[1], ARRAY[]::integer[],    'Call 26-820-400', 'Paphos Municipality'),
  ('paphos', 'Kato Paphos',   ARRAY[1,4],   ARRAY[2], ARRAY[]::integer[],    'Call 26-820-400', 'Paphos Municipality coastal area'),
  ('paphos', 'Peyia',         ARRAY[3,6],   ARRAY[1], ARRAY[]::integer[],    'Call 26-621-443', 'Peyia Community Council')
ON CONFLICT (city, area) DO NOTHING;
