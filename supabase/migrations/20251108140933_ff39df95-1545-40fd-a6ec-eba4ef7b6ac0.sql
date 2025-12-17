-- Add CASCADE delete for seasons when series is deleted
ALTER TABLE public.seasons
DROP CONSTRAINT IF EXISTS seasons_media_id_fkey,
ADD CONSTRAINT seasons_media_id_fkey 
  FOREIGN KEY (media_id) 
  REFERENCES public.series(id) 
  ON DELETE CASCADE;

-- Add CASCADE delete for episodes when season is deleted
ALTER TABLE public.episodes
DROP CONSTRAINT IF EXISTS episodes_season_id_fkey,
ADD CONSTRAINT episodes_season_id_fkey 
  FOREIGN KEY (season_id) 
  REFERENCES public.seasons(id) 
  ON DELETE CASCADE;