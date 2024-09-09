import { model, Schema } from "mongoose";

const mobileNumberSchema = new Schema({
    kind: {
        type: String,
        enum: ["work", "home"], // try an extend this to cover more
        required: true
    },
    value: {
        type: String,
        required: true,
        unique: true
    },
    isVerified: {
        type: Boolean,
        defualt: false
    }
}, {timestamps:  true});

const MobileNumber = model("mobile_number", mobileNumberSchema);

export default MobileNumber;