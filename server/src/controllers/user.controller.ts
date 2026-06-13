import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import * as userService from '../services/user.service.js';

export const listAdminUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.listAdminUsers({
    page: req.query.page as unknown as number,
    limit: req.query.limit as unknown as number,
    search: req.query.search as string | undefined,
    role: req.query.role as never,
    isActive: req.query.isActive as unknown as boolean | undefined,
  });

  res.status(200).json({
    success: true,
    data: result.users,
    pagination: result.pagination,
  });
});

export const updateAdminUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.updateAdminUser(String(req.params.id), req.body, req.user!._id);

  res.status(200).json({
    success: true,
    data: { user },
  });
});

export const getMyImpact = catchAsync(async (req: Request, res: Response) => {
  const data = await userService.getMyImpact(req.user!._id);

  res.status(200).json({
    success: true,
    data,
  });
});
