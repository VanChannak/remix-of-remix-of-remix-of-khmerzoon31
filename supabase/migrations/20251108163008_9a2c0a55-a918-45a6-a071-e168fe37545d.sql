-- Create animes table for managing anime content
CREATE TABLE IF NOT EXISTS public.animes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  thumbnail text,
  backdrop_url text,
  trailer_url text,
  genre text,
  studio text,
  source_material text CHECK (source_material IN ('manga', 'light_novel', 'visual_novel', 'original', 'game', 'other')),
  type text NOT NULL CHECK (type IN ('tv', 'movie', 'ova', 'ona', 'special')),
  access text NOT NULL DEFAULT 'free' CHECK (access IN ('free', 'rent', 'vip')),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  release_year integer,
  episodes_count integer DEFAULT 0,
  rating numeric(3,1) DEFAULT 0,
  views integer NOT NULL DEFAULT 0,
  pinned boolean NOT NULL DEFAULT false,
  rental_price numeric,
  rental_period_days integer DEFAULT 7,
  exclude_from_plan boolean DEFAULT false,
  tmdb_id text,
  mal_id text,
  anilist_id text,
  video_sources jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.animes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view animes"
  ON public.animes
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert animes"
  ON public.animes
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update animes"
  ON public.animes
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete animes"
  ON public.animes
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_animes_updated_at
  BEFORE UPDATE ON public.animes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for faster queries
CREATE INDEX idx_animes_type ON public.animes(type);
CREATE INDEX idx_animes_status ON public.animes(status);
CREATE INDEX idx_animes_studio ON public.animes(studio);
CREATE INDEX idx_animes_release_year ON public.animes(release_year);