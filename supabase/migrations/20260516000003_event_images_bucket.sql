-- Create the event-images storage bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read: anyone can view event images
DO $$ BEGIN
  CREATE POLICY "event_images_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'event-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admin upload
DO $$ BEGIN
  CREATE POLICY "event_images_admin_insert" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'event-images'
      AND auth.uid() IS NOT NULL
      AND (auth.jwt() ->> 'email') = ANY(ARRAY['martinahoto4@gmail.com'])
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admin delete
DO $$ BEGIN
  CREATE POLICY "event_images_admin_delete" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'event-images'
      AND auth.uid() IS NOT NULL
      AND (auth.jwt() ->> 'email') = ANY(ARRAY['martinahoto4@gmail.com'])
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
