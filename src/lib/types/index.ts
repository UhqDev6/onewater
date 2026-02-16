/**
 * Core type definitions for water quality data
 */

// ========================================
// Location Types
// ========================================

export interface BeachLocation {
  id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  description?: string;
  region?: string;
  localGovernmentArea?: string;
  beachType?: 'ocean' | 'bay' | 'estuary' | 'river';
}

// ========================================
// Water Quality Data Types
// ========================================

export interface EnterococciRecord {
  id: string;
  locationId: string;
  sampleDate: string; // ISO 8601 format
  enterococciValue: number; // cfu/100ml
  unit: 'cfu/100ml';
  qualityRating: WaterQualityRating;
  labReference?: string;
  notes?: string;
  isEstimated?: boolean;
  source: DataSource;
}

export type WaterQualityRating = 'excellent' | 'good' | 'fair' | 'poor' | 'bad' | 'very_poor' | 'unknown';

export type DataSource = 'nsw_beachwatch' | 'vic_epa' | 'manual';

// ========================================
// API Response Types
// ========================================

export interface BeachDataResponse {
  locations: BeachLocation[];
  records: EnterococciRecord[];
  metadata: {
    totalLocations: number;
    totalRecords: number;
    lastUpdated: string;
    dateRange: {
      start: string;
      end: string;
    };
  };
}

// ========================================
// NSW Beachwatch API Types
// ========================================

export interface NSWBeachwatchRawData {
  // Raw API response structure from NSW Beachwatch
  SiteID: string;
  SiteName: string;
  Latitude: number;
  Longitude: number;
  Council: string;
  Region: string;
  SampleDate: string;
  EnterococciResult: number;
  Classification?: string;
}

// ========================================
// Victoria EPA API Types
// ========================================

export interface VictoriaEPARawData {
  // Raw API response structure from Victoria EPA
  site_id: string;
  site_name: string;
  latitude: number;
  longitude: number;
  sample_date: string;
  enterococci_cfu_100ml: number;
  monitoring_program?: string;
}

// ========================================
// Normalized API Response
// ========================================

export interface NormalizedWaterQualityData {
  location: BeachLocation;
  latestReading: EnterococciRecord;
  historicalReadings: EnterococciRecord[];
  statistics: {
    average: number;
    median: number;
    min: number;
    max: number;
    sampleCount: number;
  };
}

// ========================================
// Filter and Query Types
// ========================================

export interface WaterQualityFilters {
  states?: string[];
  regions?: string[];
  beachTypes?: BeachLocation['beachType'][];
  qualityRatings?: WaterQualityRating[];
  dateRange?: {
    start: string;
    end: string;
  };
  sources?: DataSource[];
}

export interface DashboardQuery extends WaterQualityFilters {
  sortBy?: 'name' | 'date' | 'quality' | 'location';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// ========================================
// Chart Data Types
// ========================================

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  locationId: string;
  locationName: string;
}

export interface StatisticsData {
  label: string;
  value: number;
  color?: string;
  percentage?: number;
}

// ========================================
// Component Props Types
// ========================================

export interface MapViewProps {
  locations: BeachLocation[];
  selectedLocation?: string;
  onLocationSelect?: (locationId: string) => void;
}

export interface ChartViewProps {
  data: TimeSeriesDataPoint[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}
