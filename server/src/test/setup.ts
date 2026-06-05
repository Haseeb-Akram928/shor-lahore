import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { beforeAll, beforeEach, afterAll } from 'vitest';

let mongoServer: MongoMemoryServer;

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testing-secret-key-at-least-32-characters-long';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-placeholder';
process.env.MONGOMS_VERSION = '7.0.14'; // 4.4 needs libcrypto.so.1.1 on ubuntu-latest; 7.x is compatible with OpenSSL 3

// Before all tests run, spin up the in-memory MongoDB database
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Before each individual test, clear all database collections so tests are clean
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// After all tests finish, close the mongoose connection and stop the RAM server
afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});
