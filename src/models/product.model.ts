import { model, Schema } from "mongoose";
import type {
    IFashionProduct,
    IFurniture,
    IMachinery,
    IElectronics,
    IGadget,
    ILandedProperty,
    IVehicle,
} from "../types/product.schema";
import type IProduct from "../types/product.schema";


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
        text: true,
        required: true,
    },
    description: {
        type: String,
        text: true,
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
        duration: {
            type: String,
            enum: ["1Week", "1Month"]
        },
        sponsored_at: { type: Date },
        expires: { type: Date },
        status: {
            type: String,
            enum: ["active", "processing_payment", "flagged", "under_review", "deactivated", "completed", "expired"]
        }
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
        }
    }
}, { timestamps: true, descriminatorKey: "category" });

const ElectronicsSchema = new Schema({
    brand: {
        type: String,
    },
    item_model: {
        type: String,
    },
    condition: {
        type: String,
        enum: ["new", "used"],
    }
});

const FashionProductSchema = new Schema({
    condition: {
        type: String,
        enum: ["used", "new"],
    }
});

const FurnitureSchema = new Schema({
    condition: {
        type: String,
        enum: ["used", "new"],
    }
});

const GadgetSchema = new Schema({
    brand: {
        type: String,
    },
    item_model: {
        type: String,
    },
    RAM: {
        type: String,
    },
    condition: {
        type: String,
        enum: ["used", "new"],
    }

});

const OtherProductSchema = new Schema({
    condition: {
        type: String,
        enum: ["used", "new"],
    }
});

const LandedPropertySchema = new Schema({
    dimensions: {
        type: String,
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
    }
});

const VehicleSchema = new Schema({
    make: {
        type: String,
    },
    is_registered: {
        type: Boolean,
    },
    item_model: {
        type: String,
    },
    year: {
        type: Number,
    },
    condition: {
        type: String,
        enum: ["used", "new"],
    },
    vin: {
        type: String,
    },
    transmission_type: {
        type: String,
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
