const Trip = require("../models/Trip");
const { deleteLocationsForTrip } = require("../utils/cascadeDelete");
const {
  deleteLocalUploadedFiles,
  deleteFilesByAbsolutePath,
} = require("../utils/mediaCleanup");

const hasInvalidDateRange = (startDate, endDate) => {
  return Boolean(
    startDate &&
    endDate &&
    new Date(endDate) < new Date(startDate)
  );
};

// Create a new trip
const createTrip = async (req, res, next) => {
  try {
    const {
      title,
      description,
      destination,
      startDate,
      endDate,
      coverImage,
    } = req.body;

    // An uploaded file always wins over a plain coverImage URL string,
    // so a client can still fall back to pasting an external URL.
    const coverImagePath = req.file
      ? `/uploads/${req.file.filename}`
      : coverImage || "";

    // TEMPORARY DEBUG LOGGING - remove once image upload is confirmed working end-to-end.
    console.log("[DEBUG createTrip] req.file:", req.file);
    console.log("[DEBUG createTrip] req.body keys:", Object.keys(req.body));
    console.log("[DEBUG createTrip] coverImagePath to save:", coverImagePath);

    let trip;

    try {
      trip = await Trip.create({
        title,
        description,
        destination,
        startDate,
        endDate,
        coverImage: coverImagePath,
        createdBy: req.user._id,
        participants: [req.user._id],
      });

      // TEMPORARY DEBUG LOGGING - remove once image upload is confirmed working end-to-end.
      console.log(
        "[DEBUG createTrip] trip.coverImage after Trip.create:",
        trip.coverImage
      );
    } catch (createError) {
      // The trip was never saved - remove the uploaded file so it isn't orphaned on disk.
      if (req.file) {
        await deleteFilesByAbsolutePath([req.file.path]);
      }

      throw createError;
    }

    res.status(201).json({
      success: true,
      message: "Trip created successfully",
      trip,
    });
  }
  catch (error) {
    next(error);
  }
};

// Get all trips related to the logged-in user
const getTrips = async (req, res, next) => {
  try {
    const trips = await Trip.find({
      $or: [
        { createdBy: req.user._id },
        { participants: req.user._id },
      ],
    })
      .populate("createdBy", "name")
      .populate("participants", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      trips,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single trip by ID
const getTripById = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({
      _id: req.params.id,
      $or: [
        { createdBy: req.user._id },
        { participants: req.user._id },
      ],
    })
      .populate("createdBy", "name")
      .populate("participants", "name");

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
    next(error);
  }
};

// Update a trip by ID
const updateTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!trip) {
      // The request is rejected before the trip is touched, so an
      // uploaded file (if any) would never be referenced by anything -
      // remove it instead of leaving it orphaned on disk.
      if (req.file) {
        await deleteFilesByAbsolutePath([req.file.path]);
      }

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
      if (req.file) {
        await deleteFilesByAbsolutePath([req.file.path]);
      }

      return res.status(400).json({
        success: false,
        message: "End date must be on or after start date",
      });
    }

    const previousCoverImage = trip.coverImage;
    const updates = { ...req.body };

    // TEMPORARY DEBUG LOGGING - remove once image upload is confirmed working end-to-end.
    console.log("[DEBUG updateTrip] req.file:", req.file);
    console.log("[DEBUG updateTrip] req.body keys:", Object.keys(req.body));
    console.log(
      "[DEBUG updateTrip] previousCoverImage:",
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

    Object.assign(trip, updates);

    try {
      await trip.save();

      // TEMPORARY DEBUG LOGGING - remove once image upload is confirmed working end-to-end.
      console.log(
        "[DEBUG updateTrip] trip.coverImage after save:",
        trip.coverImage
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
      previousCoverImage !== trip.coverImage &&
      (req.file || req.body.removeCoverImage)
    ) {
      await deleteLocalUploadedFiles([previousCoverImage]);
    }

    await trip.populate("createdBy", "name");
    await trip.populate("participants", "name");

    res.status(200).json({
      success: true,
      trip,
    });
  } catch (error) {
    next(error);
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
    await deleteLocalUploadedFiles([trip.coverImage]);
    await trip.deleteOne();

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Join a trip using an invite code
const joinTrip = async (req, res, next) => {
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
    await trip.populate("createdBy", "name");
    await trip.populate("participants", "name");

    res.status(200).json({
      success: true,
      trip,
    });
  } catch (error) {
    next(error);
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
