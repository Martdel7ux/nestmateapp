-- ============================================================================
-- Households + Bills Splitting
-- ============================================================================

-- households
CREATE TABLE IF NOT EXISTS households (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  property_id     uuid,
  address         text,
  currency        text NOT NULL DEFAULT 'EUR',
  invite_code     text UNIQUE NOT NULL,
  invite_expires_at timestamptz,
  created_by      uuid REFERENCES auth.users NOT NULL,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- household_members
CREATE TABLE IF NOT EXISTS household_members (
  household_id uuid REFERENCES households ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users ON DELETE CASCADE,
  role         text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  display_name text,
  joined_at    timestamptz DEFAULT now(),
  left_at      timestamptz,
  PRIMARY KEY (household_id, user_id)
);

-- expenses
CREATE TABLE IF NOT EXISTS expenses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households ON DELETE CASCADE NOT NULL,
  description  text NOT NULL,
  amount       numeric(12,2) NOT NULL CHECK (amount > 0),
  currency     text NOT NULL DEFAULT 'EUR',
  category     text CHECK (category IN ('utilities','groceries','rent','internet','cleaning','other')),
  paid_by      uuid REFERENCES auth.users NOT NULL,
  paid_at      date NOT NULL,
  split_method text NOT NULL CHECK (split_method IN ('equal','shares','custom')),
  receipt_url  text,
  notes        text,
  created_by   uuid REFERENCES auth.users NOT NULL,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  deleted_at   timestamptz
);

-- expense_shares
CREATE TABLE IF NOT EXISTS expense_shares (
  expense_id   uuid REFERENCES expenses ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users ON DELETE CASCADE,
  amount       numeric(12,2) NOT NULL,
  share_weight numeric(6,2),
  PRIMARY KEY (expense_id, user_id)
);

-- settlements
CREATE TABLE IF NOT EXISTS settlements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households ON DELETE CASCADE NOT NULL,
  from_user_id uuid REFERENCES auth.users NOT NULL,
  to_user_id   uuid REFERENCES auth.users NOT NULL,
  amount       numeric(12,2) NOT NULL CHECK (amount > 0),
  currency     text NOT NULL DEFAULT 'EUR',
  method       text CHECK (method IN ('cash','revolut','bank_transfer','other')),
  note         text,
  settled_at   date NOT NULL,
  created_by   uuid REFERENCES auth.users NOT NULL,
  created_at   timestamptz DEFAULT now(),
  deleted_at   timestamptz,
  CHECK (from_user_id != to_user_id)
);

-- household_invites
CREATE TABLE IF NOT EXISTS household_invites (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    uuid REFERENCES households ON DELETE CASCADE,
  inviter_id      uuid REFERENCES auth.users,
  invitee_email   text,
  invitee_user_id uuid REFERENCES auth.users,
  status          text DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','expired')),
  created_at      timestamptz DEFAULT now(),
  responded_at    timestamptz,
  expires_at      timestamptz DEFAULT (now() + INTERVAL '14 days')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_household_members_user    ON household_members (user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_household        ON expenses (household_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_expense_shares_expense    ON expense_shares (expense_id);
CREATE INDEX IF NOT EXISTS idx_settlements_household     ON settlements (household_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_household_invites_code    ON households (invite_code);

-- ============================================================================
-- Helper: is_household_member (SECURITY DEFINER to avoid RLS recursion)
-- ============================================================================
CREATE OR REPLACE FUNCTION is_household_member(p_household_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = p_household_id
      AND user_id = auth.uid()
      AND left_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION is_household_owner_or_admin(p_household_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = p_household_id
      AND user_id = auth.uid()
      AND role IN ('owner','admin')
      AND left_at IS NULL
  );
$$;

-- ============================================================================
-- Trigger: enforce max 6 members
-- ============================================================================
CREATE OR REPLACE FUNCTION enforce_household_max_members()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM household_members
    WHERE household_id = NEW.household_id AND left_at IS NULL
  ) >= 6 THEN
    RAISE EXCEPTION 'household_full'
      USING HINT = 'A household can have at most 6 members.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_household_max_members ON household_members;
CREATE TRIGGER trg_household_max_members
  BEFORE INSERT ON household_members
  FOR EACH ROW EXECUTE FUNCTION enforce_household_max_members();

-- ============================================================================
-- updated_at triggers
-- ============================================================================
CREATE OR REPLACE FUNCTION hh_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_households_updated_at BEFORE UPDATE ON households
  FOR EACH ROW EXECUTE FUNCTION hh_set_updated_at();
CREATE TRIGGER trg_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION hh_set_updated_at();

-- ============================================================================
-- Materialized view: household_balances
-- ============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS household_balances AS
SELECT
  household_id,
  user_id,
  SUM(net_amount) AS balance
FROM (
  -- amount payer advanced minus their own share
  SELECT e.household_id, e.paid_by AS user_id,
    (e.amount - COALESCE(s.amount, 0)) AS net_amount
  FROM expenses e
  LEFT JOIN expense_shares s ON s.expense_id = e.id AND s.user_id = e.paid_by
  WHERE e.deleted_at IS NULL
  UNION ALL
  -- each non-payer owes their share
  SELECT e.household_id, s.user_id, -s.amount AS net_amount
  FROM expenses e
  JOIN expense_shares s ON s.expense_id = e.id
  WHERE s.user_id != e.paid_by AND e.deleted_at IS NULL
  UNION ALL
  -- settlements received (positive)
  SELECT household_id, to_user_id AS user_id, amount AS net_amount
  FROM settlements WHERE deleted_at IS NULL
  UNION ALL
  -- settlements paid (negative)
  SELECT household_id, from_user_id AS user_id, -amount AS net_amount
  FROM settlements WHERE deleted_at IS NULL
) totals
GROUP BY household_id, user_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_hh_balances ON household_balances (household_id, user_id);

-- Function to refresh balances (called by triggers)
CREATE OR REPLACE FUNCTION refresh_household_balances()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY household_balances;
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_refresh_balances_on_expense
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH STATEMENT EXECUTE FUNCTION refresh_household_balances();

CREATE OR REPLACE TRIGGER trg_refresh_balances_on_shares
  AFTER INSERT OR UPDATE OR DELETE ON expense_shares
  FOR EACH STATEMENT EXECUTE FUNCTION refresh_household_balances();

CREATE OR REPLACE TRIGGER trg_refresh_balances_on_settlement
  AFTER INSERT OR UPDATE OR DELETE ON settlements
  FOR EACH STATEMENT EXECUTE FUNCTION refresh_household_balances();

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE households         ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_shares     ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_invites  ENABLE ROW LEVEL SECURITY;

-- households
CREATE POLICY "hh_select" ON households FOR SELECT TO authenticated
  USING (is_household_member(id));
CREATE POLICY "hh_insert" ON households FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "hh_update" ON households FOR UPDATE TO authenticated
  USING (is_household_owner_or_admin(id));

-- household_members
CREATE POLICY "hhm_select" ON household_members FOR SELECT TO authenticated
  USING (is_household_member(household_id));
CREATE POLICY "hhm_insert" ON household_members FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR is_household_owner_or_admin(household_id)
  );
CREATE POLICY "hhm_update" ON household_members FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id OR is_household_owner_or_admin(household_id)
  );
CREATE POLICY "hhm_delete" ON household_members FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id OR is_household_owner_or_admin(household_id)
  );

-- expenses
CREATE POLICY "exp_select" ON expenses FOR SELECT TO authenticated
  USING (is_household_member(household_id));
CREATE POLICY "exp_insert" ON expenses FOR INSERT TO authenticated
  WITH CHECK (is_household_member(household_id) AND auth.uid() = created_by);
CREATE POLICY "exp_update" ON expenses FOR UPDATE TO authenticated
  USING (
    is_household_member(household_id) AND
    (auth.uid() = created_by OR is_household_owner_or_admin(household_id)) AND
    (created_at > now() - INTERVAL '24 hours' OR is_household_owner_or_admin(household_id))
  );
CREATE POLICY "exp_delete" ON expenses FOR DELETE TO authenticated
  USING (
    is_household_member(household_id) AND
    (auth.uid() = created_by OR is_household_owner_or_admin(household_id))
  );

-- expense_shares
CREATE POLICY "es_select" ON expense_shares FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND is_household_member(e.household_id))
  );
CREATE POLICY "es_insert" ON expense_shares FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND is_household_member(e.household_id))
  );
CREATE POLICY "es_delete" ON expense_shares FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND is_household_member(e.household_id))
  );

-- settlements
CREATE POLICY "stl_select" ON settlements FOR SELECT TO authenticated
  USING (is_household_member(household_id));
CREATE POLICY "stl_insert" ON settlements FOR INSERT TO authenticated
  WITH CHECK (is_household_member(household_id) AND auth.uid() = created_by);
CREATE POLICY "stl_delete" ON settlements FOR DELETE TO authenticated
  USING (
    is_household_member(household_id) AND
    (auth.uid() = created_by OR is_household_owner_or_admin(household_id))
  );

-- household_invites
CREATE POLICY "inv_select" ON household_invites FOR SELECT TO authenticated
  USING (
    auth.uid() = inviter_id OR
    auth.uid() = invitee_user_id OR
    is_household_owner_or_admin(household_id)
  );
CREATE POLICY "inv_insert" ON household_invites FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = inviter_id AND is_household_member(household_id));
CREATE POLICY "inv_update" ON household_invites FOR UPDATE TO authenticated
  USING (auth.uid() = invitee_user_id OR is_household_owner_or_admin(household_id));

-- household_balances view: members can read
GRANT SELECT ON household_balances TO authenticated;

-- ============================================================================
-- Storage bucket: expense-receipts
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'expense-receipts', 'expense-receipts', false, 10485760,
  ARRAY['image/jpeg','image/png','image/webp','image/heic','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "receipts_member_read" ON storage.objects
    FOR SELECT USING (
      bucket_id = 'expense-receipts' AND auth.uid() IS NOT NULL
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "receipts_member_insert" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'expense-receipts' AND auth.uid() IS NOT NULL
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "receipts_member_delete" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'expense-receipts' AND auth.uid() IS NOT NULL
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
