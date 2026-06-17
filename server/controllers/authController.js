const User = require("../models/User");

// Handle user registration requests
const register = async (req, res) => {
  try {
    // Extract registration fields from the request body
    const { name, email, password } = req.body;

    // Check if all required fields were provided
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    // Create a new user document in MongoDB
    const user = await User.create({
      name,
      email,
      password,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Handle user login requests
const login = (req, res) => {
  // Extract login fields from the request body
  const { email, password } = req.body;

  // Check if all required fields were provided
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  res.status(200).json({
    success: true,
    message: "Login data received successfully",
    user: {
      email,
    },
  });
};

// Export controller functions
module.exports = {
  register,
  login,
};