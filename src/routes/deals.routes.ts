import { Router } from "express";
import PaymentController from "../controllers/payment.controller";

const deals = Router();
deals.get("/ongoing", PaymentController.getOngoingDeals);
deals.get("/successful", PaymentController.getSuccessfulDeals);
deals.get("/disputed", PaymentController.getDisputedDeals);

export default deals;