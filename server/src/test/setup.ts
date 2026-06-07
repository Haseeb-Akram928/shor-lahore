import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { beforeAll, beforeEach, afterAll } from 'vitest';

dotenv.config();

let mongoServer: MongoMemoryServer | undefined;

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testing-secret-key-at-least-32-characters-long';
process.env.MONGOMS_VERSION = '7.0.14'; // 4.4 needs libcrypto.so.1.1 on ubuntu-latest; 7.x is compatible with OpenSSL 3

function deriveTestDatabaseUri(uri: string) {
  const parsed = new URL(uri);
  const dbName = parsed.pathname.replace(/^\//, '') || 'shorlahore';
  parsed.pathname = `/${dbName.endsWith('_test') ? dbName : `${dbName}_test`}`;
  return parsed.toString();
}

function getTestMongoUri() {
  if (process.env.TEST_MONGODB_URI) {
    return process.env.TEST_MONGODB_URI;
  }

  const configuredUri = process.env.MONGODB_URI;
  if (configuredUri && !configuredUri.includes('test-placeholder')) {
    return deriveTestDatabaseUri(configuredUri);
  }

  return null;
}

// Before all tests run, connect to a test database. Prefer TEST_MONGODB_URI or a derived Atlas _test DB.
beforeAll(async () => {
  const mongoUri = getTestMongoUri();

  if (mongoUri) {
    process.env.MONGODB_URI = mongoUri;
    await mongoose.connect(mongoUri);
    return;
  }

  mongoServer = await MongoMemoryServer.create();
  const memoryUri = mongoServer.getUri();
  process.env.MONGODB_URI = memoryUri;
  await mongoose.connect(memoryUri);
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
