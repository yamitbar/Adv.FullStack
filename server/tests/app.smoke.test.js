// Minimal backend smoke tests covering the priority scenarios: health
// check, protected route without a token, Joi validation failure, bad
// login, trip authorization, and upload-cleanup-on-validation-failure.
//
// Runs against the REAL app.js (real Express wiring, middleware order,
// error handler) over a real HTTP server on an ephemeral port - but with
// the Mongoose models replaced by lightweight in-memory fakes injected
// into Node's require cache. Real MongoDB is never touched.
//
// Why fakes instead of a real/in-memory MongoDB: this project's mongoose
// version hangs indefinitely just from `require("mongoose")` in this
// sandbox (confirmed separately - `timeout 10 node -e "require('mongoose')"`
// exits 124, a pre-existing environment limitation unrelated to this
// change). app.js itself never requires mongoose directly (only
// server.js/config/db.js do), so stubbing the four model files here keeps
// the real route/middleware/controller code under test while never
// reaching mongoose at all.
//
// Run with: npm test (from server/)

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const jwt = require("jsonwebtoken");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-for-smoke-tests-only";
process.env.JWT_EXPIRES_IN = "1h";
process.env.CLIENT_URL = "http://localhost:5173";

const serverDir = path.join(__dirname, "..");

function chainable(result) {
  const node = {
    select: () => node,
    populate: () => node,
    sort: () => node,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    catch: (onRejected) => Promise.resolve(result).catch(onRejected),
  };
  return node;
}

function injectFakeModule(relativePathFromServer, exportsValue) {
  const resolvedPath = require.resolve(
    path.join(serverDir, relativePathFromServer)
  );
  require.cache[resolvedPath] = {
    id: resolvedPath,
    filename: resolvedPath,
    loaded: true,
    exports: exportsValue,
  };
}

// ---- In-memory fake data, shared across tests in this file ----
const bcrypt = require(path.join(serverDir, "node_modules/bcrypt"));

const knownUserId = "507f1f77bcf86cd799439011";
const knownUserPasswordHash = bcrypt.hashSync("correct-password", 10);

const fakeUsers = {
  [knownUserId]: {
    _id: knownUserId,
    name: "Test User",
    email: "test.user@example.com",
    password: knownUserPasswordHash,
  },
};

const FakeUser = {
  findById: (id) => chainable(fakeUsers[id] || null),
  findOne: (query) => {
    const match = Object.values(fakeUsers).find(
      (user) => user.email === query.email
    );
    return chainable(match || null);
  },
};

// Trips owned by a DIFFERENT user, so authenticated requests from
// knownUserId are always "not the owner" - used by the authorization test.
const fakeTrips = {
  trip1: {
    _id: "trip1",
    createdBy: "someone-else",
  },
};

const FakeTrip = {
  findOne: (query) => {
    const trip = fakeTrips[query._id];
    if (!trip || String(trip.createdBy) !== String(query.createdBy)) {
      return chainable(null);
    }
    return chainable(trip);
  },
};

// A single memory, owned by knownUserId, with no images yet - used by the
// image upload/remove end-to-end test below. Mutated in place by
// save(), matching how the real Mongoose document behaves.
const fakeMemory = {
  _id: "memory1",
  createdBy: knownUserId,
  images: [],
  imagePublicIds: [],
  save: async function () {
    return this;
  },
  populate: async function () {
    return this;
  },
};

const FakeMemory = {
  findById: (id) => chainable(id === "memory1" ? fakeMemory : null),
};

injectFakeModule("models/User.js", FakeUser);
injectFakeModule("models/Trip.js", FakeTrip);
injectFakeModule("models/Location.js", {});
injectFakeModule("models/Memory.js", FakeMemory);

// Stub the Cloudinary SDK so no real network call is ever attempted, and
// so the upload-cleanup test can assert it was never invoked.
const cloudinary = require(path.join(serverDir, "config/cloudinary"));
let uploadStreamCallCount = 0;
cloudinary.uploader.upload_stream = (options, callback) => ({
  end: (buffer) => {
    uploadStreamCallCount += 1;
    setImmediate(() =>
      callback(null, {
        secure_url: "https://res.cloudinary.com/demo/image/upload/v1/test.jpg",
        public_id: "test",
      })
    );
  },
});

const app = require(path.join(serverDir, "app"));

let server;
let baseUrl;

test.before(() => {
  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(() => {
  server.close();
});

test("health check: GET / returns 200", async () => {
  const res = await fetch(`${baseUrl}/`);
  const text = await res.text();

  assert.equal(res.status, 200);
  assert.match(text, /Pathly API is running/);
});

test("protected route without a token returns 401", async () => {
  const res = await fetch(`${baseUrl}/api/trips`);
  const body = await res.json();

  assert.equal(res.status, 401);
  assert.equal(body.success, false);
  assert.match(body.message, /no token/i);
});

test("Joi validation failure on register returns 400 with error details", async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Missing password on purpose - registerSchema requires it.
    body: JSON.stringify({
      name: "New User",
      email: "new.user@example.com",
    }),
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  assert.ok(Array.isArray(body.errors) && body.errors.length > 0);
});

test("login with the wrong password returns 401", async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "test.user@example.com",
      password: "wrong-password",
    }),
  });
  const body = await res.json();

  assert.equal(res.status, 401);
  assert.equal(body.success, false);
  assert.match(body.message, /invalid email or password/i);
});

test("login with the correct password succeeds and returns a token", async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "test.user@example.com",
      password: "correct-password",
    }),
  });
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.ok(typeof body.token === "string" && body.token.length > 0);
});

test("trip authorization: updating a trip you don't own is rejected", async () => {
  const token = jwt.sign({ id: knownUserId }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  const res = await fetch(`${baseUrl}/api/trips/trip1`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title: "Hijacked title" }),
  });
  const body = await res.json();

  assert.equal(res.status, 404);
  assert.equal(body.success, false);
  assert.match(body.message, /not found or you are not allowed/i);
});

test("upload-cleanup-on-validation-failure: an invalid trip create with a file never reaches Cloudinary", async () => {
  const token = jwt.sign({ id: knownUserId }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  const callsBefore = uploadStreamCallCount;

  const formData = new FormData();
  // "destination" is required by createTripSchema and is intentionally
  // omitted here so Joi validation fails.
  formData.append("title", "Trip missing destination");
  formData.append(
    "coverImage",
    new Blob([Buffer.from("fake-image-bytes")], { type: "image/jpeg" }),
    "cover.jpg"
  );

  const res = await fetch(`${baseUrl}/api/trips`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  assert.equal(
    uploadStreamCallCount,
    callsBefore,
    "Cloudinary upload must never be attempted when Joi validation fails"
  );
});

test("security headers: Helmet headers are present on responses", async () => {
  const res = await fetch(`${baseUrl}/`);

  // A couple of Helmet's default headers - enough to confirm the
  // middleware is actually wired into app.js, not a full audit of Helmet.
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.ok(res.headers.get("cross-origin-opener-policy"));
});

test("memory image upload then remove: full round trip via Cloudinary-backed endpoints", async () => {
  const token = jwt.sign({ id: knownUserId }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  const formData = new FormData();
  formData.append(
    "images",
    new Blob([Buffer.from("memory-photo-bytes")], { type: "image/jpeg" }),
    "photo.jpg"
  );

  const uploadRes = await fetch(`${baseUrl}/api/memories/memory1/images`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const uploadBody = await uploadRes.json();

  assert.equal(uploadRes.status, 200);
  assert.equal(uploadBody.success, true);
  assert.equal(uploadBody.images.length, 1);
  assert.equal(fakeMemory.imagePublicIds.length, 1);

  const removeRes = await fetch(
    `${baseUrl}/api/memories/memory1/images/0`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const removeBody = await removeRes.json();

  assert.equal(removeRes.status, 200);
  assert.equal(removeBody.success, true);
  assert.equal(fakeMemory.images.length, 0);
  assert.equal(fakeMemory.imagePublicIds.length, 0);
});
