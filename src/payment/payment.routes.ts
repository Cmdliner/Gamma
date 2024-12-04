import { Router } from "express";
import PaymentController from "./payment.controller";

const payment = Router();

payment.get("/history", PaymentController.getTransactionHistory);
payment.post("/:productID/purchase", PaymentController.purchaseItem);
payment.post("/:productID/:bidID/purchase", PaymentController.purchaseItem); //this one uses bid
payment.post("/:productID/sponsor", PaymentController.sponsorAd);
payment.post("/withdraw", PaymentController.withdrawFromWallet)
payment.post("/rewards", PaymentController.withdrawRewards);

export default payment;