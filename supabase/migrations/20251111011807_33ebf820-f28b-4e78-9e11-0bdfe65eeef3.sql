-- Add video_url column to movies table
ALTER TABLE public.movies 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add video_url column to episodes table
ALTER TABLE public.episodes 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_movies_video_url ON public.movies(video_url) WHERE video_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_episodes_video_url ON public.episodes(video_url) WHERE video_url IS NOT NULL;