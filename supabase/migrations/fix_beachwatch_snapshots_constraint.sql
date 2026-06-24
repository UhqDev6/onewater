-- Migration: Fix beachwatch_snapshots unique constraint for daily historical tracking
-- Description: Add snapshot_date column and change constraint to use clean column reference
--              This allows daily snapshots and works perfectly with Supabase upsert()

-- Step 1: Drop old constraint
ALTER TABLE beachwatch_snapshots 
DROP CONSTRAINT IF EXISTS unique_site_observation;

-- Step 2: Add new column for snapshot date (date only, no time)
ALTER TABLE beachwatch_snapshots 
ADD COLUMN IF NOT EXISTS snapshot_date DATE DEFAULT CURRENT_DATE;

-- Step 3: Backfill existing data (sync snapshot_date from created_at)
UPDATE beachwatch_snapshots 
SET snapshot_date = created_at::date 
WHERE snapshot_date IS NULL;

-- Step 4: Make snapshot_date NOT NULL for future data integrity
ALTER TABLE beachwatch_snapshots 
ALTER COLUMN snapshot_date SET NOT NULL;

-- Step 5: Add UNIQUE constraint on the new clean column
ALTER TABLE beachwatch_snapshots 
ADD CONSTRAINT unique_site_snapshot_date 
UNIQUE (site_id, snapshot_date);

-- Step 6: Create index for fast queries on snapshot_date
CREATE INDEX IF NOT EXISTS idx_snapshots_snapshot_date 
ON beachwatch_snapshots (snapshot_date DESC);

-- Step 7: Add comment explaining the constraint
COMMENT ON CONSTRAINT unique_site_snapshot_date ON beachwatch_snapshots IS 
  'Ensures one snapshot per site per day based on snapshot_date column. Works perfectly with Supabase upsert onConflict.';

COMMENT ON COLUMN beachwatch_snapshots.snapshot_date IS
  'The date when this snapshot was taken (pull date). Used for daily historical tracking in line charts. Always set to CURRENT_DATE during ingestion.';

-- Benefits of this approach:
-- 1. Clean column reference (no expressions in constraint)
-- 2. Supabase .upsert() works perfectly with onConflict: 'site_id,snapshot_date'
-- 3. Fast queries with direct index on snapshot_date
-- 4. Easy to understand and maintain
-- 5. No syntax errors in Supabase or PostgreSQL

