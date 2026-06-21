const express = require("express");
// Create a new router for user routes
const router = express.Router();

// Import controller functions
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

// GET /
// Return all users from the database
router.get("/", getUsers);

// GET /:id
// Return a single user by MongoDB id
router.get("/:id", getUserById);

// PUT /:id
// Update a single user by MongoDB id
router.put("/:id", updateUser);

// DELETE /:id
// Delete a single user by MongoDB id
router.delete("/:id", deleteUser);

// Export the router
module.exports = router;