import Joi from "joi";

export const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    "string.empty": "Category name is required",
    "any.required": "Category name is required",
    "string.min": "Category name must be at least 2 characters",
    "string.max": "Category name must not exceed 50 characters",
  }),

  description: Joi.string().trim().max(500).optional().allow("").messages({
    "string.max": "Description must not exceed 500 characters",
  }),
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).optional().messages({
    "string.min": "Category name must be at least 2 characters",
    "string.max": "Category name must not exceed 50 characters",
  }),

  description: Joi.string().trim().max(500).optional().allow("").messages({
    "string.max": "Description must not exceed 500 characters",
  }),
}).min(1).messages({
  "object.min": "At least one field (name or description) must be provided",
});