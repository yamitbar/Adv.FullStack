const express = require("express");

// Import authentication controller functions
const { register, login } = require("../controllers/authController");

// Create a new router instance for authentication routes
const router = express.Router();

// Route for registering a new user
router.post("/register", register);

// Route for logging in an existing user
router.post("/login", login);

// Export the router so it can be used in app.js
module.exports = router;