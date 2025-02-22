import Joi from "joi";
import { allowedCategories } from "./product.validation";

const phoneNumberSchema = Joi.string()
  .pattern(/^(0\d{10}|\d{10})$/)
  .message('Phone number must be 11 digits starting with 0 or 10 digits without the leading 0');

export const registerValidationSchema = Joi.object({
  first_name: Joi.string().alphanum().required(),
  middle_name: Joi.string().alphanum(),
  last_name: Joi.string().alphanum().required(),
  dob: Joi.date().required(),
  phone_numbers: Joi.array()
    .items(phoneNumberSchema)
    .min(1)
    .max(2)
    .messages({
      'array.base': 'Phone numbers must be an array.',
      'array.min': 'At least one phone number is required.',
      'array.max': 'No more than two phone numbers are allowed.'
    })
    .unique(),
  email: Joi.string().email().required(),
  gender: Joi.string().required(),
  interested_categories: Joi.array().items(Joi.string().valid(...allowedCategories)).required(),
  state_of_origin: Joi.string().required(),
  referral_code: Joi.string(),
  location: Joi.object({
    type: Joi.string().valid("Point").required(),
    coordinates: Joi.array().allow(Joi.number().required()).length(2).required(),
    human_readable: Joi.string().required(),
  }).required(),
});


export const PasswordValidationSchema = Joi.string()
  .pattern(/^(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]+$/)
  .min(8) // Optional: Minimum length requirement
  .max(30) // Optional: Maximum length requirement
  .required()
  .messages({
    "string.pattern.base": "Password must contain at least one special character, and no whitespace is allowed.",
    "string.empty": "Password cannot be empty.",
    "any.required": "Password is required.",
  });