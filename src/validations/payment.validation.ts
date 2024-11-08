import Joi from "joi";

export const AdSponsorshipValidation = Joi.object({
    payment_method: Joi.string().valid("bank_transfer", "card").required(),
    sponsorship_duration: Joi.string().valid("1Week", "1Month").required()
});


export const ItemPurchaseValidation = Joi.object({
    payment_method: Joi.string().valid("bank_transfer", "card").required(),
})