/**
 * API Route: Manual cache revalidation
 * Allows clearing cache on-demand via webhook or manual trigger
 */

import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    // Verify authorization token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token || token !== config.security.revalidateToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Revalidate paths
    revalidatePath('/dashboard');
    revalidatePath('/');
    
    // Note: Can't directly revalidate API routes, but this clears page caches
    // The API route has its own ISR revalidation time

    return NextResponse.json({
      revalidated: true,
      timestamp: new Date().toISOString(),
      paths: ['/dashboard', '/'],
    });
  } catch (error) {
    console.error('Error revalidating cache:', error);
    return NextResponse.json(
      { 
        error: 'Failed to revalidate cache',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Optional: GET method for testing (only in development)
export async function GET(request: NextRequest) {
  if (!config.isDevelopment) {
    return NextResponse.json(
      { error: 'Method not allowed in production' },
      { status: 405 }
    );
  }

  // Same logic as POST for development testing
  return POST(request);
}
