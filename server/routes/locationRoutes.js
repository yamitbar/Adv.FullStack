const express = require("express");

const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");

const {
  createLocationSchema,
  updateLocationSchema,
} = require("../validation/locationValidation");

const {
  createLocation,
  getLocationsByTrip,
  getLocationById,
  updateLocation,
  deleteLocation,
} = require("../controllers/locationController");

const tripLocationRouter = express.Router({
  mergeParams: true,
});

const locationRouter = express.Router();

// Routes nested inside a trip
tripLocationRouter
  .route("/")
  .post(
    protect,
    validate(createLocationSchema),
    createLocation
  )
  .get(
    protect,
    getLocationsByTrip
  );

// Routes for a specific location
locationRouter
  .route("/:id")
  .get(
    protect,
    getLocationById
  )
  .put(
    protect,
    validate(updateLocationSchema),
    updateLocation
  )
  .delete(
    protect,
    deleteLocation
  );

module.exports = {
  tripLocationRouter,
  locationRouter,
};