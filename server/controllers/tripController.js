const Trip = require("../models/Trip");
const { deleteLocationsForTrip } = require("../utils/cascadeDelete");
const {
  uploadBufferToCloudinary,
  destroyCloudinaryAsset,
} = require("../utils/cloudinaryUpload");

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
    let coverImagePath = coverImage || "";
    let coverImagePublicId = "";

    if (req.file) {
      const uploaded = await uploadBufferToCloudinary(
        req.file.buffer,
        "pathly/trips"
      );

      coverImagePath = uploaded.url;
      coverImagePublicId = uploaded.publicId;
    }

    let trip;

    try {
      trip = await Trip.create({
        title,
        description,
        destination,
        startDate,
        endDate,
        coverImage: coverImagePath,
        coverImagePublicId,
        createdBy: req.user._id,
        participants: [req.user._id],
      });
    } catch (createError) {
      // The trip was never saved - remove the just-uploaded Cloudinary
      // asset so it isn't orphaned with no matching database record.
      if (coverImagePublicId) {
        await destroyCloudinaryAsset(coverImagePublicId);
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

    const previousCoverImage = trip.coverImage;
    const previousCoverImagePublicId = trip.coverImagePublicId;
    const updates = { ...req.body };
    let newCoverImagePublicId = "";

    // A new file replaces the cover image; an explicit removeCoverImage
    // flag clears it; otherwise Object.assign leaves it untouched.
    if (req.file) {
      const uploaded = await uploadBufferToCloudinary(
        req.file.buffer,
        "pathly/trips"
      );

      updates.coverImage = uploaded.url;
      updates.coverImagePublicId = uploaded.publicId;
      newCoverImagePublicId = uploaded.publicId;
    } else if (updates.removeCoverImage) {
      updates.coverImage = "";
      updates.coverImagePublicId = "";
    }

    delete updates.removeCoverImage;

    Object.assign(trip, updates);

    try {
      await trip.save();
    } catch (saveError) {
      // The DB write failed - remove the just-uploaded replacement asset
      // (the previous one, if any, is still referenced and stays intact).
      if (newCoverImagePublicId) {
        await destroyCloudinaryAsset(newCoverImagePublicId);
      }

      throw saveError;
    }

    // Remove the old asset only after a successful save, and only if it
    // was actually replaced/cleared.
    if (
      previousCoverImagePublicId &&
      previousCoverImage !== trip.coverImage
    ) {
      await destroyCloudinaryAsset(previousCoverImagePublicId);
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

// Delete a trip by ID, along with every location, memory and uploaded
// Cloudinary asset that belongs to it.
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
    await destroyCloudinaryAsset(trip.coverImagePublicId);
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
