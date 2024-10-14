import { Types } from "mongoose";

interface ITransaction {
    kind: string;
    bearer: Types.ObjectId;
    amount: number;
    product: Types.ObjectId;
    status: "success" | "failed" | "pending";
    payment_method: "card" | "bank_transfer";
    details: string;
}

export default ITransaction;