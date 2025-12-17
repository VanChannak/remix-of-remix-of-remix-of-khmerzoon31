-- Add video_sources column to movies table
ALTER TABLE movies
ADD COLUMN IF NOT EXISTS video_sources jsonb DEFAULT '[]'::jsonb;