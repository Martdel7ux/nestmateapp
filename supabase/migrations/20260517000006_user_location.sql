-- ============================================================================
-- User Location Feature
-- Adds location columns to profiles + creates the cyprus_areas lookup table
-- ============================================================================

-- Extend profiles with new location columns
-- (city and area already exist from earlier migrations)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS street_address       text,
  ADD COLUMN IF NOT EXISTS postal_code          text,
  ADD COLUMN IF NOT EXISTS location_set_at      timestamptz,
  ADD COLUMN IF NOT EXISTS location_confirmed_at timestamptz;

-- ============================================================================
-- Cyprus areas lookup table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cyprus_areas (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city           text NOT NULL CHECK (city IN ('nicosia','limassol','larnaca','paphos','famagusta','other')),
  area_name      text NOT NULL,
  area_name_greek text,
  display_order  int NOT NULL DEFAULT 100,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz DEFAULT now(),
  UNIQUE (city, area_name)
);

CREATE INDEX IF NOT EXISTS cyprus_areas_city_idx
  ON public.cyprus_areas (city, display_order)
  WHERE is_active = true;

-- RLS
ALTER TABLE public.cyprus_areas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "areas_read" ON public.cyprus_areas
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "areas_admin" ON public.cyprus_areas
    FOR ALL TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- Seed: Cyprus areas
-- ============================================================================
INSERT INTO public.cyprus_areas (city, area_name, display_order) VALUES
  -- Nicosia
  ('nicosia', 'Old Town',        10),
  ('nicosia', 'Strovolos',       20),
  ('nicosia', 'Engomi',          30),
  ('nicosia', 'Aglantzia',       40),
  ('nicosia', 'Lakatamia',       50),
  ('nicosia', 'Latsia',          60),
  ('nicosia', 'Makedonitissa',   70),
  ('nicosia', 'Agios Dometios',  80),
  ('nicosia', 'Geri',            90),
  ('nicosia', 'Tseri',           100),
  ('nicosia', 'Dali',            110),
  ('nicosia', 'Nisou',           120),
  ('nicosia', 'Pera Chorio',     130),
  ('nicosia', 'Other',           999),

  -- Limassol
  ('limassol', 'Town Center',            10),
  ('limassol', 'Mesa Geitonia',          20),
  ('limassol', 'Agios Athanasios',       30),
  ('limassol', 'Germasogeia',            40),
  ('limassol', 'Potamos Germasogeias',   50),
  ('limassol', 'Agios Tychonas',         60),
  ('limassol', 'Kato Polemidia',         70),
  ('limassol', 'Pano Polemidia',         80),
  ('limassol', 'Ypsonas',                90),
  ('limassol', 'Other',                  999),

  -- Larnaca
  ('larnaca', 'Town Center',   10),
  ('larnaca', 'Aradippou',     20),
  ('larnaca', 'Livadia',       30),
  ('larnaca', 'Oroklini',      40),
  ('larnaca', 'Drosia',        50),
  ('larnaca', 'Kamares',       60),
  ('larnaca', 'Pyla',          70),
  ('larnaca', 'Other',         999),

  -- Paphos
  ('paphos', 'Kato Paphos',   10),
  ('paphos', 'Town Center',   20),
  ('paphos', 'Universal',     30),
  ('paphos', 'Geroskipou',    40),
  ('paphos', 'Konia',         50),
  ('paphos', 'Chlorakas',     60),
  ('paphos', 'Other',         999),

  -- Famagusta (free zone areas)
  ('famagusta', 'Paralimni',   10),
  ('famagusta', 'Ayia Napa',   20),
  ('famagusta', 'Deryneia',    30),
  ('famagusta', 'Sotira',      40),
  ('famagusta', 'Other',       999),

  -- Other
  ('other', 'Other', 999)

ON CONFLICT (city, area_name) DO NOTHING;
