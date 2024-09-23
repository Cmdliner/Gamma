import { Request, Response } from "express";
import Product from "../product/product.model";
import Bid from "./bid.model";
import IBid from "../types/bid.schema";
import { Types } from "mongoose";
import { compareObjectID } from "../lib/main";

class BidController {
    static async createBid(req: Request, res: Response) {
        try {
            const { productID } = req.params;
            const { negotiating_price } = req.body;
            if (!negotiating_price) return res.status(422).json({ error: "Negotiating price required" });

            if (negotiating_price < 0) {
                return res.status(422).json({ error: "Negotiating price cannot be negative" });
            }

            const product = await Product.findById(productID);
            if (!product) return res.status(404).json({ error: "Product not found!" });

            // Ensure seller does not bid for their own item
            const canBidForItem = !compareObjectID(req.user?._id!, product.owner);
            if(!canBidForItem) return res.status(403).json({error: "Cannot bid for your own item!"});
            
            const bidData: Pick<IBid, "buyer" | "seller" | "negotiating_price" | "product"> = {
                buyer: req.user?._id!,
                seller: product.owner,
                negotiating_price,
                product: new Types.ObjectId(productID)
            };
            const bid = await Bid.create(bidData);
            if (!bid) throw new Error("Error creating bid");

            //!TODO => Send push notifications for bid creation here
            return res.status(201).json({ success: "Bid for product successful" })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Error sending bid!" });
        }
    }
}

export default BidController;