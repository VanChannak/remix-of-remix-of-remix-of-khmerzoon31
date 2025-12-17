-- Create featured_content table
CREATE TABLE IF NOT EXISTS public.featured_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id UUID NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'series', 'anime')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(media_id, media_type)
);

-- Enable RLS
ALTER TABLE public.featured_content ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view featured content"
ON public.featured_content
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert featured content"
ON public.featured_content
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update featured content"
ON public.featured_content
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete featured content"
ON public.featured_content
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for ordering
CREATE INDEX idx_featured_content_order ON public.featured_content(display_order);

-- Create trigger for updated_at
CREATE TRIGGER update_featured_content_updated_at
BEFORE UPDATE ON public.featured_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();