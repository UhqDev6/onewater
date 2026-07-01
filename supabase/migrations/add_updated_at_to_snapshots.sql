-- Add updated_at column to beachwatch_snapshots table
-- This column will track when each record was last modified (for "X ago" display in UI)

-- Step 1: Add updated_at column with default value
ALTER TABLE beachwatch_snapshots 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 2: Create trigger function to auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger to call the function before UPDATE
DROP TRIGGER IF EXISTS set_updated_at ON beachwatch_snapshots;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON beachwatch_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Backfill existing records (set updated_at = created_at for old data)
UPDATE beachwatch_snapshots 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Step 5: Set NOT NULL constraint (after backfill)
ALTER TABLE beachwatch_snapshots 
ALTER COLUMN updated_at SET NOT NULL;

-- Step 6: Create index for performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_snapshots_updated_at 
ON beachwatch_snapshots (updated_at DESC);

COMMENT ON COLUMN beachwatch_snapshots.updated_at IS 
'Timestamp when this record was last updated. Used for "X ago" display in UI.';
