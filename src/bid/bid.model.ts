import { model, Schema } from "mongoose";
import IBid from "../types/bid.schema";

const Next5Mins = () => {
    let fiveMinsInMs = (1000 * 60 * 5);
    let nowInMs = new Date().valueOf()
    return new Date(nowInMs + fiveMinsInMs);
}

const BidSchema = new Schema({
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
    buyer: {
        type: Schema.Types.ObjectId,
        ref: "User",
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
        required: true,
        default: Next5Mins()
    }
});

const Bid = model<IBid>("bid", BidSchema);

export default Bid;