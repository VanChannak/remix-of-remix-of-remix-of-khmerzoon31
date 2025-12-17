-- Add adsense_code column to ads table
ALTER TABLE public.ads ADD COLUMN adsense_code text;

-- Add settings table for storing site-wide settings like AdSense verification codes
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage site settings
CREATE POLICY "Admins can manage site settings"
  ON public.site_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow anyone to view site settings (needed for public verification codes)
CREATE POLICY "Anyone can view site settings"
  ON public.site_settings
  FOR SELECT
  USING (true);

-- Insert default AdSense verification settings
INSERT INTO public.site_settings (setting_key, setting_value)
VALUES 
  ('adsense_header_code', ''),
  ('adsense_footer_code', '')
ON CONFLICT (setting_key) DO NOTHING;