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
};