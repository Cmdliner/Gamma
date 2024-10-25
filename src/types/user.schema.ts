import { Document, Types } from "mongoose";
import { ProductCategory } from "./common";


interface IUser extends Document {
    _id: Types.ObjectId;
    first_name: string;
    middle_name?: string;
    last_name: string;
    dob: Date,
    gender: string;
    state_of_origin: string;
    phone_numbers: string[];
    email:  string;
    password?: string;
    interested_categories: ProductCategory[];
    bvn?: string;
    account_no?: number;
    bank_code?: number;
    referral_code?: string;
    referrals: Types.ObjectId[];
    email_verified?: boolean;
    account_status: "dormant" | "active";
    account_verified?: boolean;
    wallet: Types.ObjectId;
    transactions: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

export default IUser;
