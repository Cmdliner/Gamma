import { Document, Types } from "mongoose";

interface IBid extends Document {
    product: Types.ObjectId;
    buyer: Types.ObjectId;
    negotiating_price: Number,
    status: "accepted" | "pending" | "rejected";
    expires: Date;
}

export default IBid;