import Joi from "joi";

export const registerValidationSchema = Joi.object({
    firstname: Joi.string().alphanum().required(),
    lastname: Joi.string().alphanum().required(),
    dob: Joi.date().required(),
    email: Joi.string().email().required(),
    gender: Joi.string().required(),
    state_of_origin: Joi.string().required(),
    referral_code: Joi.string() //! TODO => pattern of 4 digits code
})