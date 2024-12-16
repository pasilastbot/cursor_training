-- Function to increment popular search count
CREATE OR REPLACE FUNCTION increment_popular_search(search_query TEXT)
RETURNS void AS $$
BEGIN
    INSERT INTO popular_searches (query, count)
    VALUES (search_query, 1)
    ON CONFLICT (query) DO UPDATE
    SET count = popular_searches.count + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get search suggestions
CREATE OR REPLACE FUNCTION get_search_suggestions(search_term TEXT, limit_count INTEGER DEFAULT 5)
RETURNS TABLE (suggestion TEXT, frequency BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT s.suggestion, COUNT(*) as frequency
    FROM search_suggestions s
    WHERE s.suggestion ILIKE '%' || search_term || '%'
    GROUP BY s.suggestion
    ORDER BY frequency DESC, suggestion
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_search_suggestions_suggestion ON search_suggestions USING gin (suggestion gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_popular_searches_count ON popular_searches (count DESC);

-- Add triggers to clean up old suggestions
CREATE OR REPLACE FUNCTION cleanup_old_suggestions()
RETURNS trigger AS $$
BEGIN
    DELETE FROM search_suggestions
    WHERE created_at < NOW() - INTERVAL '30 days';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_old_suggestions_trigger
    AFTER INSERT ON search_suggestions
    EXECUTE FUNCTION cleanup_old_suggestions();
