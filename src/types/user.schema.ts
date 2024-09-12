import { Document, Types } from "mongoose";

interface IUser extends Document {
    first_name: string;
    last_name: string;
    dob: Date,
    gender: string;
    state_of_origin: string;
    phone_numbers: Array<Types.ObjectId>;
    email:  string;
    password?: string;
    bvn?: string;
    referral_code?: string;
    email_verified?: boolean;
    bvn_verified?: boolean;
    account_verified?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export default IUser;