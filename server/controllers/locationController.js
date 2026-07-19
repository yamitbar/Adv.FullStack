const Trip = require("../models/Trip");
const Location = require("../models/Location");
const { deleteMemoriesForLocation } = require("../utils/cascadeDelete");
const { isTripMember } = require("../utils/tripMembership");

// Create a new location inside a trip
const createLocation = async (req, res) => {
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
        message: "You are not allowed to add locations to this trip",
      });
    }

    const location = await Location.create({
      ...req.body,
      trip: tripId,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      location,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all locations inside a specific trip
const getLocationsByTrip = async (req, res) => {
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
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get a single location by ID
const getLocationById = async (req, res) => {
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
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update a location
const updateLocation = async (req, res) => {
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
        message: "Only the location creator can update this location",
      });
    }

    Object.assign(location, req.body);

    const updatedLocation = await location.save();

    res.status(200).json({
      success: true,
      location: updatedLocation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
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