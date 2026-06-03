import mongoose, { Schema, Document, Model } from 'mongoose';
import { INoiseReport, NOISE_TYPES, REPORT_STATUSES } from '../types/index.js';

export interface INoiseReportDocument extends Omit<INoiseReport, '_id' | 'user'>, Document {
  user: mongoose.Types.ObjectId;
  upvotedBy: mongoose.Types.ObjectId[];
}

const noiseReportSchema = new Schema<INoiseReportDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Report must belong to a user'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Location coordinates are required'],
        validate: {
          validator: function (coords: number[]) {
            return (
              coords.length === 2 &&
              coords[0] >= -180 && coords[0] <= 180 && // longitude
              coords[1] >= -90 && coords[1] <= 90      // latitude
            );
          },
          message: 'Invalid coordinates. Must be [longitude, latitude] with valid ranges.',
        },
      },
    },
    noiseType: {
      type: String,
      required: [true, 'Noise type is required'],
      enum: {
        values: NOISE_TYPES,
        message: 'Invalid noise type: {VALUE}',
      },
    },
    intensity: {
      type: Number,
      required: [true, 'Intensity level is required'],
      min: [1, 'Intensity must be at least 1'],
      max: [10, 'Intensity cannot exceed 10'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      trim: true,
    },
    district: {
      type: String,
      default: undefined,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags: string[]) {
          return tags.length <= 10;
        },
        message: 'Cannot have more than 10 tags',
      },
    },
    mediaUrl: {
      type: String,
      default: undefined,
    },
    status: {
      type: String,
      enum: REPORT_STATUSES,
      default: 'active',
    },
    occurredAt: {
      type: Date,
      required: [true, 'Occurrence time is required'],
      validate: {
        validator: function (date: Date) {
          return date <= new Date(); // Can't report future noise
        },
        message: 'Occurrence time cannot be in the future',
      },
    },
    upvotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    upvotedBy: {
      type: [Schema.Types.ObjectId],
      default: [],
      select: false, // Don't return this array by default
    },
  },
  {
    timestamps: true, // createdAt and updatedAt
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ============ INDEXES ============
noiseReportSchema.index({ location: '2dsphere' });
noiseReportSchema.index({ createdAt: -1 });
noiseReportSchema.index({ noiseType: 1, createdAt: -1 });
noiseReportSchema.index({ district: 1, createdAt: -1 });
noiseReportSchema.index({ occurredAt: 1 });
noiseReportSchema.index({ status: 1 });
noiseReportSchema.index({ 'location.coordinates': 1, occurredAt: 1, intensity: 1 });

export const NoiseReport: Model<INoiseReportDocument> = mongoose.model<INoiseReportDocument>(
  'NoiseReport',
  noiseReportSchema
);
