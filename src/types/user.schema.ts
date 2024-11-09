import { Document, Types } from "mongoose";
import { ProductCategory } from "./common";


interface IUser extends Document {
    _id: Types.ObjectId;
    first_name: string;
    middle_name?: string;
    last_name: string;
    display_pic: string;
    dob: Date,
    location?: string;
    gender: string;
    state_of_origin: string;
    phone_numbers: string[];
    email:  string;
    password?: string;
    interested_categories: ProductCategory[];
    bvn?: {
        verified_at: Date;
        verification_status: "verified" | "unverified",
        encrypted_data: string;
    };
    bank_details?: {
        account_no: number;
        added_at: Date;
        bank_code: number;
    };
    rewards: {
        balance: number;
    }
    referred_by: Types.ObjectId;
    referral_code?: string;
    referrals: Types.ObjectId[];
    email_verified?: boolean;
    account_status: "dormant" | "active";
    wallet: Types.ObjectId;
    transactions: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

export default IUser;
