import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiError } from '../utils/ApiError.js';
import * as analyticsService from '../services/analytics.service.js';

const getPeriodQuery = (req: Request): string => {
  const period = (req.query.period as string) || '30d';
  const allowed = ['7d', '30d', '90d', '1y', 'all'];
  if (!allowed.includes(period)) {
    throw ApiError.badRequest('Invalid period. Allowed values: 7d, 30d, 90d, 1y, all');
  }
  return period;
};

/**
 * GET /overview - KPI overview cards
 */
export const getOverview = catchAsync(async (req: Request, res: Response) => {
  const period = getPeriodQuery(req);
  const data = await analyticsService.getOverviewStats(period);
  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * GET /trends - Reports count trend over time
 */
export const getTrends = catchAsync(async (req: Request, res: Response) => {
  const period = getPeriodQuery(req);
  const data = await analyticsService.getTrendsStats(period);
  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * GET /by-type - Report count and percentage breakdown by noise type
 */
export const getByType = catchAsync(async (req: Request, res: Response) => {
  const period = getPeriodQuery(req);
  const data = await analyticsService.getByTypeStats(period);
  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * GET /by-district - Stats (reports count and avg intensity) per district
 */
export const getByDistrict = catchAsync(async (req: Request, res: Response) => {
  const period = getPeriodQuery(req);
  const data = await analyticsService.getByDistrictStats(period);
  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * GET /by-hour - 24-hour noise distribution
 */
export const getByHour = catchAsync(async (req: Request, res: Response) => {
  const period = getPeriodQuery(req);
  const data = await analyticsService.getByHourStats(period);
  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * GET /heatmap-grid - District x Hour matrix
 */
export const getHeatmapGrid = catchAsync(async (req: Request, res: Response) => {
  const period = getPeriodQuery(req);
  const data = await analyticsService.getHeatmapGridStats(period);
  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * GET /top-reporters - Active users leaderboard
 */
export const getTopReporters = catchAsync(async (_req: Request, res: Response) => {
  const data = await analyticsService.getTopReportersStats();
  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * GET /recent - Latest 20 reports
 */
export const getRecentReports = catchAsync(async (_req: Request, res: Response) => {
  const data = await analyticsService.getRecentReportsStats();
  res.status(200).json({
    success: true,
    data,
  });
});
