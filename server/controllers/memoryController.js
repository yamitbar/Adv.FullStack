const Location = require("../models/Location");
const Trip = require("../models/Trip");
const Memory = require("../models/Memory");
const {
  uploadBufferToCloudinary,
  destroyCloudinaryAsset,
  destroyCloudinaryAssets,
} = require("../utils/cloudinaryUpload");
const { isTripMember } = require("../utils/tripMembership");

// Create a memory
const createMemory = async (req, res, next) => {
  try {
    const { locationId } = req.params;

    const location = await Location.findById(locationId);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    const trip = await Trip.findById(location.trip);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    if (!isTripMember(trip, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to add memories",
      });
    }

    const memory = await Memory.create({
      ...req.body,
      location: locationId,
      createdBy: req.user._id,
    });

    // Populate createdBy before responding so the frontend gets the
    // creator's name immediately, instead of a bare ObjectId that only
    // becomes a name after a later fetch/refetch (see getMemoriesByLocation
    // and getMemoryById below, which already did this correctly).
    await memory.populate("createdBy", "name");

    res.status(201).json({
      success: true,
      memory,
    });
  } catch (error) {
    next(error);
  }
};

// Get all memories of a location
const getMemoriesByLocation = async (req, res, next) => {
  try {
    const { locationId } = req.params;

    const location = await Location.findById(locationId);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    const trip = await Trip.findById(location.trip);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    if (!isTripMember(trip, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view memories",
      });
    }

    const memories = await Memory.find({
      location: locationId,
    })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: memories.length,
      memories,
    });
  } catch (error) {
    next(error);
  }
};

// Get memory by ID
const getMemoryById = async (req, res, next) => {
  try {
    const memory = await Memory.findById(req.params.id)
      .populate("createdBy", "name");

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: "Memory not found",
      });
    }

    const location = await Location.findById(memory.location);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    const trip = await Trip.findById(location.trip);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    if (!isTripMember(trip, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this memory",
      });
    }

    res.status(200).json({
      success: true,
      memory,
    });
  } catch (error) {
    next(error);
  }
};

// Update memory (text content only in this batch - see memoryValidation)
const updateMemory = async (req, res, next) => {
  try {
    const memory = await Memory.findById(req.params.id);

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: "Memory not found",
      });
    }

    if (
      memory.createdBy.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only the memory creator can update this memory",
      });
    }

    Object.assign(memory, req.body);

    await memory.save();
    await memory.populate("createdBy", "name");

    res.status(200).json({
      success: true,
      memory,
    });
  } catch (error) {
    next(error);
  }
};

// Delete memory, along with any Cloudinary images it references
const deleteMemory = async (req, res, next) => {
  try {
    const memory = await Memory.findById(req.params.id);

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: "Memory not found",
      });
    }

    if (
      memory.createdBy.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only the memory creator can delete this memory",
      });
    }

    await destroyCloudinaryAssets(memory.imagePublicIds);
    await memory.deleteOne();

    res.status(200).json({
      success: true,
      message: "Memory deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Remove a single image from a memory, keeping the memory and its text
// intact. Only the memory creator may do this, matching the same
// authorization rule used everywhere else on memories. Identified by its
// array index (Cloudinary public_ids can contain "/", so they cannot be
// used directly as a route param the way a local filename could).
const removeMemoryImage = async (req, res, next) => {
  try {
    const { id, index } = req.params;

    const memory = await Memory.findById(id);

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: "Memory not found",
      });
    }

    if (
      memory.createdBy.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only the memory creator can remove images from this memory",
      });
    }

    const imageIndex = Number(index);

    if (
      !Number.isInteger(imageIndex) ||
      imageIndex < 0 ||
      imageIndex >= memory.images.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid image index",
      });
    }

    const publicIdToRemove = memory.imagePublicIds?.[imageIndex];

    memory.images.splice(imageIndex, 1);

    if (memory.imagePublicIds) {
      memory.imagePublicIds.splice(imageIndex, 1);
    }

    await memory.save();
    await memory.populate("createdBy", "name");

    // Remove the asset from Cloudinary after the database update
    // succeeds, so a failed save never leaves the Memory document
    // pointing at a deleted image. A failure here is logged but never
    // blocks the response - the document is already the source of truth.
    await destroyCloudinaryAsset(publicIdToRemove);

    res.status(200).json({
      success: true,
      message: "Image removed successfully",
      memory,
    });
  } catch (error) {
    next(error);
  }
};

// Uploads images to an existing memory (already authorized and loaded
// onto req.memory by authorizeMemoryImageUpload). Rolls back the
// just-written files if the database save fails.
const uploadMemoryImages = async (req, res, next) => {
  const memory = req.memory;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one image is required",
    });
  }

  // Promise.allSettled (not Promise.all) so a later failed upload never
  // hides the public_ids of uploads that already succeeded - those are
  // still real Cloudinary assets that need to be destroyed, not just
  // discarded, if any upload in the batch fails.
  const settledUploads = await Promise.allSettled(
    req.files.map((file) =>
      uploadBufferToCloudinary(file.buffer, "pathly/memories")
    )
  );

  const succeededUploads = settledUploads
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  const firstFailedUpload = settledUploads.find(
    (result) => result.status === "rejected"
  );

  if (firstFailedUpload) {
    // At least one upload failed - the memory document is never touched,
    // and every upload that DID succeed before the failure is destroyed
    // so it isn't left orphaned in Cloudinary with no matching record.
    await destroyCloudinaryAssets(
      succeededUploads.map((item) => item.publicId)
    );

    return next(firstFailedUpload.reason);
  }

  const uploaded = succeededUploads;

  try {
    memory.images.push(...uploaded.map((item) => item.url));
    memory.imagePublicIds.push(...uploaded.map((item) => item.publicId));

    await memory.save();
    await memory.populate("createdBy", "name");

    res.status(200).json({
      success: true,
      message: "Images uploaded successfully",
      images: memory.images,
      memory,
    });
  } catch (error) {
    // The DB save failed - remove the just-uploaded assets so they
    // aren't orphaned with no matching database record.
    await destroyCloudinaryAssets(uploaded.map((item) => item.publicId));

    next(error);
  }
};

module.exports = {
  createMemory,
  getMemoriesByLocation,
  getMemoryById,
  uploadMemoryImages,
  updateMemory,
  deleteMemory,
  removeMemoryImage,
};
