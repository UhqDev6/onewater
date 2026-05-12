-- ============================================================================
-- SUPABASE RPC FUNCTIONS FOR TAXONOMY DATA OPTIMIZATION
-- ============================================================================
-- Jalankan script ini di Supabase SQL Editor
-- Fungsi-fungsi ini akan mengurangi data transfer dari 20,000 rows menjadi puluhan rows
-- ============================================================================

-- 1. Fungsi untuk mendapatkan data agregat berdasarkan level taksonomi
-- ============================================================================
CREATE OR REPLACE FUNCTION get_taxonomy_aggregated(
  env_name TEXT,
  level_name TEXT,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  filter_domain TEXT DEFAULT NULL,
  filter_phylum TEXT DEFAULT NULL,
  filter_class TEXT DEFAULT NULL,
  filter_order TEXT DEFAULT NULL,
  filter_family TEXT DEFAULT NULL,
  filter_genus TEXT DEFAULT NULL
)
RETURNS TABLE (
  taxon_name TEXT,
  total_abundance NUMERIC,
  percentage NUMERIC,
  sample_count INTEGER
) 
LANGUAGE plpgsql
AS $$
DECLARE
  total_sum NUMERIC;
BEGIN
  -- Buat temporary table untuk filtered data
  CREATE TEMP TABLE IF NOT EXISTS temp_filtered AS
  SELECT *
  FROM taxonomy_measurements
  WHERE environment = env_name
    AND (start_date IS NULL OR observation_date >= start_date)
    AND (end_date IS NULL OR observation_date <= end_date)
    AND (filter_domain IS NULL OR domain = filter_domain)
    AND (filter_phylum IS NULL OR phylum = filter_phylum)
    AND (filter_class IS NULL OR class = filter_class)
    AND (filter_order IS NULL OR order_tax = filter_order)
    AND (filter_family IS NULL OR family = filter_family)
    AND (filter_genus IS NULL OR genus = filter_genus);

  -- Hitung total abundance untuk percentage
  SELECT SUM(abundance_value) INTO total_sum FROM temp_filtered;

  -- Return aggregated data berdasarkan level
  RETURN QUERY
  EXECUTE format('
    SELECT 
      COALESCE(%I, ''Unknown'') as taxon_name,
      ROUND(SUM(abundance_value)::numeric, 2) as total_abundance,
      CASE 
        WHEN %s > 0 THEN ROUND((SUM(abundance_value) / %s * 100)::numeric, 2)
        ELSE 0
      END as percentage,
      COUNT(DISTINCT sample_id)::integer as sample_count
    FROM temp_filtered
    GROUP BY %I
    ORDER BY total_abundance DESC
  ', level_name, total_sum, total_sum, level_name);

  -- Cleanup
  DROP TABLE IF EXISTS temp_filtered;
END;
$$;

-- 2. Fungsi untuk mendapatkan unique values untuk cascading filters
-- ============================================================================
CREATE OR REPLACE FUNCTION get_taxonomy_unique_values(
  env_name TEXT,
  level_name TEXT,
  filter_domain TEXT DEFAULT NULL,
  filter_phylum TEXT DEFAULT NULL,
  filter_class TEXT DEFAULT NULL,
  filter_order TEXT DEFAULT NULL,
  filter_family TEXT DEFAULT NULL
)
RETURNS TABLE (
  value TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  EXECUTE format('
    SELECT DISTINCT %I as value
    FROM taxonomy_measurements
    WHERE environment = %L
      AND %I IS NOT NULL
      AND %I != ''''
      AND ($1 IS NULL OR domain = $1)
      AND ($2 IS NULL OR phylum = $2)
      AND ($3 IS NULL OR class = $3)
      AND ($4 IS NULL OR order_tax = $4)
      AND ($5 IS NULL OR family = $5)
    ORDER BY value
  ', level_name, env_name, level_name, level_name)
  USING filter_domain, filter_phylum, filter_class, filter_order, filter_family;
END;
$$;

-- 3. Fungsi untuk mendapatkan sample composition (untuk stacked bar chart)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_taxonomy_by_sample(
  env_name TEXT,
  level_name TEXT,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  filter_domain TEXT DEFAULT NULL,
  filter_phylum TEXT DEFAULT NULL,
  filter_class TEXT DEFAULT NULL,
  filter_order TEXT DEFAULT NULL,
  filter_family TEXT DEFAULT NULL,
  filter_genus TEXT DEFAULT NULL,
  top_n INTEGER DEFAULT 50
)
RETURNS TABLE (
  sample_id TEXT,
  observation_date DATE,
  taxon_name TEXT,
  abundance_value NUMERIC,
  domain TEXT,
  phylum TEXT,
  class TEXT,
  order_tax TEXT,
  family TEXT,
  genus TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  -- Get top N most abundant taxa first
  CREATE TEMP TABLE IF NOT EXISTS top_taxa AS
  SELECT taxon_name
  FROM get_taxonomy_aggregated(
    env_name, level_name, start_date, end_date,
    filter_domain, filter_phylum, filter_class, 
    filter_order, filter_family, filter_genus
  )
  LIMIT top_n;

  -- Return sample data only for top taxa
  RETURN QUERY
  EXECUTE format('
    SELECT 
      tm.sample_id,
      tm.observation_date,
      COALESCE(tm.%I, ''Unknown'') as taxon_name,
      tm.abundance_value,
      tm.domain,
      tm.phylum,
      tm.class,
      tm.order_tax,
      tm.family,
      tm.genus
    FROM taxonomy_measurements tm
    INNER JOIN top_taxa tt ON COALESCE(tm.%I, ''Unknown'') = tt.taxon_name
    WHERE tm.environment = %L
      AND ($1 IS NULL OR tm.observation_date >= $1)
      AND ($2 IS NULL OR tm.observation_date <= $2)
      AND ($3 IS NULL OR tm.domain = $3)
      AND ($4 IS NULL OR tm.phylum = $4)
      AND ($5 IS NULL OR tm.class = $5)
      AND ($6 IS NULL OR tm.order_tax = $6)
      AND ($7 IS NULL OR tm.family = $7)
      AND ($8 IS NULL OR tm.genus = $8)
    ORDER BY tm.sample_id, tm.observation_date DESC
  ', level_name, level_name, env_name)
  USING start_date, end_date, filter_domain, filter_phylum, 
        filter_class, filter_order, filter_family, filter_genus;

  -- Cleanup
  DROP TABLE IF EXISTS top_taxa;
END;
$$;

-- 4. Fungsi untuk mendapatkan summary statistics
-- ============================================================================
CREATE OR REPLACE FUNCTION get_taxonomy_stats(
  env_name TEXT,
  level_name TEXT,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_samples INTEGER,
  total_taxa INTEGER,
  dominant_taxon TEXT,
  shannon_index NUMERIC
) 
LANGUAGE plpgsql
AS $$
DECLARE
  total_abundance NUMERIC;
BEGIN
  RETURN QUERY
  WITH aggregated AS (
    SELECT * FROM get_taxonomy_aggregated(
      env_name, level_name, start_date, end_date,
      NULL, NULL, NULL, NULL, NULL, NULL
    )
  ),
  shannon_calc AS (
    SELECT 
      SUM(total_abundance) as total,
      -SUM(
        CASE 
          WHEN total_abundance > 0 THEN 
            (total_abundance / (SELECT SUM(total_abundance) FROM aggregated)) * 
            LN(total_abundance / (SELECT SUM(total_abundance) FROM aggregated))
          ELSE 0
        END
      ) as shannon
    FROM aggregated
  )
  SELECT 
    (SELECT COUNT(DISTINCT sample_id)::integer 
     FROM taxonomy_measurements 
     WHERE environment = env_name
       AND (start_date IS NULL OR observation_date >= start_date)
       AND (end_date IS NULL OR observation_date <= end_date)
    ) as total_samples,
    (SELECT COUNT(*)::integer FROM aggregated) as total_taxa,
    (SELECT taxon_name FROM aggregated ORDER BY total_abundance DESC LIMIT 1) as dominant_taxon,
    ROUND((SELECT shannon FROM shannon_calc)::numeric, 3) as shannon_index;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS (untuk anonymous access jika menggunakan RLS)
-- ============================================================================
-- Uncomment jika perlu akses public
-- GRANT EXECUTE ON FUNCTION get_taxonomy_aggregated TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION get_taxonomy_unique_values TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION get_taxonomy_by_sample TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION get_taxonomy_stats TO anon, authenticated;

-- ============================================================================
-- TESTING QUERIES
-- ============================================================================
-- Test aggregated data
-- SELECT * FROM get_taxonomy_aggregated('Frankston_Beach', 'phylum', '2010-01-01', '2030-12-31');

-- Test unique values
-- SELECT * FROM get_taxonomy_unique_values('Frankston_Beach', 'phylum');

-- Test sample composition
-- SELECT * FROM get_taxonomy_by_sample('Frankston_Beach', 'phylum', '2010-01-01', '2030-12-31', NULL, NULL, NULL, NULL, NULL, NULL, 50);

-- Test statistics
-- SELECT * FROM get_taxonomy_stats('Frankston_Beach', 'phylum', '2010-01-01', '2030-12-31');
