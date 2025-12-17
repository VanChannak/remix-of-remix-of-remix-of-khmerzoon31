-- Add new columns to series table for comprehensive TMDB data
ALTER TABLE series
ADD COLUMN IF NOT EXISTS overview TEXT,
ADD COLUMN IF NOT EXISTS first_air_date DATE,
ADD COLUMN IF NOT EXISTS last_air_date DATE,
ADD COLUMN IF NOT EXISTS episode_run_time INTEGER[],
ADD COLUMN IF NOT EXISTS number_of_seasons INTEGER,
ADD COLUMN IF NOT EXISTS number_of_episodes INTEGER,
ADD COLUMN IF NOT EXISTS popularity DECIMAL(10,4),
ADD COLUMN IF NOT EXISTS vote_count INTEGER,
ADD COLUMN IF NOT EXISTS poster_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS backdrop_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS original_language VARCHAR(10);

-- Create series_genres junction table
CREATE TABLE IF NOT EXISTS series_genres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_id UUID REFERENCES series(id) ON DELETE CASCADE,
    genre_id INTEGER NOT NULL,
    genre_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(series_id, genre_id)
);

-- Create series_cast table
CREATE TABLE IF NOT EXISTS series_cast (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_id UUID REFERENCES series(id) ON DELETE CASCADE,
    actor_name VARCHAR(255) NOT NULL,
    character_name VARCHAR(255),
    profile_url VARCHAR(500),
    order_index INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create series_producers table
CREATE TABLE IF NOT EXISTS series_producers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_id UUID REFERENCES series(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(series_id, company_name)
);

-- Enable RLS on new tables
ALTER TABLE series_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE series_cast ENABLE ROW LEVEL SECURITY;
ALTER TABLE series_producers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for series_genres
CREATE POLICY "Anyone can view series genres"
ON series_genres FOR SELECT
USING (true);

CREATE POLICY "Admins can insert series genres"
ON series_genres FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update series genres"
ON series_genres FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete series genres"
ON series_genres FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for series_cast
CREATE POLICY "Anyone can view series cast"
ON series_cast FOR SELECT
USING (true);

CREATE POLICY "Admins can insert series cast"
ON series_cast FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update series cast"
ON series_cast FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete series cast"
ON series_cast FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for series_producers
CREATE POLICY "Anyone can view series producers"
ON series_producers FOR SELECT
USING (true);

CREATE POLICY "Admins can insert series producers"
ON series_producers FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update series producers"
ON series_producers FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete series producers"
ON series_producers FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_series_genres_series_id ON series_genres(series_id);
CREATE INDEX IF NOT EXISTS idx_series_cast_series_id ON series_cast(series_id);
CREATE INDEX IF NOT EXISTS idx_series_producers_series_id ON series_producers(series_id);
CREATE INDEX IF NOT EXISTS idx_series_tmdb_id ON series(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_series_popularity ON series(popularity DESC);