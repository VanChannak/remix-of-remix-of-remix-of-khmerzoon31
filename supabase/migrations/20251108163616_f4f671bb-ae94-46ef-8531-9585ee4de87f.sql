-- Create characters table for anime characters
CREATE TABLE IF NOT EXISTS public.anime_characters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anime_id uuid REFERENCES public.animes(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  name_native text,
  name_alternative text[],
  description text,
  image_url text,
  role text NOT NULL CHECK (role IN ('main', 'supporting', 'background')),
  age text,
  gender text,
  birth_date text,
  anilist_id integer,
  mal_id integer,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create voice_actors table
CREATE TABLE IF NOT EXISTS public.voice_actors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  name_native text,
  image_url text,
  language text NOT NULL DEFAULT 'Japanese',
  date_of_birth date,
  age integer,
  gender text,
  description text,
  anilist_id integer,
  mal_id integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(anilist_id)
);

-- Create junction table for character-voice actor relationships
CREATE TABLE IF NOT EXISTS public.character_voice_actors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id uuid REFERENCES public.anime_characters(id) ON DELETE CASCADE NOT NULL,
  voice_actor_id uuid REFERENCES public.voice_actors(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(character_id, voice_actor_id)
);

-- Enable RLS
ALTER TABLE public.anime_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_voice_actors ENABLE ROW LEVEL SECURITY;

-- Create policies for anime_characters
CREATE POLICY "Anyone can view anime characters"
  ON public.anime_characters
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert anime characters"
  ON public.anime_characters
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update anime characters"
  ON public.anime_characters
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete anime characters"
  ON public.anime_characters
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policies for voice_actors
CREATE POLICY "Anyone can view voice actors"
  ON public.voice_actors
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert voice actors"
  ON public.voice_actors
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update voice actors"
  ON public.voice_actors
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete voice actors"
  ON public.voice_actors
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policies for character_voice_actors
CREATE POLICY "Anyone can view character voice actor relationships"
  ON public.character_voice_actors
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage character voice actor relationships"
  ON public.character_voice_actors
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_anime_characters_updated_at
  BEFORE UPDATE ON public.anime_characters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_voice_actors_updated_at
  BEFORE UPDATE ON public.voice_actors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for faster queries
CREATE INDEX idx_anime_characters_anime_id ON public.anime_characters(anime_id);
CREATE INDEX idx_anime_characters_role ON public.anime_characters(role);
CREATE INDEX idx_anime_characters_anilist_id ON public.anime_characters(anilist_id);
CREATE INDEX idx_voice_actors_anilist_id ON public.voice_actors(anilist_id);
CREATE INDEX idx_character_voice_actors_character_id ON public.character_voice_actors(character_id);
CREATE INDEX idx_character_voice_actors_voice_actor_id ON public.character_voice_actors(voice_actor_id);