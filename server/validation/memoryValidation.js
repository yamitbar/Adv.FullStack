const Joi = require("joi");

// Images/videos are intentionally not accepted here: a memory is always
// created with text first, and images are attached only through the
// dedicated Multer upload endpoint - this keeps a JSON client from ever
// inserting arbitrary image/video path strings directly.
const createMemorySchema = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required().messages({
    "any.required": "Memory text is required",
    "string.empty": "Memory text is required",
  }),
});

// Text-only update - images/videos are not accepted here either, so a
// JSON update can never replace or clear the image list.
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
