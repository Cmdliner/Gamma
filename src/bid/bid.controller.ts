import type { Request, Response } from "express";
import Product from "../product/product.model";
import Bid from "./bid.model";
import type IBid from "../types/bid.schema";
import { Types } from "mongoose";
import { compareObjectID, Next5Mins } from "../lib/main";

class BidController {

    static async getAllBidsForProduct(req: Request, res: Response) {
        try {
            //!TODO => check if only user can see all prod bids or anyone
            const { productID } = req.params;
            const productBids = await Bid.find({ product: productID }) //.populate("buyer");
            if (!productBids || productBids.length == 0) return res.status(404).json({ error: "No bids found" });
            return res.status(200).json({ success: "Bids found", bids: productBids });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Error fetching bids associated with that product" });
        }

    }

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
            if (!product.is_biddable) return res.status(404).json({ error: "Product not found!" });

            // Ensure seller does not bid for their own item
            const canBidForItem = !compareObjectID(req.user?._id!, product.owner);
            if (!canBidForItem) return res.status(403).json({ error: "Cannot bid for your own item!" });

            const bidData: Pick<IBid, "buyer" | "negotiating_price" | "product"> = {
                buyer: req.user?._id!,
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

    // N.B => Once a bid is accepted all other bids become rejected
    static async acceptBid(req: Request, res: Response) {
        try {
            const { bidID } = req.params;
            const bid = await Bid.findById(bidID);
            if (!bid) return res.status(404).json({ error: "Bid not found" });

            bid.status = "accepted";
            bid.expires = Next5Mins();
            const rejectedBids = await Bid.updateMany({ product: bid.product }, { status: "rejected" });
            if (!rejectedBids) throw new Error("Failed to reject other bids");

            await bid.save();
            return res.status(200).json({ success: "Bid accepted successfully", bid });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "An error occured while trying to accept bid" });
        }
    }

    static async rejectBid(req: Request, res: Response) {
        try {
            const { bidID } = req.params;
            const bid = await Bid.findById(bidID);
            if (!bid) return res.status(404).json({ error: "Bid not found!" });

            bid.status = "rejected";
            await bid.save();

            return res.status(200).json({ success: "Bid rejected", bid });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Bid rejection failed" });
        }

    }

    static async deleteBid(req: Request, res: Response) {
        try {
            const { bidID } = req.params;
            const bid = await Bid.findOneAndDelete({ id: bidID, buyer: req.user?._id! });
            if (!bid) throw new Error("Could not delete that bid");
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Error deleting bid" });
        }
    }
}

export default BidController;