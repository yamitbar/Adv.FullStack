# Pathly

Pathly is a collaborative travel-memory journal. A user creates a **trip**, adds the **locations** they visited during it, and attaches **memories** (text and photos) to each location. Trips can be shared with other travelers through an invite code, so a group can build the same travel journal together.

Built as a university full-stack final project on the MERN stack (MongoDB, Express, React, Node.js).

## MVP feature list

- Email/password registration and login, with a JWT-protected session.
- Create, view, edit, and delete trips.
- Invite other registered users to a trip with a short invite code; joined users become trip participants.
- Create, view, edit, and delete locations within a trip (full address, visit date, optional custom title and cover image — no map coordinates or place metadata are collected or shown).
- Create, view, edit, and delete text memories attached to a location.
- Upload one or more photos to a memory (JPEG/PNG/WebP, up to 5 images per request, 5MB each).
- Authorization enforced at every read/write endpoint: only a trip's creator and participants can see or modify its locations and memories; only a memory's/location's own creator can edit or delete it.
- Deleting a trip cascades to its locations, their memories, and any uploaded image files. Deleting a location cascades to its memories and their images.
- Responsive UI across desktop and mobile viewports, with loading/empty/error states throughout.

**Not included in this MVP** (explicitly out of scope): interactive maps, Google Places integration, weather, video memories, comments, notifications, profile statistics/pages, advanced sharing/permissions, and real-time features. Earlier drafts had placeholder routes for some of these (`/map`, `/profile`); those have since been removed from the router entirely rather than left as unfinished pages.

## Tech stack

**Backend:** Node.js, Express 5, MongoDB with Mongoose 9, JWT (`jsonwebtoken`), `bcrypt`, `joi` for validation, `multer` for file uploads, `helmet` and `express-rate-limit` for security, `cors`.

**Frontend:** React 19 (Vite), React Router 7, Redux Toolkit, React Context (auth), Axios, `lucide-react` icons.

## Architecture

```
React frontend (Vite dev server / static build)
        │  Axios, JWT in Authorization header
        ▼
Express REST API (server/)
        │  Mongoose
        ▼
MongoDB (local mongod, or MongoDB Atlas in production)
```

The frontend never talks to MongoDB directly — every read/write goes through the Express REST API, which owns all validation and authorization.

## Folder structure

```
Adv.FullStack/
├── client/                  React app (Vite)
│   ├── public/               Static assets, Netlify _redirects
│   ├── src/
│   │   ├── components/       Reusable UI (layout, trips, memories, common)
│   │   ├── context/          AuthContext (Context API)
│   │   ├── pages/             Route-level pages
│   │   ├── services/          Axios instance + media URL helper
│   │   └── store/             Redux Toolkit store + slices
│   ├── .env.example
│   └── vercel.json           Vercel SPA rewrite config
├── server/                  Express API
│   ├── config/                db.js (Mongoose connection)
│   ├── controllers/           Route handlers, one file per resource
│   ├── middleware/            auth, validation, upload, error handler, rate limiting
│   ├── models/                Mongoose schemas (User, Trip, Location, Memory)
│   ├── routes/                Express routers, one file per resource
│   ├── utils/                 Shared helpers (cascade delete, media cleanup, trip membership, tokens)
│   ├── validation/            Joi schemas
│   ├── uploads/                Uploaded memory images (gitignored)
│   ├── .env.example
│   └── Procfile               Heroku process declaration
└── api-tests.rest           REST Client scratch file for manual API testing
```

## Local prerequisites

- Node.js 18 or later, npm.
- A running MongoDB instance reachable from the backend — either a local `mongod` (e.g. `mongodb://localhost:27017/pathly`) or a MongoDB Atlas cluster connection string.

## Server setup

```bash
cd server
npm install
cp .env.example .env   # then fill in the real values, see below
npm run dev             # nodemon, restarts on change
# or
npm start                # plain node, for production-style runs
```

The server refuses to accept requests until the MongoDB connection succeeds (see `server/server.js` / `server/config/db.js`), and logs the exact connection error if it cannot connect.

## Client setup

```bash
cd client
npm install
cp .env.example .env   # only needed if your API is not on http://localhost:3000/api
npm run dev              # Vite dev server, default http://localhost:5173
npm run build             # production build into client/dist
npm run preview           # serve the production build locally
```

## Environment variables

### `server/.env`

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `development` or `production`. Controls whether stack traces are included in error responses. |
| `PORT` | Port the Express server listens on. Defaults to `3000` if unset. |
| `MONGO_URI` | MongoDB connection string (local `mongodb://...` or Atlas `mongodb+srv://...`). |
| `JWT_SECRET` | Secret used to sign/verify JWTs. Must be a long random string; never commit a real value. |
| `JWT_EXPIRES_IN` | JWT lifetime, e.g. `1h`. |
| `CLIENT_URL` | The frontend's origin, used for the CORS `origin` allowlist. Must exactly match where the frontend is actually running (`http://localhost:5173` in local dev). |

### `client/.env`

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Base URL of the backend API, including the `/api` prefix, e.g. `http://localhost:3000/api`. If unset, the client falls back to `http://localhost:3000/api` (see `client/src/services/api.js`). |

Neither `.env` file is committed — only the `.env.example` templates are, and they contain no real secrets.

## Authentication flow

1. `POST /api/auth/register` creates a user with a bcrypt-hashed password and returns the created user — **it does not return a JWT.** The response never includes the password field (`select: false` on the schema, and it's excluded again explicitly in the controller). After a successful registration, the frontend redirects to `/login` with a "You can now log in" message rather than logging the user in automatically.
2. `POST /api/auth/login` verifies the password with bcrypt and returns the user together with a fresh JWT — this is the only endpoint that issues a token.
3. The client stores that JWT in `localStorage` and attaches it as `Authorization: Bearer <token>` on every request via an Axios interceptor.
4. Every non-auth route on the backend is wrapped in a `protect` middleware that verifies the JWT, loads the user, and rejects the request (401) if the token is missing, invalid, expired, or belongs to a user that no longer exists.
5. On the frontend, `ProtectedRoute` reads `AuthContext` and redirects unauthenticated visitors to `/login` before rendering any trip/location/memory page. A 401 response from the API also clears the stored session and redirects to `/login`.

## Main demo flow

1. Register two accounts (or use one and imagine a second).
2. Log in, create a trip from **My Trips → Create a trip**.
3. Open the trip, copy its invite code (**Share trip**).
4. Add a location to the trip (full address + optional custom title — no coordinates).
5. Open the location, add a text memory, then add another memory with photos.
6. Log in as the second account, use **Join with invite code** on **My Trips**, paste the code.
7. The second account can now see the trip, its locations, and its memories, and can add their own memory — but cannot edit or delete the first account's trip, locations, or memories (creator-only controls simply don't render for them).

## Main API endpoints

All routes below except register/login require `Authorization: Bearer <token>`.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Log in, get a JWT |
| GET | `/api/auth/me` | Get the current user |
| GET | `/api/users` | List all users (admin only) |
| GET / PUT / DELETE | `/api/users/:id` | Read/update/delete a user (self or admin only) |
| POST | `/api/trips` | Create a trip |
| GET | `/api/trips` | List the current user's trips |
| GET / PUT / DELETE | `/api/trips/:id` | Read/update/delete a trip (member-only read, creator-only write) |
| POST | `/api/trips/join` | Join a trip by invite code |
| POST | `/api/trips/:tripId/locations` | Create a location in a trip |
| GET | `/api/trips/:tripId/locations` | List a trip's locations |
| GET / PUT / DELETE | `/api/locations/:id` | Read/update/delete a location |
| POST | `/api/locations/:locationId/memories` | Create a memory on a location |
| GET | `/api/locations/:locationId/memories` | List a location's memories |
| GET / PUT / DELETE | `/api/memories/:id` | Read/update/delete a memory |
| POST | `/api/memories/:id/images` | Upload up to 5 images to a memory |
| DELETE | `/api/memories/:id/images/:filename` | Remove one uploaded image from a memory |

The full request/response set (including negative-path examples like missing tokens and invalid data) is documented in `api-tests.rest` at the repo root — open it with the VS Code REST Client extension.

## Uploads and media

Memory images are stored on the server's local disk (`server/uploads/`, created automatically on startup) via Multer, and served back as static files at `/uploads/<filename>`. The frontend never constructs upload URLs itself — it always goes through `resolveMediaUrl()` in `client/src/services/api.js`, which combines the API's origin with the stored relative path, so the same code works against `localhost` in development and a real deployed API URL in production.

Only `image/jpeg`, `image/png`, and `image/webp` are accepted; uploads are capped at 5MB per file and 5 files per request, and any files written to disk during a request that ultimately fails validation are rolled back rather than left orphaned. Deleting a memory or a location/trip that owns memories removes their image files from disk, not just their database records.

**Note on deployment:** Heroku's filesystem is ephemeral — files written to `server/uploads/` will not survive a dyno restart or redeploy. This is fine for a live class demo but not for long-term storage; see Known Limitations.

## State management

- **Context API** (`client/src/context/AuthContext.jsx`) owns authentication: the current user, login/register/logout actions, and session restoration from `localStorage` on page load.
- **Redux Toolkit** (`client/src/store/`) owns domain data: trips (`tripsSlice.js`) and memories (`memoriesSlice.js`), each with independent per-operation loading/error state (e.g. creating a trip and deleting a different trip don't share a single global "loading" flag).

Both are active in the same happy path: `ProtectedRoute` and the navbar read `AuthContext`, while `MyTrips`, `TripDetails`, and `LocationDetails` dispatch Redux thunks and read the Redux store.

## Security measures

- Passwords hashed with bcrypt; never returned in any API response.
- JWT-based auth on every protected route; `protect` middleware rejects missing/invalid/expired tokens and tokens for deleted users.
- All request bodies validated with Joi (`stripUnknown: true`), so unexpected fields (like a spoofed `role` or raw coordinates) are silently dropped rather than trusted.
- Authorization checked on every read and write, not just writes — trip membership is required to view a trip's locations/memories, and only a resource's own creator can edit or delete it.
- `helmet` for standard security headers, `express-rate-limit` on `/api` generally and more strictly on `/api/auth/login` and `/api/auth/register`.
- File uploads restricted by MIME type, size, and count; upload authorization runs *before* Multer writes anything to disk.
- Secrets (`JWT_SECRET`, `MONGO_URI`) live only in untracked `.env` files; `.gitignore` excludes `.env`, `uploads/`, `node_modules/`, and `dist/`.

## Known limitations

- Uploaded images are stored on local disk, which does not persist across Heroku dyno restarts/redeploys (see Uploads and media above).
- No automated test suite (unit/integration tests) exists yet — verification has been manual/exploratory (see Testing section).
- No map view, Google Places integration, video memories, comments, notifications, or user profile/statistics page — these were intentionally descoped for this MVP (see MVP feature list above), not partially built or pending.
- No password-reset or email-verification flow.

## Future improvements

- Move uploaded images to persistent object storage (e.g. S3-compatible bucket) so they survive redeploys.
- Add a map view and a profile/statistics page (out of scope for this MVP; see Known limitations).
- Add automated backend (Jest/Supertest) and frontend (Vitest/RTL) tests.
- Add pagination for trips/locations/memories lists as data volume grows.

## Deployment

Not yet deployed. This section documents the intended setup; fill in the URLs once live.

- **Frontend:** _placeholder — Vercel or Netlify URL once deployed_
- **Backend:** _placeholder — Heroku URL once deployed_

### Backend (Heroku)

The repository is a monorepo with the Express app in `server/`, so a plain `git push heroku main` from the repo root will not find a root `package.json`. Deploy the `server/` subdirectory as the Heroku app root using either:

```bash
# Option A: subtree push (from the repo root)
git subtree push --prefix server heroku main

# Option B: Heroku's monorepo buildpack, then set:
heroku buildpacks:add -a <app-name> https://github.com/lstoll/heroku-buildpack-monorepo
heroku config:set -a <app-name> APP_BASE=server
```

Either way, set these Heroku config vars before deploying: `MONGO_URI` (an Atlas connection string — Heroku dynos can't reach a laptop's local MongoDB), `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL` (the deployed frontend's real origin), and `NODE_ENV=production`. Do **not** set `PORT` — Heroku injects it automatically, and `server.js` already reads `process.env.PORT`.

`server/Procfile` (`web: node server.js`) and `server/package.json`'s `engines.node` field are already in place for Heroku's Node buildpack. The `/` route (`GET /`) returns a simple 200 text response and can be used as a health check.

### Frontend (Vercel or Netlify)

Set the project's root directory to `client/` in the platform's dashboard (both Vercel and Netlify support this natively for monorepos). Set the build command to `npm run build`, the output directory to `dist`, and add the environment variable `VITE_API_URL` pointing at the deployed backend, e.g. `https://<your-heroku-app>.herokuapp.com/api`.

SPA fallback routing (so refreshing `/trips/:id` doesn't 404) is already configured: `client/public/_redirects` for Netlify, `client/vercel.json` for Vercel.

## Testing / manual verification

There is no automated test suite. What follows is deliberately split into three categories, because they carry very different levels of confidence — do not read "runtime API verification" as the same thing as "browser QA passed."

**Runtime API verification (real database, real HTTP requests).** The 32 requests in `api-tests.rest` were manually executed successfully by the project owner against a real local MongoDB instance and a real running server — this is manual execution via the VS Code REST Client extension, not an automated test run (there is no test runner or CI involved). That pass uncovered one genuine bug: `server/middleware/upload.js` was missing `const path = require("path")`, so every image upload failed at runtime with `ReferenceError: path is not defined` — an error invisible to static syntax checks, only reachable by actually calling the upload endpoint. That fix is committed. This round of testing was performed locally by the project owner, not witnessed or independently reproduced inside this assistant's sandbox (which cannot reach a local MongoDB instance — see `docs/development-notes/batch-4-runtime-delivery-and-docs.md` for why).

**Static verification (reproducible by anyone, anytime).** `node --check` on every backend file, `npm run lint` (oxlint), and `npm run build` (Vite) on the frontend. These pass as of the current commit.

**Manual browser QA: started, not completed.** Clicking through the actual UI — Home, Register, Login, My Trips, Create Trip, Trip Details, Add Location, Location Details, and the 404 page, at both desktop and mobile widths — has not been fully verified end to end. It was started but not finished (interrupted by an environment usage limit). Use `MANUAL_TEST_PLAN.md` to finish this before a live demo or submission; it's the single highest-value remaining check, and the only category of verification above that can catch UI-only issues (broken layouts, dead buttons, console errors) that neither API tests nor static checks can see.
