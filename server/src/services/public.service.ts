import mongoose from 'mongoose';
import { District, type IDistrictDocument } from '../models/District.model.js';
import { NoiseReport } from '../models/NoiseReport.model.js';
import type { NoiseType } from '../types/index.js';
import { ApiError } from '../utils/ApiError.js';
import { calculateDateRanges } from './analytics.service.js';

const ACTIVE_MATCH = { status: 'active' };

const round1 = (value: number) => Math.round(value * 10) / 10;

const getDateMatch = (period: string) => {
  const { startDate, endDate } = calculateDateRanges(period);
  return { createdAt: { $gte: startDate, $lte: endDate } };
};

const calculateQuietScore = (avgIntensity: number, totalReports: number) => {
  if (totalReports === 0) return 100;
  const volumePenalty = Math.min(10, Math.floor(totalReports / 75));
  return Math.max(0, Math.min(100, Math.round(100 - avgIntensity * 10 - volumePenalty)));
};

const getPeakHour = (hourly: Array<{ hour: number; count: number; avgIntensity: number }>) => {
  const activeHours = hourly.filter((item) => item.count > 0);
  if (activeHours.length === 0) return null;
  return activeHours.reduce((peak, item) => (
    item.avgIntensity > peak.avgIntensity ? item : peak
  )).hour;
};

const getQuietestHour = (hourly: Array<{ hour: number; count: number; avgIntensity: number }>) => {
  const activeHours = hourly.filter((item) => item.count > 0);
  if (activeHours.length === 0) return null;
  return activeHours.reduce((quietest, item) => (
    item.avgIntensity < quietest.avgIntensity ? item : quietest
  )).hour;
};

type HourlySummary = {
  hour: number;
  count: number;
  avgIntensity: number;
};

async function getLahoreAverage(period: string) {
  const result = await NoiseReport.aggregate([
    { $match: { ...ACTIVE_MATCH, ...getDateMatch(period) } },
    { $group: { _id: null, avgIntensity: { $avg: '$intensity' } } },
  ]);

  return result[0]?.avgIntensity ? round1(result[0].avgIntensity) : 0;
}

async function getHourlyStats(period: string, districtName?: string) {
  const match: Record<string, unknown> = {
    ...ACTIVE_MATCH,
    ...getDateMatch(period),
  };
  if (districtName) match.district = districtName;

  const hourly = await NoiseReport.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $hour: '$occurredAt' },
        count: { $sum: 1 },
        avgIntensity: { $avg: '$intensity' },
      },
    },
    {
      $project: {
        _id: 0,
        hour: '$_id',
        count: 1,
        avgIntensity: { $round: ['$avgIntensity', 1] },
      },
    },
    { $sort: { hour: 1 } },
  ]);

  const hourlyMap = new Map<number, HourlySummary>(
    hourly.map((item: HourlySummary) => [item.hour, item])
  );
  return Array.from({ length: 24 }, (_, hour) => {
    return hourlyMap.get(hour) || { hour, count: 0, avgIntensity: 0 };
  });
}

async function getByTypeStats(period: string, districtName?: string) {
  const match: Record<string, unknown> = {
    ...ACTIVE_MATCH,
    ...getDateMatch(period),
  };
  if (districtName) match.district = districtName;

  const total = await NoiseReport.countDocuments(match);
  return NoiseReport.aggregate([
    { $match: match },
    { $group: { _id: '$noiseType', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    {
      $project: {
        _id: 0,
        type: '$_id',
        count: 1,
        percentage: {
          $cond: [
            { $eq: [total, 0] },
            0,
            { $round: [{ $multiply: [{ $divide: ['$count', total] }, 100] }, 1] },
          ],
        },
      },
    },
  ]);
}

async function getAreaSummary(district: IDistrictDocument, period: string) {
  const [summaryResult, hourly, byType] = await Promise.all([
    NoiseReport.aggregate([
      { $match: { ...ACTIVE_MATCH, ...getDateMatch(period), district: district.name } },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          avgIntensity: { $avg: '$intensity' },
        },
      },
    ]),
    getHourlyStats(period, district.name),
    getByTypeStats(period, district.name),
  ]);

  const summary = summaryResult[0];
  const totalReports = summary?.totalReports || 0;
  const avgIntensity = summary?.avgIntensity ? round1(summary.avgIntensity) : 0;
  const topNoiseType = byType[0]?.type || null;

  return {
    district,
    totalReports,
    avgIntensity,
    quietScore: calculateQuietScore(avgIntensity, totalReports),
    topNoiseType,
    peakHour: getPeakHour(hourly),
    quietestHour: getQuietestHour(hourly),
    hourly,
    byType,
  };
}

export async function getPublicInsights(period: string) {
  const match = { ...ACTIVE_MATCH, ...getDateMatch(period) };
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalReports,
    activeToday,
    avgIntensityResult,
    topNoiseTypeResult,
    totalDistricts,
    trends,
    byType,
    byHour,
    byDistrict,
    heatmapGrid,
    recentReports,
  ] = await Promise.all([
    NoiseReport.countDocuments(match),
    NoiseReport.countDocuments({ ...ACTIVE_MATCH, createdAt: { $gte: today } }),
    NoiseReport.aggregate([
      { $match: match },
      { $group: { _id: null, avgIntensity: { $avg: '$intensity' } } },
    ]),
    NoiseReport.aggregate([
      { $match: match },
      { $group: { _id: '$noiseType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),
    District.countDocuments(),
    NoiseReport.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', count: 1 } },
    ]),
    getByTypeStats(period),
    getHourlyStats(period),
    NoiseReport.aggregate([
      { $match: { ...match, district: { $ne: null } } },
      {
        $group: {
          _id: { district: '$district', noiseType: '$noiseType' },
          count: { $sum: 1 },
          totalIntensity: { $sum: '$intensity' },
        },
      },
      { $sort: { '_id.district': 1, count: -1 } },
      {
        $group: {
          _id: '$_id.district',
          totalReports: { $sum: '$count' },
          totalIntensity: { $sum: '$totalIntensity' },
          topNoiseType: { $first: '$_id.noiseType' },
        },
      },
      {
        $project: {
          _id: 0,
          district: '$_id',
          totalReports: 1,
          avgIntensity: { $round: [{ $divide: ['$totalIntensity', '$totalReports'] }, 1] },
          topNoiseType: 1,
        },
      },
      { $sort: { avgIntensity: 1 } },
    ]),
    NoiseReport.aggregate([
      { $match: { ...match, district: { $ne: null } } },
      { $group: { _id: { district: '$district', hour: { $hour: '$occurredAt' } }, avgIntensity: { $avg: '$intensity' } } },
      { $project: { _id: 0, district: '$_id.district', hour: '$_id.hour', avgIntensity: { $round: ['$avgIntensity', 1] } } },
      { $sort: { district: 1, hour: 1 } },
    ]),
    NoiseReport.find(ACTIVE_MATCH)
      .sort({ createdAt: -1 })
      .limit(12)
      .populate('user', 'name avatar'),
  ]);

  const avgIntensity = avgIntensityResult[0]?.avgIntensity ? round1(avgIntensityResult[0].avgIntensity) : 0;

  return {
    overview: {
      totalReports,
      totalReportsChange: 0,
      activeToday,
      avgIntensity,
      avgIntensityChange: 0,
      topNoiseType: topNoiseTypeResult[0]
        ? { type: topNoiseTypeResult[0]._id, count: topNoiseTypeResult[0].count }
        : { type: 'other' as const, count: 0 },
      totalUsers: 0,
      totalDistricts,
    },
    trends,
    byType,
    byHour,
    byDistrict,
    heatmapGrid,
    recentReports,
  };
}

export async function getAreaScorecard(areaId: string, period: string) {
  if (!mongoose.Types.ObjectId.isValid(areaId)) {
    throw ApiError.badRequest('Invalid area ID');
  }

  const district = await District.findById(areaId);
  if (!district) throw ApiError.notFound('Area not found');

  const [summary, lahoreAvgIntensity, recentReports] = await Promise.all([
    getAreaSummary(district, period),
    getLahoreAverage(period),
    NoiseReport.find({ ...ACTIVE_MATCH, district: district.name })
      .sort({ createdAt: -1 })
      .limit(12)
      .populate('user', 'name avatar'),
  ]);

  return {
    ...summary,
    lahoreAvgIntensity,
    comparisonToLahore: round1(summary.avgIntensity - lahoreAvgIntensity),
    recentReports,
  };
}

export async function getAreaComparison(districtIds: string | undefined, period: string) {
  const districts = districtIds
    ? await District.find({ _id: { $in: districtIds.split(',').map((id) => id.trim()) } })
    : await District.find().sort({ totalReports: -1 }).limit(2);

  if (districtIds && districts.length !== districtIds.split(',').filter(Boolean).length) {
    throw ApiError.notFound('One or more areas were not found');
  }

  const areas = await Promise.all(districts.slice(0, 3).map((district) => getAreaSummary(district, period)));
  return { areas };
}

const timeWindowHours: Record<string, number[]> = {
  any: Array.from({ length: 24 }, (_, hour) => hour),
  morning: [5, 6, 7, 8, 9, 10, 11],
  afternoon: [12, 13, 14, 15, 16],
  evening: [17, 18, 19, 20, 21],
  night: [22, 23, 0, 1, 2, 3, 4],
};

export async function getQuietFinder(input: {
  period: string;
  timeWindow: string;
  avoidType?: NoiseType;
  maxIntensity: number;
}) {
  const hours = timeWindowHours[input.timeWindow] || timeWindowHours.any;
  const match = {
    ...ACTIVE_MATCH,
    ...getDateMatch(input.period),
    $expr: { $in: [{ $hour: '$occurredAt' }, hours] },
  };

  const districts = await District.find().sort({ name: 1 });
  const stats = await NoiseReport.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$district',
        totalReports: { $sum: 1 },
        avgIntensity: { $avg: '$intensity' },
        avoidedTypeCount: {
          $sum: { $cond: [{ $eq: ['$noiseType', input.avoidType || '__none__'] }, 1, 0] },
        },
      },
    },
  ]);
  const bestHours = await NoiseReport.aggregate([
    { $match: match },
    { $group: { _id: { district: '$district', hour: { $hour: '$occurredAt' } }, avgIntensity: { $avg: '$intensity' }, count: { $sum: 1 } } },
    { $sort: { '_id.district': 1, avgIntensity: 1 } },
    { $group: { _id: '$_id.district', bestHour: { $first: '$_id.hour' } } },
  ]);

  const statsByDistrict = new Map(stats.map((item: { _id: string }) => [item._id, item]));
  const bestHourByDistrict = new Map(bestHours.map((item: { _id: string; bestHour: number }) => [item._id, item.bestHour]));

  const results = districts.map((district) => {
    const item = statsByDistrict.get(district.name) as { totalReports: number; avgIntensity: number; avoidedTypeCount: number } | undefined;
    const expectedIntensity = item?.avgIntensity ? round1(item.avgIntensity) : 0;
    const quietScore = expectedIntensity > input.maxIntensity
      ? Math.max(0, calculateQuietScore(expectedIntensity, item?.totalReports || 0) - 20)
      : calculateQuietScore(expectedIntensity, item?.totalReports || 0);

    return {
      district,
      quietScore,
      expectedIntensity,
      totalReports: item?.totalReports || 0,
      bestHour: bestHourByDistrict.get(district.name) ?? null,
      avoidedTypeCount: item?.avoidedTypeCount || 0,
    };
  });

  return {
    results: results
      .sort((a, b) => b.quietScore - a.quietScore || a.expectedIntensity - b.expectedIntensity)
      .slice(0, 10),
  };
}
