import Joi from "joi";

export const addItemSchema = Joi.object({
  productId: Joi.number().integer().positive().required().messages({
    "number.base": "productId must be a number",
    "number.positive": "productId must be a positive number",
    "any.required": "productId is required",
  }),
  quantity: Joi.number().integer().min(1).max(100).required().messages({
    "number.base": "quantity must be a number",
    "number.min": "quantity must be at least 1",
    "number.max": "quantity cannot exceed 100",
    "any.required": "quantity is required",
  }),
});

export const updateItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).max(100).required().messages({
    "number.base": "quantity must be a number",
    "number.min": "quantity must be at least 1",
    "number.max": "quantity cannot exceed 100",
    "any.required": "quantity is required",
  }),
});
