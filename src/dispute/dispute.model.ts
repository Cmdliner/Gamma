import { model, Schema } from "mongoose";

const DisputeSchema = new Schema({
    transaction: {
        type: Schema.Types.ObjectId,
        ref: "Transaction",
        required: true
    },
    raised_by: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["resolved", "ongoing", "pending"]
    },
    issue: {
        type: String,
        required: true
    },
    comments: {
        type: String
    }
});

const Dispute = model("Dispute", DisputeSchema);

export default Dispute;