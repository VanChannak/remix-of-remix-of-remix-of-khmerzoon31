-- Add rental pricing fields to movies table
ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS rental_price numeric,
ADD COLUMN IF NOT EXISTS rental_period_days integer DEFAULT 7,
ADD COLUMN IF NOT EXISTS exclude_from_plan boolean DEFAULT false;