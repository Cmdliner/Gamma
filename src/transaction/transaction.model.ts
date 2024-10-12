import { model, Schema } from "mongoose";
import ITransaction from "../types/transaction.schema";

const TransactionSchema = new Schema({
    kind: {
        type: String,
        enum: ["ad_sponsorhip", "product_payment", ""]
    },
    bearer: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    amount: {
        type: Number,
        min: 0,
        required: true
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product"
    },
    status: {
        type: String,
        ref: ["success", "failed", "pending"],
        default: "pending"
    },
    payment_method: {
        type: String,
        enum: ["card", "transfer"]
    },
    details: {
        type: String
    }
}, { timestamps: true });

const Transaction = model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;