import { z } from 'zod';
import { NOISE_TYPES, REPORT_STATUSES } from '../types/index.js';

const longitude = z.coerce.number().min(73.8).max(74.8);
const latitude = z.coerce.number().min(31.2).max(31.8);

export const createReportSchema = z.object({
  lng: longitude,
  lat: latitude,
  noiseType: z.enum(NOISE_TYPES),
  intensity: z.coerce.number().int().min(1).max(10),
  description: z.string().trim().max(500).optional().default(''),
  district: z.string().trim().max(80).optional(),
  tags: z.array(z.string().trim().max(32)).max(10).optional().default([]),
  occurredAt: z.coerce.date().refine((date: Date) => date <= new Date(), 'Occurrence time cannot be in the future'),
});

export const heatmapQuerySchema = z.object({
  swLng: longitude.optional(),
  swLat: latitude.optional(),
  neLng: longitude.optional(),
  neLat: latitude.optional(),
  hour: z.coerce.number().int().min(0).max(23).optional(),
  noiseTypes: z.string().trim().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  minIntensity: z.coerce.number().int().min(1).max(10).optional().default(1),
  maxIntensity: z.coerce.number().int().min(1).max(10).optional().default(10),
  limit: z.coerce.number().int().min(1).max(1000).optional().default(700),
}).superRefine((query: { swLng?: number; swLat?: number; neLng?: number; neLat?: number; hour?: number; noiseTypes?: string; from?: Date; to?: Date; minIntensity: number; maxIntensity: number; limit: number }, ctx: z.RefinementCtx) => {
  const bounds = [query.swLng, query.swLat, query.neLng, query.neLat];
  const providedBounds = bounds.filter((value) => value !== undefined);

  if (providedBounds.length > 0 && providedBounds.length < bounds.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Viewport bounds require swLng, swLat, neLng, and neLat',
      path: ['swLng'],
    });
  }

  if (query.minIntensity > query.maxIntensity) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'minIntensity cannot be greater than maxIntensity',
      path: ['minIntensity'],
    });
  }

  if (query.from && query.to && query.from > query.to) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'from cannot be later than to',
      path: ['from'],
    });
  }

  if (query.noiseTypes) {
    const requestedTypes = query.noiseTypes.split(',').map((type) => type.trim()).filter(Boolean);
    const invalidType = requestedTypes.find((type) => !NOISE_TYPES.includes(type as never));

    if (requestedTypes.length === 0 || invalidType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'noiseTypes must contain valid comma-separated noise types',
        path: ['noiseTypes'],
      });
    }
  }
});

export const nearbyQuerySchema = z.object({
  lng: longitude,
  lat: latitude,
  radius: z.coerce.number().int().min(100).max(20000).optional().default(3000),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const recentQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const adminReportQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  noiseType: z.enum(NOISE_TYPES).optional(),
  status: z.enum(REPORT_STATUSES).optional(),
  district: z.string().trim().min(1).max(80).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  minIntensity: z.coerce.number().int().min(1).max(10).optional(),
  maxIntensity: z.coerce.number().int().min(1).max(10).optional(),
}).superRefine((query, ctx) => {
  if (
    query.minIntensity !== undefined &&
    query.maxIntensity !== undefined &&
    query.minIntensity > query.maxIntensity
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'minIntensity cannot be greater than maxIntensity',
      path: ['minIntensity'],
    });
  }

  if (query.from && query.to && query.from > query.to) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'from cannot be later than to',
      path: ['from'],
    });
  }
});

export const updateReportStatusSchema = z.object({
  status: z.enum(REPORT_STATUSES),
});

export const bulkUpdateReportStatusSchema = z.object({
  ids: z.array(z.string().refine((value) => /^[a-f\d]{24}$/i.test(value), 'Invalid report ID')).min(1).max(100),
  status: z.enum(REPORT_STATUSES),
});
