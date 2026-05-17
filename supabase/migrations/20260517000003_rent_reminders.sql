-- ============================================================================
-- Rent Reminders
-- ============================================================================

-- 1. Extend notification_type enum
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'rent_reminder';

-- 2. Add link column to notifications for deep links
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS link text;

-- 3. Add last_used_at to push_subscriptions + fix unique constraint
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS last_used_at timestamptz;

-- Drop old unique-on-endpoint-only constraint if exists, add user+endpoint unique
DO $$ BEGIN
  ALTER TABLE public.push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_endpoint_key;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_endpoint_key UNIQUE (user_id, endpoint);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- ============================================================================
-- rent_agreements
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rent_agreements (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid REFERENCES auth.users NOT NULL,
  household_id              uuid REFERENCES public.households ON DELETE SET NULL,
  amount                    numeric(12,2) NOT NULL,
  currency                  text NOT NULL DEFAULT 'EUR',
  due_day                   smallint NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  first_payment_date        date NOT NULL,
  end_date                  date,
  scope                     text NOT NULL DEFAULT 'personal' CHECK (scope IN ('personal','household')),

  -- Landlord info
  landlord_name             text,
  landlord_phone            text,
  landlord_email            text,
  landlord_whatsapp         text,
  landlord_user_id          uuid REFERENCES auth.users,
  property_id               uuid,

  -- Payment instructions
  payment_method            text CHECK (payment_method IN ('bank_transfer','revolut','cash','cheque','other')),
  payment_details           text,

  -- Reminder preferences
  reminder_days_before      smallint NOT NULL DEFAULT 3 CHECK (reminder_days_before BETWEEN 0 AND 14),
  reminder_followup_on_due_day boolean NOT NULL DEFAULT true,
  reminder_channels         text[] NOT NULL DEFAULT ARRAY['in_app'],

  -- State
  is_active                 boolean NOT NULL DEFAULT true,
  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rent_agreements_user
  ON public.rent_agreements (user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_rent_agreements_household
  ON public.rent_agreements (household_id) WHERE is_active = true;

-- ============================================================================
-- rent_payments
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rent_payments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id      uuid REFERENCES public.rent_agreements ON DELETE CASCADE NOT NULL,
  due_date          date NOT NULL,
  amount            numeric(12,2) NOT NULL,
  currency          text NOT NULL DEFAULT 'EUR',
  status            text NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming','reminded','due_today','paid','late','skipped')),
  paid_at           timestamptz,
  paid_method       text,
  receipt_url       text,
  reminded_at       timestamptz,
  followup_sent_at  timestamptz,
  notes             text,
  created_at        timestamptz DEFAULT now(),
  UNIQUE (agreement_id, due_date)
);

CREATE INDEX IF NOT EXISTS idx_rent_payments_agreement
  ON public.rent_payments (agreement_id, due_date DESC);
CREATE INDEX IF NOT EXISTS idx_rent_payments_pending_remind
  ON public.rent_payments (due_date)
  WHERE status IN ('upcoming','reminded') AND reminded_at IS NULL;

-- ============================================================================
-- updated_at trigger for rent_agreements
-- ============================================================================
CREATE OR REPLACE FUNCTION set_rent_agreement_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_rent_agreements_updated_at ON public.rent_agreements;
CREATE TRIGGER trg_rent_agreements_updated_at
  BEFORE UPDATE ON public.rent_agreements
  FOR EACH ROW EXECUTE FUNCTION set_rent_agreement_updated_at();

-- ============================================================================
-- Helper: is_rent_agreement_owner
-- ============================================================================
CREATE OR REPLACE FUNCTION is_rent_agreement_owner(p_agreement_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM rent_agreements
    WHERE id = p_agreement_id AND user_id = auth.uid()
  );
$$;

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE public.rent_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rent_payments   ENABLE ROW LEVEL SECURITY;

-- rent_agreements: only own rows
CREATE POLICY "ra_select" ON public.rent_agreements FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "ra_insert" ON public.rent_agreements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ra_update" ON public.rent_agreements FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "ra_delete" ON public.rent_agreements FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- rent_payments: only via own agreements
CREATE POLICY "rp_select" ON public.rent_payments FOR SELECT TO authenticated
  USING (is_rent_agreement_owner(agreement_id));
CREATE POLICY "rp_update" ON public.rent_payments FOR UPDATE TO authenticated
  USING (is_rent_agreement_owner(agreement_id));
CREATE POLICY "rp_insert" ON public.rent_payments FOR INSERT TO authenticated
  WITH CHECK (is_rent_agreement_owner(agreement_id));

-- push_subscriptions: own rows only
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "ps_select" ON public.push_subscriptions FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "ps_insert" ON public.push_subscriptions FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "ps_delete" ON public.push_subscriptions FOR DELETE TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- Storage bucket: rent-receipts (private)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rent-receipts', 'rent-receipts', false, 10485760,
  ARRAY['image/jpeg','image/png','image/webp','image/heic','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "rr_owner_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'rent-receipts' AND auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "rr_owner_insert" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'rent-receipts' AND auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "rr_owner_delete" ON storage.objects
    FOR DELETE USING (bucket_id = 'rent-receipts' AND auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
