/**
 * Cron Job API Route for Beachwatch Snapshot Ingestion
 * 
 * This endpoint triggers the snapshot ingestion process.
 * It should be called periodically by a cron service (e.g., Vercel Cron, GitHub Actions).
 * 
 * Recommended schedule:
 * - Every 1 hour: For frequent updates
 * - Every 6 hours: For balanced updates
 * - Once daily: For daily historical tracking
 * 
 * Security Note:
 * Consider adding authentication/authorization to this endpoint in production
 * to prevent unauthorized triggering.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ingestBeachwatchSnapshots, getIngestionStats } from '@/services/snapshotIngestionService';

/**
 * GET handler for snapshot ingestion
 * 
 * Query parameters:
 * - dryRun: if 'true', returns stats without performing ingestion
 * - auth: optional authentication token (implement as needed)
 * 
 * Example usage:
 * - Trigger ingestion: GET /api/cron/ingest-snapshots
 * - Get stats only: GET /api/cron/ingest-snapshots?dryRun=true
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Optional: Implement authentication
    // const authHeader = request.headers.get('authorization');
    // const configuredToken = process.env.CRON_SECRET_TOKEN;
    // 
    // if (configuredToken && authHeader !== `Bearer ${configuredToken}`) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    // Check for dry run mode
    const { searchParams } = new URL(request.url);
    const isDryRun = searchParams.get('dryRun') === 'true';

    if (isDryRun) {
      // Just return current stats without performing ingestion
      const stats = await getIngestionStats();
      return NextResponse.json({
        mode: 'dry-run',
        stats,
        timestamp: new Date().toISOString(),
      });
    }

    // Perform the actual ingestion
    console.log('[Cron Job] Starting beachwatch snapshot ingestion...');
    
    const result = await ingestBeachwatchSnapshots();
    
    const executionTime = Date.now() - startTime;
    console.log(`[Cron Job] Ingestion completed in ${executionTime}ms`);

    // Get updated stats after ingestion
    const stats = await getIngestionStats();

    // Return success response
    return NextResponse.json({
      ...result,
      executionTimeMs: executionTime,
      stats,
    }, {
      status: result.success ? 200 : 500,
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('[Cron Job] Unexpected error:', error);

    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      executionTimeMs: executionTime,
      timestamp: new Date().toISOString(),
    }, {
      status: 500,
    });
  }
}

/**
 * POST handler for snapshot ingestion
 * Alternative method for triggering ingestion via POST request
 * 
 * This is useful when your cron service prefers POST requests
 * or when you want to pass additional configuration in the request body.
 */
export async function POST() {
  const startTime = Date.now();
  
  try {
    // Optional: Parse request body for configuration
    // const body = await request.json();
    // const config = body.config || {};

    console.log('[Cron Job] Starting beachwatch snapshot ingestion (POST)...');
    
    const result = await ingestBeachwatchSnapshots();
    
    const executionTime = Date.now() - startTime;
    console.log(`[Cron Job] Ingestion completed in ${executionTime}ms`);

    const stats = await getIngestionStats();

    return NextResponse.json({
      ...result,
      executionTimeMs: executionTime,
      stats,
    }, {
      status: result.success ? 200 : 500,
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('[Cron Job] Unexpected error:', error);

    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      executionTimeMs: executionTime,
      timestamp: new Date().toISOString(),
    }, {
      status: 500,
    });
  }
}
