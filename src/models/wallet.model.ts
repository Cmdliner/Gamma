import { model, Schema } from "mongoose";
import IWallet from "../types/wallet.schema";

const WalletSchema = new Schema({
    rewards_balance: {
        type: Number,
        default: 0,
        min: 0
    },
    disbursement_fees: {
        type: Number,
        default: 0,
        min: 0
    },
    account: {
        provider: {
            type: String,
            enum: ["safe_haven"],
        },
        account_no: {
            type: String,
            sparse: true,
            unique: true
        },
        _id: {
            type: String,
            sparse: true,
            unique: true
        }
    }
});

const Wallet = model<IWallet>("Wallet", WalletSchema);


export default Wallet;