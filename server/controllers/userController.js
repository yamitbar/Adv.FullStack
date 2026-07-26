const User = require("../models/User");

const canManageUser = (authenticatedUser, requestedUserId) => {
  return (
    authenticatedUser.role === "admin" ||
    authenticatedUser._id.toString() === requestedUserId
  );
};

// Get all users
const getUsers = async (req, res, next) => {
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
    next(error);
  }
};

// Get a single user by id
const getUserById = async (req, res, next) => {
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
    next(error);
  }
};

// Update a user by id. req.body is already restricted to name/email and
// validated (trimmed, email lowercased) by updateUserSchema.
const updateUser = async (req, res, next) => {
  try {
    if (!canManageUser(req.user, req.params.id)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this user",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

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
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
};
