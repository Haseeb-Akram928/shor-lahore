export type UserRole = 'user' | 'admin';

export type NoiseType =
  | 'construction'
  | 'traffic'
  | 'nightlife'
  | 'neighbors'
  | 'industrial'
  | 'animals'
  | 'sirens'
  | 'religious'
  | 'generators'
  | 'horns'
  | 'music'
  | 'other';

export type ReportStatus = 'active' | 'resolved' | 'flagged';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  reportsCount: number;
  reputation: number;
}

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface NoiseReport {
  _id: string;
  user: User | string;
  location: GeoJSONPoint;
  noiseType: NoiseType;
  intensity: number;
  description?: string;
  district?: string;
  tags: string[];
  mediaUrl?: string;
  status: ReportStatus;
  createdAt: string;
  occurredAt: string;
  upvotes: number;
}

export interface HeatmapPoint {
  _id: string;
  coordinates: [number, number];
  intensity: number;
  noiseType: NoiseType;
  district?: string;
  description?: string;
  occurredAt: string;
  createdAt: string;
  upvotes: number;
}

export interface District {
  _id: string;
  name: string;
  city: string;
  avgNoiseLevel: number;
  totalReports: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export type AnalyticsPeriod = '7d' | '30d' | '90d' | '1y' | 'all';

export interface OverviewStats {
  totalReports: number;
  totalReportsChange: number;
  activeToday: number;
  avgIntensity: number;
  avgIntensityChange: number;
  topNoiseType: {
    type: NoiseType;
    count: number;
  };
  totalUsers: number;
  totalDistricts: number;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface NoiseTypeBreakdown {
  type: NoiseType;
  count: number;
  percentage: number;
}

export interface HourlyStats {
  hour: number;
  count: number;
  avgIntensity: number;
}

export type PopulatedReportUser = Pick<User, '_id' | 'name' | 'avatar'>;

export type RecentReport = Omit<NoiseReport, 'user'> & {
  user: PopulatedReportUser | string;
};
