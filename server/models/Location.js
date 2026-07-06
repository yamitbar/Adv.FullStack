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

    placeName: {
      type: String,
      required: [true, "Place name is required"],
      trim: true,
    },

    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },

    lat: {
      type: Number,
      required: [true, "Latitude is required"],
    },

    lng: {
      type: Number,
      required: [true, "Longitude is required"],
    },

    googlePlaceId: {
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