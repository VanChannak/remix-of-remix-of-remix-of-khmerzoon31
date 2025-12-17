-- Create public Supabase Storage bucket for fallback profile images (id = 'profile-images')
insert into storage.buckets (id, name, public)
select 'profile-images', 'profile-images', true
where not exists (
  select 1 from storage.buckets where id = 'profile-images'
);

-- Allow public read access to files in the 'profile-images' bucket
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Public read access for profile-images'
  ) THEN
    CREATE POLICY "Public read access for profile-images"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'profile-images');
  END IF;
END $$;

-- Allow authenticated users to upload to their own folder: profile-images/<user_id>/...
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Users can upload their own profile-images'
  ) THEN
    CREATE POLICY "Users can upload their own profile-images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'profile-images'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- Allow authenticated users to update their own files under their folder
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Users can update their own profile-images'
  ) THEN
    CREATE POLICY "Users can update their own profile-images"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'profile-images'
      AND auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
      bucket_id = 'profile-images'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- Allow authenticated users to delete their own files under their folder
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Users can delete their own profile-images'
  ) THEN
    CREATE POLICY "Users can delete their own profile-images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'profile-images'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;