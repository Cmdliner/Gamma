import { model, Schema } from "mongoose";
import type IUser from "../types/user.schema";
import { allowedCategories } from "../validations/product.validation";

const UserSchema = new Schema({
    first_name: {
        type: String,
        required: true
    },
    middle_name: {
        type: String
    },
    interested_categories: [{
        type: String,
        enum: allowedCategories,
        required: true
    }],
    last_name: {
        type: String,
        required: true
    },
    location: {
        type: String
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
    account_details: {
        account_no: { type: Number },
        bank_code: { type: Number },
        added_at: { type: Date }
    },
    account_status: {
        type: String,
        enum: ["active", "dormant"],
        default: "dormant"
    },
    referral_code: {
        type: String,
        required: true,
        unique: true
    },
    referrals: [{
        type: Schema.Types.ObjectId,
        ref: "User",
    }],
    email_verified: {
        type: Boolean,
        default: false
    },
    account_verified: {
        type: Boolean,
        default: false
    },
    wallet: {
        type: Schema.Types.ObjectId,
        ref: "Wallet"
    },
    transactions: [{
        type: Schema.Types.ObjectId,
        ref: "Transaction"
    }]
}, { timestamps: true });

const User = model<IUser>("User", UserSchema);

export default User;
