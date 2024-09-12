import { model, Schema } from "mongoose";

const PhoneNumberSchema = new Schema({
    value: {
        type: String,
        required: true,
        unique: true
    }
}, { timestamps: true });

const PhoneNumber = model("phone_number", PhoneNumberSchema);

export default PhoneNumber;