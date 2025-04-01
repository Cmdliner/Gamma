import type { Request, Response } from "express";
import { AppError } from "../lib/error.handler";
import { logger } from "../config/logger.config";
import Notification from "../models/notification.model";
import { StatusCodes } from "http-status-codes";


class NotificationController {
    static async allNotifications(req: Request, res: Response) {
        try {
            const notifications = await Notification.find({
                for: req.user?._id,
                has_been_read: false
            });

            return res.status(StatusCodes.OK).json({ success: true, notifications });
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "");
            return res.status(status).json(errResponse);
        }
    }

    static async read(req: Request, res: Response) {
        try {
            const { notificationID } = req.params;

            const notification = await Notification.findById({
                for: req.user?._id,
                _id: notificationID,
            });
            if (!notification) throw new AppError(StatusCodes.NOT_FOUND, "Notification not found!");

            return res.status(StatusCodes.OK).json({ success: true, notification });
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "");
            return res.status(status).json(errResponse);
        }
    }

    static async markAllAsRead(req: Request, res: Response) {
        try {
            await Notification.updateMany(
                { for: req.user?._id, has_been_read: false },
                { has_been_read: true }
            );

            return res.status(StatusCodes.OK).json({ success: true, message: "All notifications have been read" });
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "");
            return res.status(status).json(errResponse);
        }
    }
}

export default NotificationController;