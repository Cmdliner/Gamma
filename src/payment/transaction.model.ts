import { model, Schema } from "mongoose";
import ITransaction, { IPaymentTransaction, IReferralTransaction, IWithdrawalTransaction } from "../types/transaction.schema";

const TransactionSchema = new Schema({
    bearer: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    kind: {
        type: String,
        enum: ["PaymentTransaction", "ReferralTransaction", "WithdrawalTransaction"],
        required: true
    },
    for: {
        type: String,
        enum: ["ad_sponsorship", "product_payment", "payment_refund", "withdrawal", "referral"],
        required: true
    },
    status: {
        type: String,
        enum: ["success", "pending", "failed", "processing_payment", "resolved", "in_dispute"],
        required: true
    },
    reason: {
        type: String,
        required: true,
    },
}, { timestamps: true, discriminatorKey: "kind" });

//   For Product Purchase and Ad sponsorship
const PaymentTransactionShema = new Schema({
    payment_method: {
        type: String,
        required: true
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    external_ref: {
        type: String,
        unique: true,
        sparse: true
    }
});

const ReferralTransactionSchema = new Schema({
    referee: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
});

const WithdrawalTransactionSchema = new Schema({
    payment_method: {
        type: String,
        enum: ["card", "bank_transfer"]
    },
    external_ref: {
        type: String
    },
    from: {
        type: String,
        enum: ["rewards", "wallet"],
        required: true
    }
});

const Transaction = model<ITransaction>("Transaction", TransactionSchema);

export const PaymentTransaction = Transaction.discriminator<IPaymentTransaction>("PaymentTransaction", PaymentTransactionShema);
export const ReferralTransaction = Transaction.discriminator<IReferralTransaction>("ReferralTransaction", ReferralTransactionSchema);
export const WithdrawalTransaction = Transaction.discriminator<IWithdrawalTransaction>("WithdrawalTransaction", WithdrawalTransactionSchema);

export default Transaction;