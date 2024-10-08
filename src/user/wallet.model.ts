import { model, Schema } from "mongoose";
import IWallet from "../types/wallet.schema";

const WalletSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    virtual_account_no: {
        type: String,
        required: true,
        unique: true
    },
    amount_withdrawable: {
        type: Number, 
        default: 0
    },
    balance: {
        type: Number,
        default: 0
    }
});

const Wallet = model<IWallet>("Wallet", WalletSchema);


export default Wallet;