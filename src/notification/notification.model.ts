import { model, Schema } from "mongoose";

const NotificationSchema = new Schema({
    
});

const Notification = model("Notification", NotificationSchema);

export default Notification;