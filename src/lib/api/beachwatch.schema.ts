/**
 * Zod schemas for NSW Beachwatch API response validation
 * Ensures runtime type safety for external API data
 */

import { z } from 'zod';

/**
 * Schema for a single beach feature in GeoJSON format
 */
export const BeachwatchFeatureSchema = z.object({
  type: z.literal('Feature'),
  geometry: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]), // [longitude, latitude]
  }),
  properties: z.object({
    id: z.string(),
    siteName: z.string(),
    pollutionForecast: z.string(),
    pollutionForecastTimeStamp: z.string(),
    latestResult: z.string(),
    latestResultRating: z.number().int().min(1).max(5),
    latestResultObservationDate: z.string(),
  }),
});

/**
 * Schema for the complete GeoJSON response
 */
export const BeachwatchGeoJSONSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(BeachwatchFeatureSchema),
});

/**
 * TypeScript types inferred from schemas
 */
export type BeachwatchFeature = z.infer<typeof BeachwatchFeatureSchema>;
export type BeachwatchGeoJSON = z.infer<typeof BeachwatchGeoJSONSchema>;

/**
 * Validate and parse NSW Beachwatch API response
 * @param data - Raw data from API
 * @returns Validated data or throws error
 */
export function validateBeachwatchResponse(data: unknown): BeachwatchGeoJSON {
  try {
    return BeachwatchGeoJSONSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Beachwatch API validation error:', error.issues);
      throw new Error(`Invalid API response format: ${error.issues[0].message}`);
    }
    throw error;
  }
}

/**
 * Safe validation that returns result object
 * @param data - Raw data from API
 * @returns Object with success status and data/error
 */
export function safeValidateBeachwatchResponse(data: unknown) {
  const result = BeachwatchGeoJSONSchema.safeParse(data);
  
  if (result.success) {
    return { success: true as const, data: result.data };
  }
  
  return { 
    success: false as const, 
    error: result.error.issues[0].message 
  };
}
