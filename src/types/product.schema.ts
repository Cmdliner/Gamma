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

export default IProduct;