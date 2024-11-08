import { Router } from "express";
import TransactionController from "./payment.controller";

const transaction = Router();

transaction.get("/history", TransactionController.getTransactionHistory);
transaction.post("/:productID/purchase", TransactionController.purchaseItem);
transaction.post("/:productID/sponsor", TransactionController.sponsorAd);

export default transaction;