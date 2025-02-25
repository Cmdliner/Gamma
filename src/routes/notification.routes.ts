import { Router } from "express";
import NotificationController from "../controllers/notification.controller";

const notification = Router();

notification.get("/", NotificationController.allNotifications);
notification.post("/:notificationID", NotificationController.read);
notification.post("/", NotificationController.markAllAsRead);


export default notification;