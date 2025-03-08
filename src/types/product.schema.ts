import { Document, Types } from "mongoose";
import { ProductCategory } from "./common";

export type SponsorshipDuration = "1Month" | "1Week";

interface IProduct extends Document {
    product_images: string[];
    name: string;
    description: string;
    owner: Types.ObjectId;
    location: {
        type: string;
        coordinates: [number, number];
        human_readable: string;
    };
    localty: string;
    price: number;
    is_negotiable: boolean;
    active_bid: Types.ObjectId;
    purchase_lock: {
        is_locked: boolean;
        locked_at: Date;
        locked_by: Types.ObjectId;
    };
    ownership_documents: string[];
    category: ProductCategory;
    status: "available" | "processing_payment" | "pending_bid_approval" | "sold" | "in_dispute";
    sponsorship: {
        duration: "1Week" | "1Month";
        sponsored_at: Date;
        expires: Date;
        status: "active" | "processing_payment" | "flagged" | "completed" | "under_review" | "deactivated" | "expired";
    };
}

export interface IElectronics extends IProduct {
    brand: string;
    item_model: string;
    condition: "new" | "used";
}

export interface ILandedProperty extends IProduct {
    localty: string;
    dimensions: string;
    condition: "fairly_used" | "newly_built" | "old" | "renovated" | "under_construction" | "empty_land";
}

export interface IGadget extends IProduct {
    brand: string;
    item_model: string;
    RAM: string;
    condition: "new" | "used";
}

export interface IVehicle extends IProduct {
    make: string;
    is_registered: boolean;
    item_model: string;
    year: number;
    condition:  "new" | "used";
    vin: string;
    transmission_type: string;
}

export interface IOtherProduct extends IProduct {
    condition: string;
}

export interface IFurniture extends IOtherProduct {}

export interface IMachinery extends IOtherProduct {}

export interface IFashionProduct extends IOtherProduct {}

export default IProduct;