import Joi from "joi";
import { isValidPhoneNumber } from "libphonenumber-js";

export const adminLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Enter valid email",
    "any.required": "Email is required",
  }),

  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),
});

export const updateRoleSchema = Joi.object({
  role: Joi.string().valid("USER", "ADMIN").required().messages({
    "any.only": "Role must be USER or ADMIN",
  }),
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(3).max(30).required().messages({
    "any.required": "Name is required",
  }),

  phone: Joi.string()
    .custom((value, helpers) => {
      if (!isValidPhoneNumber(value)) {
        return helpers.error("phone.invalid");
      }
      return value;
    })
    .required()
    .messages({
      "any.required": "Phone is required",
      "phone.invalid": "Enter a valid phone number for the selected country",
    }),

  address: Joi.string().min(3).max(100).required().messages({
    "any.required": "Address is required",
    "string.min": "Address must be at least 3 characters",
  }),

  countryId: Joi.number().integer().positive().required().messages({
    "any.required": "Country is required",
    "number.base": "Country must be a valid ID",
  }),

  stateId: Joi.number().integer().positive().required().messages({
    "any.required": "State is required",
    "number.base": "State must be a valid ID",
  }),

  cityId: Joi.number().integer().positive().required().messages({
    "any.required": "City is required",
    "number.base": "City must be a valid ID",
  }),

  postalCode: Joi.string().min(3).max(10).required().messages({
    "any.required": "Postal code is required",
    "string.min": "Enter a valid postal code",
  }),
});

export const updateAdminProfileSchema = Joi.object({
  name: Joi.string().min(3).max(30).optional(),

  phone: Joi.string()
    .custom((value, helpers) => {
      if (!isValidPhoneNumber(value)) {
        return helpers.error("phone.invalid");
      }
      return value;
    })
    .optional()
    .messages({
      "phone.invalid": "Enter a valid phone number for the selected country",
    }),

  address: Joi.string().min(3).max(100).optional(),
  countryId: Joi.number().integer().positive().optional(),
  stateId: Joi.number().integer().positive().optional(),
  cityId: Joi.number().integer().positive().optional(),

  postalCode: Joi.string().min(3).max(10).optional().messages({
    "string.min": "Enter a valid postal code",
  }),
});
