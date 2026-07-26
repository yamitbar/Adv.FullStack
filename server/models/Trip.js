const mongoose = require("mongoose");
const generateInviteCode = require("../utils/generateInviteCode");

const tripSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Trip title is required"],
      trim: true,
      maxlength: [100, "Trip title cannot exceed 100 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Trip description cannot exceed 500 characters"],
    },

    destination: {
      type: String,
      required: [true, "Trip destination is required"],
      trim: true,
      maxlength: [100, "Trip destination cannot exceed 100 characters"],
    },

    startDate: {
      type: Date,
    },

    endDate: {
      type: Date,
    },

    coverImage: {
      type: String,
      default: "",
    },

    // Cloudinary public_id for coverImage, needed to delete/replace the
    // asset. Empty when coverImage is a plain external URL, not an upload.
    coverImagePublicId: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Trip creator is required"],
    },

    participants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },

    inviteCode: {
      type: String,
      unique: true,
      default: generateInviteCode,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Trip", tripSchema);