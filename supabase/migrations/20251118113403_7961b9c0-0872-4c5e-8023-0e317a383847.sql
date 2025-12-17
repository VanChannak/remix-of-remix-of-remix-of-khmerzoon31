-- Create user_likes table for like/dislike functionality
CREATE TABLE IF NOT EXISTS public.user_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  media_id UUID NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'episode')),
  like_type TEXT NOT NULL CHECK (like_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, media_id, media_type)
);

-- Create user_watchlist table for "Add to My List" functionality
CREATE TABLE IF NOT EXISTS public.user_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  media_id UUID NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'series', 'anime')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, media_id, media_type)
);

-- Create user_reports table for reporting content
CREATE TABLE IF NOT EXISTS public.user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  media_id UUID,
  media_type TEXT CHECK (media_type IN ('movie', 'episode', 'series', 'comment')),
  report_type TEXT NOT NULL CHECK (report_type IN ('inappropriate', 'copyright', 'broken', 'spam', 'other')),
  report_reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.user_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_likes
CREATE POLICY "Users can manage own likes"
  ON public.user_likes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view like counts"
  ON public.user_likes
  FOR SELECT
  USING (true);

-- RLS Policies for user_watchlist
CREATE POLICY "Users can manage own watchlist"
  ON public.user_watchlist
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_reports
CREATE POLICY "Users can create reports"
  ON public.user_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own reports"
  ON public.user_reports
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reports"
  ON public.user_reports
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at
CREATE TRIGGER update_user_likes_updated_at
  BEFORE UPDATE ON public.user_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_reports_updated_at
  BEFORE UPDATE ON public.user_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();