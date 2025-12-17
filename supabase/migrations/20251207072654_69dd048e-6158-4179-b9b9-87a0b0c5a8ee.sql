-- Create table for users to follow cast members
CREATE TABLE public.user_followed_cast (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cast_type TEXT NOT NULL CHECK (cast_type IN ('movie', 'series')),
  cast_id UUID NOT NULL,
  tmdb_person_id INTEGER,
  actor_name TEXT NOT NULL,
  profile_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicate follows
CREATE UNIQUE INDEX idx_user_followed_cast_unique ON public.user_followed_cast(user_id, cast_type, cast_id);

-- Create index for efficient lookups
CREATE INDEX idx_user_followed_cast_user ON public.user_followed_cast(user_id);

-- Enable RLS
ALTER TABLE public.user_followed_cast ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own followed cast"
  ON public.user_followed_cast
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can follow cast members"
  ON public.user_followed_cast
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow cast members"
  ON public.user_followed_cast
  FOR DELETE
  USING (auth.uid() = user_id);