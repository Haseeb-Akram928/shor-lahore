import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { User } from '../../models/User.model.js';
import { NoiseReport } from '../../models/NoiseReport.model.js';
import { signToken } from '../../utils/jwt.js';

describe('Admin Management Integration Tests', () => {
  const createUser = async (
    role: 'user' | 'admin',
    suffix: string,
    overrides: Partial<{ isActive: boolean; reportsCount: number; reputation: number }> = {}
  ) => {
    return User.create({
      name: `${role} ${suffix}`,
      email: `${role}-${suffix}@example.com`,
      password: 'password123',
      role,
      ...overrides,
    });
  };

  const createReport = async (userId: string, overrides: Partial<{
    noiseType: 'traffic' | 'music';
    intensity: number;
    status: 'active' | 'resolved' | 'flagged';
    occurredAt: Date;
  }> = {}) => {
    return NoiseReport.create({
      user: userId,
      location: {
        type: 'Point',
        coordinates: [74.3478, 31.5378],
      },
      noiseType: overrides.noiseType || 'traffic',
      intensity: overrides.intensity ?? 7,
      district: 'Gulberg',
      status: overrides.status || 'active',
      occurredAt: overrides.occurredAt || new Date(Date.now() - 60 * 60 * 1000),
    });
  };

  const tokenFor = (user: Awaited<ReturnType<typeof createUser>>) => {
    return signToken({ userId: user._id.toString(), role: user.role });
  };

  describe('GET /api/users', () => {
    it('should reject unauthenticated and non-admin requests', async () => {
      const user = await createUser('user', 'regular');

      const missing = await request(app).get('/api/users');
      expect(missing.status).toBe(401);

      const forbidden = await request(app)
        .get('/api/users')
        .set('Cookie', [`token=${tokenFor(user)}`]);
      expect(forbidden.status).toBe(403);
    });

    it('should list users for admins with filters', async () => {
      const admin = await createUser('admin', 'owner');
      await createUser('user', 'active', { reportsCount: 4, reputation: 12 });
      await createUser('user', 'inactive', { isActive: false });

      const response = await request(app)
        .get('/api/users?role=user&isActive=true')
        .set('Cookie', [`token=${tokenFor(admin)}`]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].email).toBe('user-active@example.com');
      expect(response.body.pagination.total).toBe(1);
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should update a user role and active state for admins', async () => {
      const admin = await createUser('admin', 'owner');
      const user = await createUser('user', 'promote');

      const response = await request(app)
        .patch(`/api/users/${user._id}`)
        .set('Cookie', [`token=${tokenFor(admin)}`])
        .send({ role: 'admin', isActive: false });

      expect(response.status).toBe(200);
      expect(response.body.data.user.role).toBe('admin');
      expect(response.body.data.user.isActive).toBe(false);
    });

    it('should reject empty update payloads', async () => {
      const admin = await createUser('admin', 'owner');
      const user = await createUser('user', 'empty');

      const response = await request(app)
        .patch(`/api/users/${user._id}`)
        .set('Cookie', [`token=${tokenFor(admin)}`])
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/reports/admin', () => {
    it('should list reports for admins with filters', async () => {
      const admin = await createUser('admin', 'owner');
      const user = await createUser('user', 'reporter');
      await createReport(user._id.toString(), { intensity: 8, noiseType: 'traffic' });
      await createReport(user._id.toString(), { intensity: 3, noiseType: 'music' });

      const response = await request(app)
        .get('/api/reports/admin?noiseType=traffic&minIntensity=5')
        .set('Cookie', [`token=${tokenFor(admin)}`]);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].noiseType).toBe('traffic');
      expect(response.body.data[0].user.name).toBe('user reporter');
    });

    it('should list reports within an occurrence date range', async () => {
      const admin = await createUser('admin', 'owner');
      const user = await createUser('user', 'reporter');
      await createReport(user._id.toString(), { occurredAt: new Date('2026-01-10T08:00:00.000Z') });
      await createReport(user._id.toString(), { occurredAt: new Date('2026-02-10T08:00:00.000Z') });

      const response = await request(app)
        .get('/api/reports/admin?from=2026-02-01T00:00:00.000Z&to=2026-02-28T23:59:59.999Z')
        .set('Cookie', [`token=${tokenFor(admin)}`]);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].occurredAt).toBe('2026-02-10T08:00:00.000Z');
    });
  });

  describe('PATCH /api/reports/admin/bulk-status', () => {
    it('should update multiple report statuses for admins', async () => {
      const admin = await createUser('admin', 'owner');
      const user = await createUser('user', 'reporter');
      const firstReport = await createReport(user._id.toString());
      const secondReport = await createReport(user._id.toString(), { noiseType: 'music' });

      const response = await request(app)
        .patch('/api/reports/admin/bulk-status')
        .set('Cookie', [`token=${tokenFor(admin)}`])
        .send({ ids: [firstReport._id.toString(), secondReport._id.toString()], status: 'flagged' });

      expect(response.status).toBe(200);
      expect(response.body.data.matchedCount).toBe(2);
      expect(response.body.data.reports).toHaveLength(2);
      expect(response.body.data.reports.every((report: { status: string }) => report.status === 'flagged')).toBe(true);
    });

    it('should reject invalid bulk status payloads', async () => {
      const admin = await createUser('admin', 'owner');

      const response = await request(app)
        .patch('/api/reports/admin/bulk-status')
        .set('Cookie', [`token=${tokenFor(admin)}`])
        .send({ ids: [], status: 'resolved' });

      expect(response.status).toBe(400);
    });

    it('should reject non-admin bulk status requests', async () => {
      const user = await createUser('user', 'regular');

      const response = await request(app)
        .patch('/api/reports/admin/bulk-status')
        .set('Cookie', [`token=${tokenFor(user)}`])
        .send({ ids: ['507f1f77bcf86cd799439011'], status: 'resolved' });

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/reports/:id/status and DELETE /api/reports/:id', () => {
    it('should update and delete reports for admins', async () => {
      const admin = await createUser('admin', 'owner');
      const user = await createUser('user', 'reporter');
      const report = await createReport(user._id.toString());

      const updated = await request(app)
        .patch(`/api/reports/${report._id}/status`)
        .set('Cookie', [`token=${tokenFor(admin)}`])
        .send({ status: 'resolved' });

      expect(updated.status).toBe(200);
      expect(updated.body.data.report.status).toBe('resolved');

      const deleted = await request(app)
        .delete(`/api/reports/${report._id}`)
        .set('Cookie', [`token=${tokenFor(admin)}`]);

      expect(deleted.status).toBe(200);
      expect(await NoiseReport.findById(report._id)).toBeNull();
    });
  });
});
