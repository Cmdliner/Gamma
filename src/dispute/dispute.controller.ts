import { Request, Response } from "express";
import Product from "../product/product.model";
import User from "../user/user.model";
import { compareObjectID } from "../lib/utils";
import Dispute from "./dispute.model";
import { ProductPurchaseTransaction } from "../payment/transaction.model";
import { startSession } from "mongoose";
import { logger } from "../config/logger.config";

class DisputeController {
    static async raiseDispute(req: Request, res: Response) {
        const { transactionID } = req.params;
        const { issues, comments } = req.body;

        // VALIDATE REQUEST BODY
        if (!comments?.trim()) {
            return res.status(422).json({ error: true, message: 'comments required' });
        }
        const session = await startSession();
        try {
            session.startTransaction();

            const transaction = await ProductPurchaseTransaction.findById(transactionID).session(session);
            if (!transaction) {
                await session.abortTransaction();
                return res.status(400).json({ error: true, message: "Transaction not found!" })
            }

            // Find the Product
            const product = await Product.findById(transaction.product).session(session);
            if (!product) {
                await session.abortTransaction();
                return res.status(404).json({ error: true, message: "Product not found!" });
            }

            // Find the buyer
            const buyer = await User.findById(product.purchase_lock.locked_by);
            if (!buyer) {
                await session.abortTransaction();
                return res.status(404).json({ error: true, message: "Buyer not found!" })
            }

            // Check if current user is the buyer or seller
            const seller = transaction.seller;
            const isBuyerOrSeller = compareObjectID(buyer._id, req.user?._id) || compareObjectID(seller, req.user?._id);
            if (!isBuyerOrSeller) {
                await session.abortTransaction();
                return res.status(403).json({ error: true, message: "Forbidden!" });
            }

            // Raise dispute if this req passes validation checks above
            transaction.status = "in_dispute";
            product.status = "in_dispute";
            await product.save({ session });
            await transaction.save({ session });
            const disputeData: any = {
                status: "ongoing",
                raised_by: req.user?._id,
                transaction: transactionID,
                comments
            }
            if(issues?.trim()) disputeData.issues = issues;
            const dispute = new Dispute(disputeData);
            await dispute.save({ session });
            await session.commitTransaction();
            return res.status(200).json({ success: true, message: "Dispute registered" });
        } catch (error) {
            await session.abortTransaction();
            logger.error(error);
            return res.status(500).json({ error: true, message: "Error raising dispute!" });
        } finally {
            await session.endSession();
        }
    }

    static async resolveDispute(req: Request, res: Response) {
        try {
            const { disputeID } = req.params;

            const dispute = await Dispute.findById(disputeID).populate("transaction");
            const isDisputeRaiser = compareObjectID(req.user?._id, dispute.raised_by);
            if (!dispute || !isDisputeRaiser) {
                return res.status(404).json({ error: true, message: "Dispute not found for current user" });
            }

            dispute.status = "resolved";
            await dispute.save();

            const disputedTransaction = await ProductPurchaseTransaction.findById(dispute.transaction);
            disputedTransaction.status = "resolved";
            await disputedTransaction.save();

        } catch (error) {
            logger.error(error);
            return res.status(500).json({ error: true, message: "Error resolving dispute" });
        }
    }
}

export default DisputeController;
