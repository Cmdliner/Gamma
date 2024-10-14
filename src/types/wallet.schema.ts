import { Document } from "mongoose";

interface IWallet extends Document {
    amount_withdrawable: number;
    balance: number;
}

export default IWallet;