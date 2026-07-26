const mongoose = require("mongoose");

// Define the schema for a real location inside a trip
const locationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: [100, "Location title cannot exceed 100 characters"],
      default: "",
    },

    // Legacy field, no longer collected from the user - kept optional so
    // documents created before this change keep working unchanged.
    placeName: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },

    // Optional: not every location has known coordinates (e.g. added
    // without a map/places lookup).
    lat: {
      type: Number,
    },

    lng: {
      type: Number,
    },

    // Legacy field from an earlier, unmerged Google Places integration.
    // Kept optional rather than removed in case an existing document
    // still has one set; new locations use `placeId` (Geoapify) instead.
    googlePlaceId: {
      type: String,
      trim: true,
      default: "",
    },

    // Provider-neutral external place identifier (currently Geoapify's
    // place_id). Optional - not every location has one.
    placeId: {
      type: String,
      trim: true,
      default: "",
    },

    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: [true, "Trip is required"],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },

    coverImage: {
      type: String,
      default: "",
    },

    visitedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Location", locationSchema);