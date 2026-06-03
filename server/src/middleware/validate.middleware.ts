import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';

type RequestPart = 'body' | 'query' | 'params';

/**
 * Generic Zod validation middleware.
 * Usage: validate(createReportSchema, 'body')
 */
export const validate = (schema: ZodSchema, source: RequestPart = 'body') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed; // Replace with parsed (coerced) values
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        throw ApiError.badRequest(`Validation error: ${messages}`);
      }
      next(error);
    }
  };
};
