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

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
