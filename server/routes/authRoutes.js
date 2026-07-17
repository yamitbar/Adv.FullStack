const express = require("express");

// Import authentication controller functions
const {
  register,
  login,
  getMe,
} = require("../controllers/authController");

// Import authentication middleware
const {
  protect,
} = require("../middleware/authMiddleware");

// Import validation middleware and schemas
const validate = require("../middleware/validate");
const {
  registerSchema,
  loginSchema,
} = require("../validation/authValidation");

// Create a new router instance for authentication routes
const router = express.Router();

// Route for registering a new user
router.post(
  "/register",
  validate(registerSchema),
  register
);

// Route for logging in an existing user
router.post(
  "/login",
  validate(loginSchema),
  login
);

// Route for retrieving the currently authenticated user
router.get("/me", protect, getMe);

// Export the router so it can be used in app.js
module.exports = router;