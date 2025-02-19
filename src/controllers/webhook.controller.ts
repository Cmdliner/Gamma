import { Request, Response } from "express";

export class WebhookController {
    static async handleProductPurchase(_req: Request, _res: Response) {}

    static async handleAdPayments(_req: Request, _res: Response) {}
}