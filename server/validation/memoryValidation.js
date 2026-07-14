const Joi = require("joi");

// Validate memory creation
const createMemorySchema = Joi.object({
  content: Joi.string().trim().allow("").optional(),

  images: Joi.array()
    .items(Joi.string())
    .optional(),

  videos: Joi.array()
    .items(Joi.string())
    .optional(),
}).or("content", "images", "videos")
  .messages({
    "object.missing":
      "A memory must contain text, images or videos",
  });

// Validate memory update
const updateMemorySchema = Joi.object({
  content: Joi.string().trim().allow("").optional(),

  images: Joi.array()
    .items(Joi.string())
    .optional(),

  videos: Joi.array()
    .items(Joi.string())
    .optional(),
})
  .min(1)
  .messages({
    "object.min":
      "At least one field is required for update",
  });

module.exports = {
  createMemorySchema,
  updateMemorySchema,
};