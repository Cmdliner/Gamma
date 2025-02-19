import Expo, { ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { Types } from "mongoose";
import User from "../models/user.model";
import { logger } from "../config/logger.config";

class NotificationService {
    private expo: Expo;
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY_MS = 5_000;
    private readonly BATCH_SIZE = 100;
    private readonly RECEIPT_CHECK_DELAY_MS = 2_000;

    /**
     *
     */
    constructor() {
        this.expo = new Expo();
    }

    async sendPushNotifications(
        user_id: Types.ObjectId,
        title: string,
        body: string,
        data: { [key: string]: unknown }
    ): Promise<boolean> {
        try {
            const user = await User.findById(user_id);
            if (!user?.device_push_token) {
                logger.error(`Invalid pushtoken ${user.device_push_token} for user ${user_id}`);
                return false;
            }

            const message: ExpoPushMessage = {
                to: user.device_push_token,
                sound: 'default',
                title,
                body,
                data
            }

            // Send notification
            const chunks = this.expo.chunkPushNotifications([message]);
            const tickets: ExpoPushTicket[] = [];

            // Send chunks and collect tickets
            for (const chunk of chunks) {
                const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            }

            // Handle tickets (you might want to store these in your database)
            for (const ticket of tickets) {
                if (ticket.status === 'error') {
                    logger.error(`Error sending notification: ${ticket.message}`);
                    return false;
                }
            }

            return true;
        } catch (error) {
            logger.error('Error in sendPushNotification:', error);
            return false;
        }
    }
}

export const notificationService = new NotificationService();
