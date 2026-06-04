import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { User } from '../../models/User.model.js';
import { signToken } from '../../utils/jwt.js';
import { runSeed } from '../../scripts/seed.js';

describe('Analytics Integration Tests', () => {
  let adminToken: string;
  let userToken: string;

  beforeEach(async () => {
    // 1. Seed database with users, districts, and reports
    await runSeed(false);

    // 2. Fetch seeded users to sign tokens
    const admin = await User.findOne({ role: 'admin' });
    const user = await User.findOne({ role: 'user' });

    if (!admin || !user) {
      throw new Error('Seed failed to create users');
    }

    adminToken = signToken({ userId: admin._id.toString(), role: 'admin' });
    userToken = signToken({ userId: user._id.toString(), role: 'user' });
  });

  describe('Authorization checks', () => {
    it('should fail with 401 for unauthorized requests', async () => {
      const response = await request(app).get('/api/analytics/overview');
      expect(response.status).toBe(401);
    });

    it('should fail with 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/analytics/overview')
        .set('Cookie', [`token=${userToken}`]);
      expect(response.status).toBe(403);
    });

    it('should succeed with 200 for admin users', async () => {
      const response = await request(app)
        .get('/api/analytics/overview')
        .set('Cookie', [`token=${adminToken}`]);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/analytics/overview', () => {
    it('should return correct KPI properties', async () => {
      const response = await request(app)
        .get('/api/analytics/overview')
        .set('Cookie', [`token=${adminToken}`]);

      expect(response.status).toBe(200);
      const data = response.body.data;
      expect(data).toHaveProperty('totalReports');
      expect(data).toHaveProperty('activeToday');
      expect(data).toHaveProperty('avgIntensity');
      expect(data).toHaveProperty('topNoiseType');
      expect(data.totalReports).toBeGreaterThan(0);
      expect(data.totalUsers).toBe(25);
      expect(data.totalDistricts).toBe(10);
    });

    it('should reject invalid period values', async () => {
      const response = await request(app)
        .get('/api/analytics/overview?period=bad')
        .set('Cookie', [`token=${adminToken}`]);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid period');
    });
  });

  describe('GET /api/analytics/trends', () => {
    it('should return an array of trend data points', async () => {
      const response = await request(app)
        .get('/api/analytics/trends')
        .set('Cookie', [`token=${adminToken}`]);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('date');
      expect(response.body.data[0]).toHaveProperty('count');
    });
  });

  describe('GET /api/analytics/by-type', () => {
    it('should return noise type count and percentage breakdowns', async () => {
      const response = await request(app)
        .get('/api/analytics/by-type')
        .set('Cookie', [`token=${adminToken}`]);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('type');
      expect(response.body.data[0]).toHaveProperty('percentage');
    });
  });

  describe('GET /api/analytics/by-district', () => {
    it('should return stats and top noise type per district', async () => {
      const response = await request(app)
        .get('/api/analytics/by-district')
        .set('Cookie', [`token=${adminToken}`]);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('district');
      expect(response.body.data[0]).toHaveProperty('totalReports');
      expect(response.body.data[0]).toHaveProperty('avgIntensity');
      expect(response.body.data[0]).toHaveProperty('topNoiseType');
    });
  });

  describe('GET /api/analytics/by-hour', () => {
    it('should return exactly 24 hourly distribution slots', async () => {
      const response = await request(app)
        .get('/api/analytics/by-hour')
        .set('Cookie', [`token=${adminToken}`]);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(24);
      expect(response.body.data[0]).toHaveProperty('hour');
      expect(response.body.data[0]).toHaveProperty('count');
      expect(response.body.data[0]).toHaveProperty('avgIntensity');
    });
  });

  describe('GET /api/analytics/heatmap-grid', () => {
    it('should return district x hour average intensity matrix cells', async () => {
      const response = await request(app)
        .get('/api/analytics/heatmap-grid')
        .set('Cookie', [`token=${adminToken}`]);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('district');
      expect(response.body.data[0]).toHaveProperty('hour');
      expect(response.body.data[0]).toHaveProperty('avgIntensity');
    });
  });

  describe('GET /api/analytics/top-reporters', () => {
    it('should return a leaderboard of the top 10 most active users', async () => {
      const response = await request(app)
        .get('/api/analytics/top-reporters')
        .set('Cookie', [`token=${adminToken}`]);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(10);
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('reportsCount');
      expect(response.body.data[0]).toHaveProperty('reputation');
    });
  });

  describe('GET /api/analytics/recent', () => {
    it('should return the 20 most recent reports populated with user names', async () => {
      const response = await request(app)
        .get('/api/analytics/recent')
        .set('Cookie', [`token=${adminToken}`]);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(20);
      expect(response.body.data[0]).toHaveProperty('user');
      expect(response.body.data[0].user).toHaveProperty('name');
    });
  });
});
