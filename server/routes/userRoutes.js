const express = require("express");
// Create a new router for user routes
const router = express.Router();

// Import controller functions from userController.js
const { getUsers } = require("../controllers/userController");

// Get all users
router.get("/", getUsers);

// Export the router
module.exports = router;