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
    const io = getIO();
    io.to('dashboard').emit('report-created', report);
    io.emit('map-report-created', report);
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

export const listAdminReports = catchAsync(async (req: Request, res: Response) => {
  const result = await reportService.listAdminReports({
    page: req.query.page as unknown as number,
    limit: req.query.limit as unknown as number,
    noiseType: req.query.noiseType as never,
    status: req.query.status as never,
    district: req.query.district as string | undefined,
    from: req.query.from as unknown as Date | undefined,
    to: req.query.to as unknown as Date | undefined,
    minIntensity: req.query.minIntensity as unknown as number | undefined,
    maxIntensity: req.query.maxIntensity as unknown as number | undefined,
  });

  res.status(200).json({
    success: true,
    data: result.reports,
    pagination: result.pagination,
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
    noiseTypes: req.query.noiseTypes as string | undefined,
    from: req.query.from as unknown as Date | undefined,
    to: req.query.to as unknown as Date | undefined,
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

export const updateReportStatus = catchAsync(async (req: Request, res: Response) => {
  const report = await reportService.updateReportStatus(String(req.params.id), req.body.status);
  res.status(200).json({
    success: true,
    data: { report },
  });
});

export const bulkUpdateReportStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await reportService.bulkUpdateReportStatus(req.body.ids, req.body.status);
  res.status(200).json({
    success: true,
    data: result,
  });
});

export const deleteReport = catchAsync(async (req: Request, res: Response) => {
  await reportService.deleteReport(String(req.params.id));
  res.status(200).json({
    success: true,
    data: {},
  });
});
