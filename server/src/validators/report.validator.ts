import { z } from 'zod';
import { NOISE_TYPES } from '../types/index.js';

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
  occurredAt: z.coerce.date().refine((date) => date <= new Date(), 'Occurrence time cannot be in the future'),
});

export const heatmapQuerySchema = z.object({
  swLng: longitude.optional(),
  swLat: latitude.optional(),
  neLng: longitude.optional(),
  neLat: latitude.optional(),
  hour: z.coerce.number().int().min(0).max(23).optional(),
  minIntensity: z.coerce.number().int().min(1).max(10).optional().default(1),
  maxIntensity: z.coerce.number().int().min(1).max(10).optional().default(10),
  limit: z.coerce.number().int().min(1).max(1000).optional().default(700),
}).superRefine((query, ctx) => {
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
