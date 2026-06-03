# Architecture

## Root
```text
NoisePollutionMapper/
├── AGENTS.md
├── PROJECT_CONTEXT.md
├── DEVELOPMENT_FLOW.md
├── TESTING_RULES.md
├── CODE_STYLE.md
├── ARCHITECTURE.md
├── .agent/
├── docs/
├── server/
└── client/
```

## Backend Target Structure
```text
server/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── sockets/
│   ├── test/
│   ├── types/
│   ├── utils/
│   ├── validators/
│   ├── app.ts
│   └── server.ts
├── package.json
├── tsconfig.json
├── nodemon.json
└── .env.example
```

## Frontend Target Structure
```text
client/
├── src/
│   ├── app/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── map/
│   │   ├── report/
│   │   └── charts/
│   ├── context/
│   ├── lib/
│   └── styles/
├── package.json
└── next.config.ts
```

## Backend Request Flow
Request -> route -> validation middleware -> auth middleware if needed -> controller -> service -> model -> response/error middleware

## Frontend Data Flow
Page -> data hook/API client -> stateful container -> presentational component -> UI primitives
