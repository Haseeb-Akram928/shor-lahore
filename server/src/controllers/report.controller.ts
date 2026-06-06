import { Request, Response } from 'express';
import { getIO } from '../config/socket.js';
import { catchAsync } from '../utils/catchAsync.js';
import * as reportService from '../services/report.service.js';

export const createReport = catchAsync(async (req: Request, res: Response) => {
  const report = await reportService.createReport({
    userId: req.user!._id,
    lng: req.body.lng,
    lat: req.body.lat,
    noiseType: req.body.noiseType,
    intensity: req.body.intensity,
    description: req.body.description,
    district: req.body.district,
    tags: req.body.tags,
    occurredAt: req.body.occurredAt,
  });

  try {
    getIO().to('dashboard').emit('report-created', report);
  } catch {
    // Socket.io is not initialized during isolated tests.
  }

  res.status(201).json({
    success: true,
    data: { report },
  });
});

export const getRecentReports = catchAsync(async (req: Request, res: Response) => {
  const reports = await reportService.getRecentReports(req.query.limit as unknown as number);
  res.status(200).json({
    success: true,
    data: reports,
  });
});

export const getNearbyReports = catchAsync(async (req: Request, res: Response) => {
  const reports = await reportService.getNearbyReports(
    req.query.lng as unknown as number,
    req.query.lat as unknown as number,
    req.query.radius as unknown as number,
    req.query.limit as unknown as number
  );

  res.status(200).json({
    success: true,
    data: reports,
  });
});

export const getHeatmapReports = catchAsync(async (req: Request, res: Response) => {
  const reports = await reportService.getHeatmapReports({
    swLng: req.query.swLng as unknown as number | undefined,
    swLat: req.query.swLat as unknown as number | undefined,
    neLng: req.query.neLng as unknown as number | undefined,
    neLat: req.query.neLat as unknown as number | undefined,
    hour: req.query.hour as unknown as number | undefined,
    minIntensity: req.query.minIntensity as unknown as number,
    maxIntensity: req.query.maxIntensity as unknown as number,
    limit: req.query.limit as unknown as number,
  });

  res.status(200).json({
    success: true,
    data: reports,
  });
});

export const upvoteReport = catchAsync(async (req: Request, res: Response) => {
  const report = await reportService.upvoteReport(String(req.params.id), req.user!._id);
  res.status(200).json({
    success: true,
    data: { report },
  });
});
