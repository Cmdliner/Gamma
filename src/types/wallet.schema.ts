import { Document, Types } from "mongoose";

interface IWallet extends Document {
    virtual_account_no: number;
    amount_withdrawable: number;
    balance: number;
}

export default IWallet;