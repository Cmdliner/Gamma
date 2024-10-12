import { Router } from "express";
import TransactionController from "./transaction.controller";

const transaction = Router();

transaction.get("/history", TransactionController.getTransactionHistory);
transaction.post("/initiate-product-purchase", TransactionController.purchaseItem);

export default transaction;