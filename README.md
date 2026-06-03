# ShorLahore

ShorLahore is a crowdsourced noise pollution mapping and analytics platform for Lahore, Pakistan.

The project lets residents report local noise by type, intensity, time, and location. Over time, those reports can power a live city noise map, heatmaps, district-level analysis, and admin dashboards for residents, planners, and researchers.

## Features

- Geospatial noise reporting with GeoJSON coordinates
- Lahore district mapping using geospatial queries
- JWT authentication with httpOnly cookies
- MongoDB `2dsphere` indexes for location-based reports
- Express API with TypeScript, Zod validation, and structured error handling
- Socket.io foundation for real-time map and dashboard updates
- Backend integration tests using Vitest, Supertest, and MongoDB Memory Server
- GitHub Actions workflow for automated build and test checks

## Tech Stack

| Layer | Technology |
| --- | --- |
| Backend | Express 5, TypeScript |
| Database | MongoDB, Mongoose |
| Validation | Zod |
| Auth | JWT, httpOnly cookies, bcryptjs |
| Real-time | Socket.io |
| Testing | Vitest, Supertest, MongoDB Memory Server |
| CI | GitHub Actions |
| Frontend | Next.js, MapLibre, deck.gl, Recharts, Nivo planned |

## Project Structure

```text
NoisePollutionMapper/
|-- .agent/                    # Agent-specific development rules
|-- .github/workflows/         # GitHub Actions workflows
|-- docs/plans/                # Planning and implementation documents
|-- server/                    # Express API server
|   |-- src/
|   |   |-- config/            # Environment, database, Socket.io setup
|   |   |-- controllers/       # Request handlers and tests
|   |   |-- middleware/        # Auth, validation, rate limit, error handling
|   |   |-- models/            # Mongoose schemas
|   |   |-- routes/            # API routes
|   |   |-- test/              # Test setup
|   |   |-- types/             # Shared TypeScript types
|   |   |-- utils/             # JWT, password, error helpers
|   |   |-- validators/        # Zod schemas
|   |   |-- app.ts             # Express app configuration
|   |   `-- server.ts          # Server startup
|   |-- package.json
|   |-- tsconfig.json
|   `-- vitest.config.ts
|-- AGENTS.md                  # Main AI agent instructions
|-- ARCHITECTURE.md            # Architecture rules and target structure
|-- CODE_STYLE.md              # Code style rules
|-- DEVELOPMENT_FLOW.md        # Build-test-fix workflow
|-- PROJECT_CONTEXT.md         # Project summary and goals
|-- TESTING_RULES.md           # Required testing and edge cases
|-- package.json               # Root scripts
`-- README.md
```

## Getting Started

### Prerequisites

- Node.js 20 or newer
- MongoDB Atlas connection string for development data

Tests use MongoDB Memory Server, so they do not need a local MongoDB server or Atlas database.

### Install Dependencies

From the root directory:

```bash
npm install
npm install --prefix server
```

### Configure Environment

Create `server/.env` from the example:

```bash
Copy-Item server/.env.example server/.env
```

Set these values in `server/.env`:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_32_character_minimum_secret
CLIENT_URL=http://localhost:3000
```

## Running the Backend

```bash
npm run dev:server
```

The API runs on:

```text
http://localhost:5000
```

Health check:

```text
GET /api/health
```

## Testing

Run backend tests:

```bash
npm run test --prefix server
```

Tests run against MongoDB Memory Server and do not touch the development database.

## Build

Build the backend:

```bash
npm run build --prefix server
```

Build all configured workspaces:

```bash
npm run build
```

## Continuous Integration

GitHub Actions is configured in:

```text
.github/workflows/ci.yml
```

The workflow is intended to install dependencies, build the backend, and run the backend test suite on pushes and pull requests.

## Development Rule

Build one small unit, test it immediately, fix failures, verify edge cases, then move to the next unit.
