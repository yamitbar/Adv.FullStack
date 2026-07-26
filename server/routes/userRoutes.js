const express = require("express");
const router = express.Router();

const {
  getUsers,
  getUserById,
  updateUser,
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { updateUserSchema } = require("../validation/userValidation");

// Admin-only listing
router.get("/", protect, getUsers);

// Self or admin
router.get("/:id", protect, getUserById);

// stripUnknown: false so a field like "role" or "password" is rejected
// outright instead of silently dropped.
router.put(
  "/:id",
  protect,
  validate(updateUserSchema, { stripUnknown: false }),
  updateUser
);

// No DELETE route: account deletion is not part of the product (no
// frontend flow uses it), and a full cascade delete of a user's trips,
// participant references, locations, memories and files was judged
// too large/risky to add without a real product requirement for it.

module.exports = router;
