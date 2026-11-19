# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- **Presentation tier:** Keep pages focused on rendering and user interaction; use the shared API client for relative `/api` requests. Show accessible loading, empty, and error states on every capability page.
- **Logic tier:** Keep HTTP validation and response handling in Express routes/services. Validate request shape and ObjectId syntax before database queries, and return deliberate 4xx responses for invalid or missing resources rather than leaking cast errors as 500s. Do not add authentication.
- **Data tier:** Use Mongoose models with required fields and references for users, teams, activities, and workouts. Keep seed data idempotent and preserve records that are not owned by the seed fixtures.
- **Activity tracking:** Accept `userId`, `teamId`, `type`, and positive `minutes`; require existing user/team references, store them as `user` and `team`, calculate `points` from minutes, and set `occurredAt` on creation.
- **Team management:** Preserve submitted team names and mascots, store member references as ObjectIds, default omitted members to an empty list, and reject a missing name with `400`.
- **Leaderboard:** Aggregate activity points by team, sort highest total first with a deterministic team-name tie-break, and assign ranks starting at 1.
- **Workout suggestions:** Find the user by email and prioritize workout focus matching their recent activity; when there is no relevant activity, use their fitness goal. Explain the selected focus in the suggestion reason and return a 4xx for an unknown email.

## Test plan

Run the narrow contract tests while implementing each tier, then build both packages. A passing test/build command exits successfully; failures indicate the following contract or integration area needs attention:

- **Data tier:** `npm run test:data --prefix octofit-tracker/backend` — schema validation failures point to missing constraints/defaults; seed failures point to incomplete fixtures, broken relationships, non-idempotent behavior, or unintended changes to unrelated records.
- **API logic:** `npm run test:api --prefix octofit-tracker/backend` — failures point to incorrect status codes or response shapes, invalid-reference handling, activity persistence, leaderboard aggregation/ranking, or workout recommendation behavior.
- **Presentation:** `npm test --prefix octofit-tracker/frontend` — failures point to API integration or missing rendered data, accessible loading/error states, or meaningful empty states.
- **Backend build:** `npm run build --prefix octofit-tracker/backend` — TypeScript errors indicate backend type or module integration problems.
- **Frontend build:** `npm run build --prefix octofit-tracker/frontend` — TypeScript or Vite errors indicate frontend type, import, or bundling problems.

Baseline contract-test run on 2026-11-19: data tests failed 4/5 (required model fields); API tests failed 4/4 (invalid requests returned `501`, leaderboard was empty, and a suggestion did not match the user's activity); frontend tests failed 15/15 (pages remained at the implementation-pending state). Re-run these commands after implementation and update this baseline with the results.
