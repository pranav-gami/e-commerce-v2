const Joi = require("joi");

export const placeOrderSchema = Joi.object({
  // No body needed — order is built from the cart
  // But if you plan to add shipping address or notes, add them here
});

export const orderIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Order ID must be a number",
    "number.integer": "Order ID must be an integer",
    "number.positive": "Order ID must be a positive number",
    "any.required": "Order ID is required",
  }),
});

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid("PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED")
    .required()
    .messages({
      "any.only":
        "Status must be one of: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED",
      "any.required": "Status is required",
    }),
});
