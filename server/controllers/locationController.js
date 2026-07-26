const Trip = require("../models/Trip");
const Location = require("../models/Location");
const { deleteMemoriesForLocation } = require("../utils/cascadeDelete");
const { isTripMember } = require("../utils/tripMembership");
const {
  deleteLocalUploadedFiles,
  deleteFilesByAbsolutePath,
} = require("../utils/mediaCleanup");

// Create a new location inside a trip
const createLocation = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);

    if (!trip) {
      // No location exists yet to attach the file to - remove it instead of leaving it orphaned.
      if (req.file) {
        await deleteFilesByAbsolutePath([req.file.path]);
      }

      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    if (!isTripMember(trip, req.user._id)) {
      if (req.file) {
        await deleteFilesByAbsolutePath([req.file.path]);
      }

      return res.status(403).json({
        success: false,
        message: "You are not allowed to add locations to this trip",
      });
    }

    // An uploaded file always wins over a plain coverImage URL string.
    const coverImage = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.coverImage || "";

    // TEMPORARY DEBUG LOGGING - remove once image upload is confirmed working end-to-end.
    console.log("[DEBUG createLocation] req.file:", req.file);
    console.log("[DEBUG createLocation] req.body keys:", Object.keys(req.body));
    console.log("[DEBUG createLocation] coverImage to save:", coverImage);

    let location;

    try {
      location = await Location.create({
        ...req.body,
        coverImage,
        trip: tripId,
        createdBy: req.user._id,
      });

      // TEMPORARY DEBUG LOGGING - remove once image upload is confirmed working end-to-end.
      console.log(
        "[DEBUG createLocation] location.coverImage after create:",
        location.coverImage
      );
    } catch (createError) {
      if (req.file) {
        await deleteFilesByAbsolutePath([req.file.path]);
      }

      throw createError;
    }

    res.status(201).json({
      success: true,
      location,
    });
  } catch (error) {
    next(error);
  }
};

// Get all locations inside a specific trip
const getLocationsByTrip = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    if (!isTripMember(trip, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view locations in this trip",
      });
    }

    const locations = await Location.find({
      trip: tripId,
    })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: locations.length,
      locations,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single location by ID
const getLocationById = async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id)
      .populate("createdBy", "name email");

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
        message: "You are not allowed to view this location",
      });
    }

    res.status(200).json({
      success: true,
      location,
    });
  } catch (error) {
    next(error);
  }
};

// Update a location
const updateLocation = async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      if (req.file) {
        await deleteFilesByAbsolutePath([req.file.path]);
      }

      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    const isLocationCreator =
      location.createdBy.toString() ===
      req.user._id.toString();

    if (!isLocationCreator) {
      if (req.file) {
        await deleteFilesByAbsolutePath([req.file.path]);
      }

      return res.status(403).json({
        success: false,
        message: "Only the location creator can update this location",
      });
    }

    const previousCoverImage = location.coverImage;
    const updates = { ...req.body };

    // TEMPORARY DEBUG LOGGING - remove once image upload is confirmed working end-to-end.
    console.log("[DEBUG updateLocation] req.file:", req.file);
    console.log(
      "[DEBUG updateLocation] req.body keys:",
      Object.keys(req.body)
    );
    console.log(
      "[DEBUG updateLocation] previousCoverImage:",
      previousCoverImage
    );

    // A new file replaces the cover image; an explicit removeCoverImage
    // flag clears it; otherwise Object.assign leaves it untouched.
    if (req.file) {
      updates.coverImage = `/uploads/${req.file.filename}`;
    } else if (updates.removeCoverImage) {
      updates.coverImage = "";
    }

    delete updates.removeCoverImage;

    // The client sends lat/lng as "" (not omitted) when the address was
    // changed to free text with no resolved coordinates, so a previously
    // saved lat/lng is not silently left in place. Unset them explicitly
    // instead of assigning the empty string to a Number field.
    if (updates.lat === "") {
      location.lat = undefined;
      delete updates.lat;
    }

    if (updates.lng === "") {
      location.lng = undefined;
      delete updates.lng;
    }

    Object.assign(location, updates);

    let updatedLocation;

    try {
      updatedLocation = await location.save();

      // TEMPORARY DEBUG LOGGING - remove once image upload is confirmed working end-to-end.
      console.log(
        "[DEBUG updateLocation] coverImage after save:",
        updatedLocation.coverImage
      );
    } catch (saveError) {
      if (req.file) {
        await deleteFilesByAbsolutePath([req.file.path]);
      }

      throw saveError;
    }

    // Remove the old file only after a successful save, and only if it
    // was actually replaced/cleared and was a local upload.
    if (
      previousCoverImage &&
      previousCoverImage !== updatedLocation.coverImage &&
      (req.file || req.body.removeCoverImage)
    ) {
      await deleteLocalUploadedFiles([previousCoverImage]);
    }

    res.status(200).json({
      success: true,
      location: updatedLocation,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a location, along with every memory and locally uploaded file
// that belongs to it.
const deleteLocation = async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    const isLocationCreator =
      location.createdBy.toString() ===
      req.user._id.toString();

    if (!isLocationCreator) {
      return res.status(403).json({
        success: false,
        message: "Only the location creator can delete this location",
      });
    }

    await deleteMemoriesForLocation(location._id);
    await deleteLocalUploadedFiles([location.coverImage]);
    await location.deleteOne();

    res.status(200).json({
      success: true,
      message: "Location deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLocation,
  getLocationsByTrip,
  getLocationById,
  updateLocation,
  deleteLocation,
};