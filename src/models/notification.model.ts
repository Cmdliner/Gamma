import { model, Schema } from "mongoose";
import { type INotification } from "../types/notification.schema";

const NotificationSchema = new Schema({
    for: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    has_been_read: {
        type: Boolean,
        default: false
    },
    action_link: {
        type: String,
    },
    body: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 40
    }
}, { timestamps: true });

const Notification = model<INotification>("Notification", NotificationSchema);

export default Notification;