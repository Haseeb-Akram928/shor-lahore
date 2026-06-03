# AGENTS.md

## Required First Step
Before coding, read these files:
1. `PROJECT_CONTEXT.md`
2. `DEVELOPMENT_FLOW.md`
3. `TESTING_RULES.md`
4. `CODE_STYLE.md`
5. `ARCHITECTURE.md`
6. Current phase plan in `docs/plans/`

## Operating Rules
Answer only what is needed. Make the smallest useful change, verify it, and report the result briefly.

## Before Building
1. Read the relevant plan files and existing code.
2. Follow the current project structure and naming conventions.
3. Do not invent new libraries or abstractions unless the plan or codebase clearly needs them.
4. Keep implementation scoped to the requested phase/task.

## Component Creation Workflow
For every frontend component:
1. Define its purpose, props, states, and data dependencies before coding.
2. Build the component with clear separation between UI, data fetching, and formatting logic.
3. Include all expected states:
   - default
   - loading
   - empty
   - error
   - disabled
   - active/selected
   - overflow/long text
   - mobile and desktop layouts
4. Use accessible controls and labels.
5. Use existing design tokens, CSS variables, and component patterns.
6. Prefer lucide icons for icon buttons where available.
7. Avoid explanatory in-app text about how the UI works.
8. Make the actual usable app screen first; do not replace product UI with a marketing page.

## Backend Creation Workflow
For every API feature:
1. Add validation before controller logic.
2. Keep business rules in services where practical.
3. Return consistent JSON responses.
4. Protect routes with auth and role middleware where required.
5. Handle missing records, invalid IDs, invalid query params, duplicate data, and permission failures.
6. Keep `app.ts` importable for tests without starting the HTTP server.

## Testing Requirements
Every feature must be tested before being considered complete.

Backend tests must cover:
- success path
- invalid payloads
- missing required fields
- boundary values
- duplicate records
- unauthorized requests
- forbidden role access
- missing records
- database/query edge cases
- expected cookie/token behavior for auth

Frontend tests or browser verification must cover:
- default render
- loading state
- empty state
- error state
- disabled controls
- form validation errors
- long text and overflow
- mobile viewport
- small mobile viewport at 320px width
- desktop viewport
- keyboard/accessibility basics

No frontend page is complete until it has been checked on small mobile widths and has no horizontal overflow, clipped controls, or overlapping text.

## Edge Case Checklist
Always check:
- empty arrays
- null or undefined values
- invalid enum values
- min/max numeric boundaries
- malformed coordinates
- out-of-range Lahore coordinates
- expired or tampered JWTs
- network/API failure
- slow loading
- duplicate user actions such as double submit or duplicate upvote

## Verification Commands
Use the narrowest command that proves the change:
- Backend: `npm run test --prefix server`
- Backend build: `npm run build --prefix server`
- Frontend build: `npm run build --prefix client`
- Full build: `npm run build`

If a command cannot run because dependencies are missing or network access is blocked, report that clearly and do not claim verification passed.

## Completion Standard
A task is complete only when:
1. The requested code or document change exists.
2. Expected success and failure states are handled.
3. Relevant tests or verification were run, or the reason they could not run is stated.
4. The final response summarizes only the important result.
