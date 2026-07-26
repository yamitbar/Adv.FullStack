const express = require("express");

const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { uploadImages } = require("../middleware/upload");
const {
  authorizeMemoryImageUpload,
} = require("../middleware/memoryAuth");

const {
  createMemorySchema,
  updateMemorySchema,
} = require("../validation/memoryValidation");

const {
  createMemory,
  getMemoriesByLocation,
  getMemoryById,
  updateMemory,
  deleteMemory,
  uploadMemoryImages,
  removeMemoryImage,
} = require("../controllers/memoryController");

const locationMemoryRouter = express.Router({
  mergeParams: true,
});

const memoryRouter = express.Router();

// Routes for memories inside a location
locationMemoryRouter
  .route("/")
  .post(
    protect,
    validate(createMemorySchema),
    createMemory
  )
  .get(
    protect,
    getMemoriesByLocation
  );

// Upload images to an existing memory. Authorization runs BEFORE Multer
// so an unauthorized/not-found request never writes files to disk.
memoryRouter.post(
  "/:id/images",
  protect,
  authorizeMemoryImageUpload,
  uploadImages.array("images", 5),
  uploadMemoryImages
);

// Remove a single image from a memory without deleting the memory
// itself. Identified by its position in the memory's images array
// (Cloudinary public_ids may contain "/" so they can't be a route param).
memoryRouter.delete(
  "/:id/images/:index",
  protect,
  removeMemoryImage
);

// Routes for a specific memory
memoryRouter
  .route("/:id")
  .get(
    protect,
    getMemoryById
  )
  .put(
    protect,
    validate(updateMemorySchema),
    updateMemory
  )
  .delete(
    protect,
    deleteMemory
  );

module.exports = {
  locationMemoryRouter,
  memoryRouter,
};