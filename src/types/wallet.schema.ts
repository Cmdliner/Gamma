import { Document } from "mongoose";

interface IWallet extends Document {
    main_balance: number;
    rewards_balance: number;
    disbursement_fees: number;
    account: {
        provider: "safe_haven";
        account_no: string;
    }
}

export default IWallet;