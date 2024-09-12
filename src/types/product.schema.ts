import { Document, Types } from "mongoose";

interface IProduct extends Document {
    proproduct_images_url: string[];
    name: string;
    description: string;
    owner: Types.ObjectId;
    location: string;
    price: number;
    is_biddable: boolean;
    ownership_documents_url: string[];
    category: ProductCategory;
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