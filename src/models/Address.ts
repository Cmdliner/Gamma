import { model, Schema } from "mongoose";

const addressSchema = new Schema({
    // Addresses can be home, work or vacation address
    kind: {
        type: String,
        enum: ["work", "home", "vacation"],
        required: true,
    },
    location: {
        type:  String,
        required: true
    }
}, {timestamps: true});

const Address = model("address", addressSchema);


export default Address;
