# Pathly — Manual Two-User Happy-Path Test Plan

This checklist could not be executed by the AI assistant in this batch: the sandbox it runs in cannot reach your computer's local MongoDB (`server/.env`'s `MONGO_URI` points at `localhost:27017`, which resolves to the sandbox itself, not your machine — connection attempt failed with `MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`). Everything below is written so *you* can run it in a few minutes against your real database before a demo or submission.

Use throwaway test accounts, not your personal login. Suggested naming:

- User A: `pathly.test.owner.<timestamp>@example.com`
- User B: `pathly.test.member.<timestamp>@example.com`
- Password: any temporary test password, e.g. `TestPass123!`

Start both servers first: `cd server && npm run dev`, `cd client && npm run dev`. Confirm the terminal shows `MongoDB connected: ...` and `Server is running on port 3000`, and that the browser at `http://localhost:5173` loads with no CORS errors in the console.

## Part 1 — User A

- [ ] 1. Register User A.
- [ ] 2. Confirm the register response/network tab shows no `password` field.
- [ ] 3. Log in as User A.
- [ ] 4. Refresh the page — confirm you're still logged in (session restored from the stored token).
- [ ] 5. Log out.
- [ ] 6. Log in again.
- [ ] 7. Create a trip.
- [ ] 8. Open **My Trips** — the new trip appears.
- [ ] 9. Open **Trip Details**.
- [ ] 10. Edit the trip (change the title).
- [ ] 11. Confirm the title updates on screen immediately, without a manual page refresh.
- [ ] 12. Copy the invite code (Share trip button) — save it for Part 2.
- [ ] 13. Add a location. Confirm the form never asks for latitude, longitude, or a Google Place ID.
- [ ] 14. Open Location Details.
- [ ] 15. Refresh the browser directly on the Location Details URL — confirm it still loads (not a blank page or error).
- [ ] 16. Edit the location.
- [ ] 17. Add a text-only memory.
- [ ] 18. Add a second memory and upload one valid image (jpeg/png/webp).
- [ ] 19. Upload multiple valid images in a single upload where the UI supports it.
- [ ] 20. Refresh the page — confirm the uploaded images still load (not broken image icons).
- [ ] 21. Edit a memory's text.
- [ ] 22. Delete a memory.
- [ ] 23. Confirm the deleted memory disappears immediately, without a manual refresh.

## Part 2 — User B

- [ ] 1. Register User B (different browser/incognito window, or log out User A first).
- [ ] 2. Log in as User B.
- [ ] 3. Try to open User A's trip directly by URL (`/trips/<tripId>`) — confirm it's rejected (404/error state), not shown.
- [ ] 4. In the browser devtools or `api-tests.rest`, call `GET /api/locations/<locationId>` for User A's location with User B's token — confirm 403/404, not the location data.
- [ ] 5. Same for `GET /api/memories/<memoryId>` — confirm rejected.
- [ ] 6. Join the trip using User A's invite code.
- [ ] 7. Confirm the trip now appears in User B's **My Trips**.
- [ ] 8. Open the trip, open the location.
- [ ] 9. Create a memory as User B.
- [ ] 10. Confirm User B does **not** see edit/delete controls on User A's memories or on the trip/location.
- [ ] 11. Switch back to User A — confirm User A still has their own edit/delete controls (didn't lose creator status).

## Part 3 — Edge cases

- [ ] Invalid invite code → friendly error, not a crash.
- [ ] Empty invite code → blocked client-side or friendly 400.
- [ ] Join the same trip twice → friendly "already a member" style response, not a duplicate entry or crash.
- [ ] Submit a memory with empty content → blocked/validation error.
- [ ] Upload a non-image file (e.g. a `.txt` renamed to `.jpg`, or an actual PDF) → rejected with a friendly message.
- [ ] Upload more than 5 images in one request → rejected with a friendly message.
- [ ] Upload a file over 5MB (if you have one handy) → rejected with a friendly message.
- [ ] Call any protected endpoint with an invalid/garbage JWT → 401.
- [ ] Call any protected endpoint with a JWT belonging to a user you then delete from the database → 401 on the next request with that token.
- [ ] Refresh directly on a protected route (e.g. `/trips/<id>`) while logged in → loads correctly, not a blank screen.
- [ ] Log out, then try to open a protected route directly by URL → redirected to `/login`, not shown a blank/broken page.

## Part 4 — Delete & cascade cleanup

Do this with disposable test data only.

**Memory deletion**
- [ ] Delete a memory that has uploaded images.
- [ ] Confirm the memory document is gone (refresh the location page — it's not there).
- [ ] Confirm its image files are gone from `server/uploads/` on disk.

**Location deletion**
- [ ] Create a temporary location with at least one memory (with an image).
- [ ] Delete the location.
- [ ] Confirm its memories are gone.
- [ ] Confirm their image files are gone from `server/uploads/`.
- [ ] Confirm the UI returns you to the parent trip page.
- [ ] Confirm the location no longer appears in the trip's location list, without a manual refresh.

**Trip deletion**
- [ ] Create a temporary trip with a location, memories, and at least one image.
- [ ] Delete the trip.
- [ ] Confirm its locations are gone.
- [ ] Confirm their memories are gone.
- [ ] Confirm all associated image files are gone from `server/uploads/`.
- [ ] Confirm the trip disappears from **My Trips** without a manual refresh.

## Part 5 — Cleanup afterwards

- [ ] Delete both test users (`DELETE /api/users/:id`, or directly in MongoDB Compass/shell) once you're done, so they don't linger in your development database.
- [ ] Confirm no leftover test trips/locations/memories remain under either test account.
- [ ] Confirm `server/uploads/` has no orphaned files left from this test pass.

If everything above passes, you can be confident in the happy path beyond what static code review alone can promise.
