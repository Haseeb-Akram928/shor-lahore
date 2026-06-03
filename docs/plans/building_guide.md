# ShorLahore — Production-Grade Building & Testing Guide

Welcome! This guide is designed to take you step-by-step through setting up automated testing, version control, and GitHub Actions (CI/CD) for your monorepo. Since you are new to testing and CI/CD, this guide breaks down the core concepts into simple, actionable patterns with code examples you can copy and modify.

---

## Table of Contents
1. [Git Branching & Feature Workflow](#1-git-branching--feature-workflow)
2. [Testing 101: A Beginner's Guide](#2-testing-101-a-beginners-guide)
3. [Writing Your First Backend Integration Test](#3-writing-your-first-backend-integration-test)
4. [GitHub Actions (CI/CD) 101](#4-github-actions-cicd-101)
5. [The Step-by-Step Building Roadmap](#5-the-step-by-step-building-roadmap)

---

## 1. Git Branching & Feature Workflow

A production-grade project uses Git branch tracking to prevent unfinished code from breaking the live application. You will follow a process called **Trunk-Based Development**.

### The Git Commands Flow
For every new feature (e.g., adding user login, building the map view):

```bash
# 1. Start from main and pull the latest changes
git checkout main
git pull origin main

# 2. Create and switch to a new branch for your feature
git checkout -b feature/user-login

# 3. Work on your code... save changes.

# 4. Check what files you changed
git status

# 5. Stage files for commit
git add .

# 6. Commit your changes with a descriptive message
git commit -m "feat(server): implement jwt login and password verification"

# 7. Push your branch to GitHub
git push origin feature/user-login
```

Once pushed, go to GitHub, open a **Pull Request (PR)**, wait for your automated tests to pass, and merge it into `main`.

---

## 2. Testing 101: A Beginner's Guide

> [!IMPORTANT]
> Tests should cover both the happy path and failure states. For every endpoint or component, write tests for valid input, invalid input, missing auth, permission errors, empty data, and boundary values.

### What is Automated Testing?
Think of automated testing as writing a small script that runs your main program, feeds it specific input, and checks if the output is correct. Instead of opening Postman or clicking around the browser yourself, the script does it in milliseconds.

Every test follows the **AAA Pattern**:
1.  **Arrange:** Set up the test data (e.g., create a fake user in a temporary database).
2.  **Act:** Execute the code or hit the API endpoint (e.g., send a request to `/api/auth/login`).
3.  **Assert:** Check the results (e.g., assert that the response status is `200 OK` and a cookie was set).

### The Test Stack for ShorLahore
*   **Vitest:** Our test runner. It scans for files ending in `.test.ts` or `.spec.ts` and runs them. It is modern, extremely fast, and compatible with Jest assertions.
*   **Supertest:** A library that lets you run your Express server in-memory during tests and make HTTP requests to it without starting a real port listener.
*   **MongoDB Memory Server (`mongodb-memory-server`):** Spins up a real, temporary MongoDB database entirely in your computer's RAM. When the tests start, it connects to this clean RAM-database; when the tests finish, it deletes it. This keeps your tests completely isolated and prevents pollution of your real database.

---

## 3. Writing Your First Backend Integration Test

Let's look at how to test the **Health Check Endpoint** (`GET /api/health`) and the **Register Endpoint** (`POST /api/auth/register`).

### Step 1: Create the Test Environment Setup
We create a helper file to handle spinning up our temporary database before tests run, and cleaning it up afterward.

Create this file at `server/src/test/setup.ts`:

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { beforeAll, beforeEach, afterAll } from 'vitest';

let mongoServer: MongoMemoryServer;

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testing-secret-key-at-least-32-characters-long';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-placeholder';

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
  await mongoServer.stop();
});
```

### Step 2: Write the Test File
Here is a complete example of testing your API endpoints. 

Create this file at `server/src/controllers/__tests__/auth.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js'; // Your configured Express app instance

describe('Auth Integration Tests', () => {
  
  // Test 1: Testing a simple health check
  describe('GET /api/health', () => {
    it('should return a 200 status and success message', async () => {
      // Act
      const response = await request(app).get('/api/health');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('ShorLahore API is running');
    });
  });

  // Test 2: Testing a POST request with database interaction
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully with valid details', async () => {
      // Arrange (Fake user payload)
      const userPayload = {
        name: 'Lahore Resident',
        email: 'resident@lahore.pk',
        password: 'SecurePassword123!',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userPayload);

      // Assert
      expect(response.status).toBe(201); // 201 Created
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe(userPayload.name);
      expect(response.body.data.user.email).toBe(userPayload.email);
      expect(response.body.data.user).not.toHaveProperty('password'); // Password must be hidden!
    });

    it('should fail with 400 if email is already taken', async () => {
      // Arrange
      const userPayload = {
        name: 'Lahore Resident',
        email: 'resident@lahore.pk',
        password: 'SecurePassword123!',
      };

      // Register the user first
      await request(app).post('/api/auth/register').send(userPayload);

      // Act: Try registering the exact same email again
      const response = await request(app)
        .post('/api/auth/register')
        .send(userPayload);

      // Assert
      expect(response.status).toBe(400); // Bad Request
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email is already registered');
    });
  });
});
```

### Running Your Tests Locally
In `server/package.json`, add this script:
```json
"scripts": {
  "test": "vitest run --setupFiles ./src/test/setup.ts"
}
```
Then, you can run all your backend tests with:
```bash
npm run test --prefix server
```

Before adding a new feature, add or update tests for:
- Success path
- Validation failures
- Auth/permission failures
- Empty or missing data
- Boundary values
- Regression cases discovered during debugging

---

## 4. GitHub Actions (CI/CD) 101

### What is GitHub Actions?
GitHub Actions is an automation platform built directly into GitHub. It listens for events on your repository (like opening a PR) and triggers "workflows." Workflows are run on temporary, clean Linux virtual machines provided for free by GitHub.

### Why do we use it?
If you write tests but forget to run them locally, bugs can get merged into production. GitHub Actions enforces a rule: **"If any test fails, you cannot merge the code."**

### How to set it up
You define a workflow in a simple YAML configuration file.

Create this file at the root of your project: `.github/workflows/ci.yml`:

```yaml
name: ShorLahore Continuous Integration

# Trigger this workflow on pushes or pull requests to the main branch
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  verify:
    name: Build, Lint, and Test
    runs-on: ubuntu-latest # Run on a clean Linux container

    steps:
      # Step 1: Download the source code from GitHub onto the container
      - name: Checkout Code
        uses: actions/checkout@v4

      # Step 2: Install Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm' # Caches npm packages to speed up builds

      # Step 3: Install dependencies for the whole monorepo
      - name: Install Dependencies
        run: npm run install:all

      # Step 4: Run backend linters & syntax checks
      - name: Lint Backend
        run: npm run lint --prefix server || true # Change to exit code on strict setup

      # Step 5: Verify backend builds without TS errors
      - name: Build Backend
        run: npm run build --prefix server

      # Step 6: Run Backend Test Suite
      # Note: Vitest automatically downloads and spins up MongoMemoryServer inside this build runner!
      - name: Run Backend Tests
        run: npm run test --prefix server
        env:
          JWT_SECRET: testing-secret-key-at-least-32-characters-long
          MONGODB_URI: mongodb://localhost:27017/unused # Test suite runs in-memory anyway

      # Step 7: Verify frontend builds without TS/Next.js errors
      - name: Build Frontend (Next.js)
        run: npm run build --prefix client
```

---

## 5. The Step-by-Step Building Roadmap

To keep things structured, follow this roadmap to transition the project from zero files to production-grade:

### Phase A: Repository Initialization & Tooling
*   [ ] Set up folders: `server/` and `client/`.
*   [ ] Create root `package.json` and install `concurrently`.
*   [ ] Initialize a local Git repository: `git init`.
*   [ ] Add the root `.gitignore`.
*   [ ] Create the `.github/workflows/ci.yml` pipeline file.

### Phase B: Backend Foundation & First Endpoint
*   [ ] Create the Express app boilerplates (`app.ts`, `server.ts`).
*   [ ] Write the `GET /api/health` check endpoint.
*   [ ] Install `vitest`, `supertest`, and `mongodb-memory-server` in the `server` directory.
*   [ ] Write the health check test setup, verify tests pass locally using `npm run test --prefix server`.
*   [ ] Push this branch to GitHub, open a PR, and verify that the GitHub Actions CI pipeline runs and passes!

### Phase C: Core Backend API
*   [ ] Write the User schema, Zod validations, and registration controller.
*   [ ] Write integration tests for registration and login.
*   [ ] Implement the actual registration and login controllers until tests pass.
*   [ ] Build out the geospatial schema features (reporting a noise location, calculating which district the coordinates fall under).
*   [ ] Write tests for geospatial aggregations and radius searches.

### Phase D: Frontend Scaffolding & Component Design
*   [ ] Bootstrap the client app using Next.js.
*   [ ] Build the core design system CSS files and typography.
*   [ ] Set up global UI components (Navbar, buttons, layouts).

### Phase E: Interactive Map & Socket Sync
*   [ ] Integrate MapLibre GL and render the base map focused on Lahore.
*   [ ] Wire the Report form with the map overlay so users can drop a marker to report.
*   [ ] Set up Socket.io connection on the client to listen for new report triggers.

### Phase F: Final Polish & Production Deployment
*   [ ] Build out the admin dashboards and analytics graphs.
*   [ ] Verify the build succeeds locally with zero TypeScript warnings.
*   [ ] Connect your database to MongoDB Atlas (M0 free cluster).
*   [ ] Deploy the server to Render or Railway.
*   [ ] Deploy the client to Vercel.
*   [ ] Connect UptimeRobot to ping `/api/health` to monitor uptime.
