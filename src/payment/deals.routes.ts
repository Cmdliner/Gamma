import { Router } from "express";
import PaymentController from "./payment.controller";

const deals = Router();
deals.get("/ongoing", PaymentController.getOngoingDeals);
deals.get("/successful", PaymentController.getSuccessfulDeals);
// deals.get("/failed", PaymentController.getFailedDeals);
deals.get("/disputed", PaymentController.getDisputedDeals);

export default deals;