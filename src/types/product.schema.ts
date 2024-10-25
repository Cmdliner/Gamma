import { Document, Types } from "mongoose";
import { ProductCategory } from "./common";

interface IProduct extends Document {
    product_images: string[];
    name: string;
    description: string;
    owner: Types.ObjectId;
    location: string;
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
    status: "available" | "processing_payment" | "pending_bid_approval" | "sold";
    sponsored: boolean;
}


export default IProduct;