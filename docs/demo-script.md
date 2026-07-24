# Pathly — Demo Script (5–7 minutes)

A straight-line walkthrough of the real, implemented MVP flow. Nothing here is aspirational — every step matches an actual page/button in the current app. Run this after your own manual QA pass has confirmed each step works locally; this script assumes a working local (or deployed) instance with a reachable MongoDB.

Suggested prep: have two browser windows/profiles ready (or one regular + one incognito) so "second user" steps don't require live re-registration mid-demo.

## Flow

**1. Register / Login** (~45s)
Go to `/register`, create an account (name, email, password). You'll land on `/login` with a "you can now log in" message — register intentionally does not log you in automatically, only login issues a session. Log in with the new account.

**2. Create a trip** (~30s)
From **My Trips**, click **Create a trip**. Fill in title and destination (required), optionally description/dates/cover image. Submit — you land back on My Trips or the new trip's page with a success message.

**3. Edit the trip** (~20s)
Open the trip, click **Edit trip**, change the title or description, save. Point out the updated value renders immediately (no refresh needed).

**4. Copy the invite code** (~15s)
Click **Share trip** — the invite code is copied to the clipboard (button label briefly confirms "Invite code copied"). This is the code a second user pastes to join.

**5. Add a location** (~30s)
Click **Add location**. Start typing a full address (required) and pick one of Google's suggestions — this silently captures the place's coordinates and Place ID behind the scenes, but there's still no map or visible place lookup UI (that's the next phase). Optionally add a custom title. Submit.

**6. Add a text memory** (~30s)
Open the location, type a memory in the **Add a memory** box, save. Point out the creator's name appears immediately next to the memory — no refresh required.

**7. Upload an image** (~40s)
Either attach an image before saving a new memory, or use **Add photos** on the memory just created. Show the thumbnail appearing in the memory card after upload completes.
- *Fallback if the upload fails or looks broken live:* say so plainly — "this is one of the things manual QA is still confirming" — and continue with the text-only flow. Do not claim it works if it visibly doesn't during the demo.

**8. Join with a second user** (~45s)
Switch to the second browser window/profile, register or log in as a different account, go to **My Trips → Join with invite code**, paste the code from step 4. The trip now appears in the second account's list.

**9. Show the participant list** (~20s)
On the trip page, click the **Participants** card (shows the traveler count). A small panel opens listing the creator (labeled "Trip creator") and the newly joined user by name.

**10. Show the authorization difference** (~30s)
Still logged in as the second user, open a location or memory created by the first account — point out there is no Edit/Delete button, because creator-only controls simply don't render for a non-creator. Optionally show that the second user *can* add their own new memory to the same location.

**11. Edit or delete a memory/location** (~30s)
Switch back to the first (creator) account. Edit a memory's text, or delete a location, and point out the confirmation prompt before deletion and the resulting empty/updated state.

**12. Logout** (~15s)
Use the navbar logout control. Confirm you're returned to a logged-out view and that visiting a protected route like `/trips` now redirects to `/login`.

## General fallbacks

- **Any network/server error appears:** don't improvise — say what the error message actually says, and move to the next step rather than retrying repeatedly on stage.
- **Second-user step is awkward live:** pre-register the second account before the demo starts, so step 8 is just "log in and join" rather than a full registration under time pressure.
- **Image upload is the one area still being manually verified** as of this writing — see the root README's Testing section for current status before promising it works.
- **Time runs short:** steps 3 (edit trip) and 11 (edit/delete) are the safest to compress or skip — the CRUD pattern is already demonstrated by trip creation and location/memory creation.
