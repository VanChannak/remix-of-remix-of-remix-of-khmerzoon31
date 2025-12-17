-- Add version, server, and video source fields to episodes table
ALTER TABLE episodes
ADD COLUMN IF NOT EXISTS access access_type DEFAULT 'free',
ADD COLUMN IF NOT EXISTS server_url TEXT,
ADD COLUMN IF NOT EXISTS video_sources JSONB DEFAULT '[]'::jsonb;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_episodes_access ON episodes(access);

COMMENT ON COLUMN episodes.access IS 'Episode access type: free, rent, or vip';
COMMENT ON COLUMN episodes.server_url IS 'Primary server URL for the episode';
COMMENT ON COLUMN episodes.video_sources IS 'Array of video source objects with quality, url, and type';