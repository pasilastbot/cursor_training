-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create cars table with PostGIS geometry column
CREATE TABLE IF NOT EXISTS cars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    mileage INTEGER NOT NULL,
    location GEOMETRY(Point, 4326),
    photos TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    searchable_text TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', make), 'A') ||
        setweight(to_tsvector('english', model), 'A') ||
        setweight(to_tsvector('english', year::text), 'B')
    ) STORED
);

-- Create function for nearby cars search
CREATE OR REPLACE FUNCTION nearby_cars(
    user_lat DOUBLE PRECISION,
    user_lng DOUBLE PRECISION,
    radius_km DOUBLE PRECISION DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    distance DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        ST_Distance(
            c.location::geography,
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
        ) / 1000 as distance_km
    FROM cars c
    WHERE ST_DWithin(
        c.location::geography,
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
        radius_km * 1000  -- Convert km to meters
    )
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create indexes
CREATE INDEX IF NOT EXISTS cars_location_idx ON cars USING GIST(location);
CREATE INDEX IF NOT EXISTS cars_searchable_text_idx ON cars USING GIN(searchable_text);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
    status VARCHAR(10) NOT NULL CHECK (status IN ('liked', 'passed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, car_id)
);

-- Create search suggestions table
CREATE TABLE IF NOT EXISTS search_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    suggestion TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create popular searches table
CREATE TABLE IF NOT EXISTS popular_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(query)
);

-- Create trigger to update cars.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cars_updated_at
    BEFORE UPDATE ON cars
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_searches ENABLE ROW LEVEL SECURITY;

-- Cars policies
CREATE POLICY "Cars are viewable by everyone"
    ON cars FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own cars"
    ON cars FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cars"
    ON cars FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cars"
    ON cars FOR DELETE
    USING (auth.uid() = user_id);

-- Matches policies
CREATE POLICY "Users can view their own matches"
    ON matches FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own matches"
    ON matches FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own matches"
    ON matches FOR DELETE
    USING (auth.uid() = user_id);

-- Search suggestions policies
CREATE POLICY "Search suggestions are viewable by everyone"
    ON search_suggestions FOR SELECT
    USING (true);

-- Popular searches policies
CREATE POLICY "Popular searches are viewable by everyone"
    ON popular_searches FOR SELECT
    USING (true);
