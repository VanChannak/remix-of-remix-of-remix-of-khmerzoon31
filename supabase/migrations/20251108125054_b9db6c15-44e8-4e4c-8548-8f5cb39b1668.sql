-- Add new columns to media table
ALTER TABLE public.media 
ADD COLUMN IF NOT EXISTS views integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS imdb_id text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'published' NOT NULL,
ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false NOT NULL;

-- Create index on status for better query performance
CREATE INDEX IF NOT EXISTS idx_media_status ON public.media(status);

-- Create index on pinned for better query performance
CREATE INDEX IF NOT EXISTS idx_media_pinned ON public.media(pinned);