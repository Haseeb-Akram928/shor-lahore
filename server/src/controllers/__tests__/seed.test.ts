import { describe, it, expect } from 'vitest';
import { User } from '../../models/User.model.js';
import { District } from '../../models/District.model.js';
import { NoiseReport } from '../../models/NoiseReport.model.js';
import { runSeed } from '../../scripts/seed.js';

describe('Database Seeding Engine Tests', () => {
  it('should seed the database successfully without errors', async () => {
    // Run the seed script (disable auto-disconnection)
    await runSeed(false);

    // Verify default admin user
    const admin = await User.findOne({ role: 'admin' });
    expect(admin).toBeDefined();
    expect(admin?.email).toBe('admin@shorlahore.com');

    // Verify fake users count
    const usersCount = await User.countDocuments({ role: 'user' });
    expect(usersCount).toBe(25);

    // Verify districts count
    const districtsCount = await District.countDocuments();
    expect(districtsCount).toBe(10);

    // Verify noise reports count
    const reportsCount = await NoiseReport.countDocuments();
    expect(reportsCount).toBe(900);

    const actualUserReports = await NoiseReport.aggregate([
      { $group: { _id: '$user', reportsCount: { $sum: 1 } } },
      { $sort: { reportsCount: -1 } },
      { $limit: 1 },
    ]);

    const topUser = await User.findById(actualUserReports[0]._id);
    expect(topUser?.reportsCount).toBe(actualUserReports[0].reportsCount);

    // Verify district stats are populated
    const gulberg = await District.findOne({ name: 'Gulberg' });
    expect(gulberg).toBeDefined();
    expect(gulberg?.totalReports).toBeGreaterThan(0);
    expect(gulberg?.avgNoiseLevel).toBeGreaterThan(0);
  });
});
