import { describe, it, expect } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import { User } from '../../models/User.model.js';
import { District } from '../../models/District.model.js';
import { NoiseReport } from '../../models/NoiseReport.model.js';
import { signToken } from '../../utils/jwt.js';

describe('District Integration Tests', () => {
  const createTestUser = async (role: 'user' | 'admin', name = 'Test User', email = 'test@example.com') => {
    return User.create({
      name,
      email,
      password: 'password123',
      role,
    });
  };

  const gulbergBoundary = {
    type: 'Polygon' as const,
    coordinates: [[
      [74.3350, 31.5280],
      [74.3600, 31.5280],
      [74.3600, 31.5480],
      [74.3350, 31.5480],
      [74.3350, 31.5280]
    ]] as [number, number][][]
  };

  describe('GET /api/districts', () => {
    it('should return an empty list when no districts exist', async () => {
      const response = await request(app).get('/api/districts');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(0);
    });

    it('should return all districts sorted by name', async () => {
      await District.create([
        { name: 'Model Town', boundary: gulbergBoundary },
        { name: 'Gulberg', boundary: gulbergBoundary }
      ]);

      const response = await request(app).get('/api/districts');
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].name).toBe('Gulberg');
      expect(response.body.data[1].name).toBe('Model Town');
    });
  });

  describe('POST /api/districts', () => {
    it('should fail with 401 if token is missing', async () => {
      const response = await request(app)
        .post('/api/districts')
        .send({ name: 'Gulberg', boundary: gulbergBoundary });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with 403 if user is not an admin', async () => {
      const user = await createTestUser('user');
      const token = signToken({ userId: user._id.toString(), role: 'user' });

      const response = await request(app)
        .post('/api/districts')
        .set('Cookie', [`token=${token}`])
        .send({ name: 'Gulberg', boundary: gulbergBoundary });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should succeed with 201 if user is an admin', async () => {
      const admin = await createTestUser('admin', 'Admin User', 'admin@example.com');
      const token = signToken({ userId: admin._id.toString(), role: 'admin' });

      const response = await request(app)
        .post('/api/districts')
        .set('Cookie', [`token=${token}`])
        .send({ name: 'Gulberg', boundary: gulbergBoundary });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Gulberg');
    });

    it('should fail with 409 if district name already exists', async () => {
      const admin = await createTestUser('admin', 'Admin User', 'admin@example.com');
      const token = signToken({ userId: admin._id.toString(), role: 'admin' });

      await District.create({ name: 'Gulberg', boundary: gulbergBoundary });

      const response = await request(app)
        .post('/api/districts')
        .set('Cookie', [`token=${token}`])
        .send({ name: 'Gulberg', boundary: gulbergBoundary });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });

    it('should fail with 400 if polygon boundary is not closed', async () => {
      const admin = await createTestUser('admin', 'Admin User', 'admin@example.com');
      const token = signToken({ userId: admin._id.toString(), role: 'admin' });

      const invalidBoundary = {
        type: 'Polygon',
        coordinates: [[
          [74.3350, 31.5280],
          [74.3600, 31.5280],
          [74.3600, 31.5480],
          [74.3350, 31.5480]
        ]]
      };

      const response = await request(app)
        .post('/api/districts')
        .set('Cookie', [`token=${token}`])
        .send({ name: 'Invalid District', boundary: invalidBoundary });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('closed');
    });
  });

  describe('GET /api/districts/:id/reports', () => {
    it('should return reports located within the district polygon boundary', async () => {
      const district = await District.create({ name: 'Gulberg', boundary: gulbergBoundary });
      const user = await createTestUser('user');

      // Create reports: one inside, one outside
      await NoiseReport.create([
        {
          user: user._id,
          location: { type: 'Point', coordinates: [74.3450, 31.5380] }, // inside
          noiseType: 'traffic',
          intensity: 6,
          occurredAt: new Date(),
        },
        {
          user: user._id,
          location: { type: 'Point', coordinates: [74.1000, 31.1000] }, // outside
          noiseType: 'music',
          intensity: 3,
          occurredAt: new Date(),
        }
      ]);

      const response = await request(app).get(`/api/districts/${district._id}/reports`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].location.coordinates).toEqual([74.3450, 31.5380]);
      expect(response.body.data[0].noiseType).toBe('traffic');
    });

    it('should return 404 if district ID does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await request(app).get(`/api/districts/${fakeId}/reports`);
      expect(response.status).toBe(404);
    });

    it('should reject invalid pagination values', async () => {
      const district = await District.create({ name: 'Gulberg', boundary: gulbergBoundary });

      const response = await request(app).get(`/api/districts/${district._id}/reports?page=0`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Pagination');
    });
  });
});
