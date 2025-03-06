import Joi from "joi";
import { phoneNumberSchema } from "./auth.validation";

export const UserUpdateValidationSchema = Joi.object({
    // location, phone_nos, profile_pic, verification_docs
    location: Joi.string(),
    phone_nos: Joi.array()
        .items(phoneNumberSchema)
        .min(1)
        .max(2)
        .messages({
            'array.base': 'Phone numbers must be an array.',
            'array.min': 'At least one phone number is required.',
            'array.max': 'No more than two phone numbers are allowed.'
        }),
    profile_pic: Joi.string(),
    verification_docs: Joi.array()
        .max(10)
        .messages({
            'array.max': 'No more than 10 verification documents allowed!'
        })
});