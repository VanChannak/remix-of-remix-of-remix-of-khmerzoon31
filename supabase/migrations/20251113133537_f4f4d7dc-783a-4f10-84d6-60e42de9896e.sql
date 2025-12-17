-- Create movie_cast table similar to series_cast
CREATE TABLE IF NOT EXISTS public.movie_cast (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  actor_name VARCHAR NOT NULL,
  character_name VARCHAR,
  profile_url VARCHAR,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.movie_cast ENABLE ROW LEVEL SECURITY;

-- Create policies for movie_cast
CREATE POLICY "Anyone can view movie cast"
  ON public.movie_cast
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert movie cast"
  ON public.movie_cast
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update movie cast"
  ON public.movie_cast
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete movie cast"
  ON public.movie_cast
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_movie_cast_movie_id ON public.movie_cast(movie_id);
CREATE INDEX idx_movie_cast_order ON public.movie_cast(movie_id, order_index);