import { z } from 'zod';
import { USER_ROLES } from '../types/index.js';

export const adminUserQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().max(80).optional(),
  role: z.enum(USER_ROLES).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const updateUserSchema = z.object({
  role: z.enum(USER_ROLES).optional(),
  isActive: z.boolean().optional(),
}).refine((body) => body.role !== undefined || body.isActive !== undefined, {
  message: 'role or isActive is required',
});
