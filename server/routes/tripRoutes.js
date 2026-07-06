const express = require("express");
const validate = require("../middleware/validate");

const { createTripSchema } = require("../validation/tripValidation");

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

// Route for creating a new trip
router.post("/", protect, validate(createTripSchema), createTrip);

// Route for getting all trips related to the logged-in user
router.get("/", protect, getTrips);

// Get a single trip by ID
router.get("/:id", protect, getTripById);

// Update a trip by ID
router.put("/:id", protect, updateTrip);

// Delete a trip by ID
router.delete("/:id", protect, deleteTrip);

// Join a trip using an invite code
router.post("/join", protect, joinTrip);

// Export the router so it can be used in app.js
module.exports = router;