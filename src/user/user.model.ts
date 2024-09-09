import { model, Schema } from "mongoose";

const UserSchema = new Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    dob: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    state_of_origin: {
        type: String,
        required: true
    },
    phone_number: [{
        type: Schema.Types.ObjectId,
        ref: "PhoneNumber"
    }],
    email: {
        type: String,
        unique: true
    },
    password: {
        type: String,
    },
    bvn: {
        type: String
    },
    referral_code: {
        type: Number
    },
    referrals: [{
        type: Schema.Types.ObjectId,
        ref: "User",
        unique: true
    }],
    isVerified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const User = model("user", UserSchema);

export default User;
