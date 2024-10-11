import Joi from "joi";

export const allowedCategories = [
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
    product_images: Joi.array().min(10).max(10).required(),
    name: Joi.string().required(),
    description: Joi.string(),
    owner: Joi.object().required(),
    location: Joi.string().required(),
    price: Joi.number().min(10).required(),
    is_negotiable: Joi.boolean().required(),
    ownership_documents: Joi.array().max(5),
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
    product_images: Joi.array().min(10).max(10).required(),
    name: Joi.string().required(),
    description: Joi.string().required(),
    owner: Joi.object().required(),
    location: Joi.string().required(),
    price: Joi.number().min(10).required(),
    is_negotiable: Joi.boolean().required(),
    ownership_documents: Joi.array().min(1).max(5).required(),
    localty: Joi.string().required(),
    dimensions: Joi.string().required(),
    category: Joi.allow(...allowedCategories).required(),
    condition: Joi.allow(...validPropertyconditions).required()
});

export const gadgetValidationSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().min(10).required(),
    product_images: Joi.array().min(10).max(10).required(),
    owner: Joi.object().required(),
    location: Joi.string().required(),
    is_negotiable: Joi.boolean().required(),
    category: Joi.allow(...allowedCategories).required(),
    brand: Joi.string().required(),
    item_model: Joi.string().required(),
    RAM: Joi.string().required(),
    condition: Joi.allow("new", "used").required(),
    ownership_documents: Joi.array().min(0).max(5)
});

export const vehiclevalidationSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().min(10).required(),
    product_images: Joi.array().min(10).max(10).required(),
    owner: Joi.object().required(),
    location: Joi.string().required(),
    is_negotiable: Joi.boolean().required(),
    category: Joi.allow(...allowedCategories).required(),
    condition: Joi.allow("new", "used").required(),
    ownership_documents: Joi.array().min(2).max(5),
    make: Joi.string().required(),
    is_registered: Joi.boolean().required(),
    item_model: Joi.string().required(),
    year: Joi.number().required(),
    vin: Joi.string().required(),
    transmission_type: Joi.string().required()
});

export const genericValidationSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    owner: Joi.object().required(),
    location: Joi.string().required(),
    price: Joi.number().min(10).required(),
    is_negotiable: Joi.boolean().required(),
    condition: Joi.string().allow("used", "new").required(),
    category: Joi.allow(...allowedCategories).required(),
    product_images: Joi.array().min(10).max(10).required(),
    ownership_documents: Joi.array()
});