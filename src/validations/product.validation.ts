import Joi, { allow } from "joi";

const allowedCategories = [
    "electronics",
    "landed_properties",
    "gadgets",
    "vehicles",
    "furnitures",
    "machineries",
    "fashion_wears",
    "others",
];
export const electronicsValidationSchema = Joi.object({
    product_images: Joi.array().min(1).max(10).required(),
    name: Joi.string().required(),
    description: Joi.string(),
    owner: Joi.object().required(),
    location: Joi.string().required(),
    price: Joi.number().min(10).required(),
    is_biddable: Joi.boolean().required(),
    ownership_documents: Joi.array().min(1).max(5).required(),
    brand: Joi.string().required(),
    item_model: Joi.string().required(),
    condition: Joi.string().allow("new", "used"),
    category: Joi.allow(...allowedCategories).required()
});

const validPropertyconditions = [
  "fairly_used",
  "newly_built",
  "old",
  "renovated",
  "under_construction",
  "empty_land",
];
export const landedPropertyValidationSchema = Joi.object({
    product_images: Joi.array().min(1).max(10).required(),
    name: Joi.string().required(),
    description: Joi.string().required(),
    owner: Joi.object().required(),
    location: Joi.string().required(),
    price: Joi.number().min(10).required(),
    is_biddable: Joi.boolean().required(),
    ownership_documents: Joi.array().min(1).max(5).required(),
    localty: Joi.string().required(),
    dimensions: Joi.string().required(),
    category: Joi.allow(...allowedCategories).required(),
    condition: Joi.allow(...validPropertyconditions).required()
})