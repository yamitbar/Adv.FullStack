const User = require("../models/User");

// Get all users
const getUsers = async (req, res) => {
  try {
    // Find all user documents in MongoDB
    const users = await User.find();

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

module.exports = {
  getUsers,
};