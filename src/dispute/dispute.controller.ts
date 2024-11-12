import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import Product from "../product/product.model";
import User from "../user/user.model";
import { compareObjectID } from "../lib/main";
import Dispute from "./dispute.model";

class DisputeController {
  static async raiseDispute(req: Request, res: Response) {
    // A DISPUTE IS AN UNREOLVED TRANSACTION DURING PURCHASE OF AN ITEM
    // - Buyer
    // - Seller
    // - product item
    const { productID, transactionID } = req.params;
    const { issues, comments } = req.body;
    if (!productID || !isValidObjectId(productID)) {
      return res.status(422).json({ error: true, message: "Product ID required" });
    }
    if (!transactionID || !isValidObjectId(transactionID)) {
        return res.status(422).json({ error: true, message: "Product ID required" });
      }

    try {
        const product = await Product.findById(productID);
        if(!product) {
            return res.status(404).json({ error: true, message: "Product not found" });
        }
        const seller = product.owner;

        // Find the buyer
        const buyer = await User.findById(product.purchase_lock.locked_by);
        if(!buyer) {
          return res.status(404).json({ error: true, message: "Buyer not found!" })
        }
        const isBuyerOrSeller = compareObjectID(buyer._id, req.user?._id!) || compareObjectID(seller, req.user?._id!);
        if(!isBuyerOrSeller) {
          return res.status(403).json({ error: true, message: "Forbidden!" });
        }
        const dispute = new Dispute({
          status: "ongoing",
          raised_by: req.user?._id!,
          transaction: transactionID,
          issues,
          comments
        });
        return res.status(200).json({ success: true, message: "Dispute registered" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: true, message: "Error raising dispute!" });
    }
  }

  static async resolveDispute(req: Request, res: Response) {}
}

export default DisputeController;
