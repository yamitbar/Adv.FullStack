const Joi = require("joi");

const createTripSchema = Joi.object({
  title: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional().allow(""),
  destination: Joi.string().min(2).max(100).required(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  coverImage: Joi.string().optional().allow(""),
});

module.exports = {
  createTripSchema,
};  