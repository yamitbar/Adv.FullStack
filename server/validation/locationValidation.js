const Joi = require("joi");

// Validate location creation data
const createLocationSchema = Joi.object({
  title: Joi.string().trim().max(100).allow("").optional(),

  placeName: Joi.string().trim().required().messages({
    "any.required": "Place name is required",
    "string.empty": "Place name is required",
  }),

  address: Joi.string().trim().required().messages({
    "any.required": "Address is required",
    "string.empty": "Address is required",
  }),

  lat: Joi.number().min(-90).max(90).required().messages({
    "any.required": "Latitude is required",
    "number.base": "Latitude must be a number",
    "number.min": "Latitude must be between -90 and 90",
    "number.max": "Latitude must be between -90 and 90",
  }),

  lng: Joi.number().min(-180).max(180).required().messages({
    "any.required": "Longitude is required",
    "number.base": "Longitude must be a number",
    "number.min": "Longitude must be between -180 and 180",
    "number.max": "Longitude must be between -180 and 180",
  }),

  googlePlaceId: Joi.string().trim().allow("").optional(),

  coverImage: Joi.string().trim().allow("").optional(),

  visitedAt: Joi.date().optional(),
});

// Validate location update data
const updateLocationSchema = Joi.object({
  title: Joi.string().trim().max(100).allow("").optional(),

  placeName: Joi.string().trim().min(1).optional().messages({
    "string.empty": "Place name cannot be empty",
  }),

  address: Joi.string().trim().min(1).optional().messages({
    "string.empty": "Address cannot be empty",
  }),

  lat: Joi.number().min(-90).max(90).optional().messages({
    "number.base": "Latitude must be a number",
    "number.min": "Latitude must be between -90 and 90",
    "number.max": "Latitude must be between -90 and 90",
  }),

  lng: Joi.number().min(-180).max(180).optional().messages({
    "number.base": "Longitude must be a number",
    "number.min": "Longitude must be between -180 and 180",
    "number.max": "Longitude must be between -180 and 180",
  }),

  googlePlaceId: Joi.string().trim().allow("").optional(),

  coverImage: Joi.string().trim().allow("").optional(),

  visitedAt: Joi.date().optional(),
}).min(1).messages({
  "object.min": "At least one field is required for update",
});

module.exports = {
  createLocationSchema,
  updateLocationSchema,
};
