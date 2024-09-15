import Joi from "joi";

export const registerValidationSchema = Joi.object({
    first_name: Joi.string().alphanum().required(),
    last_name: Joi.string().alphanum().required(),
    dob: Joi.date().required(),
    phone_numbers: Joi.array().min(1).unique(),
    email: Joi.string().email().required(),
    gender: Joi.string().required(),
    state_of_origin: Joi.string().required(),
    referral_code: Joi.string() //! TODO => pattern of 4 digits code
})