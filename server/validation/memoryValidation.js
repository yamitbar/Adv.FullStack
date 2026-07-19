const Joi = require("joi");

// Validate memory creation.
//
// Images/videos are intentionally NOT accepted here: a memory is always
// created with non-empty text first, and images are attached afterwards
// only through the dedicated Multer upload endpoint. This prevents JSON
// clients from inserting arbitrary image/video path strings directly.
// `validate` strips unknown keys, so an `images`/`videos` field sent here
// is silently dropped rather than stored.
const createMemorySchema = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required().messages({
    "any.required": "Memory text is required",
    "string.empty": "Memory text is required",
  }),
});

// Validate memory update.
//
// Text-only in this batch: images/videos are not accepted here either,
// so a JSON update can never replace or clear the image list, and an
// update can never turn a memory into a completely empty one.
const updateMemorySchema = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required().messages({
    "any.required": "Memory text is required",
    "string.empty": "Memory text is required",
  }),
});

module.exports = {
  createMemorySchema,
  updateMemorySchema,
};
