const express = require("express");
const validate = require("../middleware/validate");
const { uploadImages } = require("../middleware/upload");

const {
  createTripSchema,
  updateTripSchema,
  joinTripSchema,
} = require("../validation/tripValidation");

// Import trip controller functions
const {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  joinTrip,
} = require("../controllers/tripController");

// Import authentication middleware
const { protect } = require("../middleware/authMiddleware");

// Create a new router instance for trip routes
const router = express.Router();

// Route for creating a new trip. Multer parses the multipart/form-data
// request (populating req.body with the text fields and req.file with
// the optional cover image) before Joi validates req.body.
router.post(
  "/",
  protect,
  uploadImages.single("coverImage"),
  validate(createTripSchema),
  createTrip
);

// Route for getting all trips related to the logged-in user
router.get("/", protect, getTrips);

// Get a single trip by ID
router.get("/:id", protect, getTripById);

// Update a trip by ID. Same Multer-before-Joi ordering as create, so an
// updated cover image (or its removal) can be sent alongside the other
// trip fields in one request.
router.put(
  "/:id",
  protect,
  uploadImages.single("coverImage"),
  validate(updateTripSchema),
  updateTrip
);

// Delete a trip by ID
router.delete("/:id", protect, deleteTrip);

// Join a trip using an invite code
router.post("/join", protect, validate(joinTripSchema), joinTrip);

// Export the router so it can be used in app.js
module.exports = router;
