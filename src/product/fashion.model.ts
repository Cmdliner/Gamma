import { Schema } from "mongoose";
import Product from "./product.model";
import { IFashionProduct } from "../types/generic.schema";

const FashionProductSchema = new Schema({
    condition: {
        type: String,
        enum: ["used" , "new"],
        required: true
    }
});

const FashionProduct = Product.discriminator<IFashionProduct>("fashion_product", FashionProductSchema);


export default FashionProduct;