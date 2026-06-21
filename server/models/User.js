const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

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

// Hash the password before saving a user
userSchema.pre("save", async function () {
  // Skip hashing if the password was not changed
  if (!this.isModified("password")) {
    return;
  }

  // Hash the password before saving it
  this.password = await bcrypt.hash(this.password, 10);
});

// Create the User model from the schema
const User = mongoose.model("User", userSchema);

// Export the User model
module.exports = User;