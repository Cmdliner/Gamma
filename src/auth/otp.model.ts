import { model, Schema } from "mongoose";

const nextHour = () => {
    let oneHourInMs = (1000 * 60 * 60);
    let nowInMs = new Date().valueOf()
    return new Date(nowInMs + oneHourInMs);
}

const OTPSchema = new Schema({
    kind: {
        type: String,
        enum: ["verification", "password_reset", "funds_approval"],
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    token: {
        type: String,
        required:true
    },
    expires: {
        type: Date,
        default: nextHour()
    }
})

const OTP = model("otp", OTPSchema);

export default OTP;