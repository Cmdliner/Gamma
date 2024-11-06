import { model, Schema } from "mongoose";
import IWallet from "../types/wallet.schema";

const WalletSchema = new Schema({
    amount_withdrawable: {
        type: Number, 
        default: 0
    },
    account_number: {
        type: Number,
        required: true,
    },
    bank_code: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        default: 0
    }
});

const Wallet = model<IWallet>("Wallet", WalletSchema);


export default Wallet;