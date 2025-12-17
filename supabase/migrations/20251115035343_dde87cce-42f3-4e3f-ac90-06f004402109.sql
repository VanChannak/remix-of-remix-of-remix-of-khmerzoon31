-- Create comments table for watch page
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_media_reference CHECK (
    (episode_id IS NOT NULL AND movie_id IS NULL) OR
    (episode_id IS NULL AND movie_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view non-deleted comments
CREATE POLICY "Anyone can view comments"
ON public.comments
FOR SELECT
USING (is_deleted = false);

-- Authenticated users can insert comments
CREATE POLICY "Authenticated users can create comments"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
ON public.comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments (soft delete)
CREATE POLICY "Users can delete own comments"
ON public.comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND is_deleted = false);

-- Admins can delete any comment
CREATE POLICY "Admins can delete any comment"
ON public.comments
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_comments_episode_id ON public.comments(episode_id) WHERE is_deleted = false;
CREATE INDEX idx_comments_movie_id ON public.comments(movie_id) WHERE is_deleted = false;
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id) WHERE is_deleted = false;
CREATE INDEX idx_comments_user_id ON public.comments(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();