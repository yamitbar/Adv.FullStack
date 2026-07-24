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

    // Internal/legacy field. No longer collected from the user (Batch 6
    // final manual QA fixes) - the UI only captures a free-text address
    // and an optional custom title. Kept optional (not required) rather
    // than removed so documents created by earlier batches that already
    // have a placeName keep working unchanged.
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

    // Internal/non-user-facing field. Optional: not every location has
    // known coordinates (e.g. added without a map/places lookup).
    lat: {
      type: Number,
    },

    // Internal/non-user-facing field. See note on lat above.
    lng: {
      type: Number,
    },

    // Legacy field from an earlier, unmerged Google Places integration
    // attempt. No production data ever used it, but it's kept optional
    // rather than removed in case any existing document already has
    // one set. New locations use the provider-neutral `placeId` below
    // instead (currently populated by Geoapify's Address Autocomplete
    // API).
    googlePlaceId: {
      type: String,
      trim: true,
      default: "",
    },

    // Provider-neutral external place identifier (currently Geoapify's
    // `place_id`, from the Address Autocomplete API). Optional: not
    // every location has one, e.g. older documents created before this
    // field existed, or locations added without selecting a
    // suggestion (once autocomplete is unavailable, the address field
    // still works as plain text - see AddressAutocomplete.jsx).
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