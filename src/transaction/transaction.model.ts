import { model, Schema } from "mongoose";

const TransactionSchema = new Schema({
    kind: {
        type: String,
        enum: ["ad_sponsorhip", "product_payment", ]
    },
    initiater: {
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
    details: {
        type: String
    }
});

const Transaction = model("Transaction", TransactionSchema);

export default Transaction;