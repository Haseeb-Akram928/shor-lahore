# Testing Rules

## Rule
Tests are part of the feature, not a separate later phase.

## Backend Test Coverage
Every API feature must cover:
- success path
- invalid payload
- missing required fields
- invalid enum values
- min/max boundary values
- duplicate records
- unauthorized request
- forbidden role access
- missing record
- invalid MongoDB id
- database/query edge case
- cookie/JWT behavior where auth is involved

## Frontend Verification
Every reusable component/page must cover:
- default state
- loading state
- empty state
- error state
- disabled state
- selected/active state
- validation errors
- long text/overflow
- mobile viewport
- small mobile viewport at 320px width
- desktop viewport
- keyboard basics

## Responsive Requirements
Every frontend screen must be verified at:
- 320px width
- 375px width
- 768px width
- 1024px width
- 1440px width

Small-device checks must confirm:
- no horizontal scrolling
- no text overlap
- no clipped buttons
- no hidden required actions
- forms are usable without zooming
- map controls remain reachable
- tables become scrollable, stacked, or card-like
- sidebars collapse properly
- modals fit within viewport height
- touch targets are large enough

## Edge Cases
Always check:
- empty arrays
- null/undefined values
- malformed coordinates
- out-of-range coordinates
- invalid dates
- slow API
- failed API
- duplicate submit
- duplicate upvote
- expired/tampered JWT

## Commands
- Backend tests: `npm run test --prefix server`
- Backend build: `npm run build --prefix server`
- Frontend build: `npm run build --prefix client`
- Full build: `npm run build`

If dependencies are missing, install only what the current phase needs.
