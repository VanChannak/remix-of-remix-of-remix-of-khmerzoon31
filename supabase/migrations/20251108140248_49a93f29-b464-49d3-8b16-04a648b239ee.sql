-- Enable RLS on movies table (should already be enabled, but ensuring it)
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view movies
CREATE POLICY "Anyone can view movies"
ON public.movies
FOR SELECT
USING (true);

-- Allow admins to insert movies
CREATE POLICY "Admins can insert movies"
ON public.movies
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update movies
CREATE POLICY "Admins can update movies"
ON public.movies
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete movies
CREATE POLICY "Admins can delete movies"
ON public.movies
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));