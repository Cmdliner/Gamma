import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import Product from "../product/product.model";
import User from "../user/user.model";
import { compareObjectID } from "../lib/main";
import Dispute from "./dispute.model";
import ITransaction from "../types/transaction.schema";
import Transaction from "../payment/transaction.model";

class DisputeController {
    static async raiseDispute(req: Request, res: Response) {
        const { productID, transactionID } = req.params;
        const { issues, comments } = req.body;

        // VALIDATE REQUEST BODY
        if (!issues.trim() || !comments.trim()) {
            return res.status(422).json({ error: true, message: `${!issues ? "issues" : "comments"} required` })
        }

        try {
            const product = await Product.findById(productID);
            if (!product) {
                return res.status(404).json({ error: true, message: "Product not found" });
            }
            const transaction = await Transaction.findById(transactionID);
            if (!transaction) {
                return res.status(400).json({ error: true, message: "Transaction not found!" })
            }
            // Find the seller
            const seller = product.owner;

            // Find the buyer
            const buyer = await User.findById(product.purchase_lock.locked_by);
            if (!buyer) {
                return res.status(404).json({ error: true, message: "Buyer not found!" })
            }

            // Check if current user is the buyer or seller
            const isBuyerOrSeller = compareObjectID(buyer._id, req.user?._id!) || compareObjectID(seller, req.user?._id!);
            if (!isBuyerOrSeller) {
                return res.status(400).json({ error: true, message: "Forbidden!" });
            }

            // Raise dispute if this req passes validation checks above
            transaction.status = "resolved";
            product.status = "in_dispute";
            await product.save();
            await transaction.save();

            const dispute = new Dispute({
                status: "ongoing",
                raised_by: req.user?._id!,
                transaction: transactionID,
                issues,
                comments
            });
            await dispute.save();
            return res.status(200).json({ success: true, message: "Dispute registered" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error raising dispute!" });
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
            (dispute.transaction as unknown as ITransaction).status = "resolved";
            await dispute.save();

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error resolving dispute" });
        }
    }
}

export default DisputeController;
