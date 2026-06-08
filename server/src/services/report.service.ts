import mongoose from 'mongoose';
import { District } from '../models/District.model.js';
import { NoiseReport } from '../models/NoiseReport.model.js';
import { User } from '../models/User.model.js';
import type { NoiseType } from '../types/index.js';
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

  const match: Record<string, unknown> = {
    intensity: { $gte: minIntensity, $lte: maxIntensity },
    status: 'active',
  };

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
