import { model, Schema } from "mongoose";

const DisputeSchema = new Schema({
    transaction: {
        type: Schema.Types.ObjectId,
        ref: "ProductPurchaseTransaction",
        required: true
    },
    raised_by: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["resolved", "ongoing"]
    },
    issues: {
        type: String,
    },
    comments: {
        type: String,
        required: true
    }
});

const Dispute = model("Dispute", DisputeSchema);

export default Dispute;