const Joi = require("joi");

// Validate location creation data
const createLocationSchema = Joi.object({
  title: Joi.string().trim().max(100).allow("").optional(),

  // No longer collected from the user - the UI only captures address
  // and an optional custom title. Kept optional (not stripped) so any
  // caller that still sends it (e.g. api-tests.rest) doesn't break.
  placeName: Joi.string().trim().allow("").optional(),

  address: Joi.string().trim().required().messages({
    "any.required": "Address is required",
    "string.empty": "Address is required",
  }),

  // Internal/non-user-facing fields. Not collected from the user in the
  // MVP, so they must stay optional here - location creation must work
  // without coordinates.
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

  // Legacy, unused by the current (Geoapify-based) autocomplete - kept
  // optional for backward compatibility, see Location.js.
  googlePlaceId: Joi.string().trim().allow("").optional(),

  // Provider-neutral external place identifier (currently Geoapify's
  // place_id). Optional - not every location has one.
  placeId: Joi.string().trim().allow("").optional(),

  coverImage: Joi.string().trim().allow("").optional(),

  visitedAt: Joi.date().optional(),
});

// Validate location update data
const updateLocationSchema = Joi.object({
  title: Joi.string().trim().max(100).allow("").optional(),

  // No longer collected from the user - see createLocationSchema.
  placeName: Joi.string().trim().allow("").optional(),

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

  placeId: Joi.string().trim().allow("").optional(),

  coverImage: Joi.string().trim().allow("").optional(),

  visitedAt: Joi.date().optional(),
}).min(1).messages({
  "object.min": "At least one field is required for update",
});

module.exports = {
  createLocationSchema,
  updateLocationSchema,
};
