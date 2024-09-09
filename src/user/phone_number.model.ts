import { model, Schema } from "mongoose";

const phoneNumberSchema = new Schema({
    value: {
        type: String,
        required: true,
        unique: true
    }
}, { timestamps: true });

const PhoneNumber = model("phone_number", phoneNumberSchema);

export default PhoneNumber;