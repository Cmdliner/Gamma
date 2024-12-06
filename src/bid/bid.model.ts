import { model, Schema } from "mongoose";
import type IBid from "../types/bid.schema";


const BidSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    buyer: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["accepted", "pending", "rejected", "expired"],
        default: "pending"
    },
    negotiating_price: {
        type: Number,
        required: true,
        min: 0,
    },
    expires: {
        type: Date,
    }
}, { timestamps: true });

const Bid = model<IBid>("Bid", BidSchema);

export default Bid;