# Pathly — Final Release-Readiness & Defense-Preparation Pass

> Development note, not current status. The root `README.md` is authoritative for current project state.

## 1. Git / branch review

Branch: `claude/final-manual-qa-fixes`. HEAD at the end of this batch: see the final commit in this file's own history (this note is committed as part of that same sequence).

This branch contains **all prior work**: `claude/batch3-collaboration-location-crud`, `claude/batch4-runtime-delivery`, `claude/final-stabilization-fixes`, `claude/final-manual-qa`, and `codex/mvp-security-validation-batch` are all confirmed ancestors of the current HEAD (`git merge-base --is-ancestor <branch> HEAD` returned true for each).

`main` (`5ccf5f8`) is a **strict ancestor** of the current HEAD — confirmed via `git merge-base --is-ancestor main HEAD`. A merge to `main` can be a **clean fast-forward**, 39 commits ahead, no divergence, no conflicts expected.

**Unexpected finding, worth flagging plainly:** at the start of this batch, HEAD was three commits ahead of where the previous session left off (`2031c5d`) — `3409a00` (fix: tighten memory creator response contract), `30ff6ce` (style: clean location form whitespace), and `f51a671` (docs: align final QA flow and image endpoint), matching what you described as "the Codex review." I read all three diffs in full before continuing. They are small, sound, and consistent with this project's direction: dropping `email` from the memory `createdBy` populate (the frontend never used it, so this is a minor privacy tightening), a slightly more defensive `creatorName` fallback check, whitespace/line-ending normalization in `AddLocation.jsx`, a missing-trailing-newline fix in two files, and a real, accurate README correction (the demo flow still said "place name + address" and the API table was missing the new image-removal endpoint). Nothing in them contradicts or undoes any of this project's prior work, and nothing suggested unreviewed or risky changes — I did not need to alter or revert anything.

**Untracked `.discarded_*` files** (unchanged in number and identity from every prior batch — none new this session):

| File | What it actually is | Safe to delete? |
| --- | --- | --- |
| `client/src/pages/PlaceholderPage.jsx.discarded_...` | The old `/map`/`/profile` placeholder page component. Its deletion is already fully recorded in git (`git rm --cached` was run when it was removed from the app); this is the renamed leftover from this sandbox's inability to truly `unlink` a file (same-directory rename is allowed, real deletion is not). | Yes — deleting it on your own machine changes nothing; it is not tracked and nothing references it. |
| `package-lock.json.discarded_...` | The orphaned root lockfile from before the `client`/`server` split (confirmed no root `package.json` exists, nothing references it). Same "cannot truly delete in this sandbox" situation. | Yes, same reasoning. |
| `pathly-batch3-summary.md.discarded_...` | The original root-level Batch 3 summary, already moved (not deleted) to `docs/development-notes/batch-3-collaboration-location-crud.md` with proper git history. | Yes — the real content lives on at the new path. |
| `pathly-batch4-summary.md.discarded_...` | Same as above, for Batch 4 → `docs/development-notes/batch-4-runtime-delivery-and-docs.md`. | Yes, same reasoning. |

I did not delete these myself — this sandbox cannot perform a real filesystem `unlink`, and even if it could, deleting tracked-adjacent files without being asked is exactly the kind of unrequested destructive action this project's rules ask me to avoid. If you want them gone, deleting all four on your own machine is safe and changes nothing about the app or its git history.

## 2. Deployment readiness audit

**Backend (Heroku):**
- `server/Procfile` → `web: node server.js`. Correct, minimal, already in place.
- `server/package.json` → `engines.node: ">=18.0.0"` (present), `scripts.start: "node server.js"` (present, what Heroku's Node buildpack runs by default).
- `PORT`: `server.js` reads `process.env.PORT`, falling back to `3000` only if unset — correct for Heroku, which injects its own `PORT`. **Do not set `PORT` yourself in Heroku config.**
- `MONGO_URI`: must be a MongoDB **Atlas** connection string (`mongodb+srv://...`) — a Heroku dyno cannot reach a laptop's local `mongod`.
- `JWT_SECRET`: must be set to a long random value in Heroku config vars, different from (or at least never copied insecurely from) your local `.env`.
- `CLIENT_URL`: must exactly equal the deployed frontend's real origin (e.g. `https://pathly.vercel.app`, no trailing slash) — this feeds the CORS `origin` allowlist in `app.js`; a mismatch here is the single most common "everything 404s/CORS-fails after deploy" cause.
- Static `/uploads` serving: works as-is (`express.static`), now with the `Cross-Origin-Resource-Policy: cross-origin` header fixed this batch so images load across origins in production too, not just in dev.
- Health endpoint: there is no dedicated `/health` or `/api/health` route. `GET /` (`app.js`) returns a plain 200 text response ("Pathly API is running") and can serve as a basic health check, but it's not a conventional health-check path — worth knowing if your deployment platform or a grader expects `/health` specifically.

**Exact backend deploy steps** (monorepo, so a plain `git push heroku main` won't find a root `package.json`):
1. `heroku create <app-name>` (or use an existing app).
2. Either: `git subtree push --prefix server heroku main`, or add the monorepo buildpack (`heroku buildpacks:add -a <app-name> https://github.com/lstoll/heroku-buildpack-monorepo` then `heroku config:set -a <app-name> APP_BASE=server`) and push normally.
3. `heroku config:set -a <app-name> MONGO_URI=<atlas-uri> JWT_SECRET=<random-long-string> JWT_EXPIRES_IN=7d CLIENT_URL=<deployed-frontend-url> NODE_ENV=production`.
4. Do not set `PORT`.

**Frontend (Vercel or Netlify):**
- `VITE_API_URL`: must be set in the platform's environment variables to the deployed backend's `/api` base (e.g. `https://<app-name>.herokuapp.com/api`) — without it, the build falls back to `http://localhost:3000/api`, which will silently fail in production.
- Vite build: `npm run build` → `client/dist`; already confirmed working this session.
- `client/vercel.json`: SPA rewrite (`/(.*) → /index.html`) already in place, needed so refreshing `/trips/:id` doesn't 404.
- `client/public/_redirects`: Netlify equivalent, already in place.
- React Router fallback: covered by the two files above — no extra platform config needed beyond setting the project root to `client/`.
- Media URL resolution: `resolveMediaUrl()` already derives the uploads origin from `VITE_API_URL` at runtime — no separate media/CDN URL variable is needed.

**Exact frontend deploy steps:**
1. In Vercel/Netlify, set the project root directory to `client/`.
2. Build command `npm run build`, output directory `dist` (both platforms auto-detect this for Vite, but set explicitly to be safe).
3. Set environment variable `VITE_API_URL` to the deployed backend's `/api` URL.
4. Deploy.

**Values that must be replaced after deployment:** the two `README.md` placeholders under "Deployment" (`_placeholder — Vercel or Netlify URL once deployed_` and `_placeholder — Heroku URL once deployed_`) should be filled in with the real URLs once both are live — I did not fill these in myself since nothing is actually deployed yet and inventing URLs would be a false claim.

**Likely deployment blockers:**
- `CLIENT_URL` on the backend not exactly matching the frontend's real deployed origin (CORS failure).
- `VITE_API_URL` not set on the frontend platform (falls back to `localhost`, breaks silently in production).
- Forgetting the monorepo subtree/buildpack step on Heroku (build fails immediately, no root `package.json`).
- Using a local `MONGO_URI` instead of an Atlas one (server fails to start, same `ECONNREFUSED` class of error this sandbox hits constantly).

**Heroku's ephemeral filesystem:** confirmed uploaded images live only in `server/uploads/` on local disk via Multer. Heroku dynos have an ephemeral filesystem — every restart, redeploy, or dyno cycle wipes it. For a single live class demo this is fine (files persist for the duration of that dyno's uptime), but any image uploaded will vanish on the next deploy or dyno restart, and this **cannot** be relied on for anything beyond a single demo session. This is already documented in the README's Known Limitations and Uploads sections.

## 3. README / documentation audit

Fixed three genuine contradictions found on a fresh full re-read (see commit `f553033` for the exact diff):
- The MVP feature list still said Add Location collects "place name, address, visit date" — `placeName` was removed from the UI two batches ago. Now says "full address, visit date, optional custom title and cover image."
- Known limitations / Future improvements still called the map and profile pages "not yet built" / "currently placeholders" — both were deleted outright, not left pending. Reworded to say they were intentionally descoped, matching the MVP feature list's own "explicitly out of scope" framing.
- The runtime-API-verification paragraph now explicitly says the 32 requests were manually executed and are not an automated test run (the section header already implied this; now the sentence itself says so).

Confirmed accurate and unchanged (already correct, verified against current code): register does not return a JWT, login does return one; manual browser QA is explicitly marked "started, not completed"; maps/Google Places/video/comments/notifications/profile are listed as explicitly out of scope; the MVP feature list correctly covers trips, locations, memories, photos, and invite-code collaboration. `client/README.md` had no contradictions and was not changed.

## 4–6. New documentation

`docs/course-requirements-evidence.md`, `docs/oral-defense-cheat-sheet.md`, and `docs/demo-script.md` were created this batch — see their own commits for what each contains. All three were written from direct code reading this session, not carried over from older, possibly-stale reports.

## 7. Static verification results (actually run this session)

- `node --check` on every file under `server/` (via a native-filesystem copy, since this sandbox's mounted directory is too slow for a plain recursive check) — all pass.
- `npm run lint` (oxlint) on the client — 0 errors, the same 1 pre-existing unrelated warning in `AuthContext.jsx` as every prior batch.
- `npm run build` (Vite) — succeeds, no errors.
- Hygiene scan: no dead `/map`/`/profile` routes or `PlaceholderPage` references in the app itself (only the harmless untracked `.discarded_*` file, see §1); no hardcoded `localhost` outside the documented dev-fallback in `api.js`; no `.env` tracked; no JWT/Mongo secret or personal filesystem path found in any tracked file (`git grep` scan); no false feature claims remaining in `README.md`; Vite's build succeeding is itself confirmation there are no broken imports anywhere in the bundle graph.
- No browser QA or local MongoDB connection was attempted this session, per your explicit instruction.

## 8. Remaining known issues

Same as every prior batch: the one thing left is your own manual browser click-through against a real local (or deployed) MongoDB. Nothing found this session changes that.
