# 🔊 ShorLahore — Noise Pollution Crowdsourced Mapper

ShorLahore is a crowdsourced noise pollution mapping and analytics platform for **Lahore, Pakistan**. It allows residents to report local noise levels by type, intensity, time, and coordinates. Over time, the platform aggregates this data to build a living noise map of the city—featuring GPU-accelerated heatmaps, localized district analysis, and interactive dashboards to help planners, researchers, and residents make informed decisions.

---

## 🚀 Key Features

*   **Geospatial Reporting**: Drop a marker on the map to log noise occurrences using GeoJSON coordinates.
*   **Intelligent District Mapping**: Automatically matches reports to Lahore's neighborhoods (e.g., Gulberg, DHA, Walled City, Johar Town) using point-in-polygon queries.
*   **Real-time Updates**: Syncs map nodes and feeds instantly to connected users using Socket.io geo-bounding-box rooms.
*   **24-Hour Hotspot Heatmaps**: Drag a time-of-day slider to watch noise levels fluctuate dynamically across the city's grid.
*   **Admin Dashboard**: Deep analytics suite capturing hourly intensity distributions, trends, and noise type breakdowns.

---

## 🛠️ The Tech Stack

| Layer | Technology | Key Features |
| --- | --- | --- |
| **Frontend** | Next.js 15, TypeScript | App Router, Server Components, CSS Modules |
| **Mapping & Viz** | MapLibre GL, deck.gl | GPU-accelerated HeatmapLayers, Vector tiles (no API keys required) |
| **Charts** | Recharts, Nivo | Matrix grid distributions, radar metrics, area charts |
| **Backend** | Express 5, TypeScript | Native async error handlers, modular services |
| **Database** | MongoDB & Mongoose | Geospatial `2dsphere` indexes, aggregation pipelines |
| **Auth & Security** | JWT in httpOnly Cookies | BCryptjs hashing, cors, helmet, custom rate-limiters |
| **Testing** | Vitest & Supertest | Local isolated runs via in-memory Mongo database (`mongodb-memory-server`) |

---

## 📂 Project Structure

```text
NoisePollutionMapper/
├── .github/workflows/         # GitHub Actions CI pipelines
│   └── ci.yml                 # Automated building, linting, and testing workflow
├── .agent/                    # Workspace agent guidelines
├── docs/plans/                # Phase roadmaps and technical guides
├── server/                    # Express API Server (Node/TypeScript)
│   ├── src/
│   │   ├── config/            # Mongoose connections, Zod env rules, Socket.io rooms
│   │   ├── controllers/       # Route request & response handlers
│   │   ├── middleware/        # JWT auth, rate limits, Zod schema validation, global error
│   │   ├── models/            # Mongoose schemas (User, NoiseReport, District)
│   │   ├── routes/            # Modular endpoint routing (stubs)
│   │   ├── test/              # Memory Server setup and configuration
│   │   ├── types/             # Shared TypeScript structures and interfaces
│   │   ├── utils/             # ApiError models, JWT signs, password hashing
│   │   └── validators/        # Zod request validators
│   ├── tsconfig.json          # TypeScript config
│   └── nodemon.json           # Hot-reloading watcher config
├── package.json               # Root orchestrator (runs server + client concurrently)
└── .gitignore                 # Root gitignore rules
```

---

## ⚙️ Getting Started

### 📋 Prerequisites
*   [Node.js](https://nodejs.org/) (v20+ recommended)
*   [MongoDB](https://www.mongodb.com/) (Local installation or MongoDB Atlas instance)

### 🔧 Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Haseeb-Akram928/shor-lahore.git
    cd shor-lahore
    ```

2.  **Install dependencies (Root and Server):**
    ```bash
    npm install
    cd server
    npm install
    ```

3.  **Configure environment variables:**
    Copy the example template and adjust values:
    ```bash
    cp .env.example .env
    ```
    Configure your MongoDB URI and a secure, 32-character minimum JWT secret inside `server/.env`.

---

## 💻 Running the Application

### Development Servers
From the root directory, you can orchestrate development environments:

```bash
# Start backend watcher
npm run dev:server
```

---

## 🧪 Testing

The repository uses **Vitest**, **Supertest**, and an in-memory database to execute integration tests locally without modifying a live database.

Run the test suite:
```bash
npm run test --prefix server
```

The initial test run will automatically download and cache the MongoDB binary for `mongodb-memory-server`. Subsequent test runs will run in **milliseconds**.

---

## 🛡️ Continuous Integration (CI)

A continuous integration pipeline is defined in [ci.yml](file:///.github/workflows/ci.yml). On every push or pull request to the `main` branch, GitHub Actions automatically:
1.  Checks out the code.
2.  Installs all monorepo dependencies.
3.  Verifies the TypeScript compiler builds without errors.
4.  Executes the backend test suite with isolated databases.
