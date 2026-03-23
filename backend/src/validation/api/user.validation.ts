import Joi from "joi";
import { isValidPhoneNumber } from "libphonenumber-js";

export const registerSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),

  email: Joi.string()
    .email()
    .pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    .required(),

  password: Joi.string()
    .pattern(new RegExp("^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@$!%*#?&]{6,}$"))
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain letters and numbers and be at least 6 characters",
    }),

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

  address: Joi.string().min(3).max(100).optional().messages({
    "string.min": "Address must be at least 3 characters",
    "string.max": "Address must be at most 100 characters",
  }),

  countryId: Joi.number().integer().positive().optional().messages({
    "number.base": "Country must be a valid ID",
    "number.integer": "Country ID must be an integer",
  }),

  stateId: Joi.number().integer().positive().optional().messages({
    "number.base": "State must be a valid ID",
    "number.integer": "State ID must be an integer",
  }),

  cityId: Joi.number().integer().positive().optional().messages({
    "number.base": "City must be a valid ID",
    "number.integer": "City ID must be an integer",
  }),

  // ✅ postalCode is now a plain string
  postalCode: Joi.string().min(3).max(10).optional().messages({
    "string.min": "Enter a valid postal code",
    "string.max": "Postal code is too long",
  }),
});

export const updateProfileSchema = Joi.object({
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

  address: Joi.string().min(3).max(100).optional().messages({
    "string.min": "Address must be at least 3 characters",
    "string.max": "Address must be at most 100 characters",
  }),

  countryId: Joi.number().integer().positive().optional(),
  stateId: Joi.number().integer().positive().optional(),
  cityId: Joi.number().integer().positive().optional(),

  // ✅ postalCode is now a plain string
  postalCode: Joi.string().min(3).max(10).optional().messages({
    "string.min": "Enter a valid postal code",
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string()
    .pattern(new RegExp("^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@$!%*#?&]{6,}$"))
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain letters and numbers and be at least 6 characters",
    }),
});
