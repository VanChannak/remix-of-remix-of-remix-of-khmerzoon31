-- Add new columns to ads table for enhanced ad management
ALTER TABLE ads ADD COLUMN IF NOT EXISTS ad_type text NOT NULL DEFAULT 'manual';
ALTER TABLE ads ADD COLUMN IF NOT EXISTS image_type text;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS device text;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS ad_format text;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS video_type text;

-- Add check constraints
ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_ad_type_check;
ALTER TABLE ads ADD CONSTRAINT ads_ad_type_check 
  CHECK (ad_type IN ('manual', 'adsense', 'video'));

ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_image_type_check;
ALTER TABLE ads ADD CONSTRAINT ads_image_type_check 
  CHECK (image_type IS NULL OR image_type IN ('portrait', 'landscape'));

ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_device_check;
ALTER TABLE ads ADD CONSTRAINT ads_device_check 
  CHECK (device IS NULL OR device IN ('web', 'app'));

ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_ad_format_check;
ALTER TABLE ads ADD CONSTRAINT ads_ad_format_check 
  CHECK (ad_format IS NULL OR ad_format IN ('banner', 'script'));

ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_video_type_check;
ALTER TABLE ads ADD CONSTRAINT ads_video_type_check 
  CHECK (video_type IS NULL OR video_type IN ('video', 'popup', 'banner'));