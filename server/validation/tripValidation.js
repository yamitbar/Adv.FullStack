const Joi = require("joi");

const validateDateOrder = (value, helpers) => {
  if (
    value.startDate &&
    value.endDate &&
    new Date(value.endDate) < new Date(value.startDate)
  ) {
    return helpers.error("date.order");
  }

  return value;
};

const createTripSchema = Joi.object({
  title: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional().allow(""),
  destination: Joi.string().min(2).max(100).required(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  coverImage: Joi.string().optional().allow(""),
})
  .custom(validateDateOrder)
  .messages({
    "date.order": "End date must be on or after start date",
  });

const updateTripSchema = Joi.object({
  title: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional().allow(""),
  destination: Joi.string().min(2).max(100).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  coverImage: Joi.string().optional().allow(""),

  // FormData sends this as "true"/"false"; Joi's `convert` option turns
  // it into a real boolean. Not accepted on create - nothing to remove yet.
  removeCoverImage: Joi.boolean().optional(),
})
  .min(1)
  .custom(validateDateOrder)
  .messages({
    "object.min": "At least one field is required for update",
    "date.order": "End date must be on or after start date",
  });

const joinTripSchema = Joi.object({
  inviteCode: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^PTR-[A-Z0-9]{3,12}$/)
    .required()
    .messages({
      "string.pattern.base": "Invite code must use the PTR-XXXX format",
      "any.required": "Invite code is required",
      "string.empty": "Invite code is required",
    }),
});

module.exports = {
  createTripSchema,
  updateTripSchema,
  joinTripSchema,
};
