import { Router } from "express";
import TransactionController from "./payment.controller";

const transaction = Router();

transaction.get("/history", TransactionController.getTransactionHistory);
transaction.post("/:productID/purchase", TransactionController.purchaseItem);
transaction.post("/:productID/:bidID/purchase", TransactionController.purchaseItem); //this one uses bid
transaction.post("/:productID/sponsor", TransactionController.sponsorAd);

export default transaction;