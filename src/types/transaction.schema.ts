import { Document, Types } from "mongoose";

interface ITransaction extends Document {
    kind:
    | "ReferralTransaction"
    | "WithdrawalTransaction"
    | "ProductPurchaseTransaction"
    | "AdSponsorshipTransaction"
    | "RefundTransaction";
    bearer: Types.ObjectId;
    amount: number;
    status:
    | "completed"
    | "success"
    | "failed"
    | "processing_payment"
    | "in_dispute"
    | "in_escrow"
    | "resolved"
    | "refunded";
    reason: string;
}

export interface IProductPurchaseTransaction extends ITransaction {
    payment_method: "card" | "bank_transfer";
    destination: "escrow" | "wallet";
    product: Types.ObjectId;
    seller: Types.ObjectId;
    payment_ref: string;
    reversal_ref: string;
    virtual_account_id: string;
}

export interface IRefundTransaction extends ITransaction {
    status:
    | "success"
    | "failed"
    | "processing_payment";
    payment_method: string;
    product: Types.ObjectId;
    seller: Types.ObjectId;
    associated_payment_tx: Types.ObjectId;
    payment_ref: string;
}

export interface IAdSponsorshipTransaction extends ITransaction {
    status:
    | "success"
    | "failed"
    | "processing_payment"
    | "refunded";
    payment_method: "card" | "bank_transfer";
    product: Types.ObjectId;
    payment_ref: string;
    reversal_ref: string;
    virtual_account_id: string;
}

export interface IReferralTransaction extends ITransaction {
    status:
    | "success"
    | "failed"
    | "processing_payment";
    referee: Types.ObjectId;
}

export interface IWithdrawalTransaction extends ITransaction {
    status:
    | "success"
    | "failed"
    | "processing_payment"
    | "refunded";
    payment_method: "card" | "bank_transfer";
    payment_ref: string;
    from: "rewards" | "wallet"
}

export default ITransaction;