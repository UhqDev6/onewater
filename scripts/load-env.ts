/**
 * Environment loader - must be imported FIRST before any other project files
 */
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
const envLocalPath = resolve(process.cwd(), '.env.local');
const result = config({ path: envLocalPath });

if (result.error) {
  // Try .env as fallback
  const envPath = resolve(process.cwd(), '.env');
  const envResult = config({ path: envPath });
  
  if (envResult.error) {
    console.warn('⚠️  Could not load environment variables');
  }
}

// Export a ready signal
export const envLoaded = true;
