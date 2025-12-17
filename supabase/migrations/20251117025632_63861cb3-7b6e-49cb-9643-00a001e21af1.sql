-- Add rental_max_devices column to series table
ALTER TABLE series ADD COLUMN IF NOT EXISTS rental_max_devices integer DEFAULT 1;

-- Add rental_max_devices column to movies table
ALTER TABLE movies ADD COLUMN IF NOT EXISTS rental_max_devices integer DEFAULT 1;

-- Add rental_max_devices column to animes table
ALTER TABLE animes ADD COLUMN IF NOT EXISTS rental_max_devices integer DEFAULT 1;

-- Add comments for documentation
COMMENT ON COLUMN series.rental_max_devices IS 'Maximum number of simultaneous devices allowed for rental content (independent of subscription plan limits)';
COMMENT ON COLUMN movies.rental_max_devices IS 'Maximum number of simultaneous devices allowed for rental content (independent of subscription plan limits)';
COMMENT ON COLUMN animes.rental_max_devices IS 'Maximum number of simultaneous devices allowed for rental content (independent of subscription plan limits)';