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

  lat: Joi.number().required().messages({
    "any.required": "Latitude is required",
    "number.base": "Latitude must be a number",
  }),

  lng: Joi.number().required().messages({
    "any.required": "Longitude is required",
    "number.base": "Longitude must be a number",
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

  lat: Joi.number().optional().messages({
    "number.base": "Latitude must be a number",
  }),

  lng: Joi.number().optional().messages({
    "number.base": "Longitude must be a number",
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