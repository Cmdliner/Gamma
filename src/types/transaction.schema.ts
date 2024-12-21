import { Document, Types } from "mongoose";

interface ITransaction extends Document {
    kind: "PaymentTransaction" | "ReferralTransaction" | "WithdrawalTransaction";
    for: "ad_sponsorship" | "product_payment" | "payment_refund" | "withdrawal" | "referral";
    bearer: Types.ObjectId;
    amount: number;
    status: "success" | "failed" | "pending" | "processing_payment" | "in_dispute" | "in_escrow" | "resolved";
    reason: string;
}

export interface IPaymentTransaction extends ITransaction {
    payment_method: "bank_transfer" | "card";
    product: Types.ObjectId;
    external_ref: string;
}

export interface IReferralTransaction extends ITransaction {
    referee: Types.ObjectId;
}

export interface IWithdrawalTransaction extends ITransaction {
    payment_method: "card" | "bank_transfer";
    external_ref: string;
    from: "rewards" | "wallet"
}

export default ITransaction;