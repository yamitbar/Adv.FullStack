const Trip = require("../models/Trip");

// Create a new trip
const createTrip = async (req, res) => {
  try {
    const {
      title,
      description,
      destination,
      startDate,
      endDate,
      coverImage,
    } = req.body;

    const trip = await Trip.create({
      title,
      description,
      destination,
      startDate,
      endDate,
      coverImage,
      createdBy: req.user._id,
      participants: [req.user._id],
    });

    res.status(201).json({
      success: true,
      message: "Trip created successfully",
      trip,
    });
  } 
  catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all trips related to the logged-in user
const getTrips = async (req, res) => {
  try {
    const trips = await Trip.find({
      $or: [
        { createdBy: req.user._id },
        { participants: req.user._id },
      ],
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      trips,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// Export the router so it can be used in app.js
module.exports = {
  createTrip,
  getTrips,
};