import Joi, { string } from "joi";
import { allowedCategories } from "./product.validation";

export const registerValidationSchema = Joi.object({
    first_name: Joi.string().alphanum().required(),
    middle_name: Joi.string().alphanum(),
    last_name: Joi.string().alphanum().required(),
    dob: Joi.date().required(),
    phone_numbers: Joi.array().min(1).unique(),
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