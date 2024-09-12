import { Schema } from "mongoose";
import Product from "./product.model";
import IElectronics from "../types/electronics.schema";

const ElectronicsSchema = new Schema({
    brand: {
        type: String,
        required: true
    },
    item_model: {
        type: String,
        required: true
    },
    condition: {
        type: String,
        enum: ["new", "used"],
        required: true
    }
});


const Electronics = Product.discriminator<IElectronics>("electronics", ElectronicsSchema);

export default Electronics;