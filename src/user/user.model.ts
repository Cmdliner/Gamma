import { model, Schema } from "mongoose";
import type IUser from "../types/user.schema";
import { allowedCategories } from "../validations/product.validation";

const UserSchema = new Schema({
    first_name: {
        type: String,
        required: true
    },
    middle_name: {
        type: String,
    },
    interested_categories: [{
        type: String,
        enum: allowedCategories
    }],
    last_name: {
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
    phone_numbers: [{
        type: String,
        unique: true
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
    }],
    email_verified: {
        type: Boolean,
        default: false
    },
    bvn_verified: {
        type: Boolean,
        default: false
    },
    account_verified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const User = model<IUser>("user", UserSchema);

export default User;
