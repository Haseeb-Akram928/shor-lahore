# Development Flow

## Main Rule
Build one small unit, test it immediately, fix it, then move on.

Never build many files first and test later.

## Backend Flow
1. Create schema/model or helper.
2. Add focused tests.
3. Run the relevant backend test command.
4. Fix failures.
5. Add edge case tests.
6. Move to the next route/service/controller only after verification.

Recommended order:
1. config/env
2. config/db
3. utils
4. types
5. models
6. validators
7. middleware
8. services
9. controllers
10. routes
11. app/server wiring

## Frontend Flow
1. Build one reusable component.
2. Verify default, loading, empty, error, disabled, long text, mobile, and desktop states.
3. Integrate the component into a page.
4. Verify the full page in browser.
5. Fix visual or state bugs before moving on.

Mobile verification is mandatory. Check at least 320px and 375px widths before considering any page complete.

Recommended order:
1. design tokens/global CSS
2. UI primitives
3. layout components
4. forms
5. map components
6. charts
7. pages

## Final Check
Every task must end with:
- what changed
- what was tested
- what could not be tested, if anything
