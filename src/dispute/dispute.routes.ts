import { Router } from "express";
import DisputeController from "./dispute.controller";

const dispute = Router();

dispute.post("/:productID/:transactionID/intiate", DisputeController.raiseDispute);
dispute.post("/:productID/:transactionID/resolve", DisputeController.resolveDispute);
// dispute.get("/", DisputeController.getAll);

export default  dispute;