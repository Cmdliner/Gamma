import { Schema } from "mongoose";
import Product from "./product.model";
import IVehicle from "../types/vehicle.schema";

const VehicleSchema = new Schema({
    make: {
        type: String,
        required: true
    },
    registered:  {
        type: Boolean,
        required: true
    },
    item_model:  {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    condition:  {
        type: String,
        enum: ["used", "new"],
        required: true
    },
    vin:  {
        type: String,
        required: true
    },
    //! TODO => Check what transmission type is and update accordingly
    transmission_type:  {
        type: String,
        required: true
    }
});

const Vehicle = Product.discriminator<IVehicle>("vehicle", VehicleSchema);

export default Vehicle;