import { Types } from "mongoose";

interface ITransaction {
    kind: "ad_sponsorhip" | "product_payment" | "payment_refund" | "withdrawal";
    bearer: Types.ObjectId;
    amount: number;
    product: Types.ObjectId;
    status: "success" | "failed" | "pending";
    charge_ref: string;
    payment_method: "card" | "bank_transfer";
    details: string;
}

export default ITransaction;