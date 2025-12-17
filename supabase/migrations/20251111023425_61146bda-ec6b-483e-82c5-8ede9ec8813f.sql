-- Add version column to series table
ALTER TABLE series ADD COLUMN IF NOT EXISTS version TEXT;

-- Add version column to movies table
ALTER TABLE movies ADD COLUMN IF NOT EXISTS version TEXT;

-- Add version column to animes table
ALTER TABLE animes ADD COLUMN IF NOT EXISTS version TEXT;