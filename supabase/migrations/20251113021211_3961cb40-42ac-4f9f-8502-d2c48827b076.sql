-- Create video_sources table
CREATE TABLE IF NOT EXISTS public.video_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id UUID,
  episode_id UUID,
  source_type TEXT NOT NULL DEFAULT 'mp4',
  url TEXT,
  quality TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  language TEXT,
  version TEXT DEFAULT 'free',
  quality_urls JSONB DEFAULT '{}'::jsonb,
  permission TEXT NOT NULL DEFAULT 'web_and_mobile',
  server_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_sources ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view video sources"
  ON public.video_sources
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert video sources"
  ON public.video_sources
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update video sources"
  ON public.video_sources
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete video sources"
  ON public.video_sources
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better query performance
CREATE INDEX idx_video_sources_media_id ON public.video_sources(media_id);
CREATE INDEX idx_video_sources_episode_id ON public.video_sources(episode_id);
CREATE INDEX idx_video_sources_is_default ON public.video_sources(is_default);

-- Create trigger for updated_at
CREATE TRIGGER update_video_sources_updated_at
  BEFORE UPDATE ON public.video_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();