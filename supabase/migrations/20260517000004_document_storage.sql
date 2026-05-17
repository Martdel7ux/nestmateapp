-- ============================================================================
-- Document Storage
-- ============================================================================

-- Extend notification_type enum
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'document_expiry';

-- ============================================================================
-- documents
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id                  uuid REFERENCES auth.users NOT NULL,

  -- File metadata
  title                     text NOT NULL,
  description               text,
  category                  text NOT NULL DEFAULT 'other'
    CHECK (category IN (
      'lease','deposit_receipt','utility_bill','rent_receipt','insurance',
      'university_id','residence_permit','visa','passport',
      'bank_statement','medical','tax','other'
    )),
  storage_path              text NOT NULL,
  mime_type                 text NOT NULL,
  file_size                 bigint NOT NULL,
  page_count                int,
  thumbnail_path            text,
  ocr_text                  text,
  ocr_status                text NOT NULL DEFAULT 'skipped'
    CHECK (ocr_status IN ('pending','processing','completed','failed','skipped')),
  search_vector             tsvector,

  -- Dates
  issued_date               date,
  expires_at                date,
  expiry_reminded_30        timestamptz,
  expiry_reminded_14        timestamptz,
  expiry_reminded_3         timestamptz,

  -- Sharing
  visibility                text NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private','household')),
  shared_household_id       uuid REFERENCES public.households ON DELETE SET NULL,

  -- Links to other entities
  related_rent_agreement_id uuid REFERENCES public.rent_agreements ON DELETE SET NULL,
  related_property_id       uuid REFERENCES public.properties ON DELETE SET NULL,

  -- Tags
  tags                      text[] NOT NULL DEFAULT '{}',

  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now(),
  deleted_at                timestamptz
);

CREATE INDEX IF NOT EXISTS idx_documents_owner
  ON public.documents (owner_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_documents_household_shared
  ON public.documents (shared_household_id, deleted_at)
  WHERE visibility = 'household';
CREATE INDEX IF NOT EXISTS idx_documents_expiry
  ON public.documents (expires_at)
  WHERE expires_at IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_search
  ON public.documents USING GIN (search_vector);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_document_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_documents_updated_at ON public.documents;
CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION set_document_updated_at();

-- Full-text search vector trigger
CREATE OR REPLACE FUNCTION documents_search_vector_trigger()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(NEW.ocr_text, '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_documents_search_vector ON public.documents;
CREATE TRIGGER trg_documents_search_vector
  BEFORE INSERT OR UPDATE OF title, description, ocr_text ON public.documents
  FOR EACH ROW EXECUTE FUNCTION documents_search_vector_trigger();

-- ============================================================================
-- document_access_logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.document_access_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.documents ON DELETE CASCADE NOT NULL,
  accessed_by uuid REFERENCES auth.users NOT NULL,
  action      text NOT NULL CHECK (action IN ('view','download','share','delete','restore')),
  user_agent  text,
  accessed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_access_logs_document
  ON public.document_access_logs (document_id, accessed_at DESC);

-- ============================================================================
-- document_share_tokens
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.document_share_tokens (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token          text UNIQUE NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  document_id    uuid REFERENCES public.documents ON DELETE CASCADE NOT NULL,
  shared_by      uuid REFERENCES auth.users NOT NULL,
  password_hash  text,
  expires_at     timestamptz NOT NULL,
  download_count int NOT NULL DEFAULT 0,
  max_downloads  int,
  created_at     timestamptz DEFAULT now(),
  revoked_at     timestamptz
);

CREATE INDEX IF NOT EXISTS idx_doc_share_tokens_document
  ON public.document_share_tokens (document_id);

-- ============================================================================
-- RLS helpers
-- ============================================================================
CREATE OR REPLACE FUNCTION can_access_document(p_document_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = p_document_id
      AND d.deleted_at IS NULL
      AND (
        d.owner_id = auth.uid()
        OR (
          d.visibility = 'household'
          AND EXISTS (
            SELECT 1 FROM household_members hm
            WHERE hm.household_id = d.shared_household_id
              AND hm.user_id = auth.uid()
              AND hm.left_at IS NULL
          )
        )
      )
  );
$$;

-- ============================================================================
-- Full-text search RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION search_documents(p_query text)
RETURNS SETOF public.documents
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT *
  FROM documents
  WHERE deleted_at IS NULL
    AND (
      owner_id = auth.uid()
      OR (
        visibility = 'household'
        AND shared_household_id IN (
          SELECT household_id FROM household_members
          WHERE user_id = auth.uid() AND left_at IS NULL
        )
      )
    )
    AND search_vector @@ plainto_tsquery('simple', p_query)
  ORDER BY ts_rank(search_vector, plainto_tsquery('simple', p_query)) DESC
  LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION search_documents TO authenticated;

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE public.documents            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_share_tokens ENABLE ROW LEVEL SECURITY;

-- documents
CREATE POLICY "doc_select" ON public.documents FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL AND (
      owner_id = auth.uid()
      OR (
        visibility = 'household'
        AND EXISTS (
          SELECT 1 FROM household_members
          WHERE household_id = shared_household_id
            AND user_id = auth.uid()
            AND left_at IS NULL
        )
      )
    )
  );

CREATE POLICY "doc_select_trash" ON public.documents FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "doc_insert" ON public.documents FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "doc_update" ON public.documents FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "doc_delete" ON public.documents FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- document_access_logs
CREATE POLICY "dal_select" ON public.document_access_logs FOR SELECT TO authenticated
  USING (
    accessed_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_id AND d.owner_id = auth.uid()
    )
  );

CREATE POLICY "dal_insert" ON public.document_access_logs FOR INSERT TO authenticated
  WITH CHECK (accessed_by = auth.uid());

-- document_share_tokens
CREATE POLICY "dst_select" ON public.document_share_tokens FOR SELECT TO authenticated
  USING (
    shared_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_id AND d.owner_id = auth.uid()
    )
  );

CREATE POLICY "dst_insert" ON public.document_share_tokens FOR INSERT TO authenticated
  WITH CHECK (shared_by = auth.uid());

CREATE POLICY "dst_update" ON public.document_share_tokens FOR UPDATE TO authenticated
  USING (shared_by = auth.uid());

-- ============================================================================
-- Storage buckets
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 'documents', false, 26214400,
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'document-thumbnails', 'document-thumbnails', false, 2097152,
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users, app enforces authorization via documents RLS
DO $$ BEGIN
  CREATE POLICY "docs_auth_read" ON storage.objects
    FOR SELECT USING (bucket_id IN ('documents','document-thumbnails') AND auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "docs_auth_insert" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id IN ('documents','document-thumbnails') AND auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "docs_auth_delete" ON storage.objects
    FOR DELETE USING (bucket_id IN ('documents','document-thumbnails') AND auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
