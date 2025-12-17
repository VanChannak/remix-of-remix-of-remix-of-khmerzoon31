-- Insert profile for existing user
INSERT INTO public.profiles (id, email, display_name)
VALUES ('9f761653-8d6e-4289-94a2-96c439c7e126', 'admin@9drama.biz', 'admin')
ON CONFLICT (id) DO NOTHING;