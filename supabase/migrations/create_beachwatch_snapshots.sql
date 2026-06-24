-- Migration: Create beachwatch_snapshots table for historical time-series data
-- Description: This table stores periodic snapshots of NSW Beachwatch data
--              to enable historical trend analysis and time-series charts

-- Create the beachwatch_snapshots table
CREATE TABLE IF NOT EXISTS beachwatch_snapshots (
  id BIGSERIAL PRIMARY KEY,
  
  -- Site identification
  site_id TEXT NOT NULL,
  site_name TEXT NOT NULL,
  
  -- Geographic coordinates
  longitude DOUBLE PRECISION NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  
  -- Water quality data
  latest_result TEXT,
  latest_result_rating INTEGER,
  
  -- Pollution forecast
  pollution_forecast TEXT,
  pollution_forecast_timestamp TEXT,
  
  -- Observation metadata
  latest_result_observation_date TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate entries for same site on same observation date
  -- This enables upsert operations without errors
  CONSTRAINT unique_site_observation UNIQUE (site_id, latest_result_observation_date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_snapshots_site_id 
  ON beachwatch_snapshots(site_id);

CREATE INDEX IF NOT EXISTS idx_snapshots_observation_date 
  ON beachwatch_snapshots(latest_result_observation_date);

CREATE INDEX IF NOT EXISTS idx_snapshots_created_at 
  ON beachwatch_snapshots(created_at);

CREATE INDEX IF NOT EXISTS idx_snapshots_rating 
  ON beachwatch_snapshots(latest_result_rating);

-- Create a composite index for common time-series queries
CREATE INDEX IF NOT EXISTS idx_snapshots_site_date 
  ON beachwatch_snapshots(site_id, latest_result_observation_date DESC);

-- Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_beachwatch_snapshots_updated_at
  BEFORE UPDATE ON beachwatch_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE beachwatch_snapshots IS 
  'Historical snapshots of NSW Beachwatch water quality data for time-series analysis';

COMMENT ON COLUMN beachwatch_snapshots.site_id IS 
  'Unique identifier for the beach site from NSW Beachwatch API';

COMMENT ON COLUMN beachwatch_snapshots.site_name IS 
  'Human-readable name of the beach location';

COMMENT ON COLUMN beachwatch_snapshots.latest_result IS 
  'Latest water quality test result description';

COMMENT ON COLUMN beachwatch_snapshots.latest_result_rating IS 
  'Numeric rating of water quality (1=Excellent, 2=Good, 3=Fair, 4=Poor)';

COMMENT ON COLUMN beachwatch_snapshots.pollution_forecast IS 
  'Pollution forecast description';

COMMENT ON COLUMN beachwatch_snapshots.latest_result_observation_date IS 
  'Date when the water quality observation was made (ISO format string)';

-- Enable Row Level Security (RLS)
ALTER TABLE beachwatch_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (snapshots are public data)
CREATE POLICY "Allow public read access" 
  ON beachwatch_snapshots 
  FOR SELECT 
  USING (true);

-- Create policy to allow service role to insert/update (for ingestion service)
CREATE POLICY "Allow service role full access" 
  ON beachwatch_snapshots 
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create a view for easier time-series queries
CREATE OR REPLACE VIEW beachwatch_time_series AS
SELECT 
  site_id,
  site_name,
  latitude,
  longitude,
  latest_result_observation_date::timestamp as observation_timestamp,
  latest_result,
  latest_result_rating,
  pollution_forecast,
  DATE(latest_result_observation_date::timestamp) as observation_date,
  EXTRACT(YEAR FROM latest_result_observation_date::timestamp) as year,
  EXTRACT(MONTH FROM latest_result_observation_date::timestamp) as month,
  EXTRACT(WEEK FROM latest_result_observation_date::timestamp) as week
FROM beachwatch_snapshots
WHERE latest_result_observation_date IS NOT NULL
ORDER BY latest_result_observation_date DESC;

COMMENT ON VIEW beachwatch_time_series IS 
  'Convenient view for time-series analysis with parsed date components';

-- Grant access to the view
GRANT SELECT ON beachwatch_time_series TO anon, authenticated;
