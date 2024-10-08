import { Document, Types } from "mongoose";

interface IWallet extends Document {
    user: Types.ObjectId;
    virtual_account_no: number;
    amount_withdrawable: number;
    balance: number;
}

export default IWallet;