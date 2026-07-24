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

## Why Geoapify + Leaflet instead of Google Maps?

An earlier iteration of this project explored Google Places/Google Maps on a branch that was never merged. The final choice - Geoapify Address Autocomplete for address search, Leaflet + React Leaflet for the map, OpenStreetMap for tiles - needs no billing account, has a generous free tier, and OpenStreetMap tiles require no API key at all. Only the address-autocomplete field needs a (free) Geoapify key; the map itself works with zero configuration. The autocomplete request goes straight from the browser to Geoapify's API (`client/src/services/geoapify.js`) rather than through the Pathly backend, since there's no security or business reason to proxy it - the key is a public, referrer-restrictable browser key by design, the same pattern used for any client-side map SDK.

## How does the address autocomplete avoid saving fake coordinates?

`client/src/components/locations/AddressAutocomplete.jsx` only ever reports coordinates for an address the user actually selected from Geoapify's suggestion list, not for arbitrary typed text - see `server/models/Location.js` and `locationValidation.js`, which still only require `address` and treat `lat`/`lng`/`placeName`/`placeId` as optional. If the user types an address but never selects a suggestion, Add/Edit Location blocks submission with "Please select an address from the suggestions." The component tracks the last *confirmed* address text in a ref; any further edit to the text invalidates that confirmation (clearing the coordinates) until a new suggestion is chosen, so a changed address can never keep a stale set of coordinates.

## Why are coordinates/placeName/placeId internal, not directly editable?

They're populated automatically the moment the user selects a Geoapify suggestion - showing separate raw-coordinate or place-ID inputs would invite manual tampering (fake coordinates) and add fields nobody needs to fill in by hand. They're used by the `/map` page's markers, kept optional in the `Location` schema, and there's a legacy `googlePlaceId` field left over from the earlier Google branch, also optional and unused by new records, kept only for backward compatibility in case any existing document already had one set.

## How does the map page load its data?

`client/src/pages/Map.jsx` dispatches the existing `fetchTrips` Redux thunk for the user's accessible trips, then calls the existing `GET /trips/:tripId/locations` endpoint directly (via the shared `api` Axios instance) for every trip in parallel - there's no bulk "all locations" endpoint, so this reuses the same per-trip endpoint `TripDetails` already uses instead of adding a new one. Results are kept in local component state (not Redux's single `selectedTripLocations` slot, which is designed for one currently-viewed trip and would conflict with aggregating several at once). Locations without valid, finite `lat`/`lng` are filtered out before rendering - they simply don't produce a marker, and never crash the page.

## What are the current limitations?

No automated test suite (verification is manual: `api-tests.rest` plus static checks, plus manual browser QA of the core flows against a real Geoapify key). Uploaded images live on local disk, which is ephemeral on Heroku — fine for a live demo, not for long-term storage. No password reset or email verification flow. The map has no marker clustering, directions, live GPS, or weather/ratings/photos from external APIs - all explicitly out of scope. The project is not yet deployed - check the root README's Testing and Deployment sections for the current, honest status.

## What would be improved with more time?

Automated backend (Jest/Supertest) and frontend (Vitest/RTL) tests; moving uploaded images to persistent object storage (S3-compatible) so they survive redeploys; pagination for trips/locations/memories as data grows; and marker clustering on the map if a trip's location count ever grows large enough to make individual markers hard to distinguish.
