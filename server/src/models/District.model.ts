import mongoose, { Schema, Document, Model } from 'mongoose';
import { IDistrict } from '../types/index.js';

export interface IDistrictDocument extends Omit<IDistrict, '_id'>, Document {}

const districtSchema = new Schema<IDistrictDocument>(
  {
    name: {
      type: String,
      required: [true, 'District name is required'],
      unique: true,
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      default: 'Lahore',
      trim: true,
    },
    boundary: {
      type: {
        type: String,
        enum: ['Polygon'],
        required: true,
      },
      coordinates: {
        type: [[[Number]]], // Array of linear rings, each an array of [lng, lat] pairs
        required: true,
      },
    },
    avgNoiseLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    totalReports: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial index on polygon boundary enables point-in-polygon queries.
districtSchema.index({ boundary: '2dsphere' });

export const District: Model<IDistrictDocument> = mongoose.model<IDistrictDocument>(
  'District',
  districtSchema
);
