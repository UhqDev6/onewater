/**
 * Centralized configuration for API and application settings
 * All environment variables are accessed through this file
 */

export const config = {
  // External API URLs
  api: {
    nswBeachwatch: process.env.NSW_BEACHWATCH_API_URL || 'https://api.beachwatch.nsw.gov.au/public/sites/geojson',
  },

  // Cache settings
  cache: {
    duration: Number(process.env.API_CACHE_DURATION) || 3600,
    staleWhileRevalidate: 7200,
  },

  // Request settings
  request: {
    timeout: Number(process.env.API_TIMEOUT) || 10000,
    retryCount: Number(process.env.API_RETRY_COUNT) || 3,
    retryBackoff: Number(process.env.API_RETRY_BACKOFF) || 1000,
  },

  // Security
  security: {
    revalidateToken: process.env.REVALIDATE_TOKEN,
  },

  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

// Validate required environment variables
export function validateConfig() {
  const required = {
    'NSW_BEACHWATCH_API_URL': config.api.nswBeachwatch,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
