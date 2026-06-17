const mongoose = require("mongoose");

// Define the user schema
const userSchema = new mongoose.Schema(
  {
    // User full name
    name: {
      type: String,
      required: true,
    },

    // User email address
    email: {
      type: String,
      required: true,
      unique: true,
    },

    // User password
    password: {
      type: String,
      required: true,
    },

    // User role in the system
    role: {
      type: String,
      default: "user",
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

// Create the User model from the schema
const User = mongoose.model("User", userSchema);

// Export the User model
module.exports = User;