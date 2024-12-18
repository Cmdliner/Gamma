import { Router } from "express";
import NotificationController from "./notification.controller";

const notification = Router();

notification.post("/register-device", NotificationController.registerDevice);
notification.put("/token", NotificationController.registerDevice);

export default notification;