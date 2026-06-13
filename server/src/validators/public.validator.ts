import { z } from 'zod';
import { NOISE_TYPES } from '../types/index.js';

export const analyticsPeriodSchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y', 'all']).optional().default('30d'),
});

export const areaScorecardParamsSchema = z.object({
  id: z.string().refine((value) => /^[a-f\d]{24}$/i.test(value), 'Invalid area ID'),
});

export const compareQuerySchema = analyticsPeriodSchema.extend({
  districtIds: z.string().trim().optional(),
}).superRefine((query, ctx) => {
  if (!query.districtIds) return;

  const ids = query.districtIds.split(',').map((id) => id.trim()).filter(Boolean);
  if (ids.length < 2 || ids.length > 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Compare requires 2 or 3 area IDs',
      path: ['districtIds'],
    });
    return;
  }

  const invalidId = ids.find((id) => !/^[a-f\d]{24}$/i.test(id));
  if (invalidId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'districtIds must contain valid area IDs',
      path: ['districtIds'],
    });
  }
});

export const quietFinderQuerySchema = analyticsPeriodSchema.extend({
  timeWindow: z.enum(['any', 'morning', 'afternoon', 'evening', 'night']).optional().default('any'),
  avoidType: z.enum(NOISE_TYPES).optional(),
  maxIntensity: z.coerce.number().int().min(1).max(10).optional().default(10),
});
