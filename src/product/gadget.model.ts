import { Schema } from "mongoose";
import Product from "./product.model";
import IGadget from "../types/gadget.schema";

const GadgetSchema = new Schema({
    brand: {
        type: String,
        required: true
    },
    item_model: {
        type: String,
        required: true
    },
    RAM: {
        type: String,
        required: true
    },
    condition: {
        type: String,
        enum: ["used", "new"],
        required: true
    }

});

const Gadget = Product.discriminator<IGadget>("gadget", GadgetSchema);

export default Gadget;