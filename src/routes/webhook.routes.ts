import { Router } from "express";
import { WebhookController } from "../controllers/webhook.controller";

const webhook = Router();

webhook.post('/product-purchase', WebhookController.handleProductPurchase);
webhook.post('/ad-payment', WebhookController.handleAdPayments);

export default webhook;