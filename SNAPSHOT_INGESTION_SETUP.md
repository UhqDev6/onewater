# Beachwatch Snapshot Ingestion Setup Guide

## Overview

This guide explains how to set up and use the automated beachwatch snapshot ingestion system for historical time-series analysis.

## Architecture

The snapshot ingestion system consists of two main components:

1. **Service Layer** (`src/services/snapshotIngestionService.ts`)
   - Handles data fetching from NSW Beachwatch API
   - Maps GeoJSON data to database schema
   - Performs upsert operations to Supabase

2. **API Route** (`src/app/api/cron/ingest-snapshots/route.ts`)
   - Exposes HTTP endpoint for triggering ingestion
   - Designed to be called by cron services
   - Provides execution statistics and error handling

## Database Schema

The `beachwatch_snapshots` table should have the following structure:

```sql
CREATE TABLE beachwatch_snapshots (
  id BIGSERIAL PRIMARY KEY,
  site_id TEXT NOT NULL,
  site_name TEXT NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  latest_result TEXT,
  latest_result_rating INTEGER,
  pollution_forecast TEXT,
  pollution_forecast_timestamp TEXT,
  latest_result_observation_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate entries for same site on same date
  CONSTRAINT unique_site_observation UNIQUE (site_id, latest_result_observation_date)
);

-- Indexes for better query performance
CREATE INDEX idx_snapshots_site_id ON beachwatch_snapshots(site_id);
CREATE INDEX idx_snapshots_observation_date ON beachwatch_snapshots(latest_result_observation_date);
CREATE INDEX idx_snapshots_created_at ON beachwatch_snapshots(created_at);
```

## Setup Instructions

### 1. Environment Variables

Ensure the following environment variables are configured:

```bash
# Supabase Configuration (required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NSW Beachwatch API (optional, defaults to public API)
NSW_BEACHWATCH_API_URL=https://api.beachwatch.nsw.gov.au/public/sites/geojson

# Optional: Authentication for cron endpoint
CRON_SECRET_TOKEN=your_secret_token_here
```

### 2. Vercel Cron Setup (Recommended for Vercel Deployments)

Add to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/ingest-snapshots",
      "schedule": "0 * * * *"
    }
  ]
}
```

Schedule options:
- `"0 * * * *"` - Every hour
- `"0 */6 * * *"` - Every 6 hours
- `"0 0 * * *"` - Once daily at midnight
- `"0 8 * * *"` - Once daily at 8 AM

### 3. GitHub Actions Setup (Alternative)

Create `.github/workflows/ingest-snapshots.yml`:

```yaml
name: Ingest Beachwatch Snapshots

on:
  schedule:
    # Runs every hour
    - cron: '0 * * * *'
  workflow_dispatch: # Allows manual triggering

jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Snapshot Ingestion
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET_TOKEN }}" \
            https://your-domain.com/api/cron/ingest-snapshots
```

### 4. External Cron Services (e.g., cron-job.org, EasyCron)

Simply configure a recurring HTTP GET or POST request to:

```
https://your-domain.com/api/cron/ingest-snapshots
```

Optional: Add authentication header:
```
Authorization: Bearer YOUR_SECRET_TOKEN
```

## API Endpoint Usage

### Trigger Ingestion

```bash
# Basic ingestion
curl https://your-domain.com/api/cron/ingest-snapshots

# With authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-domain.com/api/cron/ingest-snapshots
```

### Dry Run (Check Stats Without Ingesting)

```bash
curl https://your-domain.com/api/cron/ingest-snapshots?dryRun=true
```

### Response Format

Success response:
```json
{
  "success": true,
  "message": "Successfully ingested 245 beachwatch snapshots",
  "recordsProcessed": 245,
  "timestamp": "2026-06-24T10:00:00.000Z",
  "executionTimeMs": 1234,
  "stats": {
    "totalSnapshots": 5890,
    "uniqueSites": 245,
    "dateRange": {
      "earliest": "2026-05-01T00:00:00Z",
      "latest": "2026-06-24T00:00:00Z"
    }
  }
}
```

Error response:
```json
{
  "success": false,
  "message": "Failed to fetch NSW Beachwatch data: HTTP 503",
  "recordsProcessed": 0,
  "timestamp": "2026-06-24T10:00:00.000Z",
  "executionTimeMs": 567
}
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Cron Service                            │
│  (Vercel Cron / GitHub Actions / External Service)          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │ HTTP GET/POST
                          ▼
┌─────────────────────────────────────────────────────────────┐
│           API Route: /api/cron/ingest-snapshots              │
│                                                               │
│  • Handles authentication                                    │
│  • Logs execution                                            │
│  • Calls service layer                                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│        Service: snapshotIngestionService.ts                  │
│                                                               │
│  1. Fetch from NSW Beachwatch API                           │
│  2. Parse GeoJSON response                                   │
│  3. Map to database schema                                   │
│  4. Upsert to Supabase                                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│           Supabase: beachwatch_snapshots table               │
│                                                               │
│  • Stores historical snapshots                               │
│  • Prevents duplicates via unique constraint                │
│  • Ready for time-series queries                            │
└─────────────────────────────────────────────────────────────┘
```

## Isolation from Existing Services

**IMPORTANT:** This ingestion system is completely isolated from existing real-time dashboard functionality:

- ✅ **Does NOT modify** `hybridBeachService.ts`
- ✅ **Does NOT modify** `nswBeachwatchService.ts`
- ✅ **Does NOT affect** existing API routes
- ✅ **Does NOT interfere** with frontend data fetching
- ✅ **Standalone operation** in separate files

The existing services continue to fetch data in real-time for the dashboard, while this ingestion system independently collects historical snapshots for time-series analysis.

## Querying Historical Data

Once data is being collected, you can query historical trends:

```typescript
// Example: Get time-series data for a specific beach
const { data } = await supabase
  .from('beachwatch_snapshots')
  .select('*')
  .eq('site_id', 'your-site-id')
  .order('latest_result_observation_date', { ascending: true });

// Example: Get daily average ratings across all beaches
const { data } = await supabase
  .from('beachwatch_snapshots')
  .select('latest_result_observation_date, latest_result_rating')
  .order('latest_result_observation_date', { ascending: true });
```

## Monitoring and Troubleshooting

### Check Ingestion Logs

Logs are written to console with `[Snapshot Ingestion]` or `[Cron Job]` prefix:

```
[Snapshot Ingestion] Starting data fetch from: https://api.beachwatch.nsw.gov.au/...
[Snapshot Ingestion] Fetched 245 features from API
[Snapshot Ingestion] Upserting 245 records to database
[Snapshot Ingestion] Successfully processed 245 records
[Cron Job] Ingestion completed in 1234ms
```

### Common Issues

1. **"Supabase admin client is not configured"**
   - Check `SUPABASE_SERVICE_ROLE_KEY` environment variable
   - Verify Supabase URL is correct

2. **"Failed to fetch NSW Beachwatch data: HTTP 503"**
   - NSW API might be temporarily down
   - Cron will retry on next scheduled run

3. **Duplicate key violations**
   - Should not occur due to upsert with `onConflict`
   - If it does, check unique constraint on table

4. **No data in time-series charts**
   - Verify ingestion is running successfully
   - Check that `latest_result_observation_date` field is populated
   - May need to wait for initial data collection period

## Testing

### Manual Test

```bash
# Test the ingestion locally
curl http://localhost:3000/api/cron/ingest-snapshots

# Check stats only
curl http://localhost:3000/api/cron/ingest-snapshots?dryRun=true
```

### Verify in Supabase

1. Open Supabase dashboard
2. Navigate to Table Editor
3. Open `beachwatch_snapshots` table
4. Check for recent entries

## Next Steps

After setup is complete and data is being collected:

1. **Build Time-Series Components**: Create React components to visualize historical trends
2. **Add Date Range Filters**: Allow users to select specific date ranges
3. **Aggregation Queries**: Implement daily/weekly/monthly aggregations
4. **Export Functionality**: Allow users to download historical data as CSV
5. **Alerts**: Set up notifications for data quality issues or ingestion failures

## Support

For issues or questions:
- Check application logs for detailed error messages
- Verify all environment variables are correctly set
- Ensure Supabase table schema matches documentation
- Test API endpoint manually before setting up automation
