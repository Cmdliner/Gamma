import { Document } from "mongoose";

interface IWallet extends Document {
    fincra_id: string;
    amount_withdrawable: number;
    account_number: number;
    bank_code: string;
    balance: number;
}

export default IWallet;