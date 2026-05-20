/**
 * TypeScript interfaces for Landing Page Scientific Components
 * These interfaces match the structure of real data from dashboard
 */

// MST (Microbial Source Tracking) Data Types
export interface MSTSourceData {
  name: string;
  median: number;
  color: string;
}

export interface MSTCategoryData {
  category: string;
  sources: MSTSourceData[];
}

// Water Quality Status Types
export type WaterQualityStatus = 'Good' | 'Fair' | 'Poor' | 'Polluted';

// Location Data Types (matches BeachLocation from dashboard)
export interface LocationData {
  id: string;
  name: string;
  location?: string;
  status: WaterQualityStatus;
  indicator?: string;
  lastUpdated: string;
  enterococci?: number;
  threshold?: number;
  severity?: 'high' | 'critical';
}

// Beach Camera Data Types
export interface BeachCameraData {
  id: string;
  name: string;
  location: string;
  cameraUrl: string | null;
  available: boolean;
  lastUpdate: string;
  thumbnail: string | null;
}

// Statistics Data Types
export interface StatData {
  label: string;
  value: string;
  subtext: string;
  trend: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'cyan' | 'purple';
}

// Taxonomic Data Types (matches dashboard taxonomy structure)
export interface TaxonomicLevelData {
  level: number;
  name: string;
  example: string;
}

export interface ScienceInsightData {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

// Alert Data Types
export interface PollutionAlertData extends LocationData {
  enterococci: number;
  threshold: number;
  severity: 'high' | 'critical';
}

// Color Configuration Types
export interface ColorConfig {
  bg: string;
  border: string;
  badge: string;
  text: string;
  icon: string;
  pulse?: string;
}

export interface StatColorClasses {
  bg: string;
  border: string;
  icon: string;
  iconHover: string;
  text: string;
  trend: string;
}