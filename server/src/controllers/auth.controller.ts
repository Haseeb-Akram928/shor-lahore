import { Request, Response } from 'express';
import { User } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { signToken } from '../utils/jwt.js';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const sendAuthResponse = (res: Response, statusCode: number, user: InstanceType<typeof User>) => {
  const token = signToken({ userId: user._id.toString(), role: user.role });
  res.cookie('token', token, cookieOptions);

  res.status(statusCode).json({
    success: true,
    data: { user },
  });
};

export const register = catchAsync(async (req: Request, res: Response) => {
  const existing = await User.findOne({ email: req.body.email });
  if (existing) {
    throw ApiError.badRequest('Email is already registered');
  }

  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });

  sendAuthResponse(res, 201, user);
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user || !(await user.comparePassword(req.body.password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.unauthorized('User account is deactivated');
  }

  sendAuthResponse(res, 200, user);
});

export const logout = catchAsync(async (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.status(200).json({
    success: true,
    data: null,
  });
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw ApiError.unauthorized('User no longer exists');
  }

  res.status(200).json({
    success: true,
    data: { user },
  });
});
