import { model, Schema } from "mongoose";
import ITransaction, { IAdSponsorshipTransaction, IProductPurchaseTransaction, IReferralTransaction, IRefundTransaction, IWithdrawalTransaction } from "../types/transaction.schema";

const TransactionSchema = new Schema({
    bearer: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    kind: {
        type: String,
        enum: [
            "ReferralTransaction",
            "WithdrawalTransaction",
            "ProductPurchaseTransaction",
            "RefundTransaction",
            "AdSponsorshipTransaction",
        ],
        required: true,
    },
    status: {
        type: String,
        enum: [
            "success",
            "pending",
            "failed",
            "processing_payment",
            "resolved",
            "in_dispute",
            "in_escrow",
            "refunded",
        ],
        index: true,
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
}, { timestamps: true, discriminatorKey: "kind" });


const ProductPurchaseTransactionSchema = new Schema({
    payment_method: {
        type: String,
        enum: ['card', 'bank_transfer'],
        required: true
    },
    destination: {
        type: String,
        enum: ["escrow", "wallet"],
        required: true
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    seller: {
        type: Schema.Types.ObjectId,
        ref: "Product"
    },
    payment_ref: {
        type: String,
        unique: true,
        sparse: true
    },
    reversal_ref: {
        type: String
    },
    virtual_account_id: {
        type: String
    }
    
});

const RefundTransactionSchema = new Schema({
    payment_method: {
        type: String,
        enum: ['card', 'bank_transfer'],
        required: true
    },
    associated_payment_tx: {
        type: Schema.Types.ObjectId,
        ref: "ProductPurchaseTransaction",
        required: true
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    seller: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    payment_ref: {
        type: String,
        unique: true,
        sparse: true
    }
});

const AdSponsorshipTransactionSchema = new Schema({
    payment_method: {
        type: String,
        enum: ['card', 'bank_transfer'],
        required: true
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    payment_ref: {
        type: String,
        unique: true,
        sparse: true
    },
    reversal_ref: {
        type: String,
        unique: true,
        sparse: true
    },
    virtual_account_id: {
        type: String
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
    payment_ref: {
        type: String
    },
    from: {
        type: String,
        enum: ["rewards", "wallet"],
        required: true
    }
});


// Index certain lookup fields on transaction schema
TransactionSchema.index({ createdAt: -1, status: -1 });

const Transaction = model<ITransaction>("Transaction", TransactionSchema);


export const ProductPurchaseTransaction = Transaction.discriminator<IProductPurchaseTransaction>("ProductPurchaseTransaction", ProductPurchaseTransactionSchema);
export const RefundTransaction = Transaction.discriminator<IRefundTransaction>("RefundTransaction", RefundTransactionSchema);
export const AdSponsorshipTransaction = Transaction.discriminator<IAdSponsorshipTransaction>("AdSponsorshipTransaction", AdSponsorshipTransactionSchema);
export const ReferralTransaction = Transaction.discriminator<IReferralTransaction>("ReferralTransaction", ReferralTransactionSchema);
export const WithdrawalTransaction = Transaction.discriminator<IWithdrawalTransaction>("WithdrawalTransaction", WithdrawalTransactionSchema);

export default Transaction;