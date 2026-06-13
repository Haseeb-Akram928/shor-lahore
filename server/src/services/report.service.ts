import mongoose from 'mongoose';
import { District } from '../models/District.model.js';
import { NoiseReport } from '../models/NoiseReport.model.js';
import { User } from '../models/User.model.js';
import type { NoiseType, ReportStatus } from '../types/index.js';
import { ApiError } from '../utils/ApiError.js';

interface CreateReportInput {
  userId: string;
  lng: number;
  lat: number;
  noiseType: NoiseType;
  intensity: number;
  description?: string;
  district?: string;
  tags?: string[];
  occurredAt: Date;
}

export async function findDistrictForPoint(lng: number, lat: number) {
  return District.findOne({
    boundary: {
      $geoIntersects: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      },
    },
  });
}

export async function createReport(input: CreateReportInput) {
  const district = input.district || (await findDistrictForPoint(input.lng, input.lat))?.name;

  const report = await NoiseReport.create({
    user: input.userId,
    location: {
      type: 'Point',
      coordinates: [input.lng, input.lat],
    },
    noiseType: input.noiseType,
    intensity: input.intensity,
    description: input.description,
    district,
    tags: input.tags || [],
    occurredAt: input.occurredAt,
  });

  await User.findByIdAndUpdate(input.userId, {
    $inc: { reportsCount: 1, reputation: 2 },
  });

  if (district) {
    const districtStats = await NoiseReport.aggregate([
      { $match: { district } },
      { $group: { _id: null, totalReports: { $sum: 1 }, avgNoiseLevel: { $avg: '$intensity' } } },
    ]);

    const stats = districtStats[0];
    if (stats) {
      await District.updateOne(
        { name: district },
        {
          totalReports: stats.totalReports,
          avgNoiseLevel: Math.round(stats.avgNoiseLevel * 10) / 10,
        }
      );
    }
  }

  return report.populate('user', 'name avatar');
}

export async function getRecentReports(limit: number) {
  return NoiseReport.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'name avatar');
}

interface AdminReportListInput {
  page: number;
  limit: number;
  noiseType?: NoiseType;
  status?: ReportStatus;
  district?: string;
  from?: Date;
  to?: Date;
  minIntensity?: number;
  maxIntensity?: number;
}

export async function listAdminReports(input: AdminReportListInput) {
  const filter: Record<string, unknown> = {};

  if (input.noiseType) filter.noiseType = input.noiseType;
  if (input.status) filter.status = input.status;
  if (input.district) filter.district = input.district;
  if (input.from || input.to) {
    filter.occurredAt = {
      ...(input.from && { $gte: input.from }),
      ...(input.to && { $lte: input.to }),
    };
  }
  if (input.minIntensity !== undefined || input.maxIntensity !== undefined) {
    filter.intensity = {
      ...(input.minIntensity !== undefined && { $gte: input.minIntensity }),
      ...(input.maxIntensity !== undefined && { $lte: input.maxIntensity }),
    };
  }

  const skip = (input.page - 1) * input.limit;
  const [reports, total] = await Promise.all([
    NoiseReport.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(input.limit)
      .populate('user', 'name email avatar'),
    NoiseReport.countDocuments(filter),
  ]);

  return {
    reports,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      pages: Math.ceil(total / input.limit),
    },
  };
}

export async function getNearbyReports(lng: number, lat: number, radius: number, limit: number) {
  return NoiseReport.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: 'distanceMeters',
        maxDistance: radius,
        spherical: true,
      },
    },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    { $project: { 'user.password': 0, 'user.__v': 0, upvotedBy: 0, __v: 0 } },
  ]);
}

interface HeatmapInput {
  swLng?: number | string;
  swLat?: number | string;
  neLng?: number | string;
  neLat?: number | string;
  hour?: number | string;
  noiseTypes?: string;
  from?: Date | string;
  to?: Date | string;
  minIntensity?: number | string;
  maxIntensity?: number | string;
  limit?: number | string;
}

const toNumber = (value: number | string | undefined, fallback: number) => {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export async function getHeatmapReports(input: HeatmapInput) {
  const swLng = input.swLng === undefined ? undefined : toNumber(input.swLng, 0);
  const swLat = input.swLat === undefined ? undefined : toNumber(input.swLat, 0);
  const neLng = input.neLng === undefined ? undefined : toNumber(input.neLng, 0);
  const neLat = input.neLat === undefined ? undefined : toNumber(input.neLat, 0);
  const hour = input.hour === undefined ? undefined : toNumber(input.hour, 0);
  const minIntensity = toNumber(input.minIntensity, 1);
  const maxIntensity = toNumber(input.maxIntensity, 10);
  const limit = toNumber(input.limit, 700);
  const noiseTypes = input.noiseTypes
    ?.split(',')
    .map((type) => type.trim())
    .filter(Boolean) as NoiseType[] | undefined;
  const from = input.from ? new Date(input.from) : undefined;
  const to = input.to ? new Date(input.to) : undefined;

  const match: Record<string, unknown> = {
    intensity: { $gte: minIntensity, $lte: maxIntensity },
    status: 'active',
  };

  if (noiseTypes?.length) {
    match.noiseType = { $in: noiseTypes };
  }

  if (from || to) {
    match.occurredAt = {
      ...(from && { $gte: from }),
      ...(to && { $lte: to }),
    };
  }

  if (
    swLng !== undefined &&
    swLat !== undefined &&
    neLng !== undefined &&
    neLat !== undefined
  ) {
    match.location = {
      $geoWithin: {
        $box: [
          [swLng, swLat],
          [neLng, neLat],
        ],
      },
    };
  }

  const pipeline: mongoose.PipelineStage[] = [
    { $match: match },
  ];

  if (hour !== undefined) {
    pipeline.push({
      $match: {
        $expr: { $eq: [{ $hour: '$occurredAt' }, hour] },
      },
    });
  }

  pipeline.push(
    { $sort: { createdAt: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        coordinates: '$location.coordinates',
        intensity: 1,
        noiseType: 1,
        district: 1,
        occurredAt: 1,
        createdAt: 1,
        description: 1,
        upvotes: 1,
        tags: 1,
        user: {
          _id: '$user._id',
          name: '$user.name',
          avatar: '$user.avatar',
        },
      },
    }
  );

  return NoiseReport.aggregate(pipeline);
}

export async function upvoteReport(reportId: string, userId: string) {
  const report = await NoiseReport.findById(reportId).select('+upvotedBy');
  if (!report) {
    throw ApiError.notFound('Report not found');
  }

  const alreadyUpvoted = report.upvotedBy.some((id: mongoose.Types.ObjectId) => id.toString() === userId);
  if (alreadyUpvoted) {
    throw ApiError.badRequest('Report already upvoted by this user');
  }

  report.upvotedBy.push(new mongoose.Types.ObjectId(userId));
  report.upvotes += 1;
  await report.save();

  return report;
}

export async function updateReportStatus(reportId: string, status: ReportStatus) {
  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    throw ApiError.badRequest('Invalid report ID');
  }

  const report = await NoiseReport.findByIdAndUpdate(
    reportId,
    { status },
    { new: true, runValidators: true }
  ).populate('user', 'name email avatar');

  if (!report) {
    throw ApiError.notFound('Report not found');
  }

  return report;
}

export async function bulkUpdateReportStatus(reportIds: string[], status: ReportStatus) {
  const invalidId = reportIds.find((reportId) => !mongoose.Types.ObjectId.isValid(reportId));
  if (invalidId) {
    throw ApiError.badRequest('Invalid report ID');
  }

  const uniqueIds = Array.from(new Set(reportIds));
  const result = await NoiseReport.updateMany(
    { _id: { $in: uniqueIds } },
    { status },
    { runValidators: true }
  );

  const reports = await NoiseReport.find({ _id: { $in: uniqueIds } })
    .sort({ createdAt: -1 })
    .populate('user', 'name email avatar');

  return {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    reports,
  };
}

export async function deleteReport(reportId: string) {
  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    throw ApiError.badRequest('Invalid report ID');
  }

  const report = await NoiseReport.findByIdAndDelete(reportId);
  if (!report) {
    throw ApiError.notFound('Report not found');
  }
}
