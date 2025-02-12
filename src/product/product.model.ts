import { model, Schema } from "mongoose";
import type { IFashionProduct, IFurniture, IMachinery } from "../types/generic.schema";
import type IProduct from "../types/product.schema";
import type IElectronics from "../types/electronics.schema";
import type IGadget from "../types/gadget.schema";
import type ILandedProperty from "../types/landed_property.schema";
import type IVehicle from "../types/vehicle.schema";

const ProductSchema = new Schema({
    product_images: [
        {
            type: String,
            required: true,
            unique: true,
        },
    ],
    name: {
        type: String,
        index: true,
        required: true,
    },
    description: {
        type: String,
        index: true, // do this so comparison for product duplication or copy can be easily determined
        required: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    location: {
        type: { type: String, enum: ["Point"], required: true },
        coordinates: { type: [Number, Number], required: true },
        human_readable: { type: String, required: true },
    },
    localty: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    is_negotiable: {
        type: Boolean,
        required: true,
    },
    active_bid: {
        type: Schema.Types.ObjectId,
        ref: "Bid"
    },
    ownership_documents: [{
        type: String,
    }],
    category: {
        type: String,
        enum: [
            "electronics",
            "landed_properties",
            "gadgets",
            "vehicles",
            "furnitures",
            "machineries",
            "fashion_wears",
            "others"
        ],
        index: true,
        required: true,
    },
    status: {
        type: String,
        enum: ["available", "processing_payment", "sold", "pending_bid_approval", "in_dispute"],
        default: "available"
    },
    sponsorship: {
        sponsored_at: { type: Date },
        expires: { type: Date },
        status: { type: String, enum: ["active", "pending", "under_review"]}
    },
    deleted_at: {
        type: Date
    },
    purchase_lock: {
        is_locked: {
            type: Boolean,
            default: false
        },
        locked_at: Date,
        locked_by: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        payment_link: {
            type: String
        }
    }
}, { timestamps: true, descriminatorKey: "category" });

const ElectronicsSchema = new Schema({
    brand: {
        type: String,
        // required: true
    },
    item_model: {
        type: String,
        // required: true
    },
    condition: {
        type: String,
        enum: ["new", "used"],
        // required: true
    }
});

const FashionProductSchema = new Schema({
    condition: {
        type: String,
        enum: ["used", "new"],
        // required: true
    }
});

const FurnitureSchema = new Schema({
    condition: {
        type: String,
        enum: ["used", "new"],
        // required: true
    }
});

const GadgetSchema = new Schema({
    brand: {
        type: String,
        // required: true
    },
    item_model: {
        type: String,
        // required: true
    },
    RAM: {
        type: String,
        // required: true
    },
    condition: {
        type: String,
        enum: ["used", "new"],
        // required: true
    }

});

const OtherProductSchema = new Schema({
    condition: {
        type: String,
        enum: ["used", "new"],
        // required: true
    }
});

const LandedPropertySchema = new Schema({
    dimensions: {
        type: String,
        // required: true
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
    }
});

const MachinerySchema = new Schema({
    condition: {
        type: String,
        enum: ["used", "new"],
        // required: true
    }
});

const VehicleSchema = new Schema({
    make: {
        type: String,
        // required: true
    },
    is_registered: {
        type: Boolean,
        // required: true
    },
    item_model: {
        type: String,
        // required: true
    },
    year: {
        type: Number,
        // required: true
    },
    condition: {
        type: String,
        enum: ["used", "new"],
        // required: true
    },
    vin: {
        type: String,
        // required: true
    },
    transmission_type: {
        type: String,
        // required: true
    }
});

// Index 2dsphere for geospatial queries
ProductSchema.index({ location: "2dsphere" });

const Product = model<IProduct>("Product", ProductSchema);

export const Vehicle = Product.discriminator<IVehicle>("Vehicle", VehicleSchema);
export const Machinery = Product.discriminator<IMachinery>("Machinery", MachinerySchema);
export const LandedProperty = Product.discriminator<ILandedProperty>("Landed_Property", LandedPropertySchema);
export const OtherProduct = Product.discriminator("Other_Product", OtherProductSchema);
export const Gadget = Product.discriminator<IGadget>("Gadget", GadgetSchema);
export const Furniture = Product.discriminator<IFurniture>("Furniture", FurnitureSchema);
export const FashionProduct = Product.discriminator<IFashionProduct>("Fashion_Product", FashionProductSchema);
export const Electronics = Product.discriminator<IElectronics>("Electronics", ElectronicsSchema);

export default Product;
