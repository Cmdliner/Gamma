import { Router } from "express";
import PaymentController from "./payment.controller";

const payment = Router();

payment.get("/history", PaymentController.getTransactionHistory);
payment.post("/transfer-funds", PaymentController.transferfunds);
payment.post("/withdraw", PaymentController.withdrawFromWallet)
payment.post("/rewards", PaymentController.withdrawRewards);
payment.post("/:productID/purchase", PaymentController.purchaseItem);
payment.post("/:productID/sponsor", PaymentController.sponsorAd);
payment.post("/:productID/:bidID/purchase", PaymentController.purchaseItem); //this one uses bid
payment.post("/:transactionID/initiate-funds-transfer", PaymentController.initiateFundsTransfer);
payment.post("/:transactionID/refund", PaymentController.requestRefund);
payment.post("/:refundTransactionID/approve-refund", PaymentController.approveRefund);

export default payment;