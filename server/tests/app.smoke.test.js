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

// Locations, keyed by _id - used by the location cover-image test below.
const fakeLocations = {};

const FakeLocation = {
  findById: (id) => chainable(fakeLocations[id] || null),
};

injectFakeModule("models/User.js", FakeUser);
injectFakeModule("models/Trip.js", FakeTrip);
injectFakeModule("models/Location.js", FakeLocation);
injectFakeModule("models/Memory.js", FakeMemory);

// Stub the ENTIRE Cloudinary SDK surface the app uses (upload_stream AND
// destroy) so no real network call or SDK credential check ever happens -
// without stubbing destroy too, removeMemoryImage/deleteTrip/etc. would
// reach the real SDK and fail with "Must supply api_key".
//
// public_id/url are derived from the buffer's own content (not a fixed
// value) so tests can tell different uploads apart. A buffer starting
// with "FAIL_UPLOAD" simulates a failed upload, for the partial-batch
// failure test below.
const cloudinary = require(path.join(serverDir, "config/cloudinary"));

let uploadStreamCallCount = 0;
let destroyedPublicIds = [];

cloudinary.uploader.upload_stream = (options, callback) => ({
  end: (buffer) => {
    uploadStreamCallCount += 1;

    const content = buffer.toString();

    setImmediate(() => {
      if (content.startsWith("FAIL_UPLOAD")) {
        return callback(new Error("Simulated Cloudinary upload failure"));
      }

      callback(null, {
        secure_url: `https://res.cloudinary.com/demo/image/upload/v1/${options.folder}/${content}.jpg`,
        public_id: `${options.folder}/${content}`,
      });
    });
  },
});

cloudinary.uploader.destroy = async (publicId) => {
  destroyedPublicIds.push(publicId);
  return { result: "ok" };
};

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

  destroyedPublicIds = [];

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

  const uploadedPublicId = fakeMemory.imagePublicIds[0];

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

  // Confirms destroyCloudinaryAsset/cloudinary.uploader.destroy was
  // actually called (through the stub, never the real SDK) with the
  // exact public_id that was just uploaded - not just that the DB array
  // shrank.
  assert.deepEqual(destroyedPublicIds, [uploadedPublicId]);
});

test("memory image upload: a partial batch failure destroys the uploads that already succeeded and leaves the memory untouched", async () => {
  const token = jwt.sign({ id: knownUserId }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  destroyedPublicIds = [];
  fakeMemory.images = [];
  fakeMemory.imagePublicIds = [];

  const formData = new FormData();
  // First file uploads successfully; second is rigged to fail via the
  // "FAIL_UPLOAD" buffer-content marker the stub checks for.
  formData.append(
    "images",
    new Blob([Buffer.from("photo-one-succeeds")], { type: "image/jpeg" }),
    "one.jpg"
  );
  formData.append(
    "images",
    new Blob([Buffer.from("FAIL_UPLOAD-photo-two")], { type: "image/jpeg" }),
    "two.jpg"
  );

  const res = await fetch(`${baseUrl}/api/memories/memory1/images`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const body = await res.json();

  // The error reaches the global error handler as a generic 500, since
  // it's a genuine Cloudinary failure, not a validation error.
  assert.equal(res.status, 500);
  assert.equal(body.success, false);

  // The memory document was never touched.
  assert.equal(fakeMemory.images.length, 0);
  assert.equal(fakeMemory.imagePublicIds.length, 0);

  // The one upload that DID succeed before the second one failed was
  // destroyed, so it isn't orphaned in Cloudinary.
  assert.deepEqual(destroyedPublicIds, [
    "pathly/memories/photo-one-succeeds",
  ]);
});

test("trip cover image: replacing a Cloudinary upload with a plain URL clears the stale public_id", async () => {
  const token = jwt.sign({ id: knownUserId }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  destroyedPublicIds = [];

  const tripWithCloudinaryCover = {
    _id: "trip-cover-swap",
    createdBy: knownUserId,
    startDate: null,
    endDate: null,
    coverImage:
      "https://res.cloudinary.com/demo/image/upload/v1/pathly/trips/old-cover.jpg",
    coverImagePublicId: "pathly/trips/old-cover",
    save: async function () {
      return this;
    },
    populate: async function () {
      return this;
    },
  };

  fakeTrips["trip-cover-swap"] = tripWithCloudinaryCover;

  const res = await fetch(`${baseUrl}/api/trips/trip-cover-swap`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      coverImage: "https://example.com/some-external-photo.jpg",
    }),
  });
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.trip.coverImage, "https://example.com/some-external-photo.jpg");
  // The stale public_id must be cleared, not left pointing at an asset
  // that was just destroyed below.
  assert.equal(body.trip.coverImagePublicId, "");
  assert.deepEqual(destroyedPublicIds, ["pathly/trips/old-cover"]);
});

test("location cover image: replacing a Cloudinary upload with a plain URL clears the stale public_id", async () => {
  const token = jwt.sign({ id: knownUserId }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  destroyedPublicIds = [];

  const locationWithCloudinaryCover = {
    _id: "location-cover-swap",
    createdBy: knownUserId,
    coverImage:
      "https://res.cloudinary.com/demo/image/upload/v1/pathly/locations/old-cover.jpg",
    coverImagePublicId: "pathly/locations/old-cover",
    save: async function () {
      return this;
    },
  };

  fakeLocations["location-cover-swap"] = locationWithCloudinaryCover;

  const res = await fetch(`${baseUrl}/api/locations/location-cover-swap`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      address: "Somewhere",
      coverImage: "https://example.com/some-external-photo.jpg",
    }),
  });
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(
    body.location.coverImage,
    "https://example.com/some-external-photo.jpg"
  );
  assert.equal(body.location.coverImagePublicId, "");
  assert.deepEqual(destroyedPublicIds, ["pathly/locations/old-cover"]);
});
