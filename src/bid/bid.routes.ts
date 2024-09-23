import { Router } from "express";
import BidController from "./bid.controller";

const bid = Router();

bid.post("/:productID/new", BidController.createBid);


export default bid;