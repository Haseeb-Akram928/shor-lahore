import { env } from '../config/env.js';

const localDevOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

export function isAllowedCorsOrigin(origin?: string): boolean {
  if (!origin) return true;
  if (origin === env.CLIENT_URL) return true;
  return env.NODE_ENV === 'development' && localDevOriginPattern.test(origin);
}

export function corsOrigin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
  callback(null, isAllowedCorsOrigin(origin));
}
