# Backend Rules

1. Keep `app.ts` testable and side-effect-light.
2. Put DB connection and listen logic in `server.ts`.
3. Validate input with Zod before controllers.
4. Keep controllers thin.
5. Put business logic in services.
6. Use Mongoose indexes for geospatial queries.
7. Use consistent JSON responses.
8. Test each endpoint immediately after implementation.
9. Test auth, validation, duplicate data, missing data, and permission failures.
