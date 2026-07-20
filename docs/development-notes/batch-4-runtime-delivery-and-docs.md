# Pathly — Batch 4 Summary (Runtime Delivery, Documentation & Deployment Prep)

> **Development note, not current status.** This is a point-in-time log of what Batch 4 changed and found, kept for project history. A later stabilization batch fixed a real bug this report didn't yet know about (a missing `path` import in the image-upload middleware) and corrected some README claims. The root [`README.md`](../../README.md) is the authoritative description of the project's current state.

## 1. Branch and HEAD

Branch: `claude/batch4-runtime-delivery`, created from Batch 3's HEAD (`8c0e10c`).
Final HEAD after this batch: `53dbccb`.
Checkpoint saved before any change: `refs/checkpoints/pre-batch4-runtime-delivery` → `8c0e10c`.
`main` was never touched — still at `5ccf5f8`, exactly where it was before Batch 1 started. Not merged, not force-pushed, nothing reset or discarded.

## 2. Commits (newest first)

- `53dbccb` — chore: prepare client and server for deployment
- `8ab3750` — docs: add environment examples and project README
- `2ce54b4` — fix: resolve final runtime integration issue (PORT fallback mismatch)
- `d56735e` — test: add manual two-user happy-path test plan
- `c1341c8` — fix: hide unfinished features from MVP navigation

## 3. Files changed

- `client/src/components/layout/Navbar.jsx`, `Footer.jsx`, `client/src/pages/Home.jsx`, `client/src/index.css` — removed every link to `/map` and `/profile` from the primary nav, footer, and homepage; deleted the homepage's "coming soon" map-showcase section and its now-orphaned CSS.
- `MANUAL_TEST_PLAN.md` (new) — the full two-user happy-path + edge-case + cascade-delete checklist, for you to run against your real database.
- `server/server.js` — fixed a `PORT` fallback mismatch (was `5000`, everything else assumes `3000`).
- `README.md` — replaced the one-line template with a complete project README.
- `client/.env.example` (new) — documents `VITE_API_URL`.
- `server/package.json` — added `engines.node`.
- `server/Procfile` (new) — Heroku process declaration.
- `client/vercel.json`, `client/public/_redirects` (new) — SPA fallback routing for Vercel/Netlify.

## 4 & 5. Exact runtime tests performed, and exact results

**I could not run the live two-user happy-path test in this batch, and I want to be completely direct about that rather than let it get lost in the rest of the report.**

Per your instruction ("if the local environment cannot access the database, stop and report the exact error instead of continuing as if runtime verification passed"), here is exactly what I did and found:

1. Inspected `server/.env` without printing secret values. Confirmed `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `PORT` are all present. `CLIENT_URL=http://localhost:5173` correctly matches the Vite frontend's default origin. `client/.env` contains `VITE_API_URL=http://localhost:3000/api`, matching the backend's port.
2. Parsed `MONGO_URI` far enough to confirm (without exposing credentials) that it is a plain `mongodb://` connection to `localhost:27017` — i.e., **your own machine's local MongoDB**, not a cloud database.
3. Attempted to connect from within this sandbox: `mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 6000 })`.
   **Exact result:** `MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`.

This is not a bug in Pathly. It's an inherent limitation of the environment I run in: this assistant executes inside an isolated Linux sandbox, separate from your computer. "localhost:27017" inside that sandbox refers to the sandbox itself, which has no MongoDB running on it — it has no network path to the MongoDB running on your actual machine. No code change can fix this; I could only either (a) get you a database I *can* reach (e.g., a MongoDB Atlas cluster, which is on the public internet), or (b) hand you a checklist to run yourself, which is what `MANUAL_TEST_PLAN.md` is for.

Because of this, **none of section 3's two-user happy-path steps, section 4's delete/cascade-cleanup steps, or section 5's "browser console / server console" checks were executed.** Every one of those remains unverified by me in this batch — verified only by direct code reading (same as Batches 2 and 3). I did not run `npm run dev` for both servers together, did not register any test accounts, did not open a browser against a live app, and did not perform any of the visual/manual QA described in section 5. Saying otherwise would be exactly the dishonesty you told me not to commit.

What I *did* verify by direct code reading this batch (not runtime): re-confirmed the cascade-delete logic (`server/utils/cascadeDelete.js`, `mediaCleanup.js`) is unchanged and still wired into `tripController.deleteTrip`, `locationController.deleteLocation`, `memoryController.deleteMemory`; re-confirmed the authorization checks on every location/memory read and write route; and traced the Join Trip flow end-to-end in code (`tripController.joinTrip` → `JoinTripModal.jsx` → `tripsSlice.joinTrip`).

## 6. Bugs discovered and fixed

Only one genuine runtime-relevant bug was found in this batch (beyond the nav/content issues, which were UX cleanup rather than bugs):

- **`server/server.js` PORT fallback mismatch.** The server defaulted to port `5000` when `PORT` was unset, while `server/.env.example` documents `PORT=3000` and the client's Axios base URL falls back to `http://localhost:3000/api`. A checkout without a `.env` file (or with `PORT` accidentally omitted) would have the backend silently bind to `5000` while the frontend tried to reach `3000` — producing what looks like a CORS or "backend is down" failure. Fixed by changing the fallback to `3000`. This was found by config auditing, not by reproducing the failure live (I couldn't run both servers together — see §4).

No other runtime bugs were found in this batch. That is a much weaker statement than "the app works end-to-end," though — static reading catches inconsistencies like the one above, but cannot catch every class of bug (e.g., a Mongoose query that's syntactically fine but returns the wrong documents under real data). That's exactly why `MANUAL_TEST_PLAN.md` exists.

## 7. What remains unverified

Everything in sections 3, 4, and 5 of your instructions: the full two-user happy path, all the edge cases (invalid invite code, oversized image, expired JWT, JWT for a deleted user, etc.), all four delete/cascade-cleanup scenarios, and the entire browser-based manual QA pass across all nine pages at desktop and mobile widths. None of it was executed against a running app. `MANUAL_TEST_PLAN.md` is the exact checklist to close this gap — it should take you well under 30 minutes to run once both servers are up locally.

## 8. Official course-requirements audit

| Requirement | Status | Evidence | Action taken |
| --- | --- | --- | --- |
| Node.js | Passed | `server/package.json`, `server/server.js` | None needed |
| Express | Passed | `server/app.js` (Express 5.2.1) | None needed |
| REST API | Passed | `server/routes/*.js`, mounted under `/api` in `app.js` | None needed |
| Full CRUD | Passed | Users: `GET/PUT/DELETE /api/users/:id`; Trips: `POST/GET/PUT/DELETE /api/trips`; Locations: `POST/GET/PUT/DELETE /api/locations`; Memories: `POST/GET/PUT/DELETE /api/memories` | None needed |
| Middleware | Passed | `server/middleware/{authMiddleware,validate,upload,errorHandler,rateLimiter,memoryAuth}.js` | None needed |
| Global error handler | Passed | `server/middleware/errorHandler.js`, registered last in `app.js` | None needed |
| Joi server-side validation | Passed | `server/validation/*.js` + `validate.js` middleware, `stripUnknown: true` | None needed |
| Clean Controllers/Routes/Models separation | Passed | `server/{controllers,routes,models,middleware,validation,utils}/` | None needed |
| MongoDB | Passed | `server/config/db.js`, `MONGO_URI` | None needed |
| Mongoose | Passed | `mongoose` 9.6.2 in `server/package.json` | None needed |
| Multiple collections | Passed | `server/models/{User,Trip,Location,Memory}.js` — 4 collections | None needed |
| Relationships via ObjectId references | Passed | `Location.trip→Trip`, `Location.createdBy→User`, `Memory.location→Location`, `Memory.createdBy→User`, `Trip.createdBy/participants→User` | None needed |
| Register | Passed | `POST /api/auth/register` | None needed |
| Login | Passed | `POST /api/auth/login` | None needed |
| bcrypt password hashing | Passed | `server/models/User.js` pre-save hook, `bcrypt.hash(password, 10)` | None needed |
| JWT | Passed | `jsonwebtoken`, `server/utils/generateToken.js` | None needed |
| Protected backend routes | Passed | `protect` middleware on nearly every route | None needed |
| Protected frontend routes | Passed | `client/src/components/common/ProtectedRoute.jsx` | None needed |
| Password never returned | Passed | `select: false` on schema + explicit exclusion in controllers (verified Batch 1) | None needed |
| Secrets only in env variables | Passed | `server/.env` untracked; `.gitignore` excludes it; `.env.example` files have placeholders only | None needed |
| React SPA | Passed | `client/` (Vite + React Router) | None needed |
| Components | Passed | `client/src/components/{layout,trips,memories,common}/` | None needed |
| React Router | Passed | `react-router-dom` 7.18.1, `client/src/App.jsx` | None needed |
| useState | Passed | Used throughout `pages/`, `components/`, `context/` | None needed |
| useEffect | Passed | Used throughout `pages/`, `components/`, `context/` | None needed |
| Axios | Passed | `client/src/services/api.js` | None needed |
| Frontend form validation | Passed | e.g. `CreateTrip.jsx`, `AddLocation.jsx`, `TripDetails.jsx`/`LocationDetails.jsx` edit forms all check required fields client-side before submitting | None needed |
| Loading states | Passed | `loader-spinner` pattern in `MyTrips`, `TripDetails`, `LocationDetails`, `MemoriesSection`, etc. | None needed |
| Error states | Passed | `form-error`, `trips-error-state`, `locations-error-state`, memory error states | None needed |
| Empty states | Passed | Empty trips list, empty locations list, empty memories list, all with friendly copy + CTA | None needed |
| Context API for auth | Passed | `client/src/context/AuthContext.jsx` | None needed |
| Redux for domain state | Passed | `client/src/store/slices/{tripsSlice,memoriesSlice}.js` | None needed |
| Both active in final happy path | Passed (by code tracing, not live run) | `ProtectedRoute`/`Navbar` read `AuthContext`; `MyTrips`/`TripDetails`/`LocationDetails` dispatch Redux thunks | None needed |
| Multer image upload | Passed | `server/middleware/upload.js`, `POST /api/memories/:id/images` | None needed |
| Dynamic media display in React | Passed | `resolveMediaUrl()` in `client/src/services/api.js`, used by `MemoryCard`, `TripCard`, `LocationCard`, `LocationDetails` | None needed |
| React.lazy | Passed | Every page in `client/src/App.jsx` is `lazy()`-loaded | None needed |
| Suspense | Passed | `<Suspense fallback={<PageLoader />}>` in `App.jsx` | None needed |
| React.memo | Passed | `TripCard.jsx`, `LocationCard.jsx`, `MemoryCard.jsx` | None needed |
| Responsive UI | Passed | 9 CSS files contain `@media` breakpoints covering every page | None needed |
| Clean folder structure | Passed | See README's folder-structure section | None needed |
| README | Passed | Root `README.md` — was a 1-line template, now complete | **Fixed this batch** |
| Production deployment configuration | Passed | `server/Procfile`, `server/package.json` `engines`, `client/vercel.json`, `client/public/_redirects`, both `.env.example` files | **Added this batch** |
| Working frontend and backend URLs | **Missing** | No live deployment exists yet | Not addressed — deployment is intentionally not performed until you've run the local happy-path test yourself (see §9/§10) |

Only one item is genuinely missing: live, working URLs, because the app hasn't been deployed yet (correctly, per your own instruction not to deploy before the happy path passes locally).

## 9. Remaining mandatory blockers

1. **The two-user happy-path test has not actually been run.** This is the one thing standing between "should work" and "confirmed working." Run `MANUAL_TEST_PLAN.md` — it's the single highest-value thing left to do before a demo or submission.
2. Nothing else is blocking. No missing backend/frontend requirement, no known broken feature.

## 10. Deployment readiness

**Not deployed, and I did not attempt to deploy — matching your explicit instruction not to until the local happy path passes.**

Prep work is done: `server/Procfile`, `server/package.json` `engines.node`, `client/vercel.json` and `client/public/_redirects` for SPA routing, both `.env.example` files, and a documented CORS/PORT/media-URL setup that already reads everything from environment variables (nothing hardcoded except the central, allowed dev fallbacks in `client/src/services/api.js`).

Per your instruction to report rather than silently swap platforms: the course requirement is Vercel/Netlify for frontend and Heroku for backend, and nothing here makes Heroku impractical — it's a standard Node app. The only wrinkle is that this repo is a monorepo (`client/` and `server/` as siblings with no root `package.json`), so a plain `git push heroku main` from the repo root won't find anything to build. README.md's Deployment section documents the two standard fixes for that (subtree push, or the monorepo buildpack) — no code restructuring was done to work around it, since restructuring the repo layout felt like more architectural change than this batch called for.

One thing worth flagging before you deploy: Heroku's filesystem is ephemeral, so uploaded memory images (stored via Multer on local disk) will not survive a dyno restart or redeploy. Fine for a live class demo, not for long-term data — documented in the README's Known Limitations.

## 11. Temporary test data cleanup status

**No temporary test data was created**, because no live test run occurred (see §4). There is nothing to clean up on my end. When you run `MANUAL_TEST_PLAN.md` yourself, its final section is a cleanup checklist for exactly this purpose — delete the two test accounts and confirm no test trips/locations/memories or orphaned files remain under them.

## 12. Updated completion percentages

These are code-completeness estimates based on static review across all four batches, not confirmation that everything works live end-to-end (see §7 for what's actually unverified).

- **Backend: ~95%.** Every course-required piece is in place and internally consistent (routes, validation, auth, authorization, cascade delete, error handling). The 5% gap is exclusively "hasn't been proven against a live database in this environment," not a known missing feature.
- **Frontend: ~95%.** All required pages, states, and patterns exist; nav cleanup removed the last rough edge (unfinished features exposed in primary navigation). Same caveat — not yet exercised in a real browser against a live backend.
- **Overall: ~90–95%.** The main gap to 100% is entirely the missing live verification pass (§7) and the not-yet-performed deployment (§10), both of which are things only you can complete from your own machine or Heroku/Vercel account.

## 13. Exact recommended next step

**Run `MANUAL_TEST_PLAN.md` yourself, right now, before anything else.** It's the one piece of confidence no amount of code reading can substitute for, and it should only take you 15–30 minutes. If it passes: merge `claude/batch4-runtime-delivery` into `main` yourself (I did not, per your instructions), then deploy using README.md's Deployment section. If it surfaces a bug: tell me what you saw and I'll fix it directly rather than guessing — that'll be faster than another full audit round.

## 14. Known harmless artifact (unchanged from prior batches)

`git status --short` still shows a stat-cache mismatch for some previously-unrelated files after certain git operations in this sandbox — `git diff`/`git diff HEAD` confirm it's cosmetic every time it's checked. Documented in Batches 2 and 3; not something to act on.
