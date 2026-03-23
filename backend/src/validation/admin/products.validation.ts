import Joi from "joi";
import { ProductStatus } from "@prisma/client";

export const createProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(25).required().messages({
    "string.empty": "Name is required",
    "any.required": "Name is required",
    "string.min": "Name must be at least 2 characters",
    "string.max": "Name must not exceed 25 characters",
  }),

  description: Joi.string().trim().max(1000).optional().allow("").messages({
    "string.max": "Description must not exceed 1000 characters",
  }),

  price: Joi.number().positive().required().messages({
    "number.base": "Price must be a number",
    "number.positive": "Price must be greater than 0",
    "any.required": "Price is required",
  }),

  discount: Joi.number().min(0).max(100).optional().default(0).messages({
    "number.base": "Discount must be a number",
    "number.min": "Discount must be between 0 and 100",
    "number.max": "Discount must be between 0 and 100",
  }),

  stock: Joi.number().integer().min(0).required().messages({
    "number.base": "Stock must be a number",
    "number.integer": "Stock must be an integer",
    "number.min": "Stock cannot be negative",
    "any.required": "Stock is required",
  }),

  status: Joi.string()
    .valid(...Object.values(ProductStatus))
    .optional()
    .default(ProductStatus.ACTIVE)
    .messages({
      "any.only": `Status must be one of: ${Object.values(ProductStatus).join(", ")}`,
    }),

  isFeatured: Joi.boolean().optional().default(false),

  subCategoryId: Joi.number().integer().positive().required().messages({
    "number.base": "SubCategory ID must be a number",
    "number.positive": "SubCategory ID must be a positive number",
    "any.required": "SubCategory is required",
  }),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(25).optional().messages({
    "string.min": "Name must be at least 2 characters",
    "string.max": "Name must not exceed 25 characters",
  }),

  description: Joi.string().trim().max(1000).optional().allow("").messages({
    "string.max": "Description must not exceed 1000 characters",
  }),

  price: Joi.number().positive().optional().messages({
    "number.base": "Price must be a number",
    "number.positive": "Price must be greater than 0",
  }),

  discount: Joi.number().min(0).max(100).optional().messages({
    "number.base": "Discount must be a number",
    "number.min": "Discount must be between 0 and 100",
    "number.max": "Discount must be between 0 and 100",
  }),

  stock: Joi.number().integer().min(0).optional().messages({
    "number.base": "Stock must be a number",
    "number.integer": "Stock must be an integer",
    "number.min": "Stock cannot be negative",
  }),

  status: Joi.string()
    .valid(...Object.values(ProductStatus))
    .optional()
    .messages({
      "any.only": `Status must be one of: ${Object.values(ProductStatus).join(", ")}`,
    }),

  isFeatured: Joi.boolean().optional(),

  subCategoryId: Joi.number().integer().positive().optional().messages({
    "number.base": "SubCategory ID must be a number",
    "number.positive": "SubCategory ID must be a positive number",
  }),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });

export const updateProductStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(ProductStatus))
    .required()
    .messages({
      "string.empty": "Status is required",
      "any.required": "Status is required",
      "any.only": `Status must be one of: ${Object.values(ProductStatus).join(", ")}`,
    }),
});
