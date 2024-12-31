import { Router } from "express";
import DisputeController from "./dispute.controller";

const dispute = Router();

dispute.post("/:transactionID/intiate", DisputeController.raiseDispute);
dispute.post("/:disputeID/resolve", DisputeController.resolveDispute);
// dispute.get("/", DisputeController.getAll);

export default  dispute;