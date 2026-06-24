# Fix: Daily Snapshot Historical Tracking (Solusi B - Kolom Baru)

## Problem

Initial implementation had a constraint issue that prevented proper daily historical tracking:

```sql
-- OLD CONSTRAINT (Problem):
UNIQUE (site_id, latest_result_observation_date)
```

**Issue:** NSW Beachwatch API's `latest_result_observation_date` represents the **lab test date**, not when we pull the data. Lab results might not update daily, so pulling data every day would not create new records.

---

## Solution (Recommended Approach)

**Add dedicated `snapshot_date` column** instead of using expression-based constraint.

### Why This is Better:

✅ **Clean column reference** - No complex expressions  
✅ **Supabase upsert works perfectly** - Can use `onConflict: 'site_id,snapshot_date'`  
✅ **Fast queries** - Direct index on column, no casting needed  
✅ **Easy maintenance** - Explicit and clear schema  
✅ **No PostgreSQL syntax errors** - Standard SQL only  

---

## What Changed

### 1. Database Migration ⭐

**File:** `supabase/migrations/fix_beachwatch_snapshots_constraint.sql`

**New column:**
```sql
snapshot_date DATE NOT NULL  -- The date we pulled this snapshot (YYYY-MM-DD)
```

**New constraint:**
```sql
UNIQUE (site_id, snapshot_date)  -- One snapshot per site per day
```

### 2. Ingestion Service

**File:** `src/services/snapshotIngestionService.ts`

**Changes:**
- Added `snapshot_date` field to interface
- Set `snapshot_date: today` during mapping
- Changed to `upsert` with `onConflict: 'site_id,snapshot_date'`

### 3. Query Service

**File:** `src/services/waterQualityHistoryService.ts`

**Changes:**
- Added `snapshot_date` to interface
- Query now orders by `snapshot_date` (cleaner than `created_at::date`)
- Chart X-axis uses `snapshot_date` directly

---

## How to Apply

### Step 1: Run Migration in Supabase

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste contents of `supabase/migrations/fix_beachwatch_snapshots_constraint.sql`
3. Click **Run**
4. Verify: Check table structure, should see new `snapshot_date` column

### Step 2: Deploy Code Changes

Code is already updated. Just deploy:

```bash
git add .
git commit -m "Fix: Add snapshot_date column for daily historical tracking"
git push
```

### Step 3: Test

1. Trigger ingestion: `curl https://onewater.vercel.app/api/cron/ingest-snapshots`
2. Check database: Should see `snapshot_date` = today
3. Wait 1 day
4. Trigger again tomorrow
5. Check Water Quality view → Should see 2 data points now!

---

## Data Schema

### New Column:

```sql
snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE
```

**Purpose:** Tracks the date when we pulled this snapshot  
**Format:** `YYYY-MM-DD` (date only, no time)  
**Example:** `2026-06-24`  

### Preserved Fields:

- `latest_result_observation_date` - Still stores lab test date for reference
- `created_at` - Still stores full timestamp when record was created
- All other fields unchanged

---

## Expected Behavior

### Daily Cron Job:

**Day 1 (June 24):**
- Run 1 (00:00 UTC): UPSERT 245 records → snapshot_date = 2026-06-24 ✅
- Run 2 (06:00 UTC): UPSERT 245 records → UPDATE same records (same date) ⏭️
- Run 3 (12:00 UTC): UPSERT 245 records → UPDATE same records ⏭️
- Run 4 (18:00 UTC): UPSERT 245 records → UPDATE same records ⏭️

**Day 2 (June 25):**
- Run 1 (00:00 UTC): UPSERT 245 records → snapshot_date = 2026-06-25 → **NEW RECORDS** ✅

**Result:** 245 new records per day = proper historical tracking!

---

## Code Changes Summary

### Minimal Changes (Only 2 Files):

#### 1. `snapshotIngestionService.ts`

```typescript
// Before:
{
  site_id: feature.properties.id,
  site_name: feature.properties.siteName,
  // ... other fields
}

// After:
{
  site_id: feature.properties.id,
  site_name: feature.properties.siteName,
  snapshot_date: new Date().toISOString().split('T')[0], // Added
  // ... other fields
}

// Upsert changed:
.upsert(snapshots, { onConflict: 'site_id,snapshot_date' })
```

#### 2. `waterQualityHistoryService.ts`

```typescript
// Query changed:
.order('snapshot_date', { ascending: true })  // Instead of created_at

// Mapping changed:
date: snapshot.snapshot_date  // Instead of snapshot.created_at.split('T')[0]
```

**That's it!** No other files need changes.

---

## Comparison: Expression vs Column

| Aspect | Expression `(created_at::date)` | **Column `snapshot_date`** ⭐ |
|--------|--------------------------------|-------------------------------|
| Constraint | ❌ Needs UNIQUE INDEX | ✅ Standard UNIQUE constraint |
| Supabase upsert | ❌ Cannot use onConflict | ✅ Works perfectly |
| Query speed | ⚠️ Needs cast each time | ✅ Direct column access |
| Maintenance | ⚠️ Complex | ✅ Simple and clear |
| SQL portability | ⚠️ PostgreSQL-specific | ✅ Standard SQL |

---

## Database Growth

**Per Day:** ~245 records  
**Per Month:** ~7,350 records  
**Per Year:** ~89,425 records  

**Storage:** ~10 MB per year (very small!)

---

## FAQ

### Q: Do we need to change existing API routes?

**A:** No! Only ingestion service needs update. All other code stays the same.

### Q: What happens to old data?

**A:** Migration backfills `snapshot_date` from `created_at` automatically.

### Q: Can we still query by created_at?

**A:** Yes! `created_at` column still exists. But `snapshot_date` is cleaner for charts.

### Q: What if NSW API updates twice in one day?

**A:** Upsert will UPDATE the existing record for that day with latest data.

---

## Verification Checklist

After running migration:

- ✅ Column `snapshot_date` exists with type `DATE`
- ✅ Constraint `unique_site_snapshot_date` on `(site_id, snapshot_date)`
- ✅ Index `idx_snapshots_snapshot_date` exists
- ✅ Old constraint `unique_site_observation` is dropped
- ✅ Existing data has `snapshot_date` backfilled
- ✅ Ingestion service maps `snapshot_date: today`
- ✅ Upsert uses `onConflict: 'site_id,snapshot_date'`
- ✅ Query service uses `snapshot_date` for ordering

---

## Summary

**Problem:** Expression-based constraint doesn't work with Supabase upsert  
**Solution:** Add dedicated `snapshot_date DATE` column  
**Changes:** Only 2 files (ingestion + query service)  
**Benefits:** Clean, fast, and perfectly compatible with Supabase  

**Status:** ✅ **Ready to Deploy**

Initial implementation had a constraint issue that prevented proper daily historical tracking:

```sql
-- OLD CONSTRAINT (Problem):
UNIQUE (site_id, latest_result_observation_date)
```

**Issue:** NSW Beachwatch API's `latest_result_observation_date` represents the **lab test date**, not when we pull the data. Lab results might not update daily, so pulling data every day would not create new records.

### Example of the Problem:

```
Day 1 (June 24): Pull → observation_date = "June 22" → INSERT ✅
Day 2 (June 25): Pull → observation_date = "June 22" (same!) → UPDATE (no new record) ❌
Day 3 (June 26): Pull → observation_date = "June 22" (still same!) → UPDATE ❌
```

**Result:** Line chart only shows 1 data point forever! 😢

---

## Solution

Change the unique constraint to track **when we pull** (snapshot date), not when lab tested:

```sql
-- NEW CONSTRAINT (Solution):
UNIQUE (site_id, (created_at::date))
```

Now each day creates a NEW snapshot, even if observation_date doesn't change:

```
Day 1 (June 24): Pull → created_at = "June 24" → INSERT ✅
Day 2 (June 25): Pull → created_at = "June 25" → INSERT ✅ (new snapshot!)
Day 3 (June 26): Pull → created_at = "June 26" → INSERT ✅ (another snapshot!)
```

**Result:** Line chart shows daily progression! 📈

---

## What Changed

### 1. Database Migration

**File:** `supabase/migrations/fix_beachwatch_snapshots_constraint.sql`

- Drop old constraint: `unique_site_observation`
- Add new constraint: `unique_site_snapshot_date` on `(site_id, created_at::date)`
- Add index on `created_at::date` for performance

### 2. Ingestion Service

**File:** `src/services/snapshotIngestionService.ts`

- Changed from `upsert` to `insert` with `ignoreDuplicates: true`
- Updated comments to reflect new behavior
- Handles duplicate errors gracefully (when pulling multiple times per day)

### 3. Query Service

**File:** `src/services/waterQualityHistoryService.ts`

- Query now orders by `created_at` (snapshot date) instead of `latest_result_observation_date`
- Chart X-axis shows **pull date**, not lab test date
- Added `observationDate` field to preserve lab test date for reference

---

## How to Apply

### Step 1: Run Migration in Supabase

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste contents of `supabase/migrations/fix_beachwatch_snapshots_constraint.sql`
3. Click **Run**
4. Verify: Check table structure, should see new constraint `unique_site_snapshot_date`

### Step 2: Deploy Code Changes

Changes are already in the code. Just deploy:

```bash
git add .
git commit -m "Fix: Change snapshot constraint for daily historical tracking"
git push
```

### Step 3: Test

1. Manually trigger ingestion: `curl https://onewater.vercel.app/api/cron/ingest-snapshots`
2. Wait 1 day
3. Trigger again tomorrow
4. Check Water Quality view → Should see 2 data points now!

---

## Data Semantics

### Before Fix:
- **X-axis (date):** Lab test observation date
- **Problem:** Same date repeated = no new data points

### After Fix:
- **X-axis (date):** When we pulled the snapshot (created_at)
- **Benefit:** Daily data points even if lab results don't update
- **Preserved:** `latest_result_observation_date` still stored for reference

---

## Expected Behavior Going Forward

### Daily Cron Job (GitHub Actions every 6 hours):

**Day 1:**
- Run 1 (00:00 UTC): INSERT 245 records ✅
- Run 2 (06:00 UTC): Duplicate ignored (same day) ⏭️
- Run 3 (12:00 UTC): Duplicate ignored (same day) ⏭️
- Run 4 (18:00 UTC): Duplicate ignored (same day) ⏭️

**Day 2:**
- Run 1 (00:00 UTC): INSERT 245 NEW records ✅ (different day!)
- Runs 2-4: Duplicate ignored

**Result:** 245 new records per day = proper historical tracking!

---

## Line Chart Behavior

### Before Fix:
```
1 pull = 1 data point
100 pulls = still 1 data point (if observation_date doesn't change)
```

### After Fix:
```
1 day = 1 data point
30 days = 30 data points
90 days = 90 data points (chart shows 90 days history)
```

---

## Database Growth

**Before:** ~245 records total (stuck forever)  
**After:** ~245 records per day

| Time Period | Total Records |
|-------------|---------------|
| 1 day | 245 |
| 1 week | 1,715 |
| 1 month | 7,350 |
| 3 months | 22,050 |
| 6 months | 44,100 |
| 1 year | 89,425 |

**Storage estimate:** ~10 MB per year (very small!)

---

## FAQ

### Q: What if NSW API updates observation_date?

**A:** No problem! We still create a new snapshot daily based on `created_at`. The updated `observation_date` will be stored in that day's snapshot.

### Q: What if we pull multiple times per day?

**A:** Only the first pull of the day creates a record. Subsequent pulls on the same day are ignored (duplicate constraint).

### Q: How do we know the actual lab test date?

**A:** It's still stored in `latest_result_observation_date` field. Chart tooltip can show both dates if needed.

### Q: Can we backfill historical data?

**A:** No, we can only track from now forward. Historical data before this fix is lost (but there was only 1 data point anyway).

---

## Verification Checklist

After applying migration:

- ✅ Constraint `unique_site_observation` is dropped
- ✅ New constraint `unique_site_snapshot_date` exists
- ✅ Index `idx_snapshots_created_date` exists
- ✅ Ingestion service uses `insert` instead of `upsert`
- ✅ Query service orders by `created_at`
- ✅ Water Quality chart shows pull dates on X-axis
- ✅ Multiple pulls per day don't create duplicates
- ✅ Daily pulls create new records even if observation_date is same

---

## Summary

**Problem:** Constraint prevented daily snapshots  
**Solution:** Track snapshot date (when we pull), not lab test date  
**Result:** Proper daily historical tracking for line charts  
**Action Required:** Run migration, deploy code, wait for daily cron  

**Status:** ✅ **Ready to Deploy**
