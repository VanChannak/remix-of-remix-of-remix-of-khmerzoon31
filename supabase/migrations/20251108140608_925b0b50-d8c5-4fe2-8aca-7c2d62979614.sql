-- Add tmdb_id column to movies table
ALTER TABLE public.movies ADD COLUMN tmdb_id text;

-- Add tmdb_id column to series table
ALTER TABLE public.series ADD COLUMN tmdb_id text;

-- Add index for better performance on lookups
CREATE INDEX idx_movies_tmdb_id ON public.movies(tmdb_id);
CREATE INDEX idx_series_tmdb_id ON public.series(tmdb_id);