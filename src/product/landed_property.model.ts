import { Schema } from "mongoose";
import Product from "./product.model";
import ILandedProperty from "../types/landed_property.schema";

const LandedPropertySchema = new Schema({
    localty: {
        type: String,
        required: true,
    },
    dimensions: {
        type: String,
        required: true
    },
    condition: {
        type: String,
        enum: [
            "fairly_used",
            "newly_built",
            "old",
            "renovated",
            "under_construction",
            "empty_land",
        ],
        required: true
    }
});

const LandedProperty = Product.discriminator<ILandedProperty>("landed_property", LandedPropertySchema);


export default LandedProperty;