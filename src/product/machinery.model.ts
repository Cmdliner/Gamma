import { Schema } from "mongoose";
import Product from "./product.model";
import { IMachinery } from "../types/generic.schema";

const MachinerySchema = new Schema({
    condition: {
        type: String,
        enum: ["used" , "new"],
        required: true
    }
});

const Machinery = Product.discriminator<IMachinery>("machinery", MachinerySchema);


export default Machinery;