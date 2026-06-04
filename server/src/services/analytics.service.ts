import { NoiseReport } from '../models/NoiseReport.model.js';
import { User } from '../models/User.model.js';
import { District } from '../models/District.model.js';

/**
 * Calculates start and end dates based on a string period.
 * Returns the startDate, endDate, and the previous period's boundaries.
 */
export const calculateDateRanges = (period: string) => {
  const endDate = new Date();
  const startDate = new Date();

  if (period === '7d') {
    startDate.setDate(endDate.getDate() - 7);
  } else if (period === '30d') {
    startDate.setDate(endDate.getDate() - 30);
  } else if (period === '90d') {
    startDate.setDate(endDate.getDate() - 90);
  } else if (period === '1y') {
    startDate.setFullYear(endDate.getFullYear() - 1);
  } else {
    // all time: epoch start
    startDate.setTime(0);
  }

  const durationMs = endDate.getTime() - startDate.getTime();
  const previousStartDate = new Date(startDate.getTime() - durationMs);
  const previousEndDate = startDate;

  return { startDate, endDate, previousStartDate, previousEndDate };
};

/**
 * Get overview KPIs
 */
export const getOverviewStats = async (period: string) => {
  const { startDate, endDate, previousStartDate, previousEndDate } = calculateDateRanges(period);

  const [
    totalReports,
    activeToday,
    avgIntensityResult,
    topNoiseTypeResult,
    previousPeriodTotal,
    previousAvgIntensityResult,
    totalUsers,
    totalDistricts,
  ] = await Promise.all([
    NoiseReport.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
    NoiseReport.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      status: 'active',
    }),
    NoiseReport.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, avg: { $avg: '$intensity' } } },
    ]),
    NoiseReport.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$noiseType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),
    NoiseReport.countDocuments({
      createdAt: { $gte: previousStartDate, $lt: previousEndDate },
    }),
    NoiseReport.aggregate([
      { $match: { createdAt: { $gte: previousStartDate, $lt: previousEndDate } } },
      { $group: { _id: null, avg: { $avg: '$intensity' } } },
    ]),
    User.countDocuments({ role: 'user' }),
    District.countDocuments(),
  ]);

  const avgIntensity = avgIntensityResult[0]?.avg
    ? Math.round(avgIntensityResult[0].avg * 10) / 10
    : 0;

  const topNoiseType = topNoiseTypeResult[0]
    ? { type: topNoiseTypeResult[0]._id, count: topNoiseTypeResult[0].count }
    : { type: 'other' as const, count: 0 };

  const previousAvgIntensity = previousAvgIntensityResult[0]?.avg || 0;

  // Calculate percentage changes
  const totalReportsChange = previousPeriodTotal === 0
    ? (totalReports > 0 ? 100 : 0)
    : Math.round(((totalReports - previousPeriodTotal) / previousPeriodTotal) * 100 * 10) / 10;

  const avgIntensityChange = previousAvgIntensity === 0
    ? (avgIntensity > 0 ? 100 : 0)
    : Math.round(((avgIntensity - previousAvgIntensity) / previousAvgIntensity) * 100 * 10) / 10;

  return {
    totalReports,
    totalReportsChange,
    activeToday,
    avgIntensity,
    avgIntensityChange,
    topNoiseType,
    totalUsers,
    totalDistricts,
  };
};

/**
 * Get daily trend counts
 */
export const getTrendsStats = async (period: string) => {
  const { startDate, endDate } = calculateDateRanges(period);

  const trends = await NoiseReport.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: '$_id',
        count: 1,
      },
    },
  ]);

  return trends;
};

/**
 * Get noise type breakdown
 */
export const getByTypeStats = async (period: string) => {
  const { startDate, endDate } = calculateDateRanges(period);

  const total = await NoiseReport.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });

  const breakdown = await NoiseReport.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: '$noiseType',
        count: { $sum: 1 },
      },
    },
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

  return breakdown;
};

/**
 * Get statistics per district
 */
export const getByDistrictStats = async (period: string) => {
  const { startDate, endDate } = calculateDateRanges(period);

  const districtsStats = await NoiseReport.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate }, district: { $ne: null } } },
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
    { $sort: { totalReports: -1 } },
  ]);

  return districtsStats;
};

/**
 * Get hourly average intensity and count distribution (24 items)
 */
export const getByHourStats = async (period: string) => {
  const { startDate, endDate } = calculateDateRanges(period);

  const hourly = await NoiseReport.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: { $hour: '$occurredAt' },
        count: { $sum: 1 },
        avgIntensity: { $avg: '$intensity' },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        hour: '$_id',
        count: 1,
        avgIntensity: { $round: ['$avgIntensity', 1] },
      },
    },
  ]);

  const hourlyMap = new Map(hourly.map(h => [h.hour, h]));
  const result = Array.from({ length: 24 }, (_, hour) => {
    return hourlyMap.get(hour) || { hour, count: 0, avgIntensity: 0 };
  });

  return result;
};

/**
 * Get district x hour average intensity matrix
 */
export const getHeatmapGridStats = async (period: string) => {
  const { startDate, endDate } = calculateDateRanges(period);

  const grid = await NoiseReport.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate }, district: { $ne: null } } },
    {
      $group: {
        _id: {
          district: '$district',
          hour: { $hour: '$occurredAt' },
        },
        avgIntensity: { $avg: '$intensity' },
      },
    },
    {
      $project: {
        _id: 0,
        district: '$_id.district',
        hour: '$_id.hour',
        avgIntensity: { $round: ['$avgIntensity', 1] },
      },
    },
    { $sort: { district: 1, hour: 1 } },
  ]);

  return grid;
};

/**
 * Get top 10 reporters (users)
 */
export const getTopReportersStats = async () => {
  const topReporters = await NoiseReport.aggregate([
    { $group: { _id: '$user', reportsCount: { $sum: 1 }, totalUpvotes: { $sum: '$upvotes' } } },
    { $sort: { reportsCount: -1, totalUpvotes: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    { $match: { 'user.role': 'user' } },
    {
      $project: {
        _id: '$user._id',
        name: '$user.name',
        avatar: '$user.avatar',
        reportsCount: 1,
        reputation: '$user.reputation',
        totalUpvotes: 1,
      },
    },
  ]);

  return topReporters;
};

/**
 * Get latest 20 noise reports
 */
export const getRecentReportsStats = async () => {
  const recent = await NoiseReport.find()
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('user', 'name avatar');

  return recent;
};
