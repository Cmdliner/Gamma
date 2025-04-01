import { model, Schema } from "mongoose";
import { type IAbuse } from "../types/abuse.schema";

const AbuseComplaintSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    subject: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    screenshots: [{
        type: String
    }]
});

const AbuseComplaint = model<IAbuse>("AbuseComplaint", AbuseComplaintSchema);

export default AbuseComplaint;