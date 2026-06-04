import mongoose from 'mongoose';
import { pathToFileURL } from 'url';
import { env } from '../config/env.js';
import { User } from '../models/User.model.js';
import { District } from '../models/District.model.js';
import { NoiseReport } from '../models/NoiseReport.model.js';
import { NOISE_TYPES } from '../types/index.js';

// ============ LAHORE DISTRICT DEFINITIONS ============
interface DistrictSeed {
  name: string;
  city: string;
  center: [number, number];
  percentage: number;
  avgIntensity: number;
  primaryTypes: string[];
}

const districtsData: DistrictSeed[] = [
  {
    name: 'Walled City',
    city: 'Lahore',
    center: [74.3173, 31.5810],
    percentage: 20,
    avgIntensity: 7.5,
    primaryTypes: ['traffic', 'horns', 'music', 'religious'],
  },
  {
    name: 'Gulberg',
    city: 'Lahore',
    center: [74.3478, 31.5378],
    percentage: 15,
    avgIntensity: 6.5,
    primaryTypes: ['traffic', 'horns', 'construction'],
  },
  {
    name: 'DHA',
    city: 'Lahore',
    center: [74.4298, 31.5123],
    percentage: 12,
    avgIntensity: 4.5,
    primaryTypes: ['generators', 'construction', 'traffic'],
  },
  {
    name: 'Model Town',
    city: 'Lahore',
    center: [74.3290, 31.4886],
    percentage: 12,
    avgIntensity: 6.0,
    primaryTypes: ['traffic', 'horns', 'construction'],
  },
  {
    name: 'Johar Town',
    city: 'Lahore',
    center: [74.2728, 31.4697],
    percentage: 10,
    avgIntensity: 5.5,
    primaryTypes: ['construction', 'traffic', 'horns'],
  },
  {
    name: 'Cantt',
    city: 'Lahore',
    center: [74.3637, 31.5319],
    percentage: 8,
    avgIntensity: 5.0,
    primaryTypes: ['traffic', 'sirens', 'horns'],
  },
  {
    name: 'Garden Town',
    city: 'Lahore',
    center: [74.3385, 31.5146],
    percentage: 8,
    avgIntensity: 5.5,
    primaryTypes: ['traffic', 'neighbors', 'horns'],
  },
  {
    name: 'Township',
    city: 'Lahore',
    center: [74.2947, 31.4507],
    percentage: 8,
    avgIntensity: 6.5,
    primaryTypes: ['traffic', 'industrial', 'horns'],
  },
  {
    name: 'Anarkali',
    city: 'Lahore',
    center: [74.3117, 31.5610],
    percentage: 7,
    avgIntensity: 7.5,
    primaryTypes: ['traffic', 'horns', 'music', 'nightlife'],
  },
  {
    name: 'Bahria Town',
    city: 'Lahore',
    center: [74.1870, 31.3680],
    percentage: 7,
    avgIntensity: 3.5,
    primaryTypes: ['construction', 'traffic', 'generators'],
  },
];

const totalDistrictWeight = districtsData.reduce((sum, district) => sum + district.percentage, 0);

const generateBoundingBox = (center: [number, number]) => {
  const [lng, lat] = center;
  const lngOffset = 0.0125;
  const latOffset = 0.0100;
  return {
    type: 'Polygon' as const,
    coordinates: [[
      [lng - lngOffset, lat - latOffset],
      [lng + lngOffset, lat - latOffset],
      [lng + lngOffset, lat + latOffset],
      [lng - lngOffset, lat + latOffset],
      [lng - lngOffset, lat - latOffset],
    ]] as [number, number][][],
  };
};

const getRandomPointInBoundingBox = (center: [number, number]): [number, number] => {
  const [lng, lat] = center;
  const lngOffset = 0.0125;
  const latOffset = 0.0100;
  const randomLng = lng - lngOffset + Math.random() * (lngOffset * 2);
  const randomLat = lat - latOffset + Math.random() * (latOffset * 2);
  return [randomLng, randomLat];
};

const fakePakistaniNames = [
  'Ahmad Khan', 'Fatima Ali', 'Hassan Raza', 'Ayesha Siddiqui', 'Zainab Bibi',
  'Muhammad Bilal', 'Sana Yousaf', 'Ali Usman', 'Mariam Malik', 'Hamza Shah',
  'Amna Dar', 'Osman Sheikh', 'Bilal Rafique', 'Khadija Asif', 'Zain Javed',
  'Areeba Tariq', 'Umer Farooq', 'Hira Butt', 'Tayyab Iqbal', 'Sehrish Naeem',
  'Faisal Mahmood', 'Nida Chaudhry', 'Saad Gillani', 'Sidra Bukhari', 'Mustafa Kamal'
];

const tagsByNoiseType: Record<string, string[]> = {
  construction: ['#machinery', '#drill', '#piling', '#concrete', '#daytime'],
  traffic: ['#road', '#rushhour', '#ferozepur', '#cars', '#exhaust'],
  nightlife: ['#night', '#bazaar', '#crowd', '#cafes'],
  neighbors: ['#loud', '#ac', '#shouting', '#party'],
  industrial: ['#factory', '#grinder', '#compressor', '#nightshift'],
  animals: ['#dogs', '#straydogs', '#barking', '#cats'],
  sirens: ['#ambulance', '#police', '#security', '#emergency'],
  religious: ['#loudspeaker', '#prayer', '#azan', '#sermon'],
  generators: ['#genny', '#loadshedding', '#ups', '#diesel'],
  horns: ['#pressurehorn', '#rickshaw', '#bike', '#irritating'],
  music: ['#wedding', '#shadi', '#bass', '#dhol'],
  other: ['#noisy', '#annoying'],
};

/**
 * Executes the seeding process.
 * If disconnectOnFinish is false, it won't close mongoose connections (useful for testing inside Vitest).
 */
export const runSeed = async (disconnectOnFinish = true) => {
  try {
    console.log('Seeding database...');

    // Only connect if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }

    // Clear collections
    await User.deleteMany({});
    await District.deleteMany({});
    await NoiseReport.deleteMany({});
    console.log('Cleared existing data.');

    // 1. Create Default Admin
    await User.create({
      name: 'ShorLahore Admin',
      email: 'admin@shorlahore.com',
      password: 'Admin@123456',
      role: 'admin',
    });
    console.log('Default admin user created.');

    // 2. Create Fake Users
    const users = [];
    for (const name of fakePakistaniNames) {
      const email = `${name.toLowerCase().replace(/\s+/g, '')}@example.com`;
      const reportsCount = Math.floor(Math.random() * 40);
      const reputation = Math.floor(reportsCount * 1.5);
      const user = await User.create({
        name,
        email,
        password: 'password123',
        role: 'user',
        reportsCount,
        reputation,
      });
      users.push(user);
    }
    console.log(`Created ${users.length} fake users.`);

    // 3. Create Districts
    const createdDistricts: any[] = [];
    for (const item of districtsData) {
      const boundary = generateBoundingBox(item.center);
      const district = await District.create({
        name: item.name,
        city: item.city,
        boundary,
        avgNoiseLevel: item.avgIntensity,
        totalReports: 0,
      });
      createdDistricts.push(district);
    }
    console.log(`Created ${createdDistricts.length} districts with polygon boundaries.`);

    // 4. Generate Noise Reports
    const TOTAL_REPORTS = 900;
    const reportsToCreate = [];
    const now = new Date();

    for (let i = 0; i < TOTAL_REPORTS; i++) {
      const rand = Math.random() * totalDistrictWeight;
      let selectedSeed = districtsData[0];
      let sum = 0;
      for (const d of districtsData) {
        sum += d.percentage;
        if (rand <= sum) {
          selectedSeed = d;
          break;
        }
      }

      const daysAgo = Math.random() * 90;
      const occurredAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const hour = occurredAt.getHours();

      let noiseType = NOISE_TYPES[Math.floor(Math.random() * NOISE_TYPES.length)];
      
      if (noiseType === 'construction') {
        const isDaytime = hour >= 8 && hour <= 18;
        if (!isDaytime && Math.random() > 0.20) {
          noiseType = Math.random() > 0.5 ? 'traffic' : 'neighbors';
        }
      }
      else if (noiseType === 'traffic' || noiseType === 'horns') {
        const isRushHour = (hour >= 7 && hour <= 10) || (hour >= 16 && hour <= 20);
        if (!isRushHour && Math.random() > 0.30) {
          noiseType = Math.random() > 0.5 ? 'generators' : 'other';
        }
      }
      else if (noiseType === 'nightlife' || noiseType === 'music') {
        const isNight = hour >= 20 || hour <= 2;
        if (!isNight && Math.random() > 0.20) {
          noiseType = Math.random() > 0.5 ? 'traffic' : 'neighbors';
        }
      }
      else if (noiseType === 'generators') {
        const isPeakLoadshedding = hour >= 18 && hour <= 22;
        if (!isPeakLoadshedding && Math.random() > 0.10) {
          noiseType = 'traffic';
        }
      }
      else if (noiseType === 'religious') {
        const prayerHours = [5, 13, 17, 19, 20];
        if (!prayerHours.includes(hour)) {
          const targetHour = prayerHours[Math.floor(Math.random() * prayerHours.length)];
          occurredAt.setHours(targetHour, Math.floor(Math.random() * 60), 0, 0);
          if (occurredAt > now) {
            occurredAt.setDate(occurredAt.getDate() - 1);
          }
        }
      }

      let baseIntensity = selectedSeed.avgIntensity;
      let intensity = Math.round(baseIntensity + (Math.random() * 3 - 1.5));
      intensity = Math.max(1, Math.min(10, intensity));

      const coordinates = getRandomPointInBoundingBox(selectedSeed.center);
      const user = users[Math.floor(Math.random() * users.length)];
      const description = `Unusual noise levels reported here from ${noiseType}. Intensity felt high.`;
      const tags = tagsByNoiseType[noiseType] || ['#lahore', '#noise'];
      const upvotes = Math.floor(Math.random() * 15);

      reportsToCreate.push({
        user: user._id,
        location: {
          type: 'Point' as const,
          coordinates,
        },
        noiseType,
        intensity,
        description,
        district: selectedSeed.name,
        tags,
        occurredAt,
        createdAt: occurredAt,
        upvotes,
        status: 'active',
      });
    }

    const createdReports = await NoiseReport.insertMany(reportsToCreate);
    console.log(`Created ${createdReports.length} noise reports.`);

    const reportsByUser = new Map<string, { reportsCount: number; upvotes: number }>();
    for (const report of createdReports) {
      const userId = report.user.toString();
      const current = reportsByUser.get(userId) || { reportsCount: 0, upvotes: 0 };
      current.reportsCount += 1;
      current.upvotes += report.upvotes;
      reportsByUser.set(userId, current);
    }

    await Promise.all(users.map((user) => {
      const stats = reportsByUser.get(user._id.toString()) || { reportsCount: 0, upvotes: 0 };
      user.reportsCount = stats.reportsCount;
      user.reputation = stats.reportsCount * 2 + stats.upvotes;
      return user.save();
    }));

    for (const district of createdDistricts) {
      const reports = createdReports.filter(r => r.district === district.name);
      if (reports.length > 0) {
        const total = reports.length;
        const sumIntensity = reports.reduce((acc, curr) => acc + curr.intensity, 0);
        const avg = Math.round((sumIntensity / total) * 10) / 10;
        
        district.totalReports = total;
        district.avgNoiseLevel = avg;
        await district.save();
      }
    }
    console.log('Recalculated district and user aggregates.');
    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  } finally {
    if (disconnectOnFinish) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB.');
    }
  }
};

// Auto-run only when executed directly via CLI.
const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  runSeed(true).catch(() => process.exit(1));
}
