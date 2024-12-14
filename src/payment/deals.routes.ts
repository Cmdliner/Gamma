import { Router } from "express";
import PaymentController from "./payment.controller";

const deals = Router();

deals.get("/successful", PaymentController.getSuccessfulDeals);
deals.get("/failed", PaymentController.getFailedDeals);
deals.get("/pending", PaymentController.getPendingDeals);

export default deals;