const mongoose = require("mongoose");

const memorySchema = new mongoose.Schema(
  {
    content: {
      type: String,
      trim: true,
      default: "",
    },

    images: [
      {
        type: String,
      },
    ],

    // Cloudinary public_ids, in the same order as images, needed to
    // delete each asset individually.
    imagePublicIds: [
      {
        type: String,
      },
    ],

    videos: [
      {
        type: String,
      },
    ],

    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Memory", memorySchema);