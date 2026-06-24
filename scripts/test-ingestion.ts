/**
 * Test Script for Snapshot Ingestion
 * 
 * Run this script to manually test the ingestion service:
 * npx tsx scripts/test-ingestion.ts
 */

// IMPORTANT: Load environment variables FIRST before any other imports
import './load-env';

import { ingestBeachwatchSnapshots, getIngestionStats } from '../src/services/snapshotIngestionService';

async function main() {
  console.log('='.repeat(60));
  console.log('Testing Beachwatch Snapshot Ingestion Service');
  console.log('='.repeat(60));
  console.log();

  // Debug: Check environment variables
  console.log('🔍 Environment Variables Check:');
  console.log(`  - NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`  - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`  - SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log();

  // Step 1: Get current stats (before ingestion)
  console.log('📊 Fetching current database stats...');
  const statsBefore = await getIngestionStats();
  
  if (statsBefore) {
    console.log('Current stats:');
    console.log(`  - Total snapshots: ${statsBefore.totalSnapshots}`);
    console.log(`  - Unique sites: ${statsBefore.uniqueSites}`);
    console.log(`  - Date range: ${statsBefore.dateRange.earliest || 'N/A'} to ${statsBefore.dateRange.latest || 'N/A'}`);
  } else {
    console.log('  ⚠️  Could not fetch stats (Supabase might not be configured)');
  }
  console.log();

  // Step 2: Run ingestion
  console.log('🔄 Starting ingestion process...');
  const startTime = Date.now();
  
  const result = await ingestBeachwatchSnapshots();
  
  const duration = Date.now() - startTime;
  console.log();

  // Step 3: Display results
  if (result.success) {
    console.log('✅ Ingestion successful!');
    console.log(`  - Records processed: ${result.recordsProcessed}`);
    console.log(`  - Duration: ${duration}ms`);
    console.log(`  - Timestamp: ${result.timestamp}`);
  } else {
    console.log('❌ Ingestion failed!');
    console.log(`  - Error: ${result.message}`);
    console.log(`  - Duration: ${duration}ms`);
  }
  console.log();

  // Step 4: Get updated stats (after ingestion)
  if (result.success) {
    console.log('📊 Fetching updated database stats...');
    const statsAfter = await getIngestionStats();
    
    if (statsAfter) {
      console.log('Updated stats:');
      console.log(`  - Total snapshots: ${statsAfter.totalSnapshots}`);
      console.log(`  - Unique sites: ${statsAfter.uniqueSites}`);
      console.log(`  - Date range: ${statsAfter.dateRange.earliest || 'N/A'} to ${statsAfter.dateRange.latest || 'N/A'}`);
      
      if (statsBefore) {
        const newRecords = statsAfter.totalSnapshots - statsBefore.totalSnapshots;
        console.log(`  - New records added: ${newRecords}`);
      }
    }
  }

  console.log();
  console.log('='.repeat(60));
  console.log('Test completed');
  console.log('='.repeat(60));
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test script error:', error);
    process.exit(1);
  });
