import { model, Schema } from "mongoose";

const NotificationSchema = new Schema({
    for: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 40
    },
    app_code: {
        type: String,
        required: true,
        immutable: true
    }
});

const Notification = model("Notification", NotificationSchema);

export default Notification;