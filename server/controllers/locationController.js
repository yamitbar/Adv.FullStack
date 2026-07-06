const Trip = require("../models/Trip");
const Location = require("../models/Location");

// Create a new location inside a trip
const createLocation = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findOne({
      _id: tripId,
      $or: [
        { createdBy: req.user._id },
        { participants: req.user._id },
      ],
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found or you are not allowed to add locations to it",
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

module.exports = {
  createLocation,
};