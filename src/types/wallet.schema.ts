import { Document } from "mongoose";

interface IWallet extends Document {
    rewards_balance: number;
    disbursement_fees: number;
    account: {
        provider: "safe_haven";
        account_no: string;
        _id: string;
    }
}

export default IWallet;