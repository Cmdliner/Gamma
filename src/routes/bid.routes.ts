import { Router } from "express";
import BidController from "../controllers/bid.controller";

const bid = Router();

bid.get("/", BidController.getAllReceivedBids);
bid.get("/rejected", BidController.getRejectedBids);
bid.get("/accepted", BidController.getAllAcceptedBids);
bid.post("/:productID/new", BidController.createBid);
bid.post("/:bidID/accept", BidController.acceptBid);
bid.post("/:bidID/reject", BidController.rejectBid);
bid.delete("/:bidID", BidController.deleteBid);

export default bid;