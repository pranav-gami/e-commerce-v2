// src/utils/validate.js
import Joi from "joi";

const emailField = Joi.string()
  .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
  .required()
  .messages({
    "string.empty": "Email is required",
    "string.pattern.base": "Enter a valid email address (e.g. name@gmail.com)",
    "any.required": "Email is required",
  });

export const loginSchema = Joi.object({
  email: emailField,
  password: Joi.string().min(6).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),
});

// ── Step 1 — no phone here (moved to step 3) ──
export const signupStep1Schema = Joi.object({
  name: Joi.string().min(2).required().messages({
    "string.empty": "Full name is required",
    "string.min": "Name must be at least 2 characters",
    "any.required": "Full name is required",
  }),
  email: emailField,
  password: Joi.string()
    .min(6)
    .pattern(/[A-Z]/)
    .pattern(/[0-9]/)
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 6 characters",
      "string.pattern.base":
        "Must contain at least one uppercase letter and one number",
      "any.required": "Password is required",
    }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match",
    "string.empty": "Please confirm your password",
    "any.required": "Please confirm your password",
  }),
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

// helper
export const validate = (schema, data) => {
  const { error } = schema.validate(data, { abortEarly: false });
  if (!error) return {};
  const errors = {};
  error.details.forEach((d) => {
    errors[d.path[0]] = d.message;
  });
  return errors;
};
