import { Router } from "express";
import NotificationController from "../controllers/notification.controller";

const notification = Router();

notification.get("/notifications", NotificationController.allNotifications);
notification.post("/notifications/:notificationID", NotificationController.read);
notification.post("/notifications", NotificationController.markAllAsRead);


export default notification;