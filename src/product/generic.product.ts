import { Schema } from "mongoose";
import Product from "./product.model";

const OtherProductSchema = new Schema({
    condition: {
        type: String,
        enum: ["used" , "new"],
        required: true
    }
});

const OtherProduct = Product.discriminator("other_product", OtherProductSchema);


export default OtherProduct;