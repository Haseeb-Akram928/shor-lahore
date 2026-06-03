import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signToken = (payload: { id: string; role: string }): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, env.JWT_SECRET);
};
