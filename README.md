# ShorLahore

ShorLahore is a crowdsourced noise pollution mapping and analytics platform for Lahore, Pakistan.

The project lets residents report local noise by type, intensity, time, and location. Over time, those reports can power a live city noise map, heatmaps, district-level analysis, and admin dashboards for residents, planners, and researchers.

## Features

- Geospatial noise reporting with GeoJSON coordinates
- Lahore district mapping using geospatial queries
- District API for listing districts, creating admin-managed districts, and fetching reports inside district boundaries
- Analytics API for overview KPIs, trends, noise type breakdowns, district stats, hourly distribution, heatmap grids, top reporters, and recent reports
- Seed script that generates Lahore-focused mock data for development and demos
- JWT authentication with httpOnly cookies
- MongoDB `2dsphere` indexes for location-based reports
- Express API with TypeScript, Zod validation, and structured error handling
- Socket.io foundation for real-time map and dashboard updates
- Interactive Lahore noise map with MapLibre and deck.gl heatmap rendering
- Noise report submission flow with map-based location picking
- Public districts page with loading, empty, and error states
- Backend integration tests using Vitest, Supertest, and MongoDB Memory Server
- GitHub Actions workflow for automated build and test checks
- Next.js frontend foundation with responsive layout, auth pages, UI primitives, and theme/auth providers

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
| Frontend | Next.js 15, React 19, TypeScript, CSS Modules |
| Mapping and charts | MapLibre, deck.gl, Recharts, Nivo |

## Current Status

Phase 4 is complete.

Implemented backend work:

- Phase 1 backend foundation
- District API
- Analytics API
- Seed data engine
- GitHub Actions backend CI
- Backend integration tests for health, districts, analytics, and seed data
- Frontend foundation with app shell, homepage, login/signup pages, admin shell, UI primitives, API client, Socket.io client, and theme/auth contexts
- Phase 4 public pages: interactive map, heatmap overlay, time/intensity filters, report form, and districts view

Seed data includes:

- 10 Lahore districts
- 25 mock users
- 900 mock noise reports

## Project Structure

```text
NoisePollutionMapper/
|-- .agent/                    # Agent-specific development rules
|-- .github/workflows/         # GitHub Actions workflows
|-- docs/plans/                # Planning and implementation documents
|-- client/                    # Next.js frontend
|   |-- src/
|   |   |-- app/               # App Router pages and layouts
|   |   |-- components/        # UI, forms, and layout components
|   |   |-- context/           # Auth and theme providers
|   |   |-- hooks/             # Frontend hooks
|   |   |-- lib/               # API, socket, constants, utilities
|   |   `-- types/             # Frontend TypeScript types
|   |-- package.json
|   |-- next.config.ts
|   `-- tsconfig.json
|-- server/                    # Express API server
|   |-- src/
|   |   |-- config/            # Environment, database, Socket.io setup
|   |   |-- controllers/       # Request handlers and tests
|   |   |-- middleware/        # Auth, validation, rate limit, error handling
|   |   |-- models/            # Mongoose schemas
|   |   |-- routes/            # API routes
|   |   |-- scripts/           # Seed scripts
|   |   |-- services/          # Analytics and business logic
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
npm install --prefix client
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

Current backend coverage includes health, district routes, analytics routes, role protection, seed data integrity, and selected edge cases.

## Build

Build the backend:

```bash
npm run build --prefix server
```

Build all configured workspaces:

```bash
npm run build
```

Lint the frontend:

```bash
npm run lint --prefix client
```

## Continuous Integration

GitHub Actions is configured in:

```text
.github/workflows/ci.yml
```

The workflow is intended to install dependencies, build the backend, and run the backend test suite on pushes and pull requests.

It also installs and builds the frontend client.

## Development Rule

Build one small unit, test it immediately, fix failures, verify edge cases, then move to the next unit.
