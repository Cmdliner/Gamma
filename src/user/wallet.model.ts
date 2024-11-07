import { model, Schema } from "mongoose";
import IWallet from "../types/wallet.schema";

const WalletSchema = new Schema({
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