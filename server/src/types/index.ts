// ============ ENUMS ============

export const NOISE_TYPES = [
  'construction',
  'traffic',
  'nightlife',
  'neighbors',
  'industrial',
  'animals',
  'sirens',
  'religious',     // Loudspeakers - relevant in Lahore
  'generators',    // Very common in Pakistan due to load-shedding
  'horns',         // Pressure horns - huge Lahore problem
  'music',
  'other',
] as const;

export type NoiseType = typeof NOISE_TYPES[number];

export const REPORT_STATUSES = ['active', 'resolved', 'flagged'] as const;
export type ReportStatus = typeof REPORT_STATUSES[number];

export const USER_ROLES = ['user', 'admin'] as const;
export type UserRole = typeof USER_ROLES[number];

// ============ INTERFACES ============

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: [number, number][][]; // Array of linear rings
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  reportsCount: number;
  reputation: number;
  location?: GeoJSONPoint;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface INoiseReport {
  _id: string;
  user: string | IUser;
  location: GeoJSONPoint;
  noiseType: NoiseType;
  intensity: number; // 1-10
  description?: string;
  district?: string;
  tags: string[];
  mediaUrl?: string;
  status: ReportStatus;
  createdAt: Date;
  occurredAt: Date;
  upvotes: number;
  upvotedBy: string[];
}

export interface IDistrict {
  _id: string;
  name: string;
  city: string;
  boundary: GeoJSONPolygon;
  avgNoiseLevel: number;
  totalReports: number;
  createdAt: Date;
}

// ============ API RESPONSE TYPES ============

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AnalyticsOverview {
  totalReports: number;
  totalReportsChange: number; // % change from previous period
  activeToday: number;
  avgIntensity: number;
  avgIntensityChange: number;
  topNoiseType: { type: NoiseType; count: number };
  totalUsers: number;
  totalDistricts: number;
}

export interface TrendDataPoint {
  date: string; // ISO date string
  count: number;
}

export interface NoiseTypeBreakdown {
  type: NoiseType;
  count: number;
  percentage: number;
}

export interface HourlyDistribution {
  hour: number; // 0-23
  count: number;
  avgIntensity: number;
}

export interface DistrictStats {
  district: string;
  totalReports: number;
  avgIntensity: number;
  topNoiseType: NoiseType;
}

export interface HeatmapGridCell {
  district: string;
  hour: number;
  avgIntensity: number;
}

export interface HeatmapDataPoint {
  coordinates: [number, number]; // [lng, lat]
  weight: number; // intensity 1-10
}
