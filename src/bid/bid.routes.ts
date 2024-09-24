import { Router } from "express";
import BidController from "./bid.controller";

const bid = Router();

bid.get("/:productID/all", BidController.getAllBidsForProduct);
bid.post("/:productID/new", BidController.createBid);
bid.post("/:bidID/accept", BidController.acceptBid);
bid.post("/:bidID/reject", BidController.rejectBid);

export default bid;