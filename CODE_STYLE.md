# Code Style

## General
- TypeScript strict everywhere.
- Small focused files.
- Clear names over clever abstractions.
- No unused code.
- No new libraries without a clear reason.
- Pin package versions through lockfiles after install.

## Backend
- Route files define endpoints only.
- Controllers handle HTTP request/response shape.
- Services contain business logic.
- Models contain schema/index definitions.
- Validators use Zod.
- Middleware handles auth, validation, rate limits, and errors.
- `app.ts` must not connect to DB or listen on a port.
- `server.ts` owns DB connection, HTTP server, and Socket.io startup.
- Return consistent JSON responses:

```json
{
  "success": true,
  "data": {}
}
```

```json
{
  "success": false,
  "message": "Readable error message"
}
```

## Frontend
- Use Next.js App Router.
- Prefer CSS Modules or existing CSS variables.
- Components must accept state through props where practical.
- Keep data fetching separate from presentational UI when useful.
- Use lucide icons for buttons/icons.
- Do not use large marketing-only pages when a usable app screen is expected.
- Avoid one-note purple/indigo gradient UI.
- Avoid nested cards and decorative filler.
- Text must not overflow or overlap on mobile/desktop.
- Design mobile-first. Every page must work cleanly at 320px width.
- Avoid fixed widths that break small screens.
- Use responsive grids, wrapping controls, collapsible panels, and scroll containers where appropriate.
- Touch targets should be comfortable on mobile.
