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
    last_name: {
        type: String,
        required: true
    },
    display_pic: {
        type: String
    },
    device_push_token: {
        type: String,
        sparse: true,
        unique: true
    },
    interested_categories: [{
        type: String,
        enum: allowedCategories,
        required: true
    }],
    location: {
        type: { type: String, enum: ["Point"], required: true },
        coordinates: { type: [Number], required: true },
        human_readable: { type: String, required: true },
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
    identity: {
        identity_type: { type: String, enum: ["nin", "bvn"] },
        verified_at: { type: Date },
        hash: { type: String, unique: true, sparse: true },
        v_id: { type: String },
        verification_status: { type: String, enum: ["verified", "unverified"], default: "unverified" }
    },
    bank_details: {
        account_no: { type: Number, sparse: true, unique: true },
        bank_code: { type: Number },
        added_at: { type: Date }
    },
    account_status: {
        type: String,
        enum: ["active", "dormant", "suspended"],
        default: "dormant"
    },
    referred_by: {
        type: Schema.Types.ObjectId,
        ref: "User"
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
    wallet: {
        type: Schema.Types.ObjectId,
        ref: "Wallet"
    },
    transactions: [{
        type: Schema.Types.ObjectId,
        ref: "Transaction"
    }],
    verification_docs: [{
        type: String
    }]
}, { timestamps: true });

UserSchema.index({ location: "2dsphere", createdAt: -1 });
const User = model<IUser>("User", UserSchema);

export default User;
