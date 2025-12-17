-- Add rental pricing fields to series table
ALTER TABLE series 
ADD COLUMN IF NOT EXISTS rental_price numeric,
ADD COLUMN IF NOT EXISTS rental_period_days integer DEFAULT 7,
ADD COLUMN IF NOT EXISTS exclude_from_plan boolean DEFAULT false;