import { Document, Types } from "mongoose";

interface ITransaction extends Document {
    kind: "ad_sponsorship" | "product_payment" | "payment_refund" | "withdrawal";
    bearer: Types.ObjectId;
    amount: number;
    product: Types.ObjectId;
    status: "success" | "failed" | "pending" | "in_dispute" | "resolved";
    charge_ref: string;
    payment_method: "card" | "bank_transfer";
    details: string;
}

export default ITransaction;