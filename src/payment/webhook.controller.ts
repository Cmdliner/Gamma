import { Request, Response } from "express";
import FincraService from "../lib/fincra.service";
import WebhookService from "./webhook.service";

class WebhookController {

    static async confirm(req: Request, res: Response) {
        const payload = req.body;

        try {
            console.log("web hook");
            const webhookSignature = req.headers["signature"] as string;

            const shouldProcess = await WebhookService.validateWebhook(webhookSignature, payload);
            if (!shouldProcess) {
                return res.status(400).json({ error: true, message: "Invalid webhook!" });
            }
        } catch (error) {
            console.error(error);
            return res.status(400).json({ error: true, message: "Could not validate webhook" });
        }

        // Handle individual events 
        switch (payload.event) {
            case "virtualaccount.approved":
                break;
            case "charge.successful":
                try {
                    await WebhookService.handleSuccessfulProductPurchase(payload);
                    return res.status(200).json({ success: true, message: "Payment successful" })
                } catch (error) {
                    return res.status(500).json({ error: true, message: "Error purchasing product" });
                }
            default:
                console.log("That event not found");
        }
    }
}

export default WebhookController;

/* 
{
  status: true,
  message: "Hosted link generated",
  data: {
    link: "https://sandbox-checkout.fincra.com/pay/fcr-p-7db8160151",
    reference: "672c8d54ba63a1b935801b0a",
    payCode: "fcr-p-7db8160151",
  },
}
*/