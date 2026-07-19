const User = require("../models/User");

const canManageUser = (authenticatedUser, requestedUserId) => {
  return (
    authenticatedUser.role === "admin" ||
    authenticatedUser._id.toString() === requestedUserId
  );
};

// Get all users
const getUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only administrators can view all users",
      });
    }

    // Find all user documents in MongoDB
    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get a single user by id
const getUserById = async (req, res) => {
  try {
    if (!canManageUser(req.user, req.params.id)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this user",
      });
    }

    // Find the user by MongoDB id
    const user = await User.findById(req.params.id).select("-password");

    // Check if the user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update a user by id
const updateUser = async (req, res) => {
  try {
    if (!canManageUser(req.user, req.params.id)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this user",
      });
    }

    const requestedFields = Object.keys(req.body);
    const allowedFields = ["name", "email"];
    const unsafeFields = requestedFields.filter(
      (field) => !allowedFields.includes(field)
    );

    if (unsafeFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Fields cannot be updated here: ${unsafeFields.join(", ")}`,
      });
    }

    if (requestedFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one of name or email is required",
      });
    }

    const safeUpdates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        safeUpdates[field] = req.body[field];
      }
    }

    // Find the user and update the provided fields
    const user = await User.findByIdAndUpdate(
      req.params.id,
      safeUpdates,
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    // Check if the user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a user by id
const deleteUser = async (req, res) => {
  try {
    if (!canManageUser(req.user, req.params.id)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this user",
      });
    }

    // Find the user and delete it
    const user = await User.findByIdAndDelete(req.params.id);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
