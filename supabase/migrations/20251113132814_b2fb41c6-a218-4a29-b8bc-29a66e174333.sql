-- Add backdrop_url and trailer_url columns to movies table
ALTER TABLE public.movies 
ADD COLUMN IF NOT EXISTS backdrop_url text,
ADD COLUMN IF NOT EXISTS trailer_url text;