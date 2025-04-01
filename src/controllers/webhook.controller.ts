import type { Request, Response } from "express";
import type { IVirtualAccountTransferData } from "../types/webhook.schema";
import WebhookService from "../services/webhook.service";
import { StatusCodes } from "http-status-codes";

export class WebhookController {
    static async handleProductPurchase(req: Request, res: Response) {
        try {
            const { data }: { data: IVirtualAccountTransferData } = req.body;
            await WebhookService.handleSuccessfulProductPurchase(data);
            return res.status(StatusCodes.NO_CONTENT).json();
        } catch (error) {
            console.error(error);
        }
    }

    static async handleAdPayments(req: Request, res: Response) {
        try {
            console.log("Received ad webhook");
            const { data }: { data: IVirtualAccountTransferData } = req.body;

            const { success } = await WebhookService.handleProductSponsorPayment(data);
            if (!success) { return; }

            return res.status(StatusCodes.NO_CONTENT).json();


        } catch (error) {
            console.error(error);
        }
    }
}