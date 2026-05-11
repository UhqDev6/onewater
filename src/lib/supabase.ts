/**
 * Supabase client configuration
 * Handles database connection and authentication
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured
const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url' &&
  supabaseAnonKey !== 'your_supabase_anon_key' &&
  supabaseUrl.startsWith('https://');

if (!isSupabaseConfigured) {
  console.warn('⚠️  Supabase not configured. Internal locations will be disabled.');
}

// Client-side Supabase client (only create if configured)
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

// Server-side Supabase client (with service role key)
export const supabaseAdmin = isSupabaseConfigured && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      supabaseUrl!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  : null;

// Helper function to check if Supabase is available
export const isSupabaseAvailable = () => isSupabaseConfigured;

// Database types (will be auto-generated later)
export interface InternalLocation {
  id: string;
  site_id: string;
  site_name: string;
  latitude: number;
  longitude: number;
  pollution_forecast?: string;
  pollution_forecast_timestamp?: string;
  latest_result?: string;
  latest_result_rating?: number;
  latest_result_observation_date?: string;
  description?: string;
  region?: string;
  expected_population?: number;
  beach_camera_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}