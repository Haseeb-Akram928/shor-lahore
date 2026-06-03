import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app.js';

describe('Health Check Integration Test', () => {
  describe('GET /api/health', () => {
    it('should return a 200 status and success message', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('ShorLahore API is running');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
