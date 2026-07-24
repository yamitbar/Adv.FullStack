# Pathly — Oral Defense Cheat Sheet

Short, accurate answers grounded in the actual code, not aspirational descriptions. See `docs/course-requirements-evidence.md` for exact file references.

## What is the architecture of Pathly?

A standard MERN split: a React SPA (`client/`) talks only to an Express REST API (`server/`) over HTTP/JSON, and the API is the only thing that talks to MongoDB via Mongoose. The frontend never touches the database directly. Auth is a JWT passed as `Authorization: Bearer <token>` on every request after login.

## Why use MVC (routes/controllers/models separation)?

Each resource (User, Trip, Location, Memory) has its own route file, controller file, model file, and Joi validation file. Routes only wire HTTP verbs to controller functions and middleware; controllers only contain business logic; models only define schema/relationships. This keeps authorization and validation logic in one place per resource instead of scattered across route handlers, and made it possible to fix bugs (e.g. the error-handling consistency pass) file-by-file without touching unrelated resources.

## Why Context for auth, specifically?

Auth state (current user, token, login/logout) is needed almost everywhere — the navbar, every protected route, every API call — but it changes rarely compared to trip/memory data. Context API (`AuthContext.jsx`) is a good fit for this kind of low-frequency, widely-read global state without pulling in Redux for something that doesn't need action-based updates, middleware, or time-travel debugging.

## Why Redux Toolkit for trips and memories?

Trip and memory data is fetched, created, updated, and deleted from multiple places (list pages, detail pages, cards), and each operation needs its own loading/error state so, for example, deleting one trip doesn't show a global "loading" spinner over unrelated UI. `createAsyncThunk` + `createSlice` gave a consistent, predictable pattern for that per-operation state without hand-rolling it in every component.

## How does JWT authentication work?

`POST /api/auth/login` verifies the password with bcrypt, then `generateToken(user._id)` signs a JWT with `JWT_SECRET`. The client stores it in `localStorage` and an Axios request interceptor attaches it as `Authorization: Bearer <token>` on every subsequent request. The backend's `protect` middleware verifies the token with `jwt.verify`, loads the user, and rejects the request (401) if the token is missing, invalid, expired, or belongs to a user that no longer exists.

## How are passwords protected?

`User.js`'s pre-save hook hashes the password with `bcrypt.hash(password, 10)` before it's ever written to the database, and only if the password field actually changed. The schema also marks `password` as `select: false`, so a normal `find`/`findById` never returns it; controllers additionally build an explicit safe user object rather than returning the raw document.

## How are protected routes enforced?

Two layers. Backend: every route except register/login/health goes through the `protect` middleware, which is where the actual security boundary is — the frontend gate is a UX convenience, not the real enforcement. Frontend: `ProtectedRoute.jsx` reads `AuthContext` and redirects unauthenticated visitors to `/login` before rendering a trip/location page, so there's no flash of protected content.

## How does Joi validation work?

Each resource has a Joi schema file (`server/validation/*.js`) describing exactly which fields are allowed, required, and what shape they must be. A shared `validate(schema)` middleware runs the request body through `schema.validate(req.body, { abortEarly: false, stripUnknown: true })` before the controller ever sees it — `stripUnknown` means an unexpected field (like a client trying to send `role: "admin"` or raw `lat`/`lng`) is silently dropped, not rejected or trusted.

## How does Multer upload work?

`upload.js` configures `multer.diskStorage`, writing files into `server/uploads/` with a generated unique filename (`Date.now()-random.ext`), filtered to only accept `image/jpeg`, `image/png`, `image/webp`, capped at 5MB per file and 5 files per request. The upload route runs a dedicated authorization check (`authorizeMemoryImageUpload`) *before* Multer touches the disk, so an unauthorized or non-existent memory can never cause a file write. If the following database save fails, the just-written files are deleted so nothing orphaned is left behind.

## How are uploaded images displayed?

The stored path in the database is always a relative path like `/uploads/<filename>`. The frontend never guesses or hardcodes a host — `resolveMediaUrl()` in `client/src/services/api.js` combines that relative path with the API's own configured origin (`VITE_API_URL` minus its `/api` suffix) at render time, so the exact same component code works against `localhost` in development and a real deployed URL in production. Cross-origin image loading itself required one fix: Helmet's default `Cross-Origin-Resource-Policy: same-origin` was blocking the browser from loading images off a different-origin server; that's now scoped to `cross-origin` specifically on the `/uploads` static route.

## How are Trip, Location, Memory and User related?

`Trip.createdBy` and `Trip.participants` reference `User`. `Location.trip` references `Trip`, and `Location.createdBy` references `User`. `Memory.location` references `Location`, and `Memory.createdBy` references `User`. So the ownership chain is User → Trip → Location → Memory, all via Mongoose ObjectId refs, and every read/write on a Location or Memory re-derives trip membership by walking back up that chain.

## How does Join Trip work?

Every trip has a short, unique `inviteCode` generated on creation. `POST /api/trips/join` looks up the trip by that code, checks the requesting user isn't already a participant, and pushes their id into `participants`. From then on they satisfy the trip-membership check used everywhere (`isTripMember`), so they can view and add locations/memories, but they are never the trip's `createdBy`, so creator-only controls (edit/delete trip, edit/delete someone else's location or memory) simply don't render for them and are rejected server-side if attempted directly.

## How is authorization different from authentication?

Authentication answers "who is this user" — that's the JWT/`protect` middleware layer, and it's the same check on every route. Authorization answers "is this specific user allowed to do this specific thing to this specific resource" — that's checked separately, per action, inside each controller: trip membership for reads (`isTripMember`), and exact creator match for writes (e.g. `location.createdBy.toString() === req.user._id.toString()`). A logged-in user can be authenticated but still get a 403 if they're not authorized for that particular resource.

## How does cascade deletion work?

Deleting a trip (`tripController.deleteTrip`) calls `deleteLocationsForTrip`, which finds every location under that trip, and for each one deletes its memories and any locally uploaded image files (via `mediaCleanup.js`) before deleting the location itself, then deletes the trip. Deleting a single location (`locationController.deleteLocation`) does the same at one level down — its memories and their images. This means no database record or uploaded file is ever left orphaned by a parent deletion.

## Why are coordinates/placeName/googlePlaceId internal, not user-facing?

As of this phase, they're populated by Google Places autocomplete when the user selects a suggested address (`client/src/components/locations/GoogleAddressAutocomplete.jsx`), but there's still no UI that renders them — no map page exists yet to show a pin, so displaying raw coordinates or a Place ID to the user would just be noise with no purpose. They stay internal for now and are kept optional in the `Location` schema so older records created before this phase (which have none of this data) remain valid.

## Why were maps/video/profile descoped?

Video and a profile/statistics page remain out of scope for time and grading-relevance reasons: each needs its own data source, UI, and testing pass, and neither is required to demonstrate the core MERN skills this project is graded on (full CRUD, auth, authorization, relationships, file upload, React state management). Maps are different — they were never permanently descoped, only deferred, and are now being restored in phases: this phase adds Google Places address autocomplete and stores coordinates; the actual map page with markers is the next phase. Early drafts had a placeholder `/map` route with no real functionality; that placeholder was removed entirely, and this phased rebuild is what replaces it. The `/profile` placeholder route was also removed and stays out of scope.

## What are the current limitations?

No automated test suite (verification is manual: `api-tests.rest` plus static checks). Uploaded images live on local disk, which is ephemeral on Heroku — fine for a live demo, not for long-term storage. No password reset or email verification flow. Manual browser QA (full click-through) is still the one item that hasn't been marked complete as of this writing — check the root README's Testing section for the current, honest status.

## What would be improved with more time?

Automated backend (Jest/Supertest) and frontend (Vitest/RTL) tests; moving uploaded images to persistent object storage (S3-compatible) so they survive redeploys; pagination for trips/locations/memories as data grows; and the next phase already planned for this project — a real map page rendering markers from the coordinates now being captured by Google Places autocomplete.
