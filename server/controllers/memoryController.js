const path = require("path");

const Location = require("../models/Location");
const Trip = require("../models/Trip");
const Memory = require("../models/Memory");
const {
  deleteLocalUploadedFiles,
  deleteFilesByAbsolutePath,
} = require("../utils/mediaCleanup");
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
    await memory.populate("createdBy", "name email");

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
      .populate("createdBy", "name email")
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
      .populate("createdBy", "name email");

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
    await memory.populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      memory,
    });
  } catch (error) {
    next(error);
  }
};

// Delete memory, along with any locally uploaded files it references
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

    await deleteLocalUploadedFiles(memory.images);
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
// authorization rule used everywhere else on memories.
const removeMemoryImage = async (req, res, next) => {
  try {
    const { id, filename } = req.params;

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

    // path.basename strips any "../" or "/" segments, so a crafted
    // filename can never point outside the uploads directory. If the
    // request's filename doesn't survive that unchanged, it was never a
    // plain filename to begin with - reject it instead of guessing.
    const safeFileName = path.basename(filename || "");

    if (!safeFileName || safeFileName !== filename) {
      return res.status(400).json({
        success: false,
        message: "Invalid image filename",
      });
    }

    const storedPath = `/uploads/${safeFileName}`;
    const imageIndex = memory.images.indexOf(storedPath);

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "This image does not belong to this memory",
      });
    }

    memory.images.splice(imageIndex, 1);

    await memory.save();
    await memory.populate("createdBy", "name email");

    // Remove the file from disk after the database update succeeds, so
    // a failed save never leaves the Memory document pointing at a
    // deleted file. A failure here is logged but never blocks the
    // response - the document is already the source of truth.
    await deleteLocalUploadedFiles([storedPath]);

    res.status(200).json({
      success: true,
      message: "Image removed successfully",
      memory,
    });
  } catch (error) {
    next(error);
  }
};

// Upload images to an existing memory.
//
// Authorization already ran in the authorizeMemoryImageUpload middleware
// (before Multer touched the disk), so req.memory is already the
// verified, owned memory here. If saving to the database fails after
// Multer wrote the files, the just-written files are removed so the
// request never leaves orphan uploads behind.
const uploadMemoryImages = async (req, res, next) => {
  const memory = req.memory;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one image is required",
    });
  }

  const imagePaths = req.files.map(
    (file) => `/uploads/${file.filename}`
  );

  try {
    memory.images.push(...imagePaths);

    await memory.save();
    await memory.populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      message: "Images uploaded successfully",
      images: memory.images,
      memory,
    });
  } catch (error) {
    await deleteFilesByAbsolutePath(
      req.files.map((file) => file.path)
    );

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