const Joi = require("joi");
const emptyArraySchema = Joi.array().length(0);

// Validate memory creation
const createMemorySchema = Joi.object({
  content: Joi.string().trim().empty("").max(2000).optional(),

  images: Joi.array()
    .items(Joi.string().trim().min(1))
    .empty(emptyArraySchema)
    .optional(),

  videos: Joi.array()
    .items(Joi.string().trim().min(1))
    .empty(emptyArraySchema)
    .optional(),
}).or("content", "images", "videos")
  .messages({
    "object.missing":
      "A memory must contain text, images or videos",
  });

// Validate memory update
const updateMemorySchema = Joi.object({
  content: Joi.string().trim().empty("").max(2000).optional(),

  images: Joi.array()
    .items(Joi.string().trim().min(1))
    .optional(),

  videos: Joi.array()
    .items(Joi.string().trim().min(1))
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
