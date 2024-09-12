import { Schema } from "mongoose";
import Product from "./product.model";
import { IFurniture } from "../types/generic.schema";

const FurnitureSchema = new Schema({
    condition: {
        type: String,
        enum: ["used" , "new"],
        required: true
    }
});

const Furniture = Product.discriminator<IFurniture>("furniture", FurnitureSchema);


export default Furniture;