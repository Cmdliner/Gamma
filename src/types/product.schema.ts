import { Document, Types } from "mongoose";

interface IProduct extends Document {
    product_images: string[];
    name: string;
    description: string;
    owner: Types.ObjectId;
    location: string;
    price: number;
    is_biddable: boolean;
    ownership_documents: string[];
    category: ProductCategory;
    status: "available" | "pending" | "sold";
    sponsored: boolean;
}

type ProductCategory =
  | "electronics"
  | "landed_properties"
  | "gadgets"
  | "vehicles"
  | "furnitures"
  | "machineries"
  | "fashion_wears"
  | "others";

export default IProduct;