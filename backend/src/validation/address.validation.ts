import Joi from "joi";
import { isValidPhoneNumber } from "libphonenumber-js";

export const addAddressSchema = Joi.object({
  label: Joi.string().optional(),

  fullName: Joi.string().min(2).required(),

  phone: Joi.string()
    .custom((value, helpers) => {
      if (!isValidPhoneNumber(value)) {
        return helpers.error("phone.invalid");
      }
      return value;
    })
    .required()
    .messages({
      "phone.invalid": "Invalid phone number",
    }),

  address: Joi.string().min(3).required(),

  postalCode: Joi.string().min(3).max(10).required(),

  countryId: Joi.number().integer().positive().required(),

  stateId: Joi.number().integer().positive().required(),

  cityId: Joi.number().integer().positive().required(),

  isDefault: Joi.boolean().optional(),
});
