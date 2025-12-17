-- Create upcoming_releases table for managing upcoming content
CREATE TABLE IF NOT EXISTS public.upcoming_releases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('movie', 'series', 'anime')),
  description text,
  thumbnail text,
  backdrop_url text,
  trailer_url text,
  release_date date,
  genre text,
  status text NOT NULL DEFAULT 'announced' CHECK (status IN ('announced', 'coming_soon', 'released')),
  tmdb_id text,
  imdb_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.upcoming_releases ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view upcoming releases"
  ON public.upcoming_releases
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert upcoming releases"
  ON public.upcoming_releases
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update upcoming releases"
  ON public.upcoming_releases
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete upcoming releases"
  ON public.upcoming_releases
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_upcoming_releases_updated_at
  BEFORE UPDATE ON public.upcoming_releases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on release_date for faster queries
CREATE INDEX idx_upcoming_releases_release_date ON public.upcoming_releases(release_date);
CREATE INDEX idx_upcoming_releases_status ON public.upcoming_releases(status);
CREATE INDEX idx_upcoming_releases_type ON public.upcoming_releases(type);