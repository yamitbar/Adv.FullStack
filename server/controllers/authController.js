const User = require("../models/User");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");

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
const login = async (req, res) => {
  // Extract login fields from the request body
  const { email, password } = req.body;

  // Check if all required fields were provided
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  // Find a user by email
  const user = await User.findOne({ email });

  // Check if the user exists
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  // Compare the provided password with the hashed password in the database
  const isPasswordMatch = await bcrypt.compare(password, user.password);

  // Check if the password is correct
  if (!isPasswordMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  // Generate a JWT for the authenticated user
  const token = generateToken(user._id);
  
  res.status(200).json({
    success: true,
    message: "Login successful",
    user,
    token,
  });
};

// Export controller functions
module.exports = {
  register,
  login,
};