import { Request, Response } from "express";
import User from "../user/user.model";

class NotificationController {
    static async registerDevice(req: Request, res: Response) {
        try {
            const { push_token } = req.body;

            // !TODO => VALIDATE PUSH TOKENS
            const user = await User.findById(req.user?._id);
            if (!user) {
                return res.status(404).json({ error: true, message: "User not found!" });
            }
            user.device_push_token = push_token;
            await user.save();
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error adding device push token" });
        }
    }
}

export default NotificationController;