import { model, Schema } from "mongoose";
import type IBid from "../types/bid.schema";


const BidSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: "product",
        required: true
    },
    buyer: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    status: {
        type: String,
        enum: ["accepted" , "pending" , "rejected"],
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
});

const Bid = model<IBid>("bid", BidSchema);

export default Bid;