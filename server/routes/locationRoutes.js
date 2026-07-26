const express = require("express");

const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { uploadImages } = require("../middleware/upload");

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

// Routes nested inside a trip. Multer parses the multipart/form-data
// request (populating req.body with the text fields and req.file with
// the optional cover image) before Joi validates req.body.
tripLocationRouter
  .route("/")
  .post(
    protect,
    uploadImages.single("coverImage"),
    validate(createLocationSchema),
    createLocation
  )
  .get(
    protect,
    getLocationsByTrip
  );

// Routes for a specific location. Same Multer-before-Joi ordering as
// create, so an updated cover image (or its removal) can be sent
// alongside the other location fields in one request.
locationRouter
  .route("/:id")
  .get(
    protect,
    getLocationById
  )
  .put(
    protect,
    uploadImages.single("coverImage"),
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