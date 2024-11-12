import { Router } from "express";
import DisputeController from "./dispute.controller";

const dispute = Router();

dispute.post("/:productID/:transactionID/intiate", DisputeController.raiseDispute);

export default  dispute;