import { Document, Types } from "mongoose";

interface IUser extends Document {
    _id: Types.ObjectId;
    first_name: string;
    last_name: string;
    dob: Date,
    gender: string;
    state_of_origin: string;
    phone_numbers: string[];
    email:  string;
    password?: string;
    bvn?: string;
    account_no?: number;
    bank_code?: number;
    referral_code?: string;
    referrals: Types.ObjectId[];
    email_verified?: boolean;
    bvn_verified?: boolean;
    account_verified?: boolean;
    wallet: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export default IUser;