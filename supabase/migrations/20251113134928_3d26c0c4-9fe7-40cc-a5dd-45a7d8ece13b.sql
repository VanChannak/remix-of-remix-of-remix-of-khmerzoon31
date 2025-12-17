-- Add missing backdrop_url and trailer_url columns to movies table
ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS backdrop_url TEXT,
ADD COLUMN IF NOT EXISTS trailer_url TEXT;

-- Add the same columns to series table if they don't exist
ALTER TABLE series 
ADD COLUMN IF NOT EXISTS backdrop_url TEXT,
ADD COLUMN IF NOT EXISTS trailer_url TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_movies_backdrop ON movies(backdrop_url);
CREATE INDEX IF NOT EXISTS idx_movies_trailer ON movies(trailer_url);
CREATE INDEX IF NOT EXISTS idx_series_backdrop ON series(backdrop_url);
CREATE INDEX IF NOT EXISTS idx_series_trailer ON series(trailer_url);