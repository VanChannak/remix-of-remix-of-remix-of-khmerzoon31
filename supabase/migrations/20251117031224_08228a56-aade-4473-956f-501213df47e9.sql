-- Add trailer_url column to episodes table
ALTER TABLE public.episodes 
ADD COLUMN IF NOT EXISTS trailer_url TEXT;