import { Router } from "express";
import TransactionController from "./payment.controller";

const transaction = Router();

transaction.get("/history", TransactionController.getTransactionHistory);
transaction.post("/:productID/initiate-product-purchase", TransactionController.purchaseItem);

export default transaction;