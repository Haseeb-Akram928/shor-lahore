# ShorLahore — Phase 1: Backend Foundation Implementation Plan

This document serves as the building specification for **Phase 1: Backend Foundation**. Feed this plan to your development model to implement the directories, configuration files, core helpers, schemas, validation rules, authentication flow, and initial tests.

> Implementation corrections:
> - Pin package versions after install; do not depend on `latest` behavior.
> - Express 5 supports async errors natively, so `catchAsync` is optional style glue.
> - Test setup must set `NODE_ENV=test`, `JWT_SECRET`, and a dummy `MONGODB_URI` before importing the app.
> - Keep `app.ts` side-effect-light: no database connection or server listen inside it, so Supertest can import it safely.

---

## 1. Project Initialization & Folder Setup

### Step 1.1: Root Repository Structure
At the root folder (`c:\Users\hasee\Downloads\NoisePollutionMapper\`), create the following configuration files:

#### Root `.gitignore`
```text
node_modules/
dist/
.next/
.env
.env.local
.env.production
*.log
.DS_Store
```

#### Root `package.json`
```json
{
  "name": "shor-lahore",
  "version": "1.0.0",
  "private": true,
  "description": "Crowdsourced noise pollution mapping platform for Lahore, Pakistan",
  "scripts": {
    "dev": "concurrently -n server,client -c blue,green \"npm run dev --prefix server\" \"npm run dev --prefix client\"",
    "dev:server": "npm run dev --prefix server",
    "dev:client": "npm run dev --prefix client",
    "build": "npm run build --prefix server && npm run build --prefix client",
    "build:server": "npm run build --prefix server",
    "build:client": "npm run build --prefix client",
    "seed": "npm run seed --prefix server",
    "install:all": "npm install && cd server && npm install && cd ../client && npm install"
  },
  "devDependencies": {
    "concurrently": "^9.1.0"
  }
}
```

### Step 1.2: Create the Directory Tree
Create the following directories under the root:
```text
shor-lahore/
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── validators/
│   │   └── test/
```

### Step 1.3: Backend Config Files (Inside `server/`)
Create these configuration files inside the `server/` subdirectory:

#### `server/package.json`
```json
{
  "name": "shor-lahore-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "nodemon",
    "build": "tsc",
    "start": "node dist/server.js",
    "seed": "tsx src/scripts/seed.ts",
    "test": "vitest run --setupFiles ./src/test/setup.ts"
  },
  "dependencies": {
    "express": "^5.2.0",
    "mongoose": "^8.0.0",
    "socket.io": "^4.8.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "zod": "^3.23.0",
    "cors": "^2.8.5",
    "helmet": "^8.0.0",
    "express-rate-limit": "^7.5.0",
    "cookie-parser": "^1.4.7",
    "dotenv": "^16.4.0",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/express": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/bcryptjs": "^2.4.0",
    "@types/cors": "^2.8.0",
    "@types/cookie-parser": "^1.4.0",
    "@types/morgan": "^1.9.0",
    "nodemon": "^3.1.0",
    "tsx": "^4.19.0",
    "vitest": "^1.6.0",
    "supertest": "^7.0.0",
    "@types/supertest": "^6.0.2",
    "mongodb-memory-server": "^9.2.0"
  }
}
```

#### `server/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### `server/nodemon.json`
```json
{
  "watch": ["src"],
  "ext": "ts,json",
  "exec": "tsx src/server.ts"
}
```

#### `server/.env.example`
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/shorlahore?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

---

## 2. Configuration, Types, and Utilities Setup

### Step 2.1: Environment Variable Validator (`server/src/config/env.ts`)
Implement environment validation using Zod to ensure the application fails fast if configured incorrectly.

### Step 2.2: MongoDB Connection (`server/src/config/db.ts`)
Configure Mongoose to connect to MongoDB with connection error logging.

### Step 2.3: Socket.io Setup (`server/src/config/socket.ts`)
Set up the Socket.io server with CORS configuration matching `CLIENT_URL`. Include logic to join geographic rooms based on coordinate bounding box ranges:
*   Event: `join-area` (parameter: bounds `[south, west, north, east]`).
*   Event: `leave-area`.

### Step 2.4: Shared Types (`server/src/types/index.ts`)
Define the core system structures:
*   `NOISE_TYPES`: enums containing `'construction'`, `'traffic'`, `'generators'`, `'horns'`, `'religious'`, etc.
*   `REPORT_STATUSES`: `'active'`, `'resolved'`, `'flagged'`.
*   `IUser`, `INoiseReport`, `IDistrict` interfaces.

### Step 2.5: Express Helpers (`server/src/utils/`)
*   `ApiError.ts`: A custom error class extending `Error` adding `statusCode` and `isOperational` flags.
*   `catchAsync.ts`: Optional wrapper for consistent controller style. Express 5 already forwards rejected async handlers.
*   `password.ts`: Utility using `bcryptjs` to hash and verify user passwords.
*   `jwt.ts`: Utility to sign and verify Auth tokens.

---

## 3. Schemas, Database Models, and Middleware

### Step 3.1: Mongoose Models (`server/src/models/`)
*   `User.model.ts`: User schema with pre-save password hashing.
*   `NoiseReport.model.ts`: Report schema with `location: { type: "Point", coordinates: [lng, lat] }`. **Must specify a 2dsphere index**: `noiseReportSchema.index({ location: '2dsphere' })`.
*   `District.model.ts`: District schema containing a GeoJSON `Polygon` boundary.

### Step 3.2: Express Middleware (`server/src/middleware/`)
*   `error.middleware.ts`: Global middleware that catches all validation and API errors and sends formatted JSON responses.
*   `validate.middleware.ts`: Middleware taking a Zod schema to parse and validate request body / query parameters.
*   `auth.middleware.ts`: Auth middleware extracting the JWT token from the HTTP cookie and attaching user object to the request.

---

## 4. REST API Routing & Controller Setup

### Step 4.1: Authentication API (`server/src/controllers/auth.controller.ts`)
Implement registration, login, logout, and token authorization check:
*   Route: `POST /api/auth/register` (creates user, hashes password, saves, returns cookie + user).
*   Route: `POST /api/auth/login` (checks email, verifies password, signs JWT, sets `httpOnly` cookie).
*   Route: `POST /api/auth/logout` (clears cookie).
*   Route: `GET /api/auth/me` (returns currently logged-in user profile).

### Step 4.2: Noise Reporting API (`server/src/controllers/report.controller.ts`)
*   Route: `POST /api/reports` (requires authentication, validates coordinates, saves report, broadcasts event to geographic area room).
*   Route: `GET /api/reports/nearby` (reads `lng`, `lat`, and `radius` from query; runs MongoDB `$geoNear` to return sorted reports).

### Step 4.3: Server Entrypoints
*   `server/src/app.ts`: Setup Express middlewares (`cors`, `helmet`, `cookie-parser`, `express.json()`, global rate-limiter, routes, and global error handler).
*   `server/src/server.ts`: Connect to MongoDB, wrap server in HTTP and attach Socket.io, and start listening on `PORT`.

---

## 5. Verification Plan

### Step 5.1: Database Memory Server Setup
Create `server/src/test/setup.ts` to spin up a clean MongoDB Memory Server before running tests.

### Step 5.2: Writing Integration Tests
Create `server/src/controllers/__tests__/auth.test.ts` using `supertest` to verify:
1.  `GET /api/health` returns status `200` and `"ShorLahore API is running"`.
2.  `POST /api/auth/register` creates a user, hashes their password, and succeeds with status `201`.
3.  `POST /api/auth/register` rejects duplicate emails with status `400`.
4.  `POST /api/auth/login` signs a valid token cookie.
5.  Invalid register payloads fail with `400`.
6.  Wrong login password fails with `401`.
7.  `GET /api/auth/me` fails without a cookie and succeeds with a valid cookie.
8.  Report creation rejects unauthenticated users, invalid coordinates, invalid intensity, and invalid noise type.

### Step 5.3: Executing Tests
Validate the implementation by running:
```bash
npm run test --prefix server
```
Ensure all tests execute successfully with zero errors.
