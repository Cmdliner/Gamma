import { model, Schema } from "mongoose";
import ITransaction from "./transaction.schema";

const TransactionSchema = new Schema({
    kind: {
        type: String,
        enum: ["ad_sponsorhip", "product_payment", "payment_refund", "withdrawal"]
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
        enum: ["success", "failed", "pending", "in_dispute", "resolved"],
        default: "pending"
    },
    payment_method: {
        type: String,
        enum: ["card", "bank_transfer", "none"]
    },
    charge_ref: {
        type: String
    },
    details: {
        type: String
    }
}, { timestamps: true, discriminatorKey: "kind" });

const ProductPurchaseTransactionShema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product"
    },
    payment_method: {
        type: String,
        enum: ["card", "bank_transfer", "none"]
    },
    charge_ref: {
        type: String
    },
    seller: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }

});

const ReferralTransactionSchema = new Schema({
    referred: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    amount_earned: {
        type: Number,
        min: 0
    }
});




const Transaction = model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;