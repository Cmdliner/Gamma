import { model, Schema } from "mongoose";
import IProduct from "../types/product.schema";

const productSchema = new Schema(
  {
    product_images_url: [
      {
        type: String,
        required: true,
        unique: true,
      },
    ],
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: Number,
    },
    is_biddable: {
      type: Boolean,
      required: true,
    },
    ownership_documents_url: [
      {
        type: String,
        unique: true,
        required: true,
      },
    ],
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
      required: true,
    },
  },
  { timestamps: true, descriminatorKey: "category" }
);

const Product = model<IProduct>("product", productSchema);

export default Product;