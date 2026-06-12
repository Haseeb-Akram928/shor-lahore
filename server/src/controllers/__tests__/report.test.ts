import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { User } from '../../models/User.model.js';
import { NoiseReport } from '../../models/NoiseReport.model.js';

describe('Report Integration Tests', () => {
  let userIndex = 0;

  const pastDateAtUtcHour = (hour: number) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - 1);
    date.setUTCHours(hour, 30, 0, 0);
    return date;
  };

  const createUser = async () => {
    userIndex += 1;

    return User.create({
      name: 'Map Tester',
      email: `map-tester-${userIndex}@example.com`,
      password: 'password123',
      role: 'user',
    });
  };

  const createReport = async (overrides: Partial<{
    intensity: number;
    noiseType: 'traffic' | 'construction' | 'nightlife';
    status: 'active' | 'resolved' | 'flagged';
    occurredAt: Date;
    coordinates: [number, number];
  }> = {}) => {
    const user = await createUser();

    return NoiseReport.create({
      user: user._id,
      location: {
        type: 'Point',
        coordinates: overrides.coordinates || [74.3478, 31.5378],
      },
      noiseType: overrides.noiseType || 'traffic',
      intensity: overrides.intensity ?? 7,
      district: 'Gulberg',
      status: overrides.status || 'active',
      occurredAt: overrides.occurredAt || pastDateAtUtcHour(10),
    });
  };

  describe('GET /api/reports/heatmap', () => {
    it('should return active reports with default maxIntensity and limit values', async () => {
      await createReport({ intensity: 7 });

      const response = await request(app).get('/api/reports/heatmap?minIntensity=1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].coordinates).toEqual([74.3478, 31.5378]);
    });

    it('should filter reports by hour and minimum intensity', async () => {
      await createReport({ intensity: 8, occurredAt: pastDateAtUtcHour(10) });
      await createReport({ intensity: 3, occurredAt: pastDateAtUtcHour(10) });
      await createReport({ intensity: 9, occurredAt: pastDateAtUtcHour(12) });

      const response = await request(app).get('/api/reports/heatmap?hour=10&minIntensity=5&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].intensity).toBe(8);
    });

    it('should filter reports by noise type and occurrence date range', async () => {
      const inRange = pastDateAtUtcHour(8);
      const outOfRange = new Date(inRange);
      outOfRange.setUTCDate(outOfRange.getUTCDate() - 20);

      await createReport({ noiseType: 'traffic', occurredAt: inRange });
      await createReport({ noiseType: 'construction', occurredAt: inRange });
      await createReport({ noiseType: 'traffic', occurredAt: outOfRange });

      const from = new Date(inRange);
      from.setUTCDate(from.getUTCDate() - 1);
      const to = new Date(inRange);
      to.setUTCDate(to.getUTCDate() + 1);

      const response = await request(app).get(
        `/api/reports/heatmap?noiseTypes=traffic&from=${from.toISOString()}&to=${to.toISOString()}`
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].noiseType).toBe('traffic');
    });

    it('should reject partial viewport bounds with a validation error', async () => {
      const response = await request(app).get('/api/reports/heatmap?swLng=74.2');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Viewport bounds require');
    });

    it('should reject invalid noise type filters', async () => {
      const response = await request(app).get('/api/reports/heatmap?noiseTypes=traffic,invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('noiseTypes');
    });
  });
});
