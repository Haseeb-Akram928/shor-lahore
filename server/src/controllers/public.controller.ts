import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import * as publicService from '../services/public.service.js';

export const getInsights = catchAsync(async (req: Request, res: Response) => {
  const data = await publicService.getPublicInsights(req.query.period as string);
  res.status(200).json({ success: true, data });
});

export const getAreaScorecard = catchAsync(async (req: Request, res: Response) => {
  const data = await publicService.getAreaScorecard(String(req.params.id), req.query.period as string);
  res.status(200).json({ success: true, data });
});

export const getCompare = catchAsync(async (req: Request, res: Response) => {
  const data = await publicService.getAreaComparison(req.query.districtIds as string | undefined, req.query.period as string);
  res.status(200).json({ success: true, data });
});

export const getQuietFinder = catchAsync(async (req: Request, res: Response) => {
  const data = await publicService.getQuietFinder({
    period: req.query.period as string,
    timeWindow: req.query.timeWindow as string,
    avoidType: req.query.avoidType as never,
    maxIntensity: req.query.maxIntensity as unknown as number,
  });
  res.status(200).json({ success: true, data });
});
