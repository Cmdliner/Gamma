import { model, Schema } from "mongoose";

const WalletSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    balance: {
        type: Number,
        default: 0
    }
});

const Wallet = model("Wallet", WalletSchema);


export default Wallet;