const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    // Check if the Authorization header exists and starts with Bearer
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Stop the request if no token was provided
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token",
      });
    }

    // Verify the token and decode its payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the logged-in user and attach it to the request object
    req.user = await User.findById(decoded.id).select("-password");

    // Continue to the next middleware or controller
    next();
  } 
  catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, token failed",
    });
  }
};

module.exports = {
  protect,
};