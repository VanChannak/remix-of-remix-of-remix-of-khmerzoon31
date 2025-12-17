-- Add configuration fields for video ads and display settings
ALTER TABLE ads ADD COLUMN IF NOT EXISTS skip_after_seconds integer DEFAULT 5;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS midroll_time_seconds integer DEFAULT 120;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS rotation_interval_seconds integer DEFAULT 30;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS show_close_button boolean DEFAULT true;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS auto_play boolean DEFAULT true;

-- Add check constraints for reasonable values
ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_skip_after_seconds_check;
ALTER TABLE ads ADD CONSTRAINT ads_skip_after_seconds_check 
  CHECK (skip_after_seconds IS NULL OR (skip_after_seconds >= 0 AND skip_after_seconds <= 60));

ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_midroll_time_seconds_check;
ALTER TABLE ads ADD CONSTRAINT ads_midroll_time_seconds_check 
  CHECK (midroll_time_seconds IS NULL OR (midroll_time_seconds >= 0 AND midroll_time_seconds <= 3600));

ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_rotation_interval_seconds_check;
ALTER TABLE ads ADD CONSTRAINT ads_rotation_interval_seconds_check 
  CHECK (rotation_interval_seconds IS NULL OR (rotation_interval_seconds >= 5 AND rotation_interval_seconds <= 300));