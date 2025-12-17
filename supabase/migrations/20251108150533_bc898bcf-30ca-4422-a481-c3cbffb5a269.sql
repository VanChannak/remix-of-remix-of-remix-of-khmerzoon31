-- Add trailer_url field to series table
ALTER TABLE series
ADD COLUMN IF NOT EXISTS trailer_url TEXT;

COMMENT ON COLUMN series.trailer_url IS 'URL to the series trailer video (YouTube, Vimeo, etc.)';