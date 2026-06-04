import { Request, Response } from 'express';
import { District } from '../models/District.model.js';
import { NoiseReport } from '../models/NoiseReport.model.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';

const isValidCoordinate = (coordinate: unknown): coordinate is [number, number] => {
  return (
    Array.isArray(coordinate) &&
    coordinate.length === 2 &&
    typeof coordinate[0] === 'number' &&
    typeof coordinate[1] === 'number' &&
    Number.isFinite(coordinate[0]) &&
    Number.isFinite(coordinate[1]) &&
    coordinate[0] >= -180 &&
    coordinate[0] <= 180 &&
    coordinate[1] >= -90 &&
    coordinate[1] <= 90
  );
};

const isClosedRing = (ring: [number, number][]) => {
  const first = ring[0];
  const last = ring[ring.length - 1];
  return first[0] === last[0] && first[1] === last[1];
};

const escapeRegExp = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const validatePolygonBoundary = (boundary: unknown) => {
  if (
    !boundary ||
    typeof boundary !== 'object' ||
    (boundary as { type?: unknown }).type !== 'Polygon' ||
    !Array.isArray((boundary as { coordinates?: unknown }).coordinates)
  ) {
    throw ApiError.badRequest('District boundary must be a GeoJSON Polygon');
  }

  const coordinates = (boundary as { coordinates: unknown[] }).coordinates;
  if (coordinates.length === 0) {
    throw ApiError.badRequest('District boundary must include at least one linear ring');
  }

  for (const ring of coordinates) {
    if (!Array.isArray(ring) || ring.length < 4 || !ring.every(isValidCoordinate)) {
      throw ApiError.badRequest('Each polygon ring must contain at least four valid coordinates');
    }

    if (!isClosedRing(ring)) {
      throw ApiError.badRequest('Polygon rings must be closed');
    }
  }
};

const getPositiveIntegerQuery = (value: unknown, fallback: number, max: number) => {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw ApiError.badRequest('Pagination values must be positive integers');
  }
  return Math.min(parsed, max);
};

/**
 * List all districts
 */
export const listDistricts = catchAsync(async (_req: Request, res: Response) => {
  const districts = await District.find().sort({ name: 1 });
  res.status(200).json({
    success: true,
    data: districts,
  });
});

/**
 * Create a new district (Admin only)
 */
export const createDistrict = catchAsync(async (req: Request, res: Response) => {
  const { name, city, boundary } = req.body;

  if (!name || !boundary) {
    throw ApiError.badRequest('District name and boundary polygon are required');
  }

  validatePolygonBoundary(boundary);

  // Check if district already exists
  const existing = await District.findOne({ name: new RegExp(`^${escapeRegExp(name)}$`, 'i') });
  if (existing) {
    throw ApiError.conflict(`District '${name}' already exists`);
  }

  const district = await District.create({
    name,
    city: city || 'Lahore',
    boundary,
  });

  res.status(201).json({
    success: true,
    data: district,
  });
});

/**
 * Get reports within a district's polygon boundary (paginated)
 */
export const getDistrictReports = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const district = await District.findById(id);
  if (!district) {
    throw ApiError.notFound('District not found');
  }

  const page = getPositiveIntegerQuery(req.query.page, 1, 10000);
  const limit = getPositiveIntegerQuery(req.query.limit, 20, 100);
  const skip = (page - 1) * limit;

  const filter = {
    location: {
      $geoWithin: {
        $geometry: district.boundary,
      },
    },
  };

  const [reports, total] = await Promise.all([
    NoiseReport.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email avatar'),
    NoiseReport.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: reports,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});
