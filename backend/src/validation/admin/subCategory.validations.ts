import Joi from "joi";

export const createSubCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    "string.empty": "Sub-category name is required",
    "any.required": "Sub-category name is required",
    "string.min": "Sub-category name must be at least 2 characters",
    "string.max": "Sub-category name must not exceed 50 characters",
  }),

  description: Joi.string().trim().max(500).optional().allow("").messages({
    "string.max": "Description must not exceed 500 characters",
  }),

  categoryId: Joi.number().integer().positive().required().messages({
    "number.base": "categoryId must be a number",
    "number.integer": "categoryId must be an integer",
    "number.positive": "categoryId must be a positive number",
    "any.required": "categoryId is required",
  }),
});

export const updateSubCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).optional().messages({
    "string.min": "Sub-category name must be at least 2 characters",
    "string.max": "Sub-category name must not exceed 50 characters",
  }),

  description: Joi.string().trim().max(500).optional().allow("").messages({
    "string.max": "Description must not exceed 500 characters",
  }),

  categoryId: Joi.number().integer().positive().optional().messages({
    "number.base": "categoryId must be a number",
    "number.integer": "categoryId must be an integer",
    "number.positive": "categoryId must be a positive number",
  }),
}).min(1).messages({
  "object.min": "At least one field must be provided",
});