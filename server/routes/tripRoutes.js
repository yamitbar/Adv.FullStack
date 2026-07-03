const express = require("express");
const validate = require("../middleware/validate");

const { createTripSchema } = require("../validation/tripValidation");

// Import trip controller functions
const { createTrip, getTrips } = require("../controllers/tripController");

// Import authentication middleware
const { protect } = require("../middleware/authMiddleware");

// Create a new router instance for trip routes
const router = express.Router();

// Route for creating a new trip
router.post("/", protect, validate(createTripSchema), createTrip);

// Route for getting all trips related to the logged-in user
router.get("/", protect, getTrips);


// Export the router so it can be used in app.js
module.exports = router;