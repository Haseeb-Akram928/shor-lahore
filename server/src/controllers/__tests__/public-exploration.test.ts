import { describe, it, expect } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import { District } from '../../models/District.model.js';
import { User } from '../../models/User.model.js';
import { NoiseReport } from '../../models/NoiseReport.model.js';
import { runSeed } from '../../scripts/seed.js';
import { signToken } from '../../utils/jwt.js';

describe('Public Exploration Integration Tests', () => {
  describe('GET /api/public/insights', () => {
    it('should return empty public insight data without reports', async () => {
      const response = await request(app).get('/api/public/insights');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.overview.totalReports).toBe(0);
      expect(response.body.data.byHour).toHaveLength(24);
      expect(response.body.data.recentReports).toHaveLength(0);
    });

    it('should return public city analytics from active reports', async () => {
      await runSeed(false);

      const response = await request(app).get('/api/public/insights?period=90d');

      expect(response.status).toBe(200);
      expect(response.body.data.overview.totalReports).toBeGreaterThan(0);
      expect(response.body.data.byType.length).toBeGreaterThan(0);
      expect(response.body.data.byDistrict.length).toBeGreaterThan(0);
      expect(response.body.data.heatmapGrid.length).toBeGreaterThan(0);
      expect(response.body.data.recentReports[0].user).not.toHaveProperty('email');
    });

    it('should reject invalid public insight periods', async () => {
      const response = await request(app).get('/api/public/insights?period=bad');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Validation error');
    });
  });

  describe('GET /api/public/areas/:id/scorecard', () => {
    it('should return a public area scorecard', async () => {
      await runSeed(false);
      const district = await District.findOne({ name: 'Gulberg' });
      if (!district) throw new Error('Seed failed to create Gulberg');

      const response = await request(app).get(`/api/public/areas/${district._id}/scorecard?period=90d`);

      expect(response.status).toBe(200);
      expect(response.body.data.district.name).toBe('Gulberg');
      expect(response.body.data.quietScore).toBeGreaterThanOrEqual(0);
      expect(response.body.data.quietScore).toBeLessThanOrEqual(100);
      expect(response.body.data.hourly).toHaveLength(24);
      expect(response.body.data.byType.length).toBeGreaterThan(0);
      expect(response.body.data.recentReports[0].user).not.toHaveProperty('email');
    });

    it('should reject invalid and missing area IDs', async () => {
      const invalid = await request(app).get('/api/public/areas/not-an-id/scorecard');
      expect(invalid.status).toBe(400);

      const missingId = new mongoose.Types.ObjectId().toString();
      const missing = await request(app).get(`/api/public/areas/${missingId}/scorecard`);
      expect(missing.status).toBe(404);
    });
  });

  describe('GET /api/public/compare', () => {
    it('should compare selected areas', async () => {
      await runSeed(false);
      const districts = await District.find().limit(2);
      const ids = districts.map((district) => district._id.toString()).join(',');

      const response = await request(app).get(`/api/public/compare?districtIds=${ids}&period=90d`);

      expect(response.status).toBe(200);
      expect(response.body.data.areas).toHaveLength(2);
      expect(response.body.data.areas[0]).toHaveProperty('quietScore');
      expect(response.body.data.areas[0].hourly).toHaveLength(24);
    });

    it('should default to two highest-report areas when no IDs are provided', async () => {
      await runSeed(false);

      const response = await request(app).get('/api/public/compare');

      expect(response.status).toBe(200);
      expect(response.body.data.areas).toHaveLength(2);
    });

    it('should reject too many compare IDs', async () => {
      const ids = Array.from({ length: 4 }, () => new mongoose.Types.ObjectId().toString()).join(',');

      const response = await request(app).get(`/api/public/compare?districtIds=${ids}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Compare requires 2 or 3 area IDs');
    });
  });

  describe('GET /api/public/quiet-finder', () => {
    it('should rank quiet areas by selected filters', async () => {
      await runSeed(false);

      const response = await request(app).get('/api/public/quiet-finder?timeWindow=night&avoidType=horns&maxIntensity=6&period=90d');

      expect(response.status).toBe(200);
      expect(response.body.data.results.length).toBeGreaterThan(0);
      expect(response.body.data.results[0]).toHaveProperty('quietScore');
      expect(response.body.data.results[0]).toHaveProperty('bestHour');
    });

    it('should reject invalid quiet finder filters', async () => {
      const invalidType = await request(app).get('/api/public/quiet-finder?avoidType=invalid');
      expect(invalidType.status).toBe(400);

      const invalidIntensity = await request(app).get('/api/public/quiet-finder?maxIntensity=11');
      expect(invalidIntensity.status).toBe(400);
    });
  });

  describe('Public/admin access boundaries', () => {
    it('should keep admin analytics protected while public insights stay open', async () => {
      const publicResponse = await request(app).get('/api/public/insights');
      expect(publicResponse.status).toBe(200);

      const adminResponse = await request(app).get('/api/analytics/overview');
      expect(adminResponse.status).toBe(401);
    });
  });

  describe('GET /api/users/me/impact', () => {
    it('should reject unauthenticated users', async () => {
      const response = await request(app).get('/api/users/me/impact');
      expect(response.status).toBe(401);
    });

    it('should return only the current user impact summary', async () => {
      const user = await User.create({
        name: 'Impact User',
        email: 'impact@example.com',
        password: 'password123',
        role: 'user',
      });
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
        role: 'user',
      });

      await NoiseReport.create([
        {
          user: user._id,
          location: { type: 'Point', coordinates: [74.3478, 31.5378] },
          noiseType: 'traffic',
          intensity: 7,
          district: 'Gulberg',
          upvotes: 3,
          occurredAt: new Date(Date.now() - 60 * 60 * 1000),
        },
        {
          user: otherUser._id,
          location: { type: 'Point', coordinates: [74.3478, 31.5378] },
          noiseType: 'music',
          intensity: 4,
          district: 'Gulberg',
          upvotes: 9,
          occurredAt: new Date(Date.now() - 60 * 60 * 1000),
        },
      ]);

      const token = signToken({ userId: user._id.toString(), role: 'user' });
      const response = await request(app)
        .get('/api/users/me/impact')
        .set('Cookie', [`token=${token}`]);

      expect(response.status).toBe(200);
      expect(response.body.data.user.email).toBe('impact@example.com');
      expect(response.body.data.totalReports).toBe(1);
      expect(response.body.data.totalUpvotes).toBe(3);
      expect(response.body.data.areasContributed).toBe(1);
      expect(response.body.data.recentReports).toHaveLength(1);
      expect(response.body.data.recentReports[0].user).not.toHaveProperty('email');
    });
  });
});
