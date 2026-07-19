const Trip = require("../models/Trip");
const { deleteLocationsForTrip } = require("../utils/cascadeDelete");

const hasInvalidDateRange = (startDate, endDate) => {
  return Boolean(
    startDate &&
    endDate &&
    new Date(endDate) < new Date(startDate)
  );
};

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

// Get a single trip by ID
const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findOne({
      _id: req.params.id,
      $or: [
        { createdBy: req.user._id },
        { participants: req.user._id },
      ],
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    res.status(200).json({
      success: true,
      trip,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update a trip by ID
const updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found or you are not allowed to update it",
      });
    }

    const nextStartDate =
      req.body.startDate !== undefined
        ? req.body.startDate
        : trip.startDate;

    const nextEndDate =
      req.body.endDate !== undefined
        ? req.body.endDate
        : trip.endDate;

    if (hasInvalidDateRange(nextStartDate, nextEndDate)) {
      return res.status(400).json({
        success: false,
        message: "End date must be on or after start date",
      });
    }

    Object.assign(trip, req.body);
    await trip.save();

    res.status(200).json({
      success: true,
      trip,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete a trip by ID, along with every location, memory and locally
// uploaded file that belongs to it.
const deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found or you are not allowed to delete it",
      });
    }

    await deleteLocationsForTrip(trip._id);
    await trip.deleteOne();

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Join a trip using an invite code
const joinTrip = async (req, res) => {
  try {
    const { inviteCode } = req.body;

    const trip = await Trip.findOne({ inviteCode });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    const isAlreadyParticipant = trip.participants.some(
      (participantId) => participantId.toString() === req.user._id.toString()
    );

    if (isAlreadyParticipant) {
      return res.status(400).json({
        success: false,
        message: "You are already a participant in this trip",
      });
    }

    trip.participants.push(req.user._id);

    await trip.save();

    res.status(200).json({
      success: true,
      trip,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Export the router so it can be used in app.js
module.exports = {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  joinTrip,

};
