import { model, Schema } from "mongoose";
import IWallet from "../types/wallet.schema";

const WalletSchema = new Schema({
    balance: {
        type: Number,
        default: 0,
        min: 0
    }
});

const Wallet = model<IWallet>("Wallet", WalletSchema);


export default Wallet;