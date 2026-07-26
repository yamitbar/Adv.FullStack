const Joi = require("joi");

// Only name/email are user-editable here; password and role changes
// have their own dedicated flows and must never go through this route.
const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).optional(),
  email: Joi.string().trim().lowercase().email().optional(),
})
  .min(1)
  .messages({
    "object.min": "At least one of name or email is required",
  });

module.exports = {
  updateUserSchema,
};
