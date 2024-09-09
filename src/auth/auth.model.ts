import { model, Schema } from "mongoose";
import generateOTP from "../lib/otp";

const nextHour = () => {
    let oneHourInMs = (1000 * 60 * 60 * 24);
    let nowInMs = new Date().valueOf()
    return new Date(nowInMs + oneHourInMs);
}

const OTPSchema = new Schema({
    kind: {
        type: String,
        enum: ["verification", "password_reset"],
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    token: {
        type: String,
        required: true,
        default: generateOTP()
    },
    expires: {
        type: Date,
        default: nextHour()
    }
})

const OTP = model("otp", OTPSchema);

export default OTP;